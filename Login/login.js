const texts = [
  " Tumbuh lebih baik. ",
  " capai tujuanmu. ",
  " Jadi lebih baik. ",
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
  // Fitur toggle password visibility
  const passwordField = document.querySelector(
    ".input-icon input[type='password']"
  );
  const eyeIcon = document.querySelector(".eye-icon");

  if (eyeIcon && passwordField) {
    eyeIcon.addEventListener("click", function () {
      if (passwordField.type === "password") {
        passwordField.type = "text";
        eyeIcon.textContent = "visibility";
      } else {
        passwordField.type = "password";
        eyeIcon.textContent = "visibility_off";
      }
    });
  }

  // Captcha
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
    if (captchaInput.value !== generatedCaptcha) {
      captchaError.textContent = "Captcha tidak valid";
      captchaError.style.display = "block";
      captchaInput.style.border = "2px solid red";
      return false;
    } else {
      captchaError.textContent = "";
      captchaError.style.display = "none";
      captchaInput.style.border = "";
      return true;
    }
  }

  refreshCaptchaButton.addEventListener("click", generateCaptcha);

  const form = document.querySelector("form");
  form.addEventListener("submit", function (event) {
    if (!validateCaptcha()) {
      event.preventDefault();
      alert("Perbaiki kesalahan pada form!");
    }
  });

  generateCaptcha();
});
