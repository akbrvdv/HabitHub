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
});
