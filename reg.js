const texts = [
  " Tumbuh lebih baik, ",
  " capai tujuanmu. ",
  " Jadi lebih baik, ",
  " Dibanding dahulu. ",
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const speed = 100;
const delay = 1500;

const typewriterElement = document.getElementById("typewriter");

function typeEffect() {
  let currentText = texts[textIndex];
  if (isDeleting) {
    typewriterElement.textContent = currentText.substring(0, charIndex--);
  } else {
    typewriterElement.textContent = currentText.substring(0, charIndex++);
  }

  let typeSpeed = isDeleting ? speed / 2 : speed;

  if (!isDeleting && charIndex === currentText.length) {
    typeSpeed = delay;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % texts.length;
  }

  setTimeout(typeEffect, typeSpeed);
}

typeEffect();

document.addEventListener("DOMContentLoaded", function () {
  const passwordFields = document.querySelectorAll(
    ".input-icon input[type='password'], .input-icon input[type='confirmPassword']"
  );
  const eyeIcons = document.querySelectorAll(".eye-icon");

  eyeIcons.forEach((eyeIcon, index) => {
    eyeIcon.addEventListener("click", function () {
      const inputField = passwordFields[index];
      if (inputField.type === "password") {
        inputField.type = "text";
        eyeIcon.textContent = "visibility";
      } else {
        inputField.type = "password";
        eyeIcon.textContent = "visibility_off";
      }
    });
  });

  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const form = document.querySelector("form");

  confirmPassword.addEventListener("input", function () {
    if (password.value !== confirmPassword.value) {
      confirmPassword.style.border = "2px solid red";
    } else {
      confirmPassword.style.border = "2px solid green";
    }
  });

  form.addEventListener("submit", function (event) {
    if (password.value !== confirmPassword.value) {
      event.preventDefault();
      alert("Password dan Confirm Password tidak cocok!");
    }
  });

  const captchaText = document.getElementById("captcha-text");
  const captchaInput = document.getElementById("captcha-input");
  const refreshCaptchaButton = document.getElementById("refresh-captcha");
  const captchaError = document.getElementById("captcha-error");

  let generatedCaptcha = "";

  function generateCaptcha() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
      captcha += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    generatedCaptcha = captcha;
    captchaText.textContent = captcha;

    captchaError.textContent = "";
    captchaError.style.display = "none";
    captchaInput.style.border = "";
  }

  function validateCaptcha() {
    console.log("validateCaptcha() dipanggil");
    if (captchaInput.value !== generatedCaptcha) {
      console.log("Captcha tidak valid!");
      captchaError.textContent = "Captcha tidak valid";
      captchaError.style.display = "block";
      captchaInput.style.border = "2px solid red";
      return false;
    } else {
      console.log("Captcha valid!");
      captchaError.textContent = "";
      captchaError.style.display = "none";
      captchaInput.style.border = "";
      return true;
    }
  }

  refreshCaptchaButton.addEventListener("click", generateCaptcha);

  form.addEventListener("submit", function (event) {
    console.log("Form disubmit!"); //Verifikasi submit

    const isCaptchaValid = validateCaptcha();
    console.log("isCaptchaValid:", isCaptchaValid); //Verifikasi hasil captcha

    if (!isCaptchaValid) {
      console.log("Captcha tidak valid, mencegah submit.");
      event.preventDefault(); // Mencegah submit jika ada error
      alert("Perbaiki kesalahan pada form!"); // Atur alert yang lebih baik
    } else {
      console.log("Captcha valid, form akan disubmit.");
    }
  });

  generateCaptcha(); // Generate captcha saat halaman dimuat
});
