// public/js/auth.js

// 1. Selector Constants
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const errorDisplay = document.getElementById("error-message");

// 2. Helper to show errors on screen
const showError = (message) => {
  errorDisplay.textContent = message;
  errorDisplay.style.display = "block";
  setTimeout(() => {
    errorDisplay.style.display = "none";
  }, 4000);
};

// 3. Handle Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stop page reload

    const credentialsPayload = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialsPayload),
      });

      const result = await response.json();

      if (result.success) {
        // Save the "Digital Badge"
        localStorage.setItem("vault_token", result.token);
        localStorage.setItem("vault_role", result.role);

        // Redirect based on role (We will build dashboard later)
        if (result.role === "admin") {
          window.location.href = "/dashboard.html"; // Admin Panel
        } else {
          window.location.href = "/index.html"; // Shop Home
        }
      } else {
        showError(result.message);
      }
    } catch (networkError) {
      showError("System Unreachable. Check console.");
      console.error(networkError);
    }
  });
}

// 4. Handle Registration
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newIdentityPayload = {
      fullName: document.getElementById("fullname").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIdentityPayload),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("vault_token", result.token);
        alert("Identity Created. Welcome to Bytes Vault.");
        window.location.href = "/index.html";
      } else {
        showError(result.message);
      }
    } catch (networkError) {
      showError("System Unreachable");
    }
  });
}
