// public/js/login-logic.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailVal = document.getElementById('email').value;
    const passVal = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');

    submitBtn.textContent = "Authenticating...";
    submitBtn.disabled = true;

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailVal,
                password: passVal
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem("vault_token", data.token);
            localStorage.setItem("vault_role", data.role);

            // Redirect based on role
            if(data.role === 'admin') {
                window.location.href = "/dashboard.html";
            } else {
                window.location.href = "/shop.html";
            }
        } else {
            alert(data.message || "Login failed");
            submitBtn.textContent = "Login";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert("Server connection failed");
        submitBtn.textContent = "Login";
        submitBtn.disabled = false;
    }
});