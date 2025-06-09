<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

define('DB_SERVER', 'sql212.infinityfree.com');
define('DB_USERNAME', 'if0_39116343');
define('DB_PASSWORD', 'Habithub123');
define('DB_NAME', 'if0_39116343_habithub_db');

$link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if($link === false){
    error_log("MySQL Connection Error: " . mysqli_connect_error() . " (Server: " . DB_SERVER . ", User: " . DB_USERNAME . ", DB: " . DB_NAME . ")");
    return; 
}

mysqli_set_charset($link, "utf8mb4");

function getTodayYMD() {
    return date('Y-m-d');
}

function getYesterdayYMD() {
    return date('Y-m-d', strtotime('-1 day'));
}

function calculate_habit_stats($habit_id, $habit_created_at_str) {
    global $link;
    if (!$link) {
        error_log("calculate_habit_stats: Database link not available.");
        return ['currentStreak' => 0, 'totalCompletions' => 0, 'failedCount' => 0, 'error' => 'DB link error'];
    }

    $stats = ['currentStreak' => 0, 'totalCompletions' => 0, 'failedCount' => 0];
    $habit_id_int = (int)$habit_id;
    $today_ymd = getTodayYMD();
    $yesterday_ymd = getYesterdayYMD();

    $stmt_completions = mysqli_prepare($link, "SELECT COUNT(*) as total FROM completions WHERE habit_id = ?");
    if ($stmt_completions) {
        mysqli_stmt_bind_param($stmt_completions, "i", $habit_id_int);
        mysqli_stmt_execute($stmt_completions);
        $result_completions = mysqli_stmt_get_result($stmt_completions);
        $row_completions = mysqli_fetch_assoc($result_completions);
        $stats['totalCompletions'] = $row_completions['total'] ?? 0;
        mysqli_stmt_close($stmt_completions);
    } else {
        error_log("MySQL Prepare Error (total completions for habit $habit_id_int): " . mysqli_error($link));
    }

    $stmt_streak_query = mysqli_prepare($link, "SELECT completion_date FROM completions WHERE habit_id = ? ORDER BY completion_date DESC");
    $current_streak_val = 0;
    $is_completed_today = false;
    $last_completion_date_obj = null; 

    if ($stmt_streak_query) {
        mysqli_stmt_bind_param($stmt_streak_query, "i", $habit_id_int);
        mysqli_stmt_execute($stmt_streak_query);
        $result_streak = mysqli_stmt_get_result($stmt_streak_query);
        
        $completion_dates = [];
        while ($row_streak = mysqli_fetch_assoc($result_streak)) {
            $completion_dates[] = $row_streak['completion_date'];
            if ($row_streak['completion_date'] == $today_ymd) {
                $is_completed_today = true;
            }
        }
        mysqli_stmt_close($stmt_streak_query);

        if (!empty($completion_dates)) {
            try {
                $last_completion_date_obj = new DateTime($completion_dates[0]); 
            } catch (Exception $e) {
                error_log("Error creating DateTime for last_completion_date (habit $habit_id_int): " . $e->getMessage() . " with date: " . $completion_dates[0]);
                $last_completion_date_obj = null; 
            }

            if ($last_completion_date_obj) {
                $date_to_check_streak_from = null;
                if ($last_completion_date_obj->format('Y-m-d') == $today_ymd) {
                    $date_to_check_streak_from = $last_completion_date_obj;
                } elseif ($last_completion_date_obj->format('Y-m-d') == $yesterday_ymd) {
                    $date_to_check_streak_from = $last_completion_date_obj;
                }

                if ($date_to_check_streak_from) {
                    $temp_streak_date = clone $date_to_check_streak_from;
                    foreach ($completion_dates as $cd_str_loop) { 
                        if ($cd_str_loop == $temp_streak_date->format('Y-m-d')) {
                            $current_streak_val++;
                            $temp_streak_date->modify('-1 day');
                        } elseif ($cd_str_loop < $temp_streak_date->format('Y-m-d')) {
                            break; 
                        }
                    }
                }
            }
        }
    } else {
        error_log("MySQL Prepare Error (current streak for habit $habit_id_int): " . mysqli_error($link));
    }
    
    if ($is_completed_today) {
        $stats['currentStreak'] = $current_streak_val;
    } elseif ($last_completion_date_obj && $last_completion_date_obj->format('Y-m-d') == $yesterday_ymd) {
        $stats['currentStreak'] = $current_streak_val; 
    } else {
        $stats['currentStreak'] = 0;
    }

    $failed_count = 0;
    if (!empty($habit_created_at_str)) {
        try {
            $habit_created_date = new DateTime($habit_created_at_str);
            $loop_until_date = new DateTime($today_ymd);

            if ($habit_created_date < $loop_until_date) {
                $interval = new DateInterval('P1D');
                $period = new DatePeriod($habit_created_date, $interval, $loop_until_date); 

                $stmt_check_completion = mysqli_prepare($link, "SELECT 1 FROM completions WHERE habit_id = ? AND completion_date = ? LIMIT 1");
                if ($stmt_check_completion) {
                    foreach ($period as $dt) {
                        $current_day_ymd_check = $dt->format('Y-m-d');
                        
                        mysqli_stmt_bind_param($stmt_check_completion, "is", $habit_id_int, $current_day_ymd_check);
                        mysqli_stmt_execute($stmt_check_completion);
                        mysqli_stmt_store_result($stmt_check_completion); 
                        
                        if (mysqli_stmt_num_rows($stmt_check_completion) == 0) {
                            $failed_count++;
                        }
                    }
                    mysqli_stmt_close($stmt_check_completion);
                } else {
                     error_log("MySQL Prepare Error (failed count check for habit $habit_id_int): " . mysqli_error($link));
                }
            }
        } catch (Exception $e) {
            error_log("Error calculating failed count for habit $habit_id_int (created_at: $habit_created_at_str): " . $e->getMessage());
        }
    } else {
        error_log("habit_created_at_str is empty for habit ID: $habit_id_int");
    }
    $stats['failedCount'] = $failed_count;

    return $stats;
}
?>