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
  if (!typewriterElement) return;
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

  const captchaTextElement = document.getElementById("captcha-text");
  const captchaInputElement = document.getElementById("captcha-input");
  const refreshCaptchaButton = document.getElementById("refresh-captcha");
  const captchaErrorJsElement = document.getElementById("captcha-error-js");

  let currentDisplayedCaptcha = captchaTextElement
    ? captchaTextElement.textContent
    : "";

  async function refreshCaptchaFromServer() {
    if (!captchaTextElement) return;
    try {
      const response = await fetch("login.php?action=refresh_captcha");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.captcha_text) {
        currentDisplayedCaptcha = data.captcha_text;
        captchaTextElement.textContent = currentDisplayedCaptcha;
        if (captchaErrorJsElement) {
          captchaErrorJsElement.textContent = "";
          captchaErrorJsElement.style.display = "none";
        }
        if (captchaInputElement) captchaInputElement.style.border = "";
      }
    } catch (error) {
      console.error("Error refreshing captcha:", error);
      if (captchaErrorJsElement) {
        captchaErrorJsElement.textContent = "Gagal memuat captcha baru.";
        captchaErrorJsElement.style.display = "block";
      }
    }
  }

  function validateCaptchaClientSide() {
    if (!captchaInputElement || !captchaErrorJsElement) return true;

    if (
      captchaInputElement.value.trim().toLowerCase() !==
      currentDisplayedCaptcha.toLowerCase()
    ) {
      captchaErrorJsElement.textContent =
        "Captcha tidak sesuai, silahkan coba lagi atau refresh captcha.";
      captchaErrorJsElement.style.display = "block";
      captchaInputElement.style.border = "2px solid red";
      return false;
    } else {
      captchaErrorJsElement.textContent = "";
      captchaErrorJsElement.style.display = "none";
      captchaInputElement.style.border = "";
      return true;
    }
  }

  if (refreshCaptchaButton) {
    refreshCaptchaButton.addEventListener("click", refreshCaptchaFromServer);
  }

  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", function (event) {
      if (!validateCaptchaClientSide()) {
        event.preventDefault();
      }
    });
  }
});
