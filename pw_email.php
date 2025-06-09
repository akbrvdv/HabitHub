<?php
session_start();
require_once 'db_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'libs/PHPMailer-6.10.0/src/Exception.php';
require 'libs/PHPMailer-6.10.0/src/PHPMailer.php';
require 'libs/PHPMailer-6.10.0/src/SMTP.php';

$error_message = '';
$success_message = '';

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['email'])) {
    $email = trim($_POST['email']);

    if (empty($email)) {
        $error_message = "Alamat email tidak boleh kosong.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error_message = "Format email tidak valid.";
    } else {
        $stmt_check_email = mysqli_prepare($link, "SELECT id, first_name FROM users WHERE email = ?");
        mysqli_stmt_bind_param($stmt_check_email, "s", $email);
        mysqli_stmt_execute($stmt_check_email);
        $result_check_email = mysqli_stmt_get_result($stmt_check_email);

        if (mysqli_num_rows($result_check_email) > 0) {
            $user_data = mysqli_fetch_assoc($result_check_email);
            $user_first_name = !empty($user_data['first_name']) ? $user_data['first_name'] : 'Pengguna';

            $otp = substr(str_shuffle("0123456789"), 0, 4);
            $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            $stmt_delete_old = mysqli_prepare($link, "DELETE FROM password_reset_tokens WHERE email = ?");
            mysqli_stmt_bind_param($stmt_delete_old, "s", $email);
            mysqli_stmt_execute($stmt_delete_old);
            mysqli_stmt_close($stmt_delete_old);

            $stmt_insert_token = mysqli_prepare($link, "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)");
            mysqli_stmt_bind_param($stmt_insert_token, "sss", $email, $otp, $expires_at);

            if (mysqli_stmt_execute($stmt_insert_token)) {
                $mail = new PHPMailer(true);

                try {
                    $mail->SMTPDebug = SMTP::DEBUG_OFF;
                    $mail->isSMTP();
                    $mail->Host = 'smtp.gmail.com';
                    $mail->SMTPAuth = true;
                    $mail->Username = 'email gua';
                    $mail->Password = 'kasih tau gak ya';
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port = 465;

                    $mail->setFrom('habithub08@gmail.com', 'HabitHub');
                    $mail->addAddress($email, $user_first_name);

                    $mail->isHTML(true);
                    $mail->Subject = 'Kode Reset Password HabitHub Anda';
                    $mail->Body = '
                    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="padding: 20px 0;">
                      <tr>
                        <td align="center">
                          <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" style="border-radius: 8px; overflow: hidden; font-family: Arial, sans-serif;">
                            <tr>
                              <td align="center">
                                <img 
                                  src="https://i.ibb.co/q34bwzRj/Oranye-Putih-Kuning-Modern-Festival-Musik-Pop-Ticket-1080-x-1080-piksel.jpg"
                                  alt="HabitHub Banner" 
                                  style="display: block; width: 100%; height: auto; max-width: 100%;" />
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 30px; color: #333333;">
                                <h2 style="margin-top: 0; color: #2c3e50;">Halo ' . htmlspecialchars($user_first_name) . ',</h2>
                                <p style="font-size: 16px; line-height: 1.5;">
                                  Kami menerima permintaan untuk mereset password akun HabitHub Anda.<br><br>
                                  Gunakan kode verifikasi berikut untuk melanjutkan proses reset password:
                                </p>
                                <p style="text-align: center; margin: 30px 0;">
                                  <span style="display: inline-block; font-size: 32px; font-weight: bold; background-color: #f0f0f0; padding: 15px 30px; border-radius: 8px; color: #2c3e50;">' . $otp . '</span>
                                </p>
                                <p style="font-size: 16px; line-height: 1.5;">
                                  Kode ini hanya berlaku selama 15 menit.<br><br>
                                  Jika Anda tidak meminta reset password, Anda bisa abaikan email ini.
                                </p>
                                <p style="margin-top: 40px; font-size: 14px; color: #888888;">
                                  Terima kasih,<br>
                                  Tim HabitHub
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td bgcolor="#f9f9f9" style="padding: 20px; text-align: center; font-size: 12px; color: #aaaaaa;">
                                &copy; 2025 HabitHub. Semua hak dilindungi.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ';

                    $mail->AltBody = "Halo " . htmlspecialchars($user_first_name) . ",\n\n" .
                                     "Anda meminta untuk mereset password akun HabitHub Anda.\n" .
                                     "Gunakan kode OTP berikut untuk melanjutkan: " . $otp . "\n\n" .
                                     "Kode ini akan kedaluwarsa dalam 15 menit.\n" .
                                     "Jika Anda tidak meminta ini, abaikan email ini.\n\n" .
                                     "Terima kasih,\nTim HabitHub";

                    $mail->send();
                    $_SESSION['reset_email_in_progress'] = $email;
                    header("Location: pw_code.php");
                    exit();

                } catch (Exception $e) {
                    $error_message = "Gagal mengirim email OTP. Silakan coba lagi nanti. Mailer Error: {$mail->ErrorInfo}";
                    error_log("PHPMailer Error for $email: {$mail->ErrorInfo}");
                }
            } else {
                $error_message = "Gagal menyimpan token reset. Silakan coba lagi.";
                error_log("MySQL Error (insert token): " . mysqli_error($link));
            }
            mysqli_stmt_close($stmt_insert_token);
        } else {
            $success_message = "Jika alamat email Anda terdaftar di sistem kami, instruksi untuk reset password telah dikirim.";
        }
        mysqli_stmt_close($stmt_check_email);
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
    <title>Reset Password - Email</title>
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
      <div class="image-placeholder"></div>
      <h1>Ganti Password</h1>
      <p class="subtitle">
        Masukkan ulang alamat email kamu untuk menerima kode verifikasi
      </p>

      <?php if (!empty($error_message)): ?>
        <p style="color: red; text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid red; background-color: #ffebeb;">
            <?php echo htmlspecialchars($error_message); ?>
        </p>
      <?php endif; ?>
      <?php if (!empty($success_message)): ?>
        <p style="color: green; text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid green; background-color: #e6ffe6;">
            <?php echo htmlspecialchars($success_message); ?>
        </p>
      <?php endif; ?>

      <form method="POST" action="pw_email.php">
        <div class="form-group">
          <label for="email">Email konfirmasi</label>
          <div class="input-wrapper">
            <input
              type="email"
              id="email"
              name="email"
              class="email-input"
              placeholder="contoh@email.com"
              required
            />
          </div>
        </div>

        <button type="submit">Kirim Kode Verifikasi</button>

        <a href="login.php" class="return-link">Keluar</a>
      </form>
    </div>
  </body>
</html>

<!-- src="https://tinypic.host/images/2025/06/01/Oranye-Putih-Kuning-Modern-Festival-Musik-Pop-Ticket-1080-x-1080-piksel.th.jpg"  -->