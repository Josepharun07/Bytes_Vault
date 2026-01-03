document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const alertInfo = document.getElementById('alertInfo');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Store token in localStorage
                    localStorage.setItem('token', data.token);
                    // Redirect to dashboard (or home for now as dashboard.html isn't mandated created yet but requested in structure)
                    // The prompt "WHAT TO GENERATE" didn't mandate dashboard.html code, but "REQUIRED FOLDER STRUCTURE" mentioned it.
                    // I will just alert success for now or redirect to index.html if it existed, or just log.
                    // Prompt says: "On success, store the JWT in localStorage and redirect to the dashboard."
                    // I'll redirect to dashboard.html even if I haven't created it yet (it will 404 but logic is correct).
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert(data.message, 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('An error occurred. Please try again.', 'danger');
            }
        });
    }

    function showAlert(message, type) {
        alertInfo.textContent = message;
        alertInfo.className = `alert alert-${type}`;
        alertInfo.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            alertInfo.style.display = 'none';
        }, 3000);
    }
});
