document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    forgotPasswordForm.addEventListener('submit', function(event) {
        event.preventDefault();
        requestPasswordReset();
    });
}

function requestPasswordReset() {
    const email = document.getElementById('email').value;

    // Verwendung des BASE_URL von der zentralen Konfiguration in script.js
    const BASE_URL = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=';
    const API_ENDPOINT = BASE_URL + 'pwvergessen';

    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkantwort war nicht okay');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Die API sollte einen Key senden, der als Parameter an die URL angehängt wird
                const key = data.key;
                window.location.href = `reset_password.html?key=${key}`; // Weiterleitung mit Schlüssel als URL-Parameter
            } else {
                alert('Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.');
            }
        })
        .catch(error => {
            console.error('Fehler beim Senden der Anfrage:', error);
            alert('Ein Fehler ist aufgetreten: ' + error.message);
        });
}
