const texts = [
    " Tumbuh lebih baik, ",
    " capai tujuanmu. ",
    " Jadi lebih baik, ",
    " Dibanding dahulu. "
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
    const passwordFields = document.querySelectorAll(".input-icon input[type='password'], .input-icon input[type='confirmPassword']");
    const eyeIcons = document.querySelectorAll(".eye-icon");

    eyeIcons.forEach((eyeIcon, index) => {
        eyeIcon.addEventListener("click", function () {
            const inputField = passwordFields[index];
            if (inputField.type === "password") {
                inputField.type = "text";
                eyeIcon.textContent = "visibility_off";
            } else {
                inputField.type = "password";
                eyeIcon.textContent = "visibility";
            }
        });
    });

    // Validasi password dan confirm password
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

