<?php
session_start();
require_once 'db_config.php';

$errors = [];
$success_message = '';

function generate_captcha_string_reg($length = 6) {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $captcha_string = '';
    for ($i = 0; $i < $length; $i++) {
        $captcha_string .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $captcha_string;
}

if (isset($_GET['action']) && $_GET['action'] === 'refresh_captcha_reg') {
    $_SESSION['captcha_code_reg'] = generate_captcha_string_reg();
    header('Content-Type: application/json');
    echo json_encode(['captcha_text' => $_SESSION['captcha_code_reg']]);
    exit;
}

if (!isset($_SESSION['captcha_code_reg'])) {
    $_SESSION['captcha_code_reg'] = generate_captcha_string_reg();
}
$current_captcha_text_reg = $_SESSION['captcha_code_reg'];


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstName = trim($_POST['namaDepan'] ?? '');
    $lastName = trim($_POST['namaBelakang'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['telepon'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    $captcha_input = trim($_POST['captcha_input'] ?? '');

    if (empty($firstName)) $errors['namaDepan'] = "Nama depan tidak boleh kosong.";
    if (empty($username)) $errors['username'] = "Username tidak boleh kosong.";
    if (empty($email)) {
        $errors['email'] = "Email tidak boleh kosong.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = "Format email tidak valid.";
    }
    if (empty($password)) $errors['password'] = "Password tidak boleh kosong.";
    if ($password !== $confirmPassword) $errors['confirmPassword'] = "Konfirmasi password tidak cocok.";
    
    if (empty($captcha_input) || strtolower($captcha_input) !== strtolower($_SESSION['captcha_code_reg'])) {
        $errors['captcha'] = "Captcha tidak valid.";
    }

    if (empty($errors)) {
        $sql_check_user = "SELECT id FROM users WHERE username = ?";
        if ($stmt_check_user = mysqli_prepare($link, $sql_check_user)) {
            mysqli_stmt_bind_param($stmt_check_user, "s", $username);
            mysqli_stmt_execute($stmt_check_user);
            mysqli_stmt_store_result($stmt_check_user);
            if (mysqli_stmt_num_rows($stmt_check_user) > 0) {
                $errors['username_exists'] = "Username sudah digunakan.";
            }
            mysqli_stmt_close($stmt_check_user);
        }

        $sql_check_email = "SELECT id FROM users WHERE email = ?";
        if ($stmt_check_email = mysqli_prepare($link, $sql_check_email)) {
            mysqli_stmt_bind_param($stmt_check_email, "s", $email);
            mysqli_stmt_execute($stmt_check_email);
            mysqli_stmt_store_result($stmt_check_email);
            if (mysqli_stmt_num_rows($stmt_check_email) > 0) {
                $errors['email_exists'] = "Email sudah terdaftar.";
            }
            mysqli_stmt_close($stmt_check_email);
        }
    }

    if (empty($errors)) {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $profile_picture_path = 'assets/profile_placeholder.png'; 

        $sql_insert = "INSERT INTO users (username, password_hash, email, first_name, last_name, phone, profile_picture_path, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        
        if ($stmt_insert = mysqli_prepare($link, $sql_insert)) {
            mysqli_stmt_bind_param($stmt_insert, "sssssss", 
                $username, $hashed_password, $email, $firstName, $lastName, $phone, $profile_picture_path
            );

            if (mysqli_stmt_execute($stmt_insert)) {
                $success_message = "Registrasi berhasil! Silakan login.";
                $_POST = array();
            } else {
                $errors['db_error'] = "Registrasi gagal. Silakan coba lagi. Error: " . mysqli_stmt_error($stmt_insert);
                error_log("MySQL Execute Error (Register): " . mysqli_stmt_error($stmt_insert));
            }
            mysqli_stmt_close($stmt_insert);
        } else {
            $errors['db_error'] = "Gagal mempersiapkan statement database.";
            error_log("MySQL Prepare Error (Register): " . mysqli_error($link));
        }
    }
    $_SESSION['captcha_code_reg'] = generate_captcha_string_reg();
    $current_captcha_text_reg = $_SESSION['captcha_code_reg'];
}
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Register - HabitHub</title>
    <link rel="icon" href="assets/HabitHub icon.png" type="image/png" />
    <link rel="stylesheet" href="styles_register.css" />
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
          <h1>Buat akun baru.</h1>

            <?php if (!empty($success_message)): ?>
                <p style="color: green; text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid green; background-color: #e6ffe6;">
                    <?php echo htmlspecialchars($success_message); ?>
                </p>
            <?php endif; ?>

            <?php if (!empty($errors)): ?>
                <div style="color: red; text-align: left; margin-bottom: 15px; padding: 10px; border: 1px solid red; background-color: #ffe6e6;">
                    <strong>Terjadi kesalahan:</strong><br>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?php echo htmlspecialchars($error); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>


          <form action="register.php" method="POST">
            <div class="name-fields">
              <div class="form-group">
                <label for="namaDepan">Nama Depan</label>
                <div class="input-icon">
                  <input
                    type="text"
                    id="namaDepan"
                    name="namaDepan" 
                    value="<?php echo htmlspecialchars($_POST['namaDepan'] ?? ''); ?>"
                    placeholder="Depan"
                    required
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="namaBelakang">Nama Belakang</label>
                <div class="input-icon">
                  <input
                    type="text"
                    id="namaBelakang" 
                    name="namaBelakang"
                    value="<?php echo htmlspecialchars($_POST['namaBelakang'] ?? ''); ?>"
                    placeholder="Belakang"
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="username">Username</label>
              <div class="input-icon">
                <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>" required />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <div class="input-icon">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
                  placeholder="@abc.com"
                  required
                />
                <span class="material-icons email-icon">email</span>
              </div>
            </div>

            <div class="form-group">
              <label for="telepon">Nomor Telepon</label>
              <div class="input-icon">
                <input type="text" id="telepon" name="telepon" value="<?php echo htmlspecialchars($_POST['telepon'] ?? ''); ?>" placeholder="+62" />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-icon">
                <input type="password" id="password" name="password" required />
                <i class="material-icons eye-icon">visibility_off</i>
              </div>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-icon">
                <input type="password" id="confirmPassword" name="confirmPassword" value="" required />
                <i class="material-icons eye-icon">visibility_off</i>
              </div>
            </div>

            <div class="form-group">
              <label for="captcha-input">Captcha</label> 
              <div class="captcha-container">
                <span id="captcha-text"><?php echo htmlspecialchars($current_captcha_text_reg); ?></span>
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

            <button type="submit" class="btn-create-account">
              <b>Buat Akun</b>
            </button>

            <div class="login-link">
              <p>
                Sudah punya akun?
                <a href="login.php"><b>Log In</b></a> 
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    <script src="reg.js"></script>
  </body>
</html>