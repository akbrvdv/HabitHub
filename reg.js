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

if (typewriterElement) {
  typeEffect();
}

document.addEventListener("DOMContentLoaded", function () {
  const passwordFields = document.querySelectorAll(
    ".form-container .input-icon input[type='password']"
  );
  const eyeIcons = document.querySelectorAll(".form-container .eye-icon");

  eyeIcons.forEach((eyeIcon, index) => {
    if (passwordFields[index]) {
      const inputField = passwordFields[index];
      eyeIcon.addEventListener("click", function () {
        if (inputField.type === "password") {
          inputField.type = "text";
          eyeIcon.textContent = "visibility";
        } else {
          inputField.type = "password";
          eyeIcon.textContent = "visibility_off";
        }
      });
    } else {
    }
  });

  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const form = document.querySelector("form");

  if (password && confirmPassword) {
    confirmPassword.addEventListener("input", function () {
      if (password.value !== confirmPassword.value) {
        confirmPassword.style.border = "2px solid red";
      } else {
        confirmPassword.style.border = "2px solid green";
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

  async function refreshCaptchaFromServerReg() {
    if (!captchaTextElement || !captchaErrorJsElement) return;
    try {
      const response = await fetch("register.php?action=refresh_captcha_reg");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.captcha_text) {
        currentDisplayedCaptcha = data.captcha_text;
        captchaTextElement.textContent = currentDisplayedCaptcha;
        captchaErrorJsElement.textContent = "";
        captchaErrorJsElement.style.display = "none";
        if (captchaInputElement) captchaInputElement.style.border = "";
      }
    } catch (error) {
      console.error("Error refreshing captcha:", error);
      captchaErrorJsElement.textContent = "Gagal memuat captcha baru.";
      captchaErrorJsElement.style.display = "block";
    }
  }

  if (refreshCaptchaButton) {
    refreshCaptchaButton.addEventListener("click", refreshCaptchaFromServerReg);
  }

  function validateCaptchaClientSideReg() {
    if (!captchaInputElement || !captchaErrorJsElement || !captchaTextElement)
      return true; // Lewati jika elemen tidak ada

    const displayedCaptchaText = captchaTextElement.textContent;

    if (
      captchaInputElement.value.trim().toLowerCase() !==
      displayedCaptchaText.toLowerCase()
    ) {
      captchaErrorJsElement.textContent = "Captcha tidak sesuai (client-side).";
      captchaErrorJsElement.style.display = "block";
      captchaInputElement.style.border = "2px solid red";
      return false;
    }
    captchaErrorJsElement.textContent = "";
    captchaErrorJsElement.style.display = "none";
    captchaInputElement.style.border = "";
    return true;
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      let formIsValid = true;

      if (
        password &&
        confirmPassword &&
        password.value !== confirmPassword.value
      ) {
        alert("Password dan Konfirmasi Password tidak cocok!");
        confirmPassword.style.border = "2px solid red";
        event.preventDefault();
        formIsValid = false;
        return;
      }

      if (!validateCaptchaClientSideReg()) {
        event.preventDefault();
        formIsValid = false;
        return;
      }
    });
  }
});
