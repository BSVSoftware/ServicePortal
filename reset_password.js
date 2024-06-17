document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('resetPasswordForm');
    const uid = localStorage.getItem('UID'); // UID aus dem lokalen Speicher holen

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Verhindert das normale Absenden des Formulars

        // Extrahiere den manuell eingegebenen Schlüssel
        const key = document.getElementById('resetKey').value;
        if (!key) {
            alert('Bitte geben Sie den Reset-Key ein.');
            return;
        }

        // Validiere die Passwort-Eingaben
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (newPassword !== confirmPassword) {
            alert('Die Passwörter stimmen nicht überein.');
            return;
        }

        // Bereite die Daten für die API-Anfrage vor
        const data = JSON.stringify({
            newPassword: newPassword
        });

        // Sende die Daten an die REST API
        fetch('https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=portalpwsetzen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'reset-key': key,
                'UID': uid  // Hinzufügen der UID zum Header
            },
            body: data
        })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Verarbeiten der Antwort, wenn Status OK ist
                } else {
                    throw new Error('Unauthorized: Access is denied due to invalid credentials.'); // Fehler bei 401 Unauthorized
                }
            })
            .then(data => {
                if (data.Status === 'Ok') {
                    alert('Ihr Passwort wurde erfolgreich zurückgesetzt.');
                    window.location.href = 'login.html'; // Weiterleitung zur Login-Seite
                } else {
                    throw new Error(data.message || 'Fehler beim Zurücksetzen des Passworts.');
                }
            })
            .catch(error => {
                console.error('Fehler:', error);
                alert('Fehler beim Zurücksetzen des Passworts: ' + error.message);
            });
    });
});
