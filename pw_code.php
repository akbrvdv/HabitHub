<?php
session_start();
require_once 'db_config.php';

$error_message = '';

if (!isset($_SESSION['reset_email_in_progress'])) {
    header("Location: pw_email.php");
    exit();
}

$email_for_reset = $_SESSION['reset_email_in_progress'];

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['otp']) && is_array($_POST['otp'])) {
    $otp_input_array = array_map('trim', $_POST['otp']);
    $otp_input = implode("", $otp_input_array);

    if (empty($otp_input) || strlen($otp_input) != 4 || !ctype_digit($otp_input)) {
        $error_message = "Format OTP tidak valid. Harap masukkan 4 digit angka.";
    } else {
        $current_time = date('Y-m-d H:i:s');
        $stmt_verify_otp = mysqli_prepare($link, "SELECT id FROM password_reset_tokens WHERE email = ? AND token = ? AND expires_at > ?");
        mysqli_stmt_bind_param($stmt_verify_otp, "sss", $email_for_reset, $otp_input, $current_time);
        mysqli_stmt_execute($stmt_verify_otp);
        mysqli_stmt_store_result($stmt_verify_otp);

        if (mysqli_stmt_num_rows($stmt_verify_otp) > 0) {
            $_SESSION['otp_verified_for_email'] = $email_for_reset;
            
            header("Location: pw_pw.php");
            exit();
        } else {
            $error_message = "Kode OTP salah atau sudah kedaluwarsa. Silakan coba lagi atau minta kode baru.";
        }
        mysqli_stmt_close($stmt_verify_otp);
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
    <title>Reset Password - Kode OTP</title>
    <link rel="stylesheet" href="styles_pw.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div class="container">
      <h1>Reset Password</h1>
      <p class="subtitle">
        Masukkan 4 digit kode yang telah dikirimkan ke email kamu: <br><b><?php echo htmlspecialchars($email_for_reset); ?></b>
      </p>

      <?php if (!empty($error_message)): ?>
        <p style="color: red; text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid red; background-color: #ffebeb; border-radius: 8px;"> 
            <?php echo htmlspecialchars($error_message); ?>
        </p>
      <?php endif; ?>

      <form method="POST" action="pw_code.php">
        <div class="otp-container">
          <input type="text" name="otp[]" class="otp-input" maxlength="1" required inputmode="numeric" pattern="[0-9]" autocomplete="off" />
          <input type="text" name="otp[]" class="otp-input" maxlength="1" required inputmode="numeric" pattern="[0-9]" autocomplete="off" />
          <input type="text" name="otp[]" class="otp-input" maxlength="1" required inputmode="numeric" pattern="[0-9]" autocomplete="off" />
          <input type="text" name="otp[]" class="otp-input" maxlength="1" required inputmode="numeric" pattern="[0-9]" autocomplete="off" />
        </div>

        <button type="submit" id="verifyButton" disabled>Verifikasi Kode</button>
        <a href="login.php" class="return-link">Keluar</a>
      </form>
    </div>
    <script>
      const inputs = document.querySelectorAll(".otp-input");
      const submitButton = document.getElementById('verifyButton');

      inputs.forEach((input, index) => {
        input.addEventListener("input", (e) => { 
          if (!/^[0-9]$/.test(input.value)) {
            input.value = "";
            return;
          }
          
          if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
          }
          checkAllFilled();
        });

        input.addEventListener("keydown", (e) => { 
          if (e.key === "Backspace") {
            if (input.value.length === 0 && index > 0) {
              inputs[index - 1].focus();
            }
            setTimeout(checkAllFilled, 0);
          }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pasteData.replace(/\D/g, '');
            
            let currentFocusIndex = index;
            for (let i = 0; i < digits.length && (index + i) < inputs.length; i++) {
                inputs[index + i].value = digits[i];
                currentFocusIndex = index + i;
            }
            if (currentFocusIndex < inputs.length -1) {
                inputs[currentFocusIndex + 1].focus();
            } else {
                inputs[currentFocusIndex].focus();
            }
            checkAllFilled();
        });
      });

      function checkAllFilled() {
        const allFilled = [...inputs].every(
          (input) => input.value.length === 1 && /^[0-9]$/.test(input.value)
        );
        if (allFilled) {
          submitButton.removeAttribute("disabled");
        } else {
          submitButton.setAttribute("disabled", true);
        }
      }

      window.addEventListener("load", () => {
        if(inputs.length > 0) {
            inputs[0].focus();
        }
        checkAllFilled(); 
      });
    </script>
  </body>
</html>