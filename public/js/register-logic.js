document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation(); // Stop other events

    const nameVal = document.getElementById('name').value;
    const emailVal = document.getElementById('email').value;
    const passVal = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');

    // 1. DISABLE BUTTON (Prevents Double Submit)
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";

    try {
        console.log("Sending registration request..."); // Debug Log

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: nameVal,
                email: emailVal,
                password: passVal
            })
        });

        const data = await res.json();
        console.log("Server Response:", data); // Debug Log

        if (res.ok && data.success) {
            alert("Account created! Redirecting to login...");
            window.location.href = "/login.html";
        } else {
            alert("Error: " + (data.message || "Registration failed"));
            // Re-enable button if failed
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
        }
    } catch (err) {
        console.error("Network Error:", err);
        alert("Server Error - Check Console");
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
    }
});