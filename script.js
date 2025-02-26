document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');
  const loginButton = document.querySelector('.submit-button');
  const passwordToggle = document.getElementById('passwordToggle');

  usernameInput.addEventListener('focus', function() {
    usernameInput.classList.add('focused');
  });

  usernameInput.addEventListener('blur', function() {
    usernameInput.classList.remove('focused');
  });

  passwordInput.addEventListener('focus', function() {
    passwordInput.classList.add('focused');
  });

  passwordInput.addEventListener('blur', function() {
    passwordInput.classList.remove('focused');
  });

  loginButton.addEventListener('click', function() {
    loginButton.classList.add('clicked');
    setTimeout(function() {
      loginButton.classList.remove('clicked');
    }, 300);
  });

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "") {
      errorMessage.textContent = "Username tidak boleh kosong.";
      errorMessage.style.visibility = "visible";
      errorMessage.style.display = "block";
      usernameInput.focus();
      return;
    }

    if (password === "") {
      errorMessage.textContent = "Password tidak boleh kosong.";
      errorMessage.style.visibility = "visible";
      errorMessage.style.display = "block";
      passwordInput.focus();
      return;
    }


    const correctUsername = "admin";
    const correctPassword = "password123";

    if (username === correctUsername && password === correctPassword) {
      errorMessage.style.visibility = "hidden";
      errorMessage.style.display = "none";
      alert("Login Berhasil!");
    } else {
      errorMessage.textContent = "Username atau password salah.";
      errorMessage.style.visibility = "visible";
      errorMessage.style.display = "block";
    }
  });

  passwordToggle.addEventListener('click', function() {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordToggle.textContent = "\uD83D\uDC40";
    } else {
      passwordInput.type = "password";
      passwordToggle.textContent = "&#x1F441;";
    }
  });
});