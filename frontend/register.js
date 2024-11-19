const API_URL = "http://localhost:5000"; // Change this to your server's URL if deployed

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.href = 'login.html'; // Redirect to login page after successful registration
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Error registering user');
    }
});
