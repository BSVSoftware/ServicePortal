document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
    updateUIBasedOnAuthStatus();
    populateUsernameField();
});

function populateUsernameField() {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
    }
}

function attachEventListeners() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLoginFormSubmit);
}

function handleLoginFormSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    performLogin(username, password);
}

function performLogin(username, password) {
    const credentials = btoa(username + ":" + password);
    const API_ENDPOINT_LOGIN = BASE_URL + 'requesterUserLogin&ARGUMENTS=-A';

    fetch(API_ENDPOINT_LOGIN, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + credentials
        }
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    alert('Sitzung abgelaufen. Bitte erneut einloggen.');
                    window.location.href = 'login.html';
                } else {
                    throw new Error('Login failed');
                }
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('SID', data.SID);
            localStorage.setItem('username', username); // Speichert nur den Benutzernamen
            updateUIBasedOnAuthStatus();
            window.location.href = 'Menue.html'; // Redirect to menu page
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Login fehlgeschlagen: ' + error.message);
        });
}

function updateUIBasedOnAuthStatus() {
    const isLoggedIn = !!localStorage.getItem('SID');
    document.querySelectorAll('.auth-only').forEach(item => item.style.display = isLoggedIn ? 'block' : 'none');
    document.querySelectorAll('.no-auth').forEach(item => item.style.display = isLoggedIn ? 'none' : 'block');
}
