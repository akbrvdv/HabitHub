<?php
session_start();
require_once 'db_config.php';

$error_message = '';

if (!isset($_SESSION['otp_verified_for_email'])) {
    header("Location: pw_email.php");
    exit();
}

$email_to_reset_password = $_SESSION['otp_verified_for_email'];

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['password']) && isset($_POST['confirmPassword'])) {
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirmPassword'];

    if (empty($password) || empty($confirmPassword)) {
        $error_message = "Password baru dan konfirmasi password tidak boleh kosong.";
    } elseif (strlen($password) < 6) {
        $error_message = "Password baru minimal harus 6 karakter.";
    } elseif ($password !== $confirmPassword) {
        $error_message = "Password baru dan konfirmasi password tidak cocok.";
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $stmt_update_pw = mysqli_prepare($link, "UPDATE users SET password_hash = ? WHERE email = ?");
        mysqli_stmt_bind_param($stmt_update_pw, "ss", $hashed_password, $email_to_reset_password);

        if (mysqli_stmt_execute($stmt_update_pw)) {
            $stmt_delete_token = mysqli_prepare($link, "DELETE FROM password_reset_tokens WHERE email = ?");
            mysqli_stmt_bind_param($stmt_delete_token, "s", $email_to_reset_password);
            mysqli_stmt_execute($stmt_delete_token);
            mysqli_stmt_close($stmt_delete_token);

            unset($_SESSION['reset_email_in_progress']);
            unset($_SESSION['otp_verified_for_email']);

            $_SESSION['success_message_login'] = "Password Anda berhasil diubah. Silakan login dengan password baru.";
            header("Location: login.php");
            exit();
        } else {
            $error_message = "Gagal memperbarui password. Silakan coba lagi.";
            error_log("MySQL Error (update password): " . mysqli_error($link));
        }
        mysqli_stmt_close($stmt_update_pw);
    }
}

if (isset($link) && $link && mysqli_ping($link)) {
    mysqli_close($link);
}
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="assets/HabitHub icon.png" type="image/png" />
    <title>Reset Password - Buat Password Baru</title>
    
    <link rel="stylesheet" href="styles_pw.css" />
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
      <h1>Buat Password baru</h1>
      <p class="subtitle">
        Buat password baru untuk akun dengan email: <br><b><?php echo htmlspecialchars($email_to_reset_password); ?></b>
      </p>

      <?php if (!empty($error_message)): ?>
        <p style="color: red; text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid red; background-color: #ffebeb; border-radius: 8px;">
            <?php echo htmlspecialchars($error_message); ?>
        </p>
      <?php endif; ?>
      
      <form method="POST" action="pw_pw.php">
        <div class="form-group">
          <label for="password">Password baru</label>
          <div class="input-icon">
            <input type="password" id="password" name="password" required autocomplete="new-password" />
            <i class="material-icons eye-icon" style="cursor: pointer;">visibility_off</i>
          </div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Konfirmasi password baru</label>
          <div class="input-icon">
            <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password" />
            <i class="material-icons eye-icon" style="cursor: pointer;">visibility_off</i>
          </div>
        </div>

        <button type="submit">Reset Password</button>

        <a href="login.php" class="return-link">Keluar</a>
      </form>
    </div>
    <script>
        function togglePasswordVisibility(fieldId, iconElement) {
            const passwordField = document.getElementById(fieldId);
            if (passwordField.type === "password") {
                passwordField.type = "text";
                iconElement.textContent = "visibility";
            } else {
                passwordField.type = "password";
                iconElement.textContent = "visibility_off";
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const eyeIcons = document.querySelectorAll('.eye-icon');
            eyeIcons.forEach(icon => {
                icon.addEventListener('click', function() {
                    const inputField = this.previousElementSibling; 
                    if (inputField && (inputField.type === 'password' || inputField.type === 'text')) {
                        togglePasswordVisibility(inputField.id, this);
                    }
                });
            });
        });
    </script>
  </body>
</html>