<?php
session_start(); 


if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest' && isset($_GET['action'])) {
        http_response_code(401); 
        echo json_encode(['error' => 'Sesi tidak valid atau telah berakhir. Silakan login kembali.', 'action' => 'logout']);
        exit;
    }
    header("location: login.php");
    exit;
}

require_once 'db_config.php'; 

if (!$link) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest' && isset($_GET['action'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Koneksi database gagal. Tidak dapat memproses permintaan.']);
        exit;
    }
    die("Koneksi database gagal. Aplikasi tidak dapat berjalan.");
}

if (($_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['action']))) {
    if (!$link) {
        http_response_code(500);
        echo json_encode(['error' => 'Koneksi database tidak tersedia untuk aksi AJAX.']);
        exit;
    }

    $action = $_POST['action'] ?? $_GET['action'] ?? null;
    $user_id = $_SESSION['user_id']; 
    $today_ymd = getTodayYMD();

    if (!headers_sent()) {
        header('Content-Type: application/json');
    }

    if ($action === 'load_profile') {
        $stmt = mysqli_prepare($link, "SELECT username, email, first_name, last_name, phone, profile_picture_path FROM users WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $profile = mysqli_fetch_assoc($result);

        function get_default_profile_values() { // Definisikan di dalam scope jika hanya dipakai di sini
            return [
                'username' => 'User', 
                'email' => '',
                'first_name' => '',
                'last_name' => '',
                'phone' => '',
                'profile_picture_path' => 'assets/profile_placeholder.png'
            ];
        }
        $default_values = get_default_profile_values();
        $profile_data_to_send = $profile ? array_merge($default_values, array_filter($profile, fn($value) => !is_null($value))) : $default_values;
        if ($profile && isset($profile['username'])) $profile_data_to_send['username'] = $profile['username'];

        mysqli_stmt_close($stmt);
        echo json_encode($profile_data_to_send);
        exit;
    }

    if ($action === 'save_profile') {
        $firstName = $_POST['firstName'] ?? '';
        $lastName = $_POST['lastName'] ?? '';
        $email = $_POST['email'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $profilePicturePath = null; 

        if (isset($_FILES['profilePictureFile']) && $_FILES['profilePictureFile']['error'] == UPLOAD_ERR_OK) {
            $uploadDir = 'assets/uploads/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0775, true); 
            }
            if (!is_writable($uploadDir)) {
                 echo json_encode(['success' => false, 'message' => 'Upload directory is not writable.']);
                 exit;
            }

            $fileName = 'user'. $user_id .'_'. uniqid() . '.' . pathinfo($_FILES['profilePictureFile']['name'], PATHINFO_EXTENSION);
            $uploadFilePath = $uploadDir . $fileName;

            $stmt_old_pic = mysqli_prepare($link, "SELECT profile_picture_path FROM users WHERE id = ?");
            mysqli_stmt_bind_param($stmt_old_pic, "i", $user_id);
            mysqli_stmt_execute($stmt_old_pic);
            $res_old_pic = mysqli_stmt_get_result($stmt_old_pic);
            $row_old_pic = mysqli_fetch_assoc($res_old_pic);
            mysqli_stmt_close($stmt_old_pic);

            if (move_uploaded_file($_FILES['profilePictureFile']['tmp_name'], $uploadFilePath)) {
                $profilePicturePath = $uploadFilePath;
                if ($row_old_pic && $row_old_pic['profile_picture_path'] && $row_old_pic['profile_picture_path'] !== 'assets/profile_placeholder.png' && file_exists($row_old_pic['profile_picture_path'])) {
                    @unlink($row_old_pic['profile_picture_path']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to upload profile picture. Check permissions.']);
                exit;
            }
        } else if (isset($_POST['profilePicturePath']) && !isset($_FILES['profilePictureFile'])) { 
            $profilePicturePath = $_POST['profilePicturePath'];
        }


        if ($profilePicturePath !== null && (!isset($_POST['profilePicturePath']) || (isset($_POST['profilePicturePath']) && $_POST['profilePicturePath'] !== $profilePicturePath ) || isset($_FILES['profilePictureFile']) ) ) {
            $stmt = mysqli_prepare($link, "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, profile_picture_path = ? WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "sssssi", $firstName, $lastName, $email, $phone, $profilePicturePath, $user_id);
        } else {
            $stmt = mysqli_prepare($link, "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "ssssi", $firstName, $lastName, $email, $phone, $user_id);
            if($profilePicturePath === null){
                $stmt_curr_pic = mysqli_prepare($link, "SELECT profile_picture_path FROM users WHERE id = ?");
                mysqli_stmt_bind_param($stmt_curr_pic, "i", $user_id);
                mysqli_stmt_execute($stmt_curr_pic);
                $res_curr_pic = mysqli_stmt_get_result($stmt_curr_pic);
                $row_curr_pic = mysqli_fetch_assoc($res_curr_pic);
                $profilePicturePath = $row_curr_pic['profile_picture_path'] ?? 'assets/profile_placeholder.png';
                mysqli_stmt_close($stmt_curr_pic);
            }
        }
        
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Profil berhasil disimpan!', 'newProfilePicturePath' => $profilePicturePath]);
        } else {
            error_log("Save profile error: " . mysqli_stmt_error($stmt) . " Query: " . $stmt->sqlstate);
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan profil.']);
        }
        mysqli_stmt_close($stmt);
        exit;
    }
    
    if ($action === 'load_habits') {
        $habits_data = [];
        if (empty($today_ymd) || empty($user_id)) {
            error_log("load_habits: today_ymd or user_id is empty.");
            echo json_encode(['error' => 'Parameter internal tidak valid.']);
            exit;
        }
        $query = "
            SELECT 
                h.id, h.name, h.icon, h.color, DATE_FORMAT(h.created_at, '%Y-%m-%d %H:%i:%s') as created_at_formatted,
                (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today
            FROM habits h
            WHERE h.user_id = ? AND h.is_deleted = 0 
            ORDER BY h.created_at DESC"; 
        
        $stmt = mysqli_prepare($link, $query);
        if (!$stmt) {
            error_log("MySQL Prepare Error (load_habits): " . mysqli_error($link));
            echo json_encode(['error' => 'Database query preparation failed for loading habits.']);
            exit;
        }
        mysqli_stmt_bind_param($stmt, "si", $today_ymd, $user_id);
        
        if (!mysqli_stmt_execute($stmt)) {
            error_log("MySQL Execute Error (load_habits): " . mysqli_stmt_error($stmt));
            echo json_encode(['error' => 'Database query execution failed for loading habits.']);
            mysqli_stmt_close($stmt);
            exit;
        }
        
        $result = mysqli_stmt_get_result($stmt);
        if (!$result) {
            error_log("MySQL Get Result Error (load_habits): " . mysqli_error($link));
            echo json_encode(['error' => 'Failed to get results for loading habits.']);
            mysqli_stmt_close($stmt);
            exit;
        }

        while ($row = mysqli_fetch_assoc($result)) {
            if (isset($row['created_at_formatted']) && !empty($row['created_at_formatted'])) {
                $stats = calculate_habit_stats($row['id'], $row['created_at_formatted']);
                if (isset($stats['error'])) { 
                     error_log("Error calculating stats for habit ID " . $row['id'] . ": " . $stats['error']);
                }
                $habits_data[] = [
                    'id' => $row['id'],
                    'name' => htmlspecialchars($row['name'] ?? 'Unnamed'), 
                    'icon' => htmlspecialchars($row['icon'] ?? '🎯'),   
                    'color' => htmlspecialchars($row['color'] ?? 'orange-check'), 
                    'checked' => ($row['checked_today'] ?? 0) > 0,
                    'totalCompletions' => $stats['totalCompletions'] ?? 0,
                    'currentStreak' => $stats['currentStreak'] ?? 0,
                    'failedCount' => $stats['failedCount'] ?? 0,
                    'createdAt' => $row['created_at_formatted'], 
                ];
            } else {
                error_log("Habit ID " . ($row['id'] ?? 'N/A') . " is missing created_at_formatted field or it's empty.");
            }
        }
        mysqli_stmt_close($stmt);
        if (!headers_sent()) { 
             echo json_encode($habits_data);
        } else {
            error_log("Headers already sent before final JSON echo in load_habits.");
        }
        exit;
    }

    if ($action === 'add_habit') {
        $name = $_POST['name'] ?? 'Unnamed Habit';
        $icon = $_POST['icon'] ?? '🎯';
        $color = $_POST['color'] ?? 'orange-check';

        $stmt = mysqli_prepare($link, "INSERT INTO habits (user_id, name, icon, color, created_at) VALUES (?, ?, ?, ?, NOW())");
        mysqli_stmt_bind_param($stmt, "isss", $user_id, $name, $icon, $color);
         if (mysqli_stmt_execute($stmt)) {
            $new_habit_id = mysqli_insert_id($link);
            $new_habit_stmt = mysqli_prepare($link, "SELECT id, name, icon, color, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at_formatted FROM habits WHERE id = ? AND user_id = ?");
            mysqli_stmt_bind_param($new_habit_stmt, "ii", $new_habit_id, $user_id);
            mysqli_stmt_execute($new_habit_stmt);
            $new_habit_result = mysqli_stmt_get_result($new_habit_stmt);
            $new_habit_row = mysqli_fetch_assoc($new_habit_result);
            mysqli_stmt_close($new_habit_stmt);

            if ($new_habit_row) {
                 $stats = calculate_habit_stats($new_habit_row['id'], $new_habit_row['created_at_formatted']);
                 echo json_encode([
                    'success' => true, 
                    'habit' => [
                        'id' => $new_habit_row['id'],
                        'name' => htmlspecialchars($new_habit_row['name']),
                        'icon' => htmlspecialchars($new_habit_row['icon']),
                        'color' => htmlspecialchars($new_habit_row['color']),
                        'checked' => false,
                        'totalCompletions' => $stats['totalCompletions'],
                        'currentStreak' => $stats['currentStreak'],
                        'failedCount' => $stats['failedCount'],
                        'createdAt' => $new_habit_row['created_at_formatted'],
                    ]
                ]);
            } else {
                 echo json_encode(['success' => false, 'message' => 'Gagal mengambil data habit baru.']);
            }
        } else {
            error_log("Add habit error: " . mysqli_stmt_error($stmt));
            echo json_encode(['success' => false, 'message' => 'Gagal menambahkan habit.']);
        }
        mysqli_stmt_close($stmt);
        exit;
    }

    if ($action === 'update_habit') {
        $id = $_POST['id'] ?? null;
        $name = $_POST['name'] ?? 'Unnamed Habit';
        $icon = $_POST['icon'] ?? '🎯';

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID Habit tidak ditemukan.']);
            exit;
        }
        $id_int = (int)$id;

        $stmt = mysqli_prepare($link, "UPDATE habits SET name = ?, icon = ? WHERE id = ? AND user_id = ?");
        mysqli_stmt_bind_param($stmt, "ssii", $name, $icon, $id_int, $user_id);
        if (mysqli_stmt_execute($stmt)) {
            $updated_habit_stmt = mysqli_prepare($link, "SELECT h.id, h.name, h.icon, h.color, DATE_FORMAT(h.created_at, '%Y-%m-%d %H:%i:%s') as created_at_formatted, (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today FROM habits h WHERE h.id = ? AND h.user_id = ?");
            mysqli_stmt_bind_param($updated_habit_stmt, "sii", $today_ymd, $id_int, $user_id);
            mysqli_stmt_execute($updated_habit_stmt);
            $updated_habit_result = mysqli_stmt_get_result($updated_habit_stmt);
            $updated_habit_row = mysqli_fetch_assoc($updated_habit_result);
            mysqli_stmt_close($updated_habit_stmt);

            if($updated_habit_row) {
                $stats = calculate_habit_stats($updated_habit_row['id'], $updated_habit_row['created_at_formatted']);
                echo json_encode([
                    'success' => true,
                    'habit' => [ 
                        'id' => $updated_habit_row['id'],
                        'name' => htmlspecialchars($updated_habit_row['name']),
                        'icon' => htmlspecialchars($updated_habit_row['icon']),
                        'color' => htmlspecialchars($updated_habit_row['color']),
                        'checked' => ($updated_habit_row['checked_today'] ?? 0) > 0,
                        'totalCompletions' => $stats['totalCompletions'],
                        'currentStreak' => $stats['currentStreak'],
                        'failedCount' => $stats['failedCount'],
                        'createdAt' => $updated_habit_row['created_at_formatted'],
                    ]
                ]);
            } else {
                 echo json_encode(['success' => false, 'message' => 'Gagal mengambil data habit yang diperbarui.']);
            }
        } else {
            error_log("Update habit error: " . mysqli_stmt_error($stmt));
            echo json_encode(['success' => false, 'message' => 'Gagal memperbarui habit.']);
        }
        mysqli_stmt_close($stmt);
        exit;
    }
    if ($action === 'delete_habit') {
        $id = $_POST['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID Habit tidak ditemukan.']);
            exit;
        }
        $id_int = (int)$id;
        $stmt = mysqli_prepare($link, "UPDATE habits SET is_deleted = 1 WHERE id = ? AND user_id = ?");
        mysqli_stmt_bind_param($stmt, "ii", $id_int, $user_id);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => 'Habit berhasil dihapus.']);
        } else {
            error_log("Delete habit error: " . mysqli_stmt_error($stmt));
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus habit.']);
        }
        mysqli_stmt_close($stmt);
        exit;
    }

    if ($action === 'toggle_habit_check') {
        $id = $_POST['id'] ?? null;
        $isChecked = filter_var($_POST['checked'], FILTER_VALIDATE_BOOLEAN);
        $habit_id_int = (int)$id;

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID Habit tidak ditemukan.']);
            exit;
        }
        $verify_stmt = mysqli_prepare($link, "SELECT id FROM habits WHERE id = ? AND user_id = ? AND is_deleted = 0");
        mysqli_stmt_bind_param($verify_stmt, "ii", $habit_id_int, $user_id);
        mysqli_stmt_execute($verify_stmt);
        mysqli_stmt_store_result($verify_stmt);
        if(mysqli_stmt_num_rows($verify_stmt) == 0){
            mysqli_stmt_close($verify_stmt);
            echo json_encode(['success' => false, 'message' => 'Habit tidak valid atau tidak diizinkan.']);
            exit;
        }
        mysqli_stmt_close($verify_stmt);

        $response = ['success' => false];
        if ($isChecked) { 
            $stmt_insert = mysqli_prepare($link, "INSERT IGNORE INTO completions (habit_id, completion_date, completed_at) VALUES (?, ?, NOW())");
            mysqli_stmt_bind_param($stmt_insert, "is", $habit_id_int, $today_ymd);
            if (mysqli_stmt_execute($stmt_insert)) {
                $response['success'] = true;
                $response['message'] = (mysqli_affected_rows($link) > 0) ? 'Habit ditandai selesai.' : 'Habit sudah ditandai selesai sebelumnya.';
            } else {
                $response['message'] = 'Gagal menandai habit: ' . mysqli_error($link);
            }
            mysqli_stmt_close($stmt_insert);
        } else { 
            $stmt_delete = mysqli_prepare($link, "DELETE FROM completions WHERE habit_id = ? AND completion_date = ?");
            mysqli_stmt_bind_param($stmt_delete, "is", $habit_id_int, $today_ymd);
            if (mysqli_stmt_execute($stmt_delete)) {
                $response['success'] = true;
                $response['message'] = 'Tanda selesai habit dibatalkan.';
            } else {
                $response['message'] = 'Gagal membatalkan tanda habit: ' . mysqli_error($link);
            }
            mysqli_stmt_close($stmt_delete);
        }
        
        if ($response['success']) {
            $updated_habit_stmt = mysqli_prepare($link, "SELECT h.id, h.name, h.icon, h.color, DATE_FORMAT(h.created_at, '%Y-%m-%d %H:%i:%s') as created_at_formatted, (SELECT COUNT(*) FROM completions c WHERE c.habit_id = h.id AND c.completion_date = ?) as checked_today FROM habits h WHERE h.id = ? AND h.user_id = ?");
            mysqli_stmt_bind_param($updated_habit_stmt, "sii", $today_ymd, $habit_id_int, $user_id);
            mysqli_stmt_execute($updated_habit_stmt);
            $updated_habit_result = mysqli_stmt_get_result($updated_habit_stmt);
            $updated_habit_row = mysqli_fetch_assoc($updated_habit_result);
            mysqli_stmt_close($updated_habit_stmt);

            if($updated_habit_row) {
                $stats = calculate_habit_stats($updated_habit_row['id'], $updated_habit_row['created_at_formatted']);
                $response['habit'] = [ 
                    'id' => $updated_habit_row['id'],
                    'name' => htmlspecialchars($updated_habit_row['name']),
                    'icon' => htmlspecialchars($updated_habit_row['icon']),
                    'color' => htmlspecialchars($updated_habit_row['color']),
                    'checked' => ($updated_habit_row['checked_today'] ?? 0) > 0,
                    'totalCompletions' => $stats['totalCompletions'],
                    'currentStreak' => $stats['currentStreak'],
                    'failedCount' => $stats['failedCount'],
                    'createdAt' => $updated_habit_row['created_at_formatted'],
                ];
            }
        }
        echo json_encode($response);
        exit;
    }

    if ($action === 'load_history') {
        $history_entries = [];
        $query = "
            SELECT c.completion_date, c.completed_at, h.name, h.icon, h.color
            FROM completions c
            JOIN habits h ON c.habit_id = h.id
            WHERE h.user_id = ? AND h.is_deleted = 0
            ORDER BY c.completion_date DESC, h.name ASC";
        
        $stmt = mysqli_prepare($link, $query);
        mysqli_stmt_bind_param($stmt, "i", $user_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) {
            $history_entries[] = [
                'date' => $row['completion_date'], 
                'timestamp_db' => $row['completed_at'], 
                'name' => htmlspecialchars($row['name']),
                'icon' => htmlspecialchars($row['icon']),
                'color' => htmlspecialchars($row['color']),
            ];
        }
        mysqli_stmt_close($stmt);
        echo json_encode($history_entries);
        exit;
    }
    
    if ($action === 'load_global_stats') {
        $global_stats = ['globalStreak' => 0, 'globalFailed' => 0, 'globalCompleted' => 0];
        $habits_query = "SELECT id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at_formatted FROM habits WHERE user_id = ? AND is_deleted = 0";
        $stmt_habits = mysqli_prepare($link, $habits_query);
        mysqli_stmt_bind_param($stmt_habits, "i", $user_id);
        mysqli_stmt_execute($stmt_habits);
        $habits_result = mysqli_stmt_get_result($stmt_habits);
        $max_streak_overall = 0;
        $total_failed_overall = 0;
        $total_completions_overall = 0;

        while ($habit_row = mysqli_fetch_assoc($habits_result)) {
            $stats = calculate_habit_stats($habit_row['id'], $habit_row['created_at_formatted']);
            if (($stats['currentStreak'] ?? 0) > $max_streak_overall) {
                $max_streak_overall = $stats['currentStreak'];
            }
            $total_failed_overall += ($stats['failedCount'] ?? 0);
            $total_completions_overall += ($stats['totalCompletions'] ?? 0);
        }
        mysqli_stmt_close($stmt_habits);

        $global_stats['globalStreak'] = $max_streak_overall;
        $global_stats['globalFailed'] = $total_failed_overall;
        $global_stats['globalCompleted'] = $total_completions_overall;

        echo json_encode($global_stats);
        exit;
    }

    if (!headers_sent()) {
        echo json_encode(['success' => false, 'message' => 'Aksi tidak diketahui atau tidak diizinkan.']);
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitHub Dashboard</title>
    <link rel="stylesheet" href="dashboard.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
  </head>
  <body>
    <div class="container">
      <aside class="sidebar">
        <div class="logo"><span class="logo-icon"> H </span> HabitHub</div>
        <nav id="main-nav">
          <ul>
            <li>
              <a
                href="#dashboard"
                class="nav-link active"
                data-target="dashboard-content"
              >
                <span class="icon">🏠</span> Dashboard
              </a>
            </li>
            <li>
              <a href="#history" class="nav-link" data-target="history-content">
                <span class="icon">📜</span> Riwayat
              </a>
            </li>
          </ul>
        </nav>
        <div class="user-profile" id="sidebar-profile-trigger">
          <img
            src="assets/profile_placeholder.png" 
            alt="User Avatar"
            id="sidebar-avatar"
          />
          <div class="user-info">
            <span class="username" id="sidebar-username">Nama User</span>
            <span class="email" id="sidebar-email">email@contoh.com</span>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="main-header">
          <div class="title">
            <h1 id="main-title">Dashboard</h1>
            <p id="main-subtitle">Habit hari ini</p>
          </div>
          <button class="add-habit-btn" id="add-habit-header-btn">
            Tambah Habit +
          </button>
          <!-- Tombol Logout dipindahkan dari sini -->
        </header>

        <div id="dashboard-content" class="content-section active">
          <div class="content-grid">
            <section class="habit-section">
              <h2 class="section-title visually-hidden">Daftar Habit</h2>
              <div class="habit-list" id="habit-list-container">
                <p class="no-habits-message">Memuat habit...</p>
              </div>
            </section>
            <aside class="right-panel">
              <div class="stats-area">
                <div class="stat-card streak">
                  <span class="bg-icon">🔥</span>
                  <p>Runtutan Tertinggi</p>
                  <h2 id="global-streak">- Hari</h2>
                </div>
                <div class="stat-card failed">
                  <span class="bg-icon">❗</span>
                  <p>Total Gagal</p>
                  <h2 id="global-failed">- Hari</h2>
                </div>
                <div class="stat-card completed">
                  <span class="bg-icon">⭐</span>
                  <p>Total Selesai</p>
                  <h2 id="global-completed">- Kali</h2>
                </div>
              </div>
              <div class="calendar">
                <div class="calendar-header">
                  <h2 id="calendar-month-year">Memuat...</h2>
                  <div class="calendar-nav">
                    <button id="calendar-prev"><</button
                    ><button id="calendar-next">></button>
                  </div>
                </div>
                <div class="calendar-days-header">
                  <span>SEN</span><span>SEL</span><span>RAB</span
                  ><span>KAM</span><span>JUM</span><span>SAB</span
                  ><span>MIN</span>
                </div>
                <div class="calendar-grid" id="calendar-grid-container"></div>
              </div>
            </aside>
          </div>
        </div>

        <div id="history-content" class="content-section">
          <div class="history-card-section">
            <div class="history-list-content-section" id="history-list">
              <p class="loading-message">Memuat riwayat...</p>
            </div>
          </div>
        </div>

        <div id="profile-content" class="content-section">
          <div class="profile-card-section">
            <div class="profile-left-column">
              <div class="profile-picture-container">
                <img
                  src="assets/profile_placeholder.png"
                  alt="Foto Profil User"
                  class="profile-picture"
                  id="profile-image"
                />
                <button class="edit-picture-btn" aria-label="Ubah foto profil">
                  <i class="fas fa-camera"></i>
                </button>
                <input
                  type="file"
                  id="imageUpload"
                  name="profilePictureFile" 
                  accept="image/*"
                  style="display: none"
                />
              </div>
              <div class="profile-actions-secondary">
                <button class="change-password-btn">Ganti Password</button>
                <button class="delete-account-btn">Hapus Akun</button>
                <!-- Tombol Logout dipindahkan ke sini -->
                <a href="logout.php" class="profile-logout-btn">Logout Akun</a> 
              </div>
            </div>
            <div class="profile-info" id="profile-details">
              <div class="profile-field">
                <label for="profile-username">Username:</label>
                <input
                  type="text"
                  id="profile-username"
                  placeholder="Username"
                  readonly
                  disabled
                />
              </div>
              <div class="profile-field">
                <label for="profile-first-name">Nama Lengkap:</label>
                <div class="name-inputs">
                  <input
                    type="text"
                    id="profile-first-name"
                    placeholder="Nama Depan"
                    readonly
                  />
                  <input
                    type="text"
                    id="profile-last-name"
                    placeholder="Nama Belakang"
                    readonly
                  />
                </div>
                <button
                  class="edit-field-btn"
                  data-target-fields="profile-first-name,profile-last-name"
                  aria-label="Edit Nama Lengkap"
                >
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-field">
                <label for="profile-email">Email:</label>
                <input
                  type="email"
                  id="profile-email"
                  placeholder="Email"
                  readonly
                />
                <button
                  class="edit-field-btn"
                  data-target-fields="profile-email"
                  aria-label="Edit Email"
                >
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-field">
                <label for="profile-phone">Nomor Telepon:</label>
                <input
                  type="tel"
                  id="profile-phone"
                  placeholder="Nomor Telepon (Opsional)"
                  readonly
                />
                <button
                  class="edit-field-btn"
                  data-target-fields="profile-phone"
                  aria-label="Edit Nomor Telepon"
                >
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
              <div class="profile-actions-main">
                <button class="save-profile-btn" style="display: none">
                  <i class="fas fa-save"></i> Simpan Perubahan
                </button>
                <span
                  class="save-status"
                  style="display: none; margin-left: 10px"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div
      id="habit-modal"
      class="modal"
      aria-labelledby="modal-title"
      aria-hidden="true"
      role="dialog"
    >
      <div class="modal-content">
        <button class="close-btn" aria-label="Tutup">×</button>
        <h2 id="modal-title">Tambah Habit Baru</h2>
        <form id="habit-form">
          <input type="hidden" id="habit-id" />
          <div class="form-group">
            <label for="habit-name">Nama Habit:</label>
            <input type="text" id="habit-name" required />
          </div>
          <div class="form-group">
            <label for="habit-icon">Ikon Habit (Emoji):</label>
            <input
              type="text"
              id="habit-icon"
              placeholder="Contoh: 😊, 🏃, 📚"
            />
          </div>
          <div class="form-actions">
            <button type="submit" id="save-habit-btn">Simpan</button>
            <button type="button" id="cancel-btn">Batal</button>
          </div>
        </form>
      </div>
    </div>

    <script src="dashboard.js"></script>
  </body>
</html>
