const API_URL = "http://localhost:5000"; // Change this to your server's URL if deployed

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Store JWT token (you can use localStorage, sessionStorage, or cookies)
            localStorage.setItem('authToken', data.token);
            console.log(data.token);
            window.location.href = 'index.html'; // Redirect to tasks page after successful login
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Error logging in');
    }
});
