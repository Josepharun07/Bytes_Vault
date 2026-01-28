const registerForm = document.getElementById("registerForm");
const regName = document.getElementById("name");
const regEmail = document.getElementById("email");
const regPassword = document.getElementById("password");
const regErrors = document.getElementById("register-errors");

const regEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function regShowErrors(messages) {
  if (!regErrors) return;
  regErrors.innerHTML = `<ul>${messages.map((m) => `<li>${m}</li>`).join("")}</ul>`;
  regErrors.classList.remove("hidden");
}

function regClearErrors() {
  if (!regErrors) return;
  regErrors.innerHTML = "";
  regErrors.classList.add("hidden");
}

function regSetFieldState(inputEl, hasError) {
  const wrapper = inputEl?.closest(".input-field");
  if (!wrapper) return;
  wrapper.classList.toggle("field-error", hasError);
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  regClearErrors();
  [regName, regEmail, regPassword].forEach((el) => regSetFieldState(el, false));

  const nameVal = regName.value.trim();
  const emailVal = regEmail.value.trim();
  const passVal = regPassword.value;
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  const errors = [];
  if (nameVal.length < 2) {
    errors.push("Enter your full name.");
    regSetFieldState(regName, true);
  }
  if (!regEmailPattern.test(emailVal)) {
    errors.push("Enter a valid email address.");
    regSetFieldState(regEmail, true);
  }
  if (passVal.length < 8) {
    errors.push("Password must be at least 8 characters.");
    regSetFieldState(regPassword, true);
  }

  if (errors.length) {
    regShowErrors(errors);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: nameVal,
        email: emailVal,
        password: passVal,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("Account created! Redirecting to login...");
      window.location.href = "/login.html";
    } else {
      regShowErrors([data.message || "Registration failed"]);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  } catch (err) {
    console.error("Network Error:", err);
    regShowErrors(["Server Error - Please try again"]);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
