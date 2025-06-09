<?php
session_start();
require_once 'db_config.php';

$login_error = '';
$captcha_error_php = '';

$success_message_login = '';
if (isset($_SESSION['success_message_login'])) {
    $success_message_login = $_SESSION['success_message_login'];
    unset($_SESSION['success_message_login']);
}

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
        $_SESSION['captcha_code'] = generate_captcha_string();
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
                                session_regenerate_id(true);

                                $_SESSION['loggedin'] = true;
                                $_SESSION['user_id'] = $id;
                                $_SESSION['username'] = $db_username;

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
        $_SESSION['captcha_code'] = generate_captcha_string();
        $current_captcha_text = $_SESSION['captcha_code'];
    }
}

if (isset($link) && $link && mysqli_ping($link)) {
    mysqli_close($link);
}

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
    <link rel="icon" href="assets/HabitHub icon.png" type="image/png" />
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

          <?php if (!empty($success_message_login)): ?>
            <p style="color: green; text-align: center; padding: 10px; background-color: #e6ffe6; border: 1px solid #00cc00; border-radius: 5px; margin-bottom:15px;">
              <?php echo htmlspecialchars($success_message_login); ?>
            </p>
          <?php endif; ?>

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
                <a href="pw_email.php"><b>Lupa password?</b></a>
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
              ></p>
            </div>
            <button type="submit" class="btn-login-account">
              <b>Login</b>
            </button>

            <div class="login-link">
              <p>
                Belum punya akun?
                <a href="register.php"><b>Daftar</b></a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    <script src="login.js"></script> 
    <script>
        const words = ["sukses!", "disiplin!", "produktif!", "konsisten!"];
        let i = 0;
        let j = 0;
        let currentWord = "";
        let isDeleting = false;
        const typewriterElement = document.getElementById("typewriter");

        function type() {
            if (typewriterElement) {
                currentWord = words[i];
                if (isDeleting) {
                    typewriterElement.textContent = currentWord.substring(0, j - 1);
                    j--;
                    if (j == 0) {
                        isDeleting = false;
                        i++;
                        if (i == words.length) {
                            i = 0;
                        }
                    }
                } else {
                    typewriterElement.textContent = currentWord.substring(0, j + 1);
                    j++;
                    if (j == currentWord.length) {
                        isDeleting = true;
                    }
                }
                setTimeout(type, isDeleting ? 100 : 200);
            }
        }
        if (typewriterElement) {
          type();
        }

        const eyeIconsLogin = document.querySelectorAll('.form-container .eye-icon');
        eyeIconsLogin.forEach(icon => {
            icon.addEventListener('click', function() {
                const passwordInput = this.previousElementSibling;
                if (passwordInput && passwordInput.id === 'password') {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        this.textContent = 'visibility';
                    } else {
                        passwordInput.type = 'password';
                        this.textContent = 'visibility_off';
                    }
                }
            });
        });

        const refreshButton = document.getElementById('refresh-captcha');
        const captchaTextElement = document.getElementById('captcha-text');
        if (refreshButton && captchaTextElement) {
            refreshButton.addEventListener('click', function() {
                fetch('login.php?action=refresh_captcha')
                    .then(response => response.json())
                    .then(data => {
                        if (data.captcha_text) {
                            captchaTextElement.textContent = data.captcha_text;
                        }
                    })
                    .catch(error => console.error('Error refreshing captcha:', error));
            });
        }
    </script>
  </body>
</html>