// public/js/login-logic.js
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("auth-errors");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showErrors(messages) {
  if (!errorBox) return;
  errorBox.innerHTML = `<ul>${messages.map((m) => `<li>${m}</li>`).join("")}</ul>`;
  errorBox.classList.remove("hidden");
}

function clearErrors() {
  if (!errorBox) return;
  errorBox.innerHTML = "";
  errorBox.classList.add("hidden");
}

function setFieldState(inputEl, hasError) {
  const wrapper = inputEl?.closest(".input-field");
  if (!wrapper) return;
  wrapper.classList.toggle("field-error", hasError);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  setFieldState(emailInput, false);
  setFieldState(passwordInput, false);

  const emailVal = emailInput.value.trim();
  const passVal = passwordInput.value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  const errors = [];
  if (!emailPattern.test(emailVal)) {
    errors.push("Enter a valid email address.");
    setFieldState(emailInput, true);
  }
  if (passVal.length < 6) {
    errors.push("Password must be at least 6 characters.");
    setFieldState(passwordInput, true);
  }

  if (errors.length) {
    showErrors(errors);
    emailInput.focus();
    return;
  }

  submitBtn.textContent = "Authenticating...";
  submitBtn.disabled = true;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailVal,
        password: passVal,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem("vault_token", data.token);
      localStorage.setItem("vault_role", data.role);

      // Redirect based on role
      if (data.role === "admin") {
        window.location.href = "/dashboard.html";
      } else {
        window.location.href = "/shop.html";
      }
    } else {
      showErrors([data.message || "Login failed"]);
      submitBtn.textContent = "Login";
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    showErrors(["Server connection failed"]);
    submitBtn.textContent = "Login";
    submitBtn.disabled = false;
  }
});
