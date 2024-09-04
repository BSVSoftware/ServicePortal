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
    const uid = localStorage.getItem('UID'); // UID aus dem lokalen Speicher holen

    // Verwendung des BASE_URL von der zentralen Konfiguration in script.js
    //const BASE_URL = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=';
    const API_ENDPOINT = BASE_URL + 'portalpwvergessen';

    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'UID': uid  // Hinzufügen der UID zum Header
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
            // Informiert den Benutzer, dass eine E-Mail gesendet wurde
            alert('Ein Schlüssel wurde an Ihre E-Mail-Adresse gesendet. Bitte prüfen Sie Ihr Postfach und geben Sie den Schlüssel auf der folgenden Seite ein.');
            window.location.href = 'reset_password.html'; // Weiterleitung zur manuellen Schlüsseleingabe
        })
        .catch(error => {
            console.error('Fehler beim Senden der Anfrage:', error);
            alert('Ein Fehler ist aufgetreten: ' + error.message);
        });
}
