<?php
session_start();

function handle_error_json($message, $http_code = 400, $additional_data = []) {
    http_response_code($http_code);
    echo json_encode(array_merge(['success' => false, 'message' => $message], $additional_data));
    exit;
}

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        handle_error_json('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 401, ['action' => 'logout']);
    }
    header("location: login.php");
    exit;
}

require_once 'db_config.php'; 

if (!$link) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        handle_error_json('Koneksi database gagal. Tidak dapat memproses permintaan.', 500);
    }
    die("Koneksi database gagal. Aplikasi tidak dapat berjalan.");
}

if (!function_exists('getTodayYMD')) {
    function getTodayYMD() {
        return date('Y-m-d');
    }
}

if (!function_exists('calculate_habit_stats')) {
    function calculate_habit_stats($habit_id, $created_at_str) {
        global $link;
        $today_ymd = getTodayYMD();
        $totalCompletions = 0; $currentStreak = 0; $failedCount = 0;

        $stmt_total = mysqli_prepare($link, "SELECT COUNT(*) as total FROM completions WHERE habit_id = ?");
        mysqli_stmt_bind_param($stmt_total, "i", $habit_id); mysqli_stmt_execute($stmt_total);
        $res_total = mysqli_stmt_get_result($stmt_total);
        if ($row_total = mysqli_fetch_assoc($res_total)) $totalCompletions = $row_total['total'];
        mysqli_stmt_close($stmt_total);

        $stmt_streak_dates = mysqli_prepare($link, "SELECT DISTINCT completion_date FROM completions WHERE habit_id = ? ORDER BY completion_date DESC");
        mysqli_stmt_bind_param($stmt_streak_dates, "i", $habit_id); mysqli_stmt_execute($stmt_streak_dates);
        $result_streak_dates = mysqli_stmt_get_result($stmt_streak_dates);
        $completion_dates = []; while ($row_sd = mysqli_fetch_assoc($result_streak_dates)) $completion_dates[] = $row_sd['completion_date'];
        mysqli_stmt_close($stmt_streak_dates);

        if (!empty($completion_dates)) {
            $streak = 0; 
            $check_date = new DateTime($today_ymd);
            
            $start_streak_from_today = in_array($today_ymd, $completion_dates);
            $start_streak_from_yesterday = !$start_streak_from_today && in_array($check_date->modify('-1 day')->format('Y-m-d'), $completion_dates);

            if ($start_streak_from_today) {
                $check_date = new DateTime($today_ymd);
            } else if ($start_streak_from_yesterday) {
            } else {
                $currentStreak = 0;
                goto calculate_failed_count;
            }
            
            while (in_array($check_date->format('Y-m-d'), $completion_dates)) {
                $streak++;
                $check_date->modify('-1 day');
                if ($check_date < new DateTime(substr($created_at_str, 0, 10))) break;
            }
            if ($start_streak_from_today) {
                $currentStreak = $streak;
            } else if ($start_streak_from_yesterday) {
                $currentStreak = 0; 
            }
        }

        calculate_failed_count:

        $created_at_date = new DateTime(substr($created_at_str, 0, 10)); 
        $loop_until_date = new DateTime($today_ymd); 

        if ($created_at_date < $loop_until_date) {
            $interval = new DateInterval('P1D');
            $period = new DatePeriod($created_at_date, $interval, $loop_until_date); 
            $possible_days_for_failure = 0;
            $completed_in_period_count = 0;

            foreach ($period as $dt) {
                $possible_days_for_failure++;
                if (in_array($dt->format('Y-m-d'), $completion_dates)) {
                    $completed_in_period_count++;
                }
            }
            $failedCount = $possible_days_for_failure - $completed_in_period_count;
        }
        $failedCount = max(0, $failedCount);
        return ['totalCompletions' => $totalCompletions, 'currentStreak' => $currentStreak, 'failedCount' => $failedCount];
    }
}


