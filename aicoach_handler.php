<?php
session_start();
header('Content-Type: application/json');

require_once 'db_config.php';

$GEMINI_API_KEY = 'RAHASIA DONG'; 
$GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" . $GEMINI_API_KEY;


function handle_error_json_chat($message, $http_code = 400) {
    http_response_code($http_code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

$user_id = null;
$username = "Pengguna";

if (isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true && isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    if (isset($_SESSION['username'])) { 
        $username = $_SESSION['username'];
    } else { 
        if ($link) {
            $stmt_user = mysqli_prepare($link, "SELECT username FROM users WHERE id = ?");
            if ($stmt_user) {
                mysqli_stmt_bind_param($stmt_user, "i", $user_id);
                mysqli_stmt_execute($stmt_user);
                $res_user = mysqli_stmt_get_result($stmt_user);
                if ($row_user = mysqli_fetch_assoc($res_user)) {
                    $username = $row_user['username'];
                }
                mysqli_stmt_close($stmt_user);
            }
        }
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_username') {
    if ($user_id) {
        echo json_encode(['success' => true, 'username' => $username]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
    }
    exit;
}


$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);

if (json_last_error() !== JSON_ERROR_NONE && $_SERVER['REQUEST_METHOD'] === 'POST') {
    handle_error_json_chat('Invalid JSON input: ' . json_last_error_msg());
}

$action = $data['action'] ?? null;

if (!$user_id && $action !== null && $action !== 'get_username') {
    handle_error_json_chat('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 401);
}


if (!$link && $action !== 'get_username') { 
    handle_error_json_chat('Koneksi database gagal.', 500);
}


function callGeminiAPI($history, $system_instruction) {
    global $GEMINI_API_URL;
    
    $contents = [];
    foreach($history as $turn) {
        $contents[] = ['role' => $turn['role'], 'parts' => $turn['parts']];
    }

    $payload = [
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.7, 
            'topK' => 1,
            'topP' => 0.95,
            'maxOutputTokens' => 2048,
        ],
        'safetySettings' => [
            ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
        ]
    ];
     if ($system_instruction) {
        $payload['systemInstruction'] = ['role' => 'system', 'parts' => [['text' => $system_instruction]]];
    }


    $ch = curl_init($GEMINI_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        error_log("cURL Error calling Gemini: " . $curl_error);
        return ['success' => false, 'message' => 'Error koneksi ke AI: ' . $curl_error];
    }
    if ($http_code !== 200) {
        error_log("Gemini API Error ($http_code): " . $response);
        return ['success' => false, 'message' => "AI merespons dengan error ($http_code). Coba lagi nanti." , 'details' => $response];
    }

    $responseData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error from Gemini: " . json_last_error_msg() . " | Response: " . $response);
        return ['success' => false, 'message' => 'Gagal memproses respons AI.'];
    }
    
    if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
        return ['success' => true, 'text' => $responseData['candidates'][0]['content']['parts'][0]['text']];
    } elseif (isset($responseData['candidates'][0]['finishReason']) && $responseData['candidates'][0]['finishReason'] != 'STOP') {
         return ['success' => false, 'message' => 'AI tidak dapat memberikan respons karena alasan: ' . $responseData['candidates'][0]['finishReason'] . '. Coba ubah pertanyaan Anda.'];
    }
    return ['success' => false, 'message' => 'Format respons AI tidak dikenali atau kosong.'];
}

function parseAISuggestions($text) {
    $suggestions_array = null;
    
    if (preg_match('/\[SUGGESTION_START\](.*?)\[SUGGESTION_END\]/s', $text, $matches)) {
        $json_string = trim($matches[1]);
        $parsed_json = json_decode($json_string, true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            if (isset($parsed_json['intent'])) { 
                $suggestions_array = [$parsed_json];
            } elseif (is_array($parsed_json) && count($parsed_json) > 0 && isset($parsed_json[0]['intent'])) { 
                $suggestions_array = $parsed_json;
            }
        }
    }
    return $suggestions_array;
}


if ($action === 'chat_with_ai') {
    $history = $data['history'] ?? [];
    if (empty($history)) {
        handle_error_json_chat('Riwayat percakapan kosong.');
    }

    $system_instruction = <<<EOT
Anda adalah HabitCoach AI yang sangat ramah dan suportif di aplikasi HabitHub. Tugas utama Anda adalah membantu pengguna mengelola kebiasaan mereka.
Instruksi Spesifik:
1.  **MEMBUAT HABIT:** Jika pengguna ingin membuat habit baru atau Anda merasa ada habit yang cocok, sarankan SATU ATAU LEBIH habit. Setiap saran harus diformat dalam JSON.
    Format JSON harus mencakup: `intent`, `name`, `icon`, `category`, dan informasi durasi.
    - `duration_unlimited`: `true` jika tanpa batas waktu, `false` jika ada durasi spesifik.
    - `duration_value`: (Opsional) Angka durasi, misal `30`.
    - `duration_unit`: (Opsional) `hari` atau `bulan`.
    Format untuk satu saran: `[SUGGESTION_START]{"intent": "create_suggestion", "name": "Nama Habit", "icon": "💡", "category": "pagi/siang/sore-malam/semua", "duration_unlimited": false, "duration_value": 30, "duration_unit": "hari"}[SUGGESTION_END]`
    Format untuk beberapa saran: `[SUGGESTION_START][{"intent": "create_suggestion", "name": "Habit 1", "icon": "👍", "category": "pagi", "duration_unlimited": true}, {"intent": "create_suggestion", "name": "Habit 2", "icon": "💪", "category": "semua", "duration_unlimited": false, "duration_value": 2, "duration_unit": "bulan"}][SUGGESTION_END]`
    Contoh: "Saya punya ide habit selama 30 hari untuk Anda: [SUGGESTION_START]{\"intent\": \"create_suggestion\", \"name\": \"Meditasi 5 menit\", \"icon\": \"🧘\", \"category\": \"pagi\", \"duration_unlimited\": false, \"duration_value\": 30, \"duration_unit\": \"hari\"}[SUGGESTION_END] Bagaimana menurut Anda?"
2.  **MELIHAT HABIT:** Jika pengguna meminta untuk melihat habit mereka (misalnya "apa saja habit saya?", "tampilkan habit pagi saya"), jawab dengan teks biasa dan JANGAN gunakan format [SUGGESTION_START]. Saya (backend) akan mengambil data habit dari database jika Anda mengindikasikan ini adalah permintaan 'read'. Katakan sesuatu seperti "Tentu, berikut adalah daftar habit aktif Anda:" atau "Baik, saya akan carikan habit pagi Anda."
3.  **MENGUBAH HABIT:** Jika pengguna meminta untuk mengubah habit, minta konfirmasi. Anda hanya boleh menyarankan SATU perubahan habit per permintaan.
    Format: `[SUGGESTION_START]{"intent": "update_suggestion", "old_name": "Nama Habit Lama", "new_name": "Nama Habit Baru", "new_icon": "✨", "new_category": "kategori baru", "duration_unlimited": true/false, ...}[SUGGESTION_END]`
    Isi field `new_` dan durasi hanya jika ada perubahan. Penting: `old_name` harus ada.
4.  **MENGHAPUS HABIT:** Jika pengguna meminta untuk menghapus habit, minta konfirmasi. Anda hanya boleh menyarankan SATU penghapusan habit per permintaan.
    Format: `[SUGGESTION_START]{"intent": "delete_suggestion", "name": "Nama Habit yang Akan Dihapus"}[SUGGESTION_END]`
5.  **Klarifikasi:** Untuk permintaan Mengubah atau Menghapus, jika pengguna tidak menyebutkan nama habit spesifik, tanyakan dulu nama habitnya. Jika pengguna tidak menyebutkan durasi, asumsikan `duration_unlimited` adalah `true`.
6.  **Bahasa:** Gunakan Bahasa Indonesia yang baik, ramah, dan empatik.
7.  **Emoji:** Gunakan emoji secara relevan untuk membuat percakapan lebih menarik.
8.  **Umum:** Jawab pertanyaan lain secara natural dan informatif. Fokus pada membantu pengguna dengan habit mereka.
EOT;

    $geminiResponse = callGeminiAPI($history, $system_instruction);

    if ($geminiResponse['success']) {
        $ai_text = $geminiResponse['text'];
        
        $suggestions_array = parseAISuggestions($ai_text);
        
        $display_message = trim(preg_replace('/\[SUGGESTION_START\].*?\[SUGGESTION_END\]/s', '', $ai_text));
        
        $response_payload = ['success' => true, 'ai_message' => $display_message, 'suggestions_array' => $suggestions_array];

        if (!$suggestions_array && (stripos($display_message, "berikut adalah habit Anda") !== false || stripos($display_message, "carikan habit Anda") !== false || stripos($display_message, "daftar habit Anda") !== false)) {
            $habits_data = [];
            $query = "SELECT name, icon, category, is_duration_unlimited, calculated_end_date FROM habits WHERE user_id = ? AND is_deleted = 0 AND (is_duration_unlimited = 1 OR calculated_end_date >= CURDATE()) ORDER BY name ASC";
            $stmt = mysqli_prepare($link, $query);
            mysqli_stmt_bind_param($stmt, "i", $user_id);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            while ($row = mysqli_fetch_assoc($result)) {
                $habits_data[] = $row;
            }
            mysqli_stmt_close($stmt);
            if (!empty($habits_data)) {
                 $response_payload['read_result'] = $habits_data;
            } else {
                 $response_payload['ai_message'] = $display_message . "\n\nSepertinya Anda belum memiliki habit aktif.";
            }
        }
        echo json_encode($response_payload);

    } else {
        handle_error_json_chat($geminiResponse['message'] ?? 'AI tidak dapat merespons saat ini.');
    }
    exit;
} 
elseif ($action === 'confirm_create_habit' || $action === 'confirm_update_habit') {
    $name = $data['name'] ?? null;
    $icon = $data['icon'] ?? '💡';
    $category = $data['category'] ?? 'semua';
    $is_unlimited = $data['duration_unlimited'] ?? true;
    $duration_value = $data['duration_value'] ?? null;
    $duration_unit = $data['duration_unit'] ?? 'hari';
    $start_date_str = date('Y-m-d');

    if ($action === 'confirm_create_habit' && empty($name)) {
        handle_error_json_chat('Nama habit tidak boleh kosong.');
    }

    $duration_in_days = null;
    $calculated_end_date = null;

    if ($is_unlimited === false && $duration_value > 0) {
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
            handle_error_json_chat('Format tanggal atau durasi tidak valid.');
        }
    }

    if ($action === 'confirm_create_habit') {
        $stmt = mysqli_prepare($link, "INSERT INTO habits (user_id, name, icon, category, habit_start_date, duration_in_days, is_duration_unlimited, calculated_end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        mysqli_stmt_bind_param($stmt, "issssiis", $user_id, $name, $icon, $category, $start_date_str, $duration_in_days, $is_unlimited, $calculated_end_date);
        
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => "Habit '$name' $icon berhasil ditambahkan!"]);
        } else {
            error_log("Confirm create habit error: " . mysqli_stmt_error($stmt));
            handle_error_json_chat('Gagal menambahkan habit ke database.');
        }
        mysqli_stmt_close($stmt);
    } else { 
        $old_name = $data['old_name'] ?? null;
        if (empty($old_name)) {
            handle_error_json_chat('Nama habit lama tidak diketahui.');
        }
        
        $stmt_find = mysqli_prepare($link, "SELECT id, name, icon, category, habit_start_date, duration_in_days, is_duration_unlimited, calculated_end_date FROM habits WHERE user_id = ? AND name = ? AND is_deleted = 0");
        mysqli_stmt_bind_param($stmt_find, "is", $user_id, $old_name);
        mysqli_stmt_execute($stmt_find);
        $result_find = mysqli_stmt_get_result($stmt_find);
        $habit_to_update = mysqli_fetch_assoc($result_find);
        mysqli_stmt_close($stmt_find);

        if (!$habit_to_update) {
            handle_error_json_chat("Habit '$old_name' tidak ditemukan atau bukan milik Anda.");
        }

        $final_name = $data['new_name'] ?? $habit_to_update['name'];
        $final_icon = $data['new_icon'] ?? $habit_to_update['icon'];
        $final_category = $data['new_category'] ?? $habit_to_update['category'];
        
        if (!isset($data['duration_unlimited'])) {
            $is_unlimited = $habit_to_update['is_duration_unlimited'];
            $duration_in_days = $habit_to_update['duration_in_days'];
            $calculated_end_date = $habit_to_update['calculated_end_date'];
        }

        $stmt_update = mysqli_prepare($link, "UPDATE habits SET name = ?, icon = ?, category = ?, duration_in_days = ?, is_duration_unlimited = ?, calculated_end_date = ? WHERE id = ? AND user_id = ?");
        mysqli_stmt_bind_param($stmt_update, "sssiisii", $final_name, $final_icon, $final_category, $duration_in_days, $is_unlimited, $calculated_end_date, $habit_to_update['id'], $user_id);

        if (mysqli_stmt_execute($stmt_update)) {
            echo json_encode(['success' => true, 'message' => "Habit '$old_name' berhasil diperbarui menjadi '$final_name'."]);
        } else {
            error_log("Confirm update habit error: " . mysqli_stmt_error($stmt_update));
            handle_error_json_chat('Gagal memperbarui habit di database.');
        }
        mysqli_stmt_close($stmt_update);
    }
    exit;

} elseif ($action === 'confirm_delete_habit') {
    $name_to_delete = $data['name'] ?? null;

    if (empty($name_to_delete)) {
        handle_error_json_chat('Nama habit yang akan dihapus tidak diketahui.');
    }
    
    mysqli_begin_transaction($link);
    try {
        $stmt_find_id = mysqli_prepare($link, "SELECT id FROM habits WHERE name = ? AND user_id = ? AND is_deleted = 0");
        mysqli_stmt_bind_param($stmt_find_id, "si", $name_to_delete, $user_id);
        mysqli_stmt_execute($stmt_find_id);
        $res_find_id = mysqli_stmt_get_result($stmt_find_id);
        $habit_row_id = mysqli_fetch_assoc($res_find_id);
        mysqli_stmt_close($stmt_find_id);

        if (!$habit_row_id) {
            throw new Exception("Habit '$name_to_delete' tidak ditemukan atau bukan milik Anda.");
        }
        $habit_id_to_delete = $habit_row_id['id'];

        $stmt_del_completions = mysqli_prepare($link, "DELETE FROM completions WHERE habit_id = ?");
        mysqli_stmt_bind_param($stmt_del_completions, "i", $habit_id_to_delete);
        mysqli_stmt_execute($stmt_del_completions);
        mysqli_stmt_close($stmt_del_completions);

        $stmt_del_shared_instances_completions = mysqli_prepare($link, "DELETE c FROM completions c JOIN habits h_instance ON c.habit_id = h_instance.id JOIN shared_habits sh ON h_instance.source_shared_habit_id = sh.id WHERE sh.habit_id = ?");
        mysqli_stmt_bind_param($stmt_del_shared_instances_completions, "i", $habit_id_to_delete);
        mysqli_stmt_execute($stmt_del_shared_instances_completions);
        mysqli_stmt_close($stmt_del_shared_instances_completions);
        
        $stmt_del_shared_instances = mysqli_prepare($link, "DELETE h_instance FROM habits h_instance JOIN shared_habits sh ON h_instance.source_shared_habit_id = sh.id WHERE sh.habit_id = ?");
        mysqli_stmt_bind_param($stmt_del_shared_instances, "i", $habit_id_to_delete);
        mysqli_stmt_execute($stmt_del_shared_instances);
        mysqli_stmt_close($stmt_del_shared_instances);

        $stmt_del_shared_links = mysqli_prepare($link, "DELETE FROM shared_habits WHERE habit_id = ?");
        mysqli_stmt_bind_param($stmt_del_shared_links, "i", $habit_id_to_delete);
        mysqli_stmt_execute($stmt_del_shared_links);
        mysqli_stmt_close($stmt_del_shared_links);
        
        $stmt_delete = mysqli_prepare($link, "UPDATE habits SET is_deleted = 1 WHERE id = ? AND user_id = ?"); 
        mysqli_stmt_bind_param($stmt_delete, "ii", $habit_id_to_delete, $user_id);
        mysqli_stmt_execute($stmt_delete);
        
        if (mysqli_stmt_affected_rows($stmt_delete) > 0) {
            mysqli_commit($link);
            echo json_encode(['success' => true, 'message' => "Habit '$name_to_delete' berhasil dihapus."]);
        } else {
            mysqli_rollback($link);
            handle_error_json("Gagal menghapus habit '$name_to_delete' dari database atau sudah dihapus.");
        }
        mysqli_stmt_close($stmt_delete);

    } catch (Exception $e) {
        mysqli_rollback($link);
        error_log("Confirm delete habit transaction error: " . $e->getMessage());
        handle_error_json_chat('Gagal menghapus habit dan data terkait: ' . $e->getMessage());
    }
    exit;
} else {
    handle_error_json_chat('Aksi tidak valid.', 404);
}
?>