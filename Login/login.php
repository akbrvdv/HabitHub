<?php
session_start();
require_once 'db_config.php'; // Database connection

$login_error = '';
$captcha_error_php = '';

// --- CAPTCHA HANDLING ---
function generate_captcha_string($length = 6) {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $captcha_string = '';
    for ($i = 0; $i < $length; $i++) {
        $captcha_string .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $captcha_string;
}

if (isset($_GET['action']) && $_GET['action'] === 'refresh_captcha') {
    $_SESSION['captcha_code'] = generate_captcha_string();
    header('Content-Type: application/json');
    echo json_encode(['captcha_text' => $_SESSION['captcha_code']]);
    exit;
}

if (!isset($_SESSION['captcha_code'])) {
    $_SESSION['captcha_code'] = generate_captcha_string();
}
$current_captcha_text = $_SESSION['captcha_code'];


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $captcha_input = trim($_POST['captcha_input'] ?? '');

    if (empty($captcha_input) || strtolower($captcha_input) !== strtolower($_SESSION['captcha_code'])) {
        $captcha_error_php = "Captcha tidak valid.";
        $_SESSION['captcha_code'] = generate_captcha_string(); // Regenerate captcha on error
        $current_captcha_text = $_SESSION['captcha_code'];
    } else {
        if (empty($username) || empty($password)) {
            $login_error = "Username dan password tidak boleh kosong.";
        } else {
            $sql = "SELECT id, username, password_hash FROM users WHERE username = ?";
            if ($stmt = mysqli_prepare($link, $sql)) {
                mysqli_stmt_bind_param($stmt, "s", $param_username);
                $param_username = $username;

                if (mysqli_stmt_execute($stmt)) {
                    mysqli_stmt_store_result($stmt);
                    if (mysqli_stmt_num_rows($stmt) == 1) {
                        mysqli_stmt_bind_result($stmt, $id, $db_username, $hashed_password);
                        if (mysqli_stmt_fetch($stmt)) {
                            if (password_verify($password, $hashed_password)) {
                                // Password is correct, start a new session
                                // session_regenerate_id(); // Good practice for security

                                $_SESSION['loggedin'] = true;
                                $_SESSION['user_id'] = $id;
                                $_SESSION['username'] = $db_username;

                                // Redirect to dashboard
                                header("location: dashboard.php");
                                exit;
                            } else {
                                $login_error = "Username atau password salah.";
                            }
                        }
                    } else {
                        $login_error = "Username atau password salah.";
                    }
                } else {
                    $login_error = "Terjadi kesalahan. Silakan coba lagi nanti.";
                    error_log("MySQL Execute Error: " . mysqli_stmt_error($stmt));
                }
                mysqli_stmt_close($stmt);
            } else {
                $login_error = "Terjadi kesalahan database. Silakan coba lagi nanti.";
                error_log("MySQL Prepare Error: " . mysqli_error($link));
            }
        }
        // Regenerate captcha after a login attempt, successful or not, if captcha was correct
        $_SESSION['captcha_code'] = generate_captcha_string();
        $current_captcha_text = $_SESSION['captcha_code'];
    }
}
mysqli_close($link);

if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true && $_SERVER["REQUEST_METHOD"] != "POST") {
    header("location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - HabitHub</title>
    <link rel="icon" href="assets/HabitHub icon.png" type="image/png" /> <!-- Corrected type -->
    <link rel="stylesheet" href="styles_login.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet"
    />
  </head>
  <body>
    <div class="container">
      <div class="left-section">
        <div class="content">
          <img src="assets/HabitHub logo w.png" alt="logo" width="200px" />
          <h1>
            Kamu pasti <br />bisa "<span class="h1span" id="typewriter"></span>"
          </h1>
          <p>
            HabitHub membantu Anda untuk membuat dan mengelola Kebiasaan baik,
            memungkinkan mencapai goals jangka panjang.
          </p>
        </div>
      </div>
      <div class="right-section">
        <div class="form-container">
          <h1>Login.</h1>

          <?php if (!empty($login_error)): ?>
            <p class="error-message" style="color: red; text-align: center; margin-bottom: 15px;"><?php echo htmlspecialchars($login_error); ?></p>
          <?php endif; ?>
          <?php if (!empty($captcha_error_php)): ?>
            <p class="error-message" style="color: red; text-align: center; margin-bottom: 15px;"><?php echo htmlspecialchars($captcha_error_php); ?></p>
          <?php endif; ?>


          <form action="login.php" method="POST">
            <div class="form-group">
              <label for="username">Username</label>
              <div class="input-icon">
                <input type="text" id="username" name="username" value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>" required />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-icon">
                <input type="password" id="password" name="password" required />
                <i class="material-icons eye-icon">visibility_off</i>
              </div>
            </div>

            <div class="login-link">
              <p>
                <a href="lupapw/lupapw_email.html"><b>Lupa password?</b></a>
              </p>
            </div>
            
            <div class="form-group">
              <label for="captcha-input">Captcha</label>
              <div class="captcha-container">
                <span id="captcha-text"><?php echo htmlspecialchars($current_captcha_text); ?></span>
                <button type="button" id="refresh-captcha">Refresh</button>
              </div>
              <input
                type="text"
                id="captcha-input"
                name="captcha_input"
                placeholder="Masukkan Captcha"
                required
              />
              <p
                id="captcha-error-js" 
                class="error-message"
                style="display: none; color: red;"
              ></p> <!-- For JS validation message -->
            </div>
            <button type="submit" class="btn-login-account">
              <b>Login</b>
            </button>

            <div class="login-link">
              <p>
                Belum punya akun?
                <a href="register.php"><b>Daftar</b></a> <!-- You might want to change this to register.php -->
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    <script src="login.js"></script>
  </body>
</html>