if (($_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['action']))) {
    if (!$link) handle_error_json('Koneksi database tidak tersedia untuk aksi AJAX.', 500);

    $action = $_POST['action'] ?? $_GET['action'] ?? null;
    $user_id = $_SESSION['user_id'];
    $today_ymd = getTodayYMD();

    $json_actions = [
        'load_profile', 'save_profile', 'load_habits', 'add_habit', 'update_habit',
        'delete_habit', 'toggle_habit_check', 'load_history', 'load_global_stats',
        'load_note', 'save_note', 'load_calendar_data',
        'generate_invite_code', 'get_my_invite_code', 'accept_invite', 'list_my_buddies', 
        'list_user_shared_habits', 'get_shareable_habits', 'get_buddies_for_sharing', 'share_habit_request',
        'list_incoming_share_requests', 'accept_share_request', 'decline_share_request', 'unfriend_buddy', 'revoke_shared_habit', 'delete_account'
    ];

    if (in_array($action, $json_actions) && !headers_sent()) header('Content-Type: application/json');

    if ($action === 'load_profile') {
        $stmt = mysqli_prepare($link, "SELECT username, email, first_name, last_name, phone, profile_picture_path, user_note_content FROM users WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $user_id); mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt); $profile = mysqli_fetch_assoc($result); mysqli_stmt_close($stmt);
        
        if (!function_exists('get_default_profile_values')) { 
            function get_default_profile_values() { 
                return ['username' => 'User', 'email' => '','first_name' => '','last_name' => '','phone' => '','profile_picture_path' => 'assets/profile_placeholder.png', 'user_note_content' => '']; 
            } 
        }
        $default_values = get_default_profile_values();
        $profile_data_to_send = $profile ? array_merge($default_values, array_filter($profile, fn($value) => !is_null($value))) : $default_values;
        
        $profile_data_to_send['profile_picture_path'] = $profile['profile_picture_path'] ?? 'assets/profile_placeholder.png';
        if (empty(trim($profile_data_to_send['profile_picture_path']))) { 
            $profile_data_to_send['profile_picture_path'] = 'assets/profile_placeholder.png';
        }

        if ($profile && isset($profile['username'])) $profile_data_to_send['username'] = $profile['username'];
        $profile_data_to_send['user_note_content'] = $profile['user_note_content'] ?? '';
        echo json_encode($profile_data_to_send); exit;
    }

    if ($action === 'save_profile') {
        $firstName = trim($_POST['firstName'] ?? '');
        $lastName = trim($_POST['lastName'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        $finalProfilePicturePathForDb = null;

        $stmt_current_pic = mysqli_prepare($link, "SELECT profile_picture_path FROM users WHERE id = ?");
        mysqli_stmt_bind_param($stmt_current_pic, "i", $user_id);
        mysqli_stmt_execute($stmt_current_pic);
        $res_current_pic = mysqli_stmt_get_result($stmt_current_pic);
        $currentDbPathRow = mysqli_fetch_assoc($res_current_pic);
        mysqli_stmt_close($stmt_current_pic);
        $currentDbPath = $currentDbPathRow['profile_picture_path'] ?? 'assets/profile_placeholder.png';
        if (empty(trim($currentDbPath))) {
            $currentDbPath = 'assets/profile_placeholder.png';
        }
        $finalProfilePicturePathForDb = $currentDbPath; 

        if (isset($_FILES['profilePictureFile']) && $_FILES['profilePictureFile']['error'] == UPLOAD_ERR_OK) {
            $uploadDir = 'assets/uploads/'; 
            if (!is_dir($uploadDir)) {
                if (!@mkdir($uploadDir, 0775, true)) { 
                    handle_error_json('Gagal membuat direktori upload. Pastikan `assets/uploads/` ada dan writable.', 500);
                }
            }
            if (!is_writable($uploadDir)) {
                handle_error_json('Direktori upload tidak dapat ditulis. Periksa izin `assets/uploads/`.', 500);
            }

            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            $fileType = mime_content_type($_FILES['profilePictureFile']['tmp_name']);
            if (!in_array($fileType, $allowedTypes)) {
                handle_error_json('Tipe file tidak diizinkan. Hanya JPEG, PNG, GIF.');
            }
            if ($_FILES['profilePictureFile']['size'] > 2 * 1024 * 1024) { 
                handle_error_json('Ukuran file terlalu besar. Maksimal 2MB.');
            }

            $fileExtension = strtolower(pathinfo($_FILES['profilePictureFile']['name'], PATHINFO_EXTENSION));
            $fileName = 'user_' . $user_id . '_' . uniqid() . '.' . $fileExtension;
            $uploadedServerFilePath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['profilePictureFile']['tmp_name'], $uploadedServerFilePath)) {
                $finalProfilePicturePathForDb = $uploadedServerFilePath;
                if ($currentDbPath &&
                    $currentDbPath !== 'assets/profile_placeholder.png' &&
                    file_exists($currentDbPath) &&
                    $currentDbPath !== $finalProfilePicturePathForDb) {
                    @unlink($currentDbPath);
                }
            } else {
                handle_error_json('Gagal memindahkan file yang diupload. Error: ' . $_FILES['profilePictureFile']['error'], 500);
            }
        } else {
            $pathFromClient = $_POST['profilePicturePath'] ?? null;
            if ($pathFromClient !== null && $pathFromClient !== $currentDbPath) {
                $finalProfilePicturePathForDb = $pathFromClient;
                if ($currentDbPath &&
                    $currentDbPath !== 'assets/profile_placeholder.png' &&
                    file_exists($currentDbPath) &&
                    $finalProfilePicturePathForDb === 'assets/profile_placeholder.png') {
                     @unlink($currentDbPath);
                }
            }
        }
        if (empty(trim($finalProfilePicturePathForDb))) {
            $finalProfilePicturePathForDb = 'assets/profile_placeholder.png';
        }

        $stmt_update_sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, profile_picture_path = ? WHERE id = ?";
        $stmt_update_types = "sssssi";
        $stmt_update_params = [$firstName, $lastName, $email, $phone, $finalProfilePicturePathForDb, $user_id];
        
        $stmt = mysqli_prepare($link, $stmt_update_sql);
        mysqli_stmt_bind_param($stmt, $stmt_update_types, ...$stmt_update_params);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode([
                'success' => true,
                'message' => 'Profil berhasil disimpan!',
                'newProfilePicturePath' => $finalProfilePicturePathForDb 
            ]);
        } else {
            if (isset($uploadedServerFilePath) && file_exists($uploadedServerFilePath) && $finalProfilePicturePathForDb === $uploadedServerFilePath) {
                @unlink($uploadedServerFilePath);
            }
            error_log("Save profile error DB: " . mysqli_stmt_error($stmt));
            handle_error_json('Gagal menyimpan profil ke database.', 500);
        }
        mysqli_stmt_close($stmt);
        exit;
    }
    
    if ($action === 'delete_account') {
        if (!isset($_SESSION['user_id'])) {
            handle_error_json("Sesi tidak valid untuk menghapus akun.", 401, ['action' => 'logout']);
        }
        $user_id_to_delete = $_SESSION['user_id'];

        mysqli_begin_transaction($link);
        try {
            $stmt_user_info = mysqli_prepare($link, "SELECT email, profile_picture_path FROM users WHERE id = ?");
            mysqli_stmt_bind_param($stmt_user_info, "i", $user_id_to_delete);
            mysqli_stmt_execute($stmt_user_info);
            $res_user_info = mysqli_stmt_get_result($stmt_user_info);
            $user_info_row = mysqli_fetch_assoc($res_user_info);
            mysqli_stmt_close($stmt_user_info);

            $user_email_to_delete = $user_info_row['email'] ?? null;
            $profile_pic_path_to_delete = $user_info_row['profile_picture_path'] ?? null;

            if ($user_email_to_delete) {
                $stmt_del_tokens = mysqli_prepare($link, "DELETE FROM password_reset_tokens WHERE email = ?");
                mysqli_stmt_bind_param($stmt_del_tokens, "s", $user_email_to_delete);
                mysqli_stmt_execute($stmt_del_tokens);
                mysqli_stmt_close($stmt_del_tokens);
            }
            
            $stmt_del_user = mysqli_prepare($link, "DELETE FROM users WHERE id = ?");
            mysqli_stmt_bind_param($stmt_del_user, "i", $user_id_to_delete);
            mysqli_stmt_execute($stmt_del_user);
            $affected_rows = mysqli_stmt_affected_rows($stmt_del_user);
            mysqli_stmt_close($stmt_del_user);

            if ($affected_rows > 0) {
                mysqli_commit($link);

                if ($profile_pic_path_to_delete &&
                    $profile_pic_path_to_delete !== 'assets/profile_placeholder.png' &&
                    file_exists($profile_pic_path_to_delete)) {
                    @unlink($profile_pic_path_to_delete);
                }

                $_SESSION = array(); 
                if (ini_get("session.use_cookies")) { 
                    $params = session_get_cookie_params();
                    setcookie(session_name(), '', time() - 42000,
                        $params["path"], $params["domain"],
                        $params["secure"], $params["httponly"]
                    );
                }
                session_destroy(); 

                echo json_encode(['success' => true, 'message' => 'Akun Anda telah berhasil dihapus.', 'action' => 'logout']);
            } else {
                mysqli_rollback($link);
                handle_error_json('Gagal menghapus akun dari database atau akun tidak ditemukan.', 500);
            }
        } catch (Exception $e) {
            mysqli_rollback($link);
            error_log("Delete account error: " . $e->getMessage());
            handle_error_json('Terjadi kesalahan internal saat menghapus akun: ' . $e->getMessage(), 500);
        }
        exit;
    }

    if ($action === 'load_habits') {
        $habits_data = []; 
        $query = "SELECT h.id, h.name, h.icon, h.color, h.category, 
                         h.habit_start_date, h.duration_in_days, h.is_duration_unlimited, h.calculated_end_date,
                         (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today,
                         h.is_shared_instance, h.source_shared_habit_id 
                  FROM habits h 
                  WHERE h.user_id = ? AND h.is_deleted = 0 
                  AND (h.is_duration_unlimited = 1 OR h.calculated_end_date >= ?)
                  ORDER BY checked_today ASC, 
                           CASE h.category 
                               WHEN 'pagi' THEN 1 
                               WHEN 'siang' THEN 2 
                               WHEN 'sore-malam' THEN 3 
                               ELSE 4 
                           END, 
                           h.is_shared_instance ASC, 
                           h.created_at DESC";
        $stmt = mysqli_prepare($link, $query); 
        mysqli_stmt_bind_param($stmt, "sis", $today_ymd, $user_id, $today_ymd); 
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) { 
            $stats = calculate_habit_stats($row['id'], $row['habit_start_date'], $row['is_duration_unlimited'], $row['calculated_end_date']);
            $habits_data[] = [
                'id' => $row['id'], 
                'name' => htmlspecialchars($row['name'] ?? 'Unnamed'), 
                'icon' => htmlspecialchars($row['icon'] ?? '🎯'), 
                'color' => htmlspecialchars($row['color'] ?? 'orange-check'), 
                'category' => htmlspecialchars($row['category'] ?? 'semua'),
                'checked' => ($row['checked_today'] ?? 0) > 0, 
                'totalCompletions' => $stats['totalCompletions'] ?? 0, 
                'currentStreak' => $stats['currentStreak'] ?? 0, 
                'failedCount' => $stats['failedCount'] ?? 0, 
                'is_shared_instance' => (bool)$row['is_shared_instance'],
                'source_shared_habit_id' => $row['source_shared_habit_id'],
                'habit_start_date' => $row['habit_start_date'],
                'duration_in_days' => $row['duration_in_days'],
                'is_duration_unlimited' => (bool)$row['is_duration_unlimited'],
                'calculated_end_date' => $row['calculated_end_date']
            ]; 
        }
        mysqli_stmt_close($stmt); echo json_encode($habits_data); exit;
    }
    if ($action === 'add_habit' || $action === 'update_habit') {
        $name = $_POST['name'] ?? 'Unnamed Habit';
        $icon = $_POST['icon'] ?? '🎯';
        $color = $_POST['color'] ?? 'orange-check';
        $category = $_POST['category'] ?? 'semua';
        $is_unlimited = filter_var($_POST['is_unlimited'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $start_date_str = $_POST['habit_start_date'] ?? $today_ymd;
        $duration_value = filter_input(INPUT_POST, 'duration_value', FILTER_VALIDATE_INT);
        $duration_unit = $_POST['duration_unit'] ?? 'hari';

        $duration_in_days = null;
        $calculated_end_date = null;

        if (!$is_unlimited && $duration_value > 0) {
            if ($duration_unit === 'bulan') {
                $duration_in_days = $duration_value * 30;
            } else {
                $duration_in_days = $duration_value;
            }
            try {
                $start_date_obj = new DateTime($start_date_str);
                $end_date_obj = (clone $start_date_obj)->add(new DateInterval('P' . ($duration_in_days - 1) . 'D'));
                $calculated_end_date = $end_date_obj->format('Y-m-d');
            } catch (Exception $e) {
                handle_error_json('Format tanggal atau durasi tidak valid.');
            }
        }

        if ($action === 'add_habit') {
            $stmt = mysqli_prepare($link, "INSERT INTO habits (user_id, name, icon, color, category, habit_start_date, duration_in_days, is_duration_unlimited, calculated_end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            mysqli_stmt_bind_param($stmt, "isssssiis", $user_id, $name, $icon, $color, $category, $start_date_str, $duration_in_days, $is_unlimited, $calculated_end_date);
        } else {
            $id = $_POST['id'] ?? null;
            if (!$id) handle_error_json('ID Habit tidak ditemukan.');
            $id_int = (int)$id;
            $stmt = mysqli_prepare($link, "UPDATE habits SET name = ?, icon = ?, category = ?, habit_start_date = ?, duration_in_days = ?, is_duration_unlimited = ?, calculated_end_date = ? WHERE id = ? AND user_id = ?");
            mysqli_stmt_bind_param($stmt, "ssssiisii", $name, $icon, $category, $start_date_str, $duration_in_days, $is_unlimited, $calculated_end_date, $id_int, $user_id);
        }

        if (mysqli_stmt_execute($stmt)) {
            $habit_id = ($action === 'add_habit') ? mysqli_insert_id($link) : $id_int;
            $new_habit_stmt = mysqli_prepare($link, "SELECT *, (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today FROM habits h WHERE id = ?");
            mysqli_stmt_bind_param($new_habit_stmt, "si", $today_ymd, $habit_id);
            mysqli_stmt_execute($new_habit_stmt);
            $new_habit_result = mysqli_stmt_get_result($new_habit_stmt);
            $new_habit_row = mysqli_fetch_assoc($new_habit_result);
            mysqli_stmt_close($new_habit_stmt);
            
            if ($new_habit_row) {
                $stats = calculate_habit_stats($new_habit_row['id'], $new_habit_row['habit_start_date'], $new_habit_row['is_duration_unlimited'], $new_habit_row['calculated_end_date']);
                echo json_encode(['success' => true, 'habit' => [
                    'id' => $new_habit_row['id'], 
                    'name' => htmlspecialchars($new_habit_row['name']), 
                    'icon' => htmlspecialchars($new_habit_row['icon']), 
                    'color' => htmlspecialchars($new_habit_row['color']), 
                    'category' => htmlspecialchars($new_habit_row['category']), 
                    'checked' => ($new_habit_row['checked_today'] > 0),
                    'totalCompletions' => $stats['totalCompletions'], 
                    'currentStreak' => $stats['currentStreak'], 
                    'failedCount' => $stats['failedCount'], 
                    'is_shared_instance' => (bool)$new_habit_row['is_shared_instance'],
                    'source_shared_habit_id' => $new_habit_row['source_shared_habit_id'],
                    'habit_start_date' => $new_habit_row['habit_start_date'],
                    'duration_in_days' => $new_habit_row['duration_in_days'],
                    'is_duration_unlimited' => (bool)$new_habit_row['is_duration_unlimited'],
                    'calculated_end_date' => $new_habit_row['calculated_end_date']
                ]]);
            } else {
                handle_error_json('Gagal mengambil data habit yang diperbarui.');
            }
        } else {
            error_log("Habit C/U error: " . mysqli_stmt_error($stmt));
            handle_error_json('Gagal menyimpan habit.');
        }
        mysqli_stmt_close($stmt);
        exit;
    }
    if ($action === 'delete_habit') {
        $id = $_POST['id'] ?? null; if (!$id) handle_error_json('ID Habit tidak ditemukan.'); $id_int = (int)$id;
        
        mysqli_begin_transaction($link);
        try {
            $stmt_check_shared = mysqli_prepare($link, "SELECT is_shared_instance, source_shared_habit_id FROM habits WHERE id = ? AND user_id = ?");
            mysqli_stmt_bind_param($stmt_check_shared, "ii", $id_int, $user_id);
            mysqli_stmt_execute($stmt_check_shared);
            $res_check_shared = mysqli_stmt_get_result($stmt_check_shared);
            $habit_info = mysqli_fetch_assoc($res_check_shared);
            mysqli_stmt_close($stmt_check_shared);

            if (!$habit_info) {
                throw new Exception("Habit tidak ditemukan atau bukan milik Anda.");
            }

            if ($habit_info['is_shared_instance'] && $habit_info['source_shared_habit_id']) {
                $stmt_delete_link = mysqli_prepare($link, "DELETE FROM shared_habits WHERE id = ? AND shared_with_buddy_id = ?");
                mysqli_stmt_bind_param($stmt_delete_link, "ii", $habit_info['source_shared_habit_id'], $user_id);
                mysqli_stmt_execute($stmt_delete_link);
                mysqli_stmt_close($stmt_delete_link);
            } else {
                $stmt_get_sh_ids = mysqli_prepare($link, "SELECT id FROM shared_habits WHERE habit_id = ? AND original_owner_id = ?");
                mysqli_stmt_bind_param($stmt_get_sh_ids, "ii", $id_int, $user_id);
                mysqli_stmt_execute($stmt_get_sh_ids);
                $res_sh_ids = mysqli_stmt_get_result($stmt_get_sh_ids);
                $shared_habit_ids_to_process = [];
                while($row_sh_id = mysqli_fetch_assoc($res_sh_ids)){
                    $shared_habit_ids_to_process[] = $row_sh_id['id'];
                }
                mysqli_stmt_close($stmt_get_sh_ids);

                if(!empty($shared_habit_ids_to_process)){
                    $sh_ids_list_str = implode(',', array_map('intval', $shared_habit_ids_to_process));
                    if (!empty($sh_ids_list_str)) {
                        mysqli_query($link, "DELETE c FROM completions c JOIN habits h ON c.habit_id = h.id WHERE h.source_shared_habit_id IN ($sh_ids_list_str) AND h.is_shared_instance = 1");
                        mysqli_query($link, "UPDATE habits SET is_deleted = 1 WHERE source_shared_habit_id IN ($sh_ids_list_str) AND is_shared_instance = 1");
                        mysqli_query($link, "DELETE FROM shared_habits WHERE id IN ($sh_ids_list_str)");
                    }
                }
            }

            $stmt_soft_delete_habit = mysqli_prepare($link, "UPDATE habits SET is_deleted = 1 WHERE id = ? AND user_id = ?");
            mysqli_stmt_bind_param($stmt_soft_delete_habit, "ii", $id_int, $user_id);
            mysqli_stmt_execute($stmt_soft_delete_habit);
            mysqli_stmt_close($stmt_soft_delete_habit);
            
            $stmt_del_completions_main = mysqli_prepare($link, "DELETE FROM completions WHERE habit_id = ?");
            mysqli_stmt_bind_param($stmt_del_completions_main, "i", $id_int);
            mysqli_stmt_execute($stmt_del_completions_main);
            mysqli_stmt_close($stmt_del_completions_main);

            mysqli_commit($link);
            echo json_encode(['success' => true, 'message' => 'Habit berhasil dihapus.']);
        } catch (Exception $exception) {
            mysqli_rollback($link);
            error_log("Delete habit transaction error: " . $exception->getMessage());
            handle_error_json('Gagal menghapus habit dan data terkaitnya: ' . $exception->getMessage());
        }
        exit;
    }

    if ($action === 'toggle_habit_check') {
        $id = $_POST['id'] ?? null;
        $isChecked = filter_var($_POST['checked'] ?? 'false', FILTER_VALIDATE_BOOLEAN); 
        $habit_id_int = (int)$id;
    
        if (!$id) {
            handle_error_json('ID Habit tidak ditemukan.');
        }
    
        $verify_stmt = mysqli_prepare($link, "SELECT id FROM habits WHERE id = ? AND user_id = ? AND is_deleted = 0");
        if (!$verify_stmt) {
            error_log("ToggleCheck - Prepare failed for verify_stmt: " . mysqli_error($link));
            handle_error_json('Kesalahan internal server saat verifikasi habit.');
        }
        mysqli_stmt_bind_param($verify_stmt, "ii", $habit_id_int, $user_id);
        mysqli_stmt_execute($verify_stmt);
        mysqli_stmt_store_result($verify_stmt);
        if (mysqli_stmt_num_rows($verify_stmt) == 0) {
            mysqli_stmt_close($verify_stmt);
            handle_error_json('Habit tidak valid atau bukan milik Anda.');
        }
        mysqli_stmt_close($verify_stmt);
    
        $response = ['success' => false];
    
        if ($isChecked) {
            $stmt_insert = mysqli_prepare($link, "INSERT IGNORE INTO completions (habit_id, completion_date, completed_at) VALUES (?, ?, NOW())");
            if (!$stmt_insert) {
                error_log("ToggleCheck - Prepare failed for stmt_insert: " . mysqli_error($link));
                handle_error_json('Kesalahan internal server saat menandai selesai.');
            }
            mysqli_stmt_bind_param($stmt_insert, "is", $habit_id_int, $today_ymd); 
    
            if (mysqli_stmt_execute($stmt_insert)) {
                $response['success'] = true;
                $response['message'] = (mysqli_affected_rows($link) > 0) ? 'Habit ditandai selesai.' : 'Habit sudah ditandai selesai hari ini.';
            } else {
                error_log("ToggleCheck - Execute failed for stmt_insert: " . mysqli_stmt_error($stmt_insert));
                handle_error_json('Gagal menandai habit selesai: ' . mysqli_stmt_error($stmt_insert), 500);
            }
            mysqli_stmt_close($stmt_insert);
        } else {
            $stmt_delete = mysqli_prepare($link, "DELETE FROM completions WHERE habit_id = ? AND completion_date = ?");
            if (!$stmt_delete) {
                error_log("ToggleCheck - Prepare failed for stmt_delete: " . mysqli_error($link));
                handle_error_json('Kesalahan internal server saat membatalkan.');
            }
            mysqli_stmt_bind_param($stmt_delete, "is", $habit_id_int, $today_ymd);
    
            if (mysqli_stmt_execute($stmt_delete)) {
                $response['success'] = true;
                $response['message'] = 'Tanda selesai dibatalkan.';
            } else {
                error_log("ToggleCheck - Execute failed for stmt_delete: " . mysqli_stmt_error($stmt_delete));
                handle_error_json('Gagal membatalkan tanda selesai: ' . mysqli_stmt_error($stmt_delete), 500);
            }
            mysqli_stmt_close($stmt_delete);
        }
    
        if ($response['success']) {
            $updated_habit_stmt = mysqli_prepare($link, "SELECT *, (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today FROM habits h WHERE h.id = ?");
            if (!$updated_habit_stmt) {
                error_log("ToggleCheck - Prepare failed for updated_habit_stmt: " . mysqli_error($link));
            } else {
                mysqli_stmt_bind_param($updated_habit_stmt, "si", $today_ymd, $habit_id_int);
                mysqli_stmt_execute($updated_habit_stmt);
                $updated_habit_result = mysqli_stmt_get_result($updated_habit_stmt);
                $updated_habit_row = mysqli_fetch_assoc($updated_habit_result);
                mysqli_stmt_close($updated_habit_stmt);
    
                if ($updated_habit_row) {
                    $stats = calculate_habit_stats($updated_habit_row['id'], $updated_habit_row['habit_start_date'], $updated_habit_row['is_duration_unlimited'], $updated_habit_row['calculated_end_date']);
                    if (isset($stats['error'])) {
                         error_log("ToggleCheck - Error from calculate_habit_stats for habit {$updated_habit_row['id']}: {$stats['error']}");
                    }
                    $response['habit'] = [
                        'id' => $updated_habit_row['id'],
                        'name' => htmlspecialchars($updated_habit_row['name'] ?? 'Unnamed'),
                        'icon' => htmlspecialchars($updated_habit_row['icon'] ?? '🎯'),
                        'color' => htmlspecialchars($updated_habit_row['color'] ?? 'orange-check'),
                        'category' => htmlspecialchars($updated_habit_row['category'] ?? 'semua'),
                        'checked' => ($updated_habit_row['checked_today'] > 0),
                        'totalCompletions' => $stats['totalCompletions'] ?? 0,
                        'currentStreak' => $stats['currentStreak'] ?? 0,
                        'failedCount' => $stats['failedCount'] ?? 0,
                        'is_shared_instance' => (bool)($updated_habit_row['is_shared_instance'] ?? 0),
                        'source_shared_habit_id' => $updated_habit_row['source_shared_habit_id'],
                        'habit_start_date' => $updated_habit_row['habit_start_date'],
                        'duration_in_days' => $updated_habit_row['duration_in_days'],
                        'is_duration_unlimited' => (bool)$updated_habit_row['is_duration_unlimited'],
                        'calculated_end_date' => $updated_habit_row['calculated_end_date']
                    ];
                } else {
                    error_log("ToggleCheck - Failed to fetch updated habit data for ID: $habit_id_int after toggle.");
                }
            }
        }
        echo json_encode($response);
        exit;
    }

    if ($action === 'load_history') {
        $history_entries = []; $query = "SELECT c.completion_date, c.completed_at, h.name, h.icon, h.color FROM completions c JOIN habits h ON c.habit_id = h.id WHERE h.user_id = ? AND h.is_deleted = 0 ORDER BY c.completion_date DESC, c.completed_at DESC, h.name ASC";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "i", $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) { $history_entries[] = ['date' => $row['completion_date'], 'timestamp_db' => $row['completed_at'], 'name' => htmlspecialchars($row['name']), 'icon' => htmlspecialchars($row['icon']), 'color' => htmlspecialchars($row['color'])]; } mysqli_stmt_close($stmt); echo json_encode($history_entries); exit;
    }
    if ($action === 'load_global_stats') {
        $global_stats = ['globalStreak' => 0, 'globalFailed' => 0, 'globalCompleted' => 0]; $habits_query = "SELECT id, habit_start_date, is_duration_unlimited, calculated_end_date FROM habits WHERE user_id = ? AND is_deleted = 0";
        $stmt_habits = mysqli_prepare($link, $habits_query); mysqli_stmt_bind_param($stmt_habits, "i", $user_id); mysqli_stmt_execute($stmt_habits); $habits_result = mysqli_stmt_get_result($stmt_habits);
        $max_streak_overall = 0; $total_failed_overall = 0; $total_completions_overall = 0;
        while ($habit_row = mysqli_fetch_assoc($habits_result)) { $stats = calculate_habit_stats($habit_row['id'], $habit_row['habit_start_date'], $habit_row['is_duration_unlimited'], $habit_row['calculated_end_date']); if (($stats['currentStreak'] ?? 0) > $max_streak_overall) $max_streak_overall = $stats['currentStreak']; $total_failed_overall += ($stats['failedCount'] ?? 0); $total_completions_overall += ($stats['totalCompletions'] ?? 0); } mysqli_stmt_close($stmt_habits);
        $global_stats['globalStreak'] = $max_streak_overall; $global_stats['globalFailed'] = $total_failed_overall; $global_stats['globalCompleted'] = $total_completions_overall; echo json_encode($global_stats); exit;
    }
    if ($action === 'load_calendar_data') {
        $month = filter_input(INPUT_GET, 'month', FILTER_VALIDATE_INT); 
        $year = filter_input(INPUT_GET, 'year', FILTER_VALIDATE_INT);

        if ($month === false || $year === false || $month < 0 || $month > 11) {
            handle_error_json('Parameter bulan atau tahun tidak valid.');
        }

        $calendar_data = [];
        $start_date_month = sprintf("%04d-%02d-01", $year, $month + 1);
        $end_date_month = date('Y-m-t', strtotime($start_date_month));

        $active_habits = [];
        $stmt_active_habits = mysqli_prepare($link, "SELECT id, habit_start_date, is_duration_unlimited, calculated_end_date FROM habits WHERE user_id = ? AND is_deleted = 0");
        mysqli_stmt_bind_param($stmt_active_habits, "i", $user_id);
        mysqli_stmt_execute($stmt_active_habits);
        $res_active_habits = mysqli_stmt_get_result($stmt_active_habits);
        while ($h_row = mysqli_fetch_assoc($res_active_habits)) {
            $active_habits[$h_row['id']] = $h_row;
        }
        mysqli_stmt_close($stmt_active_habits);

        if (empty($active_habits)) {
            echo json_encode([]); 
            exit;
        }
        
        $completions_in_month = [];
        if (!empty($active_habits)) {
            $active_habit_ids_list_placeholders = implode(',', array_fill(0, count($active_habits), '?'));
            $active_habit_ids_values = array_keys($active_habits);
            
            $param_types_string = str_repeat('i', count($active_habit_ids_values)) . 'ss';
            $params_to_bind = array_merge($active_habit_ids_values, [$start_date_month, $end_date_month]);

            $stmt_completions = mysqli_prepare($link, "SELECT habit_id, completion_date FROM completions WHERE habit_id IN ($active_habit_ids_list_placeholders) AND completion_date BETWEEN ? AND ?");
            mysqli_stmt_bind_param($stmt_completions, $param_types_string, ...$params_to_bind);
            
            mysqli_stmt_execute($stmt_completions);
            $res_completions = mysqli_stmt_get_result($stmt_completions);
            while ($c_row = mysqli_fetch_assoc($res_completions)) {
                if (!isset($completions_in_month[$c_row['completion_date']])) {
                    $completions_in_month[$c_row['completion_date']] = [];
                }
                $completions_in_month[$c_row['completion_date']][] = $c_row['habit_id'];
            }
            mysqli_stmt_close($stmt_completions);
        }
        
        $current_date_loop = new DateTime($start_date_month);
        $end_date_obj_loop = new DateTime($end_date_month);

        while ($current_date_loop <= $end_date_obj_loop) {
            $date_str = $current_date_loop->format('Y-m-d');
            $daily_completed_count = 0;
            $daily_failed_count = 0;
            $total_active_habits_for_day = 0;

            foreach ($active_habits as $habit_id => $habit_details) {
                $is_active_today = false;
                if ($date_str >= $habit_details['habit_start_date']) {
                    if ($habit_details['is_duration_unlimited'] || $date_str <= $habit_details['calculated_end_date']) {
                        $is_active_today = true;
                    }
                }

                if ($is_active_today) {
                    $total_active_habits_for_day++;
                    if (isset($completions_in_month[$date_str]) && in_array($habit_id, $completions_in_month[$date_str])) {
                        $daily_completed_count++;
                    } else {
                        if ($date_str < $today_ymd) { 
                           $daily_failed_count++;
                        }
                    }
                }
            }
            
            $all_completed_for_day = ($total_active_habits_for_day > 0 && $daily_completed_count === $total_active_habits_for_day);

            if ($daily_completed_count > 0 || $daily_failed_count > 0 || $all_completed_for_day) {
                 $calendar_data[$date_str] = [
                    'completed' => $daily_completed_count,
                    'failed' => $daily_failed_count,
                    'all_done' => $all_completed_for_day
                ];
            }
            $current_date_loop->modify('+1 day');
        }
        echo json_encode($calendar_data);
        exit;
    }

    if ($action === 'load_note') { 
        $stmt = mysqli_prepare($link, "SELECT user_note_content FROM users WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $note_data = mysqli_fetch_assoc($result);
        mysqli_stmt_close($stmt);
        echo json_encode(['success' => true, 'note_content' => $note_data['user_note_content'] ?? '']);
        exit;
    }
    if ($action === 'save_note') {
        $note_content = $_POST['note_content'] ?? '';
        $stmt = mysqli_prepare($link, "UPDATE users SET user_note_content = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "si", $note_content, $user_id);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Catatan berhasil disimpan.', 'note_content' => $note_content]); 
        } else {
            error_log("Save note error: " . mysqli_stmt_error($stmt));
            handle_error_json('Gagal menyimpan catatan.');
        }
        mysqli_stmt_close($stmt);
        exit;
    }

    if ($action === 'generate_invite_code') {
        $stmt_del_old = mysqli_prepare($link, "DELETE FROM buddies WHERE user1_id = ? AND status = 'pending_code'");
        mysqli_stmt_bind_param($stmt_del_old, "i", $user_id); mysqli_stmt_execute($stmt_del_old); mysqli_stmt_close($stmt_del_old);
        $invite_code = ''; $is_unique = false;
        while(!$is_unique) { 
            $invite_code = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)); 
            $stmt_check = mysqli_prepare($link, "SELECT id FROM buddies WHERE invite_code = ?"); 
            mysqli_stmt_bind_param($stmt_check, "s", $invite_code); mysqli_stmt_execute($stmt_check); mysqli_stmt_store_result($stmt_check); 
            if (mysqli_stmt_num_rows($stmt_check) == 0) $is_unique = true; 
            mysqli_stmt_close($stmt_check); 
        }
        $stmt_insert = mysqli_prepare($link, "INSERT INTO buddies (user1_id, invite_code, status) VALUES (?, ?, 'pending_code')");
        mysqli_stmt_bind_param($stmt_insert, "is", $user_id, $invite_code);
        if (mysqli_stmt_execute($stmt_insert)) echo json_encode(['success' => true, 'invite_code' => $invite_code]);
        else { error_log("Gen code error: ".mysqli_stmt_error($stmt_insert)); handle_error_json('Gagal membuat kode undangan.');} 
        mysqli_stmt_close($stmt_insert); exit;
    }
    if ($action === 'get_my_invite_code') {
        $stmt = mysqli_prepare($link, "SELECT invite_code FROM buddies WHERE user1_id = ? AND status = 'pending_code' ORDER BY created_at DESC LIMIT 1");
        mysqli_stmt_bind_param($stmt, "i", $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt); $row = mysqli_fetch_assoc($result); mysqli_stmt_close($stmt);
        if ($row) echo json_encode(['success' => true, 'invite_code' => $row['invite_code']]); 
        else echo json_encode(['success' => false, 'message' => 'Belum ada kode undangan aktif.']); 
        exit;
    }
    if ($action === 'accept_invite') {
        $code = trim($_POST['invite_code'] ?? ''); if (empty($code)) handle_error_json('Kode undangan tidak boleh kosong.');
        $stmt_find = mysqli_prepare($link, "SELECT id, user1_id FROM buddies WHERE invite_code = ? AND status = 'pending_code'");
        mysqli_stmt_bind_param($stmt_find, "s", $code); mysqli_stmt_execute($stmt_find); $res_find = mysqli_stmt_get_result($stmt_find); $invite_data = mysqli_fetch_assoc($res_find); mysqli_stmt_close($stmt_find);
        if (!$invite_data) handle_error_json('Kode undangan tidak valid atau sudah digunakan.');
        if ($invite_data['user1_id'] == $user_id) handle_error_json('Anda tidak bisa menggunakan kode undangan sendiri.');
        $stmt_check_friend = mysqli_prepare($link, "SELECT id FROM buddies WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)) AND status = 'accepted'");
        mysqli_stmt_bind_param($stmt_check_friend, "iiii", $user_id, $invite_data['user1_id'], $invite_data['user1_id'], $user_id);
        mysqli_stmt_execute($stmt_check_friend); mysqli_stmt_store_result($stmt_check_friend);
        if (mysqli_stmt_num_rows($stmt_check_friend) > 0) { mysqli_stmt_close($stmt_check_friend); handle_error_json('Anda sudah berteman dengan pengguna ini.'); }
        mysqli_stmt_close($stmt_check_friend);
        $stmt_accept = mysqli_prepare($link, "UPDATE buddies SET user2_id = ?, status = 'accepted', accepted_at = NOW(), invite_code = NULL WHERE id = ?");
        mysqli_stmt_bind_param($stmt_accept, "ii", $user_id, $invite_data['id']);
        if(mysqli_stmt_execute($stmt_accept)) echo json_encode(['success' => true, 'message' => 'Berhasil berteman!']);
        else { error_log("Accept invite error: ".mysqli_stmt_error($stmt_accept)); handle_error_json('Gagal menerima undangan.');} 
        mysqli_stmt_close($stmt_accept); exit;
    }
    if ($action === 'list_my_buddies') {
        $buddies = []; 
        $query = "SELECT b.id as relationship_id, IF(b.user1_id = ?, u2.id, u1.id) as buddy_user_id, IF(b.user1_id = ?, u2.username, u1.username) as username, IF(b.user1_id = ?, u2.profile_picture_path, u1.profile_picture_path) as profile_pic, DATE_FORMAT(b.accepted_at, '%e %b %Y') as friends_since FROM buddies b JOIN users u1 ON b.user1_id = u1.id JOIN users u2 ON b.user2_id = u2.id WHERE (b.user1_id = ? OR b.user2_id = ?) AND b.status = 'accepted'";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "iiiii", $user_id, $user_id, $user_id, $user_id, $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while($row = mysqli_fetch_assoc($result)) { $buddies[] = ['relationship_id' => $row['relationship_id'], 'buddy_user_id' => $row['buddy_user_id'], 'username' => htmlspecialchars($row['username'] ?? 'Buddy'), 'profile_pic' => $row['profile_pic'] ? htmlspecialchars($row['profile_pic']) : 'assets/profile_placeholder.png', 'friends_since' => $row['friends_since']]; } 
        mysqli_stmt_close($stmt); echo json_encode($buddies); exit;
    }
    if ($action === 'unfriend_buddy') {
        $relationship_id = filter_input(INPUT_POST, 'relationship_id', FILTER_VALIDATE_INT);
        if (!$relationship_id) handle_error_json('ID relasi tidak valid.');
        mysqli_begin_transaction($link);
        try {
            $stmt_get_buddy_id = mysqli_prepare($link, "SELECT IF(user1_id = ?, user2_id, user1_id) as buddy_id FROM buddies WHERE id = ? AND (user1_id = ? OR user2_id = ?)");
            mysqli_stmt_bind_param($stmt_get_buddy_id, "iiii", $user_id, $relationship_id, $user_id, $user_id);
            mysqli_stmt_execute($stmt_get_buddy_id);
            $res_buddy_id = mysqli_stmt_get_result($stmt_get_buddy_id);
            $buddy_row = mysqli_fetch_assoc($res_buddy_id);
            mysqli_stmt_close($stmt_get_buddy_id);

            if (!$buddy_row) throw new Exception("Relasi buddy tidak ditemukan.");
            $actual_buddy_id = $buddy_row['buddy_id'];

            $stmt_get_my_instances = mysqli_prepare($link, "SELECT h.id FROM habits h JOIN shared_habits sh ON h.source_shared_habit_id = sh.id WHERE h.user_id = ? AND sh.original_owner_id = ? AND h.is_shared_instance = 1 AND sh.buddy_relationship_id = ?");
            mysqli_stmt_bind_param($stmt_get_my_instances, "iii", $user_id, $actual_buddy_id, $relationship_id);
            mysqli_stmt_execute($stmt_get_my_instances);
            $res_my_instances = mysqli_stmt_get_result($stmt_get_my_instances);
            while ($my_instance_row = mysqli_fetch_assoc($res_my_instances)) {
                mysqli_query($link, "DELETE FROM completions WHERE habit_id = " . $my_instance_row['id']);
            }
            mysqli_stmt_close($stmt_get_my_instances);
            $stmt_del_my_instances = mysqli_prepare($link, "DELETE h FROM habits h JOIN shared_habits sh ON h.source_shared_habit_id = sh.id WHERE h.user_id = ? AND sh.original_owner_id = ? AND h.is_shared_instance = 1 AND sh.buddy_relationship_id = ?");
            mysqli_stmt_bind_param($stmt_del_my_instances, "iii", $user_id, $actual_buddy_id, $relationship_id);
            mysqli_stmt_execute($stmt_del_my_instances); mysqli_stmt_close($stmt_del_my_instances);

            $stmt_get_buddy_instances = mysqli_prepare($link, "SELECT h.id FROM habits h JOIN shared_habits sh ON h.source_shared_habit_id = sh.id WHERE h.user_id = ? AND sh.original_owner_id = ? AND h.is_shared_instance = 1 AND sh.buddy_relationship_id = ?");
            mysqli_stmt_bind_param($stmt_get_buddy_instances, "iii", $actual_buddy_id, $user_id, $relationship_id);
            mysqli_stmt_execute($stmt_get_buddy_instances);
            $res_buddy_instances = mysqli_stmt_get_result($stmt_get_buddy_instances);
            while ($buddy_instance_row = mysqli_fetch_assoc($res_buddy_instances)) {
                mysqli_query($link, "DELETE FROM completions WHERE habit_id = " . $buddy_instance_row['id']);
            }
            mysqli_stmt_close($stmt_get_buddy_instances);
            $stmt_del_buddy_instances = mysqli_prepare($link, "DELETE h FROM habits h JOIN shared_habits sh ON h.source_shared_habit_id = sh.id WHERE h.user_id = ? AND sh.original_owner_id = ? AND h.is_shared_instance = 1 AND sh.buddy_relationship_id = ?");
            mysqli_stmt_bind_param($stmt_del_buddy_instances, "iii", $actual_buddy_id, $user_id, $relationship_id);
            mysqli_stmt_execute($stmt_del_buddy_instances); mysqli_stmt_close($stmt_del_buddy_instances);
            
            $stmt_delete_shared = mysqli_prepare($link, "DELETE FROM shared_habits WHERE buddy_relationship_id = ?");
            mysqli_stmt_bind_param($stmt_delete_shared, "i", $relationship_id);
            mysqli_stmt_execute($stmt_delete_shared); mysqli_stmt_close($stmt_delete_shared);

            $stmt_unfriend = mysqli_prepare($link, "DELETE FROM buddies WHERE id = ? AND (user1_id = ? OR user2_id = ?)");
            mysqli_stmt_bind_param($stmt_unfriend, "iii", $relationship_id, $user_id, $user_id); mysqli_stmt_execute($stmt_unfriend);
            
            if (mysqli_stmt_affected_rows($stmt_unfriend) > 0) { mysqli_commit($link); echo json_encode(['success' => true, 'message' => 'Buddy berhasil dihapus.']);
            } else { mysqli_rollback($link); handle_error_json('Gagal menghapus buddy atau Anda tidak berhak melakukannya.'); }
            mysqli_stmt_close($stmt_unfriend);
        } catch (Exception $exception) { mysqli_rollback($link); error_log("Unfriend buddy transaction error: " . $exception->getMessage()); handle_error_json('Gagal menghapus buddy dan data terkaitnya: ' . $exception->getMessage()); }
        exit;
    }
    if ($action === 'list_user_shared_habits') {
        $shared_list = []; 
        $query = "SELECT sh.id as shared_id, h.name as habit_name, h.icon as habit_icon, h.color as habit_color, o.username as owner_username, buddy.username as buddy_username, sh.status, sh.original_owner_id, sh.shared_with_buddy_id FROM shared_habits sh JOIN habits h ON sh.habit_id = h.id JOIN users o ON sh.original_owner_id = o.id JOIN users buddy ON sh.shared_with_buddy_id = buddy.id WHERE (sh.original_owner_id = ? OR sh.shared_with_buddy_id = ?) AND sh.status = 'active'";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "ii", $user_id, $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while($row = mysqli_fetch_assoc($result)){ $shared_list[] = ['shared_id' => $row['shared_id'], 'habit_name' => htmlspecialchars($row['habit_name']), 'habit_icon' => htmlspecialchars($row['habit_icon']), 'habit_color' => htmlspecialchars($row['habit_color']), 'owner_username' => htmlspecialchars($row['owner_username']), 'buddy_username' => htmlspecialchars($row['buddy_username']), 'status' => $row['status'], 'is_owner' => ($row['original_owner_id'] == $user_id)]; } 
        mysqli_stmt_close($stmt); echo json_encode($shared_list); exit;
    }
     if ($action === 'revoke_shared_habit') {
        $shared_id = filter_input(INPUT_POST, 'shared_id', FILTER_VALIDATE_INT);
        if (!$shared_id) handle_error_json('ID habit bersama tidak valid.');
        mysqli_begin_transaction($link);
        try {
            $stmt_get_instance_id = mysqli_prepare($link, "SELECT id FROM habits WHERE source_shared_habit_id = ? AND is_shared_instance = 1");
            mysqli_stmt_bind_param($stmt_get_instance_id, "i", $shared_id);
            mysqli_stmt_execute($stmt_get_instance_id);
            $res_instance_id = mysqli_stmt_get_result($stmt_get_instance_id);
            $instance_habit_id = null;
            if ($row_instance_id = mysqli_fetch_assoc($res_instance_id)) {
                $instance_habit_id = $row_instance_id['id'];
            }
            mysqli_stmt_close($stmt_get_instance_id);

            if ($instance_habit_id) {
                $stmt_del_completions_instance = mysqli_prepare($link, "DELETE FROM completions WHERE habit_id = ?");
                mysqli_stmt_bind_param($stmt_del_completions_instance, "i", $instance_habit_id);
                mysqli_stmt_execute($stmt_del_completions_instance);
                mysqli_stmt_close($stmt_del_completions_instance);

                $stmt_del_instance_habit = mysqli_prepare($link, "DELETE FROM habits WHERE id = ? AND is_shared_instance = 1");
                mysqli_stmt_bind_param($stmt_del_instance_habit, "i", $instance_habit_id);
                mysqli_stmt_execute($stmt_del_instance_habit);
                mysqli_stmt_close($stmt_del_instance_habit);
            }

            $stmt_revoke = mysqli_prepare($link, "DELETE FROM shared_habits WHERE id = ? AND original_owner_id = ?");
            mysqli_stmt_bind_param($stmt_revoke, "ii", $shared_id, $user_id);
            mysqli_stmt_execute($stmt_revoke);
            
            if (mysqli_stmt_affected_rows($stmt_revoke) > 0) {
                mysqli_commit($link);
                echo json_encode(['success' => true, 'message' => 'Berbagi habit berhasil dibatalkan.']);
            } else {
                mysqli_rollback($link);
                handle_error_json('Gagal membatalkan berbagi habit atau Anda bukan pemiliknya.');
            }
            mysqli_stmt_close($stmt_revoke);
        } catch (Exception $e) {
            mysqli_rollback($link);
            error_log("Revoke shared habit error: " . $e->getMessage());
            handle_error_json('Terjadi kesalahan saat membatalkan berbagi habit: ' . $e->getMessage());
        }
        exit;
    }
    if ($action === 'get_shareable_habits') {
        $shareable_habits = []; 
        $query = "SELECT id, name, icon FROM habits WHERE user_id = ? AND is_deleted = 0 AND is_shared_instance = 0 ORDER BY name ASC";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "i", $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) { $shareable_habits[] = ['id' => $row['id'], 'name' => htmlspecialchars($row['name']), 'icon' => htmlspecialchars($row['icon'] ?? '🎯')]; } 
        mysqli_stmt_close($stmt); echo json_encode($shareable_habits); exit;
    }
    if ($action === 'get_buddies_for_sharing') {
        $buddies_for_sharing = []; 
        $query = "SELECT IF(b.user1_id = ?, u2.id, u1.id) as id, IF(b.user1_id = ?, u2.username, u1.username) as username FROM buddies b JOIN users u1 ON b.user1_id = u1.id JOIN users u2 ON b.user2_id = u2.id WHERE (b.user1_id = ? OR b.user2_id = ?) AND b.status = 'accepted' ORDER BY username ASC";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "iiii", $user_id, $user_id, $user_id, $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while($row = mysqli_fetch_assoc($result)) { $buddies_for_sharing[] = ['id' => $row['id'], 'username' => htmlspecialchars($row['username'] ?? 'Buddy')];} 
        mysqli_stmt_close($stmt); echo json_encode($buddies_for_sharing); exit;
    }
    if ($action === 'share_habit_request') {
        $habit_id = filter_input(INPUT_POST, 'habit_id', FILTER_VALIDATE_INT); $buddy_id = filter_input(INPUT_POST, 'buddy_id', FILTER_VALIDATE_INT);
        if (!$habit_id || !$buddy_id) handle_error_json('Data permintaan tidak valid.');
        if ($user_id == $buddy_id) handle_error_json('Anda tidak bisa berbagi habit dengan diri sendiri.');
        $stmt_verify_habit = mysqli_prepare($link, "SELECT id FROM habits WHERE id = ? AND user_id = ? AND is_deleted = 0 AND is_shared_instance = 0");
        mysqli_stmt_bind_param($stmt_verify_habit, "ii", $habit_id, $user_id); mysqli_stmt_execute($stmt_verify_habit); mysqli_stmt_store_result($stmt_verify_habit);
        if (mysqli_stmt_num_rows($stmt_verify_habit) == 0) { mysqli_stmt_close($stmt_verify_habit); handle_error_json('Habit tidak valid, bukan milik Anda, atau merupakan habit bersama.'); } 
        mysqli_stmt_close($stmt_verify_habit);
        
        $stmt_verify_buddy_rel = mysqli_prepare($link, "SELECT id FROM buddies WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)) AND status = 'accepted'");
        mysqli_stmt_bind_param($stmt_verify_buddy_rel, "iiii", $user_id, $buddy_id, $buddy_id, $user_id); 
        mysqli_stmt_execute($stmt_verify_buddy_rel); $res_verify_buddy_rel = mysqli_stmt_get_result($stmt_verify_buddy_rel); $buddy_rel_data = mysqli_fetch_assoc($res_verify_buddy_rel); 
        mysqli_stmt_close($stmt_verify_buddy_rel);
        if (!$buddy_rel_data) handle_error_json('Anda tidak berteman dengan pengguna ini atau relasi tidak aktif.'); 
        $buddy_relationship_id = $buddy_rel_data['id'];

        $stmt_check_exist = mysqli_prepare($link, "SELECT id FROM shared_habits WHERE habit_id = ? AND original_owner_id = ? AND shared_with_buddy_id = ? AND status IN ('pending_buddy_acceptance', 'active')");
        mysqli_stmt_bind_param($stmt_check_exist, "iii", $habit_id, $user_id, $buddy_id); mysqli_stmt_execute($stmt_check_exist); mysqli_stmt_store_result($stmt_check_exist);
        if (mysqli_stmt_num_rows($stmt_check_exist) > 0) { mysqli_stmt_close($stmt_check_exist); handle_error_json('Habit ini sudah dibagikan atau sedang menunggu persetujuan dari buddy ini.'); } 
        mysqli_stmt_close($stmt_check_exist);
        $stmt_insert = mysqli_prepare($link, "INSERT INTO shared_habits (habit_id, original_owner_id, shared_with_buddy_id, buddy_relationship_id, status, shared_at) VALUES (?, ?, ?, ?, 'pending_buddy_acceptance', NOW())");
        mysqli_stmt_bind_param($stmt_insert, "iiii", $habit_id, $user_id, $buddy_id, $buddy_relationship_id);
        if (mysqli_stmt_execute($stmt_insert)) echo json_encode(['success' => true, 'message' => 'Permintaan berbagi habit telah dikirim!']);
        else { error_log("Share req error: " . mysqli_stmt_error($stmt_insert)); handle_error_json('Gagal mengirim permintaan berbagi habit.');} 
        mysqli_stmt_close($stmt_insert); exit;
    }
    if ($action === 'list_incoming_share_requests') {
        $requests = []; 
        $query = "SELECT sh.id as shared_id, sh.habit_id, sh.original_owner_id, sh.shared_at, h.name as habit_name, h.icon as habit_icon, u.username as sharer_username, u.profile_picture_path as sharer_profile_pic FROM shared_habits sh JOIN habits h ON sh.habit_id = h.id JOIN users u ON sh.original_owner_id = u.id WHERE sh.shared_with_buddy_id = ? AND sh.status = 'pending_buddy_acceptance' ORDER BY sh.shared_at DESC";
        $stmt = mysqli_prepare($link, $query); mysqli_stmt_bind_param($stmt, "i", $user_id); mysqli_stmt_execute($stmt); $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) { $requests[] = ['shared_id' => $row['shared_id'], 'habit_id' => $row['habit_id'], 'habit_name' => htmlspecialchars($row['habit_name']), 'habit_icon' => htmlspecialchars($row['habit_icon'] ?? '🎯'), 'sharer_username' => htmlspecialchars($row['sharer_username']), 'sharer_profile_pic' => $row['sharer_profile_pic'] ? htmlspecialchars($row['sharer_profile_pic']) : 'assets/profile_placeholder.png', 'shared_at' => $row['shared_at']]; }
        mysqli_stmt_close($stmt); echo json_encode($requests); exit;
    }
    if ($action === 'accept_share_request' || $action === 'decline_share_request') {
        $shared_id = filter_input(INPUT_POST, 'shared_id', FILTER_VALIDATE_INT); 
        if (!$shared_id) handle_error_json('ID permintaan tidak valid.');
        
        $stmt_verify = mysqli_prepare($link, "SELECT sh.id, sh.habit_id, sh.original_owner_id, h.name as original_habit_name, h.icon as original_habit_icon, h.color as original_habit_color, h.category as original_habit_category, h.habit_start_date as original_start_date, h.duration_in_days as original_duration, h.is_duration_unlimited as original_is_unlimited, h.calculated_end_date as original_end_date
                                             FROM shared_habits sh
                                             JOIN habits h ON sh.habit_id = h.id
                                             WHERE sh.id = ? AND sh.shared_with_buddy_id = ? AND sh.status = 'pending_buddy_acceptance'");
        mysqli_stmt_bind_param($stmt_verify, "ii", $shared_id, $user_id); 
        mysqli_stmt_execute($stmt_verify); $res_verify = mysqli_stmt_get_result($stmt_verify); $share_data = mysqli_fetch_assoc($res_verify);
        
        if (!$share_data) { mysqli_stmt_close($stmt_verify); handle_error_json('Permintaan tidak ditemukan atau sudah diproses.'); } 
        mysqli_stmt_close($stmt_verify);
        
        $new_status = ($action === 'accept_share_request') ? 'active' : 'declined_by_buddy';
        $timestamp_column_sql = ($action === 'accept_share_request') ? ', accepted_at_share = NOW()' : '';
        
        mysqli_begin_transaction($link);
        try {
            $stmt_update_shared = mysqli_prepare($link, "UPDATE shared_habits SET status = ? $timestamp_column_sql WHERE id = ?");
            mysqli_stmt_bind_param($stmt_update_shared, "si", $new_status, $shared_id);
            mysqli_stmt_execute($stmt_update_shared); mysqli_stmt_close($stmt_update_shared);
            $new_habit_instance_id = null;
            if ($action === 'accept_share_request') {
                $stmt_insert_buddy_habit = mysqli_prepare($link, "INSERT INTO habits (user_id, name, icon, color, category, habit_start_date, duration_in_days, is_duration_unlimited, calculated_end_date, created_at, is_shared_instance, source_shared_habit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, ?)");
                mysqli_stmt_bind_param($stmt_insert_buddy_habit, "isssssiisi", $user_id, $share_data['original_habit_name'], $share_data['original_habit_icon'], $share_data['original_habit_color'], $share_data['original_habit_category'], $share_data['original_start_date'], $share_data['original_duration'], $share_data['original_is_unlimited'], $share_data['original_end_date'], $shared_id);
                if (!mysqli_stmt_execute($stmt_insert_buddy_habit)) { throw new Exception("Gagal membuat instance habit: " . mysqli_stmt_error($stmt_insert_buddy_habit)); }
                $new_habit_instance_id = mysqli_insert_id($link); mysqli_stmt_close($stmt_insert_buddy_habit);
            }
            mysqli_commit($link);
            $message = ($action === 'accept_share_request') ? 'Permintaan diterima & habit ditambahkan!' : 'Permintaan ditolak.'; 
            echo json_encode(['success' => true, 'message' => $message, 'new_habit_instance_id' => $new_habit_instance_id]); 
        } catch (Exception $e) {
            mysqli_rollback($link); error_log("Error processing share request: " . $e->getMessage()); 
            handle_error_json('Gagal memproses permintaan: ' . $e->getMessage()); 
        }
        exit;
    }


    if (!headers_sent()) { handle_error_json('Aksi tidak diketahui atau tidak diizinkan.', 404); }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitHub Dashboard</title>
    <link rel="icon" href="assets/HabitHub icon.png" type="image/png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="dashboard.css?v=<?php echo time(); ?>" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>
    <div class="container">
        <aside class="sidebar">
        <div class="logo">
                <img src="assets\HabitHub logo w.png" alt="HabitHub Logo" id="sidebar-logo-image">
            </div>
            <nav id="main-nav">
                <ul>
                    <li><a href="#dashboard" class="nav-link active" data-target="dashboard-content"><span class="icon material-icons-outlined">dashboard</span> <span>Dashboard</span></a></li>
                    <li><a href="#buddy" class="nav-link" data-target="buddy-content"><span class="icon material-icons-outlined">group</span> <span>Habit Buddy</span></a></li>
                    <li><a href="#history" class="nav-link" data-target="history-content"><span class="icon material-icons-outlined">history</span> <span>Riwayat</span></a></li>
                    <li><a href="#ai-coach" class="nav-link" data-target="ai-coach-content"><span class="icon material-icons-outlined">smart_toy</span> <span>AI Coach</span></a></li>
                    <li><a href="#notes" class="nav-link" data-target="notes-content"><span class="icon material-icons-outlined">description</span> <span>Catatan</span></a></li>
                </ul>
            </nav>
            <div class="user-profile" id="sidebar-profile-trigger">
                <img src="assets/profile_placeholder.png" alt="User Avatar" id="sidebar-avatar"/>
                <div class="user-info">
                    <span class="username" id="sidebar-username">Nama User</span>
                    <span class="email" id="sidebar-email">email@contoh.com</span>
                </div>
            </div>
        </aside>
        <main class="main-content">
            <header class="main-header">
                <div class="title"><h1 id="main-title">Dashboard</h1><p id="main-subtitle">Habit hari ini</p></div>
                <button class="add-habit-btn" id="add-habit-header-btn"><i class="fas fa-plus" style="margin-right: 8px;"></i> Tambah Habit</button>
            </header>
            <div id="dashboard-content" class="content-section active">
                 <div class="content-grid">
                    <section class="habit-section">
                        <div class="habit-category-filter">
                            <button data-category="semua" class="active">Semua</button>
                            <button data-category="pagi">Pagi</button>
                            <button data-category="siang">Siang</button>
                            <button data-category="sore-malam">Sore/Malam</button>
                        </div>
                        <div class="habit-list" id="habit-list-container"><p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat habit...</p></div>
                    </section>
                    <aside class="right-panel">
                        <div class="stats-area">
                            <div class="stat-card streak"><span class="bg-icon">🔥</span><p>Runtutan Tertinggi</p><h2 id="global-streak">- Hari</h2></div>
                            <div class="stat-card failed"><span class="bg-icon">❗</span><p>Total Gagal</p><h2 id="global-failed">- Kali</h2></div>
                            <div class="stat-card completed"><span class="bg-icon">⭐</span><p>Total Selesai</p><h2 id="global-completed">- Kali</h2></div>
                        </div>
                        <div class="calendar">
                            <div class="calendar-header"><h2 id="calendar-month-year">Memuat...</h2><div class="calendar-nav"><button id="calendar-prev" aria-label="Bulan Sebelumnya"><i class="fas fa-chevron-left"></i></button><button id="calendar-next" aria-label="Bulan Berikutnya"><i class="fas fa-chevron-right"></i></button></div></div>
                            <div class="calendar-days-header"><span>SEN</span><span>SEL</span><span>RAB</span><span>KAM</span><span>JUM</span><span>SAB</span><span>MIN</span></div>
                            <div class="calendar-grid" id="calendar-grid-container"><span class="loading-calendar">Memuat kalender...</span></div>
                        </div>
                    </aside>
                </div>
            </div>
            <div id="history-content" class="content-section">
                <div class="history-card-section card-style">
                    <div class="history-list-content-section" id="history-list"><p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat riwayat...</p></div>
                </div>
            </div>
            <div id="ai-coach-content" class="content-section">
                <div class="ai-coach-container card-style">
                    <iframe id="ai-coach-iframe" src="about:blank" frameborder="0"></iframe>
                </div>
            </div>
             <div id="notes-content" class="content-section">
                <div class="notes-container card-style">
                    <textarea id="user-note-textarea" placeholder="Tulis catatan Anda di sini..."></textarea>
                    <div class="notes-actions">
                        <button id="save-note-btn" class="btn btn-primary" disabled><i class="fas fa-save"></i> Simpan Catatan</button>
                        <span id="note-save-status" class="save-status" style="display: none; margin-left: 10px;"></span>
                    </div>
                </div>
            </div>
            <div id="buddy-content" class="content-section">
                <div class="buddy-main-container card-style">
                    <div class="buddy-tabs">
                        <button class="buddy-tab-link active" data-tab="my-buddies-tab">Buddy Saya</button>
                        <button class="buddy-tab-link" data-tab="invite-buddy-tab">Undang Buddy</button>
                        <button class="buddy-tab-link" data-tab="buddy-requests-tab">Permintaan <span class="badge-count" id="buddy-request-count">0</span></button>
                        <button class="buddy-tab-link" data-tab="shared-habits-tab">Habit Bersama</button>
                    </div>
                    <div id="my-buddies-tab" class="buddy-tab-pane active">
                        <h3>Daftar Buddy Anda</h3>
                        <div id="buddy-list" class="list-container">
                            <p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat daftar buddy...</p>
                        </div>
                    </div>
                    <div id="invite-buddy-tab" class="buddy-tab-pane">
                        <h3>Undang Teman Menjadi Buddy</h3>
                        <div class="form-group">
                            <label for="my-invite-code">Kode Undangan Anda:</label>
                            <div class="input-group">
                                <input type="text" id="my-invite-code" readonly placeholder="Klik 'Buat Kode Undangan Baru'">
                                <button id="copy-invite-code" class="btn-icon" aria-label="Salin Kode"><i class="fas fa-copy"></i></button>
                            </div>
                            <button id="generate-new-invite-code" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Buat Kode Undangan Baru</button>
                            <p id="invite-code-status" class="form-status-message"></p>
                        </div>
                        <hr class="divider">
                        <div class="form-group">
                            <label for="enter-buddy-code">Masukkan Kode Undangan Teman:</label>
                            <input type="text" id="enter-buddy-code" placeholder="Contoh: ABCDE123">
                            <button id="accept-buddy-invite" class="btn btn-success"><i class="fas fa-user-plus"></i> Terima Undangan</button>
                            <p id="accept-code-status" class="form-status-message"></p>
                        </div>
                    </div>
                    <div id="buddy-requests-tab" class="buddy-tab-pane">
                        <h3>Permintaan Berbagi Habit Masuk</h3>
                        <div id="buddy-requests-list" class="list-container">
                            <p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat permintaan...</p>
                        </div>
                    </div>
                    <div id="shared-habits-tab" class="buddy-tab-pane">
                        <h3>Habit yang Dibagikan Bersama Buddy</h3>
                        <div id="shared-habits-list" class="list-container">
                             <p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat habit bersama...</p>
                        </div>
                        <button id="initiate-share-habit-btn" class="btn btn-primary" style="margin-top: 20px;">
                            <i class="fas fa-share-alt"></i> Bagikan Habit Baru
                        </button>
                    </div>
                </div>
            </div>
            <div id="profile-content" class="content-section">
                <div class="profile-card-section card-style">
                    <div class="profile-left-column">
                        <div class="profile-picture-container">
                            <img src="assets/profile_placeholder.png" alt="Foto Profil User" class="profile-picture" id="profile-image"/>
                            <button class="edit-picture-btn" aria-label="Ubah foto profil"><i class="fas fa-camera"></i></button>
                            <input type="file" id="imageUpload" name="profilePictureFile" accept="image/*" style="display: none"/>
                        </div>
                        <div class="profile-actions-secondary">
                            <button class="change-password-btn btn"><i class="fas fa-key"></i> Ganti Password</button>
                            <button class="delete-account-btn btn"><i class="fas fa-user-slash"></i> Hapus Akun</button>
                            <a href="logout.php" class="profile-logout-btn btn"><i class="fas fa-sign-out-alt"></i> Logout Akun</a> 
                        </div>
                    </div>
                    <div class="profile-info" id="profile-details">
                        <div class="profile-field"><label for="profile-username">Username:</label><input type="text" id="profile-username" placeholder="Username" readonly disabled/></div>
                        <div class="profile-field">
                            <label for="profile-first-name">Nama Lengkap:</label>
                            <div class="name-inputs"><input type="text" id="profile-first-name" placeholder="Nama Depan" readonly/><input type="text" id="profile-last-name" placeholder="Nama Belakang" readonly/></div>
                            <button class="edit-field-btn" data-target-fields="profile-first-name,profile-last-name" aria-label="Edit Nama Lengkap"><i class="fas fa-pencil-alt"></i></button>
                        </div>
                        <div class="profile-field"><label for="profile-email">Email:</label><input type="email" id="profile-email" placeholder="Email" readonly/><button class="edit-field-btn" data-target-fields="profile-email" aria-label="Edit Email"><i class="fas fa-pencil-alt"></i></button></div>
                        <div class="profile-field"><label for="profile-phone">Nomor Telepon:</label><input type="tel" id="profile-phone" placeholder="Nomor Telepon (Opsional)" readonly/><button class="edit-field-btn" data-target-fields="profile-phone" aria-label="Edit Nomor Telepon"><i class="fas fa-pencil-alt"></i></button></div>
                        <div class="profile-actions-main"><button class="save-profile-btn btn" style="display: none"><i class="fas fa-save"></i> Simpan Perubahan</button><span class="save-status" style="display: none; margin-left: 10px"></span></div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <div id="habit-modal" class="modal" aria-labelledby="modal-title" aria-hidden="true" role="dialog">
        <div class="modal-content">
            <button class="close-btn" aria-label="Tutup">×</button>
            <h2 id="modal-title">Tambah Habit Baru</h2>
            <form id="habit-form">
                <input type="hidden" id="habit-id" />
                <div class="form-group"><label for="habit-name">Nama Habit:</label><input type="text" id="habit-name" required /></div>
                <div class="form-group"><label for="habit-icon">Ikon Habit (Emoji):</label><input type="text" id="habit-icon" placeholder="Contoh: 😊, 🏃, 📚"/></div>
                <div class="form-group">
                    <label for="habit-category">Kategori Waktu:</label>
                    <select id="habit-category">
                        <option value="semua">Semua/Fleksibel</option>
                        <option value="pagi">Pagi</option>
                        <option value="siang">Siang</option>
                        <option value="sore-malam">Sore/Malam</option>
                    </select>
                </div>
                <hr class="divider">
                <div class="form-group visually-hidden"><label for="habit-start-date">Tanggal Mulai Habit:</label><input type="date" id="habit-start-date" required /></div>
                <div class="form-group duration-toggle">
                    <input type="checkbox" id="is-duration-unlimited" checked>
                    <label for="is-duration-unlimited">Durasi Tak Terbatas</label>
                </div>
                <div class="duration-settings hidden">
                    <div class="form-group">
                        <label>Atur Durasi:</label>
                        <div class="duration-inputs">
                            <input type="number" id="duration-value" min="1" value="30">
                            <select id="duration-unit">
                                <option value="hari">Hari</option>
                                <option value="bulan">Bulan</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-btn" class="btn">Batal</button>
                    <button type="submit" id="save-habit-btn" class="btn">Simpan</button>
                </div>
            </form>
        </div>
    </div>
    <div id="share-habit-modal" class="modal" aria-labelledby="share-modal-title" aria-hidden="true" role="dialog">
        <div class="modal-content">
            <button class="close-btn" aria-label="Tutup">×</button>
            <h2 id="share-modal-title">Bagikan Habit dengan Buddy</h2>
            <form id="share-habit-form">
                <div class="form-group">
                    <label for="select-habit-to-share">Pilih Habit untuk Dibagikan:</label>
                    <select id="select-habit-to-share" required>
                        <option value="">Memuat habit...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="select-buddy-to-share-with">Pilih Buddy:</label>
                    <select id="select-buddy-to-share-with" required>
                        <option value="">Memuat buddy...</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-share-habit-btn" class="btn">Batal</button>
                    <button type="submit" id="confirm-share-habit-btn" class="btn btn-primary">Kirim Undangan Berbagi</button>
                </div>
                <p id="share-habit-status" class="form-status-message" style="text-align: center; margin-top:15px;"></p>
            </form>
        </div>
    </div>
    <script src="dashboard.js?v=<?php echo time(); ?>"></script>
</body>
</html>