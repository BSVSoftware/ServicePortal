let BASE_URL;
//const BASE_URL = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=';
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadLicenseData();
    attachEventListeners();
    updateMenuVisibility();
    populateUsernameField();  // Load username from localStorage
});

function loadSettings() {
    fetch('Einstellungen.txt')
        .then(response => response.json())
        .then(data => {
            BASE_URL = data.BASE_URL;
            console.log('BASE_URL loaded:', BASE_URL);
            // After loading BASE_URL, you can perform other operations that depend on it
        })
        .catch(error => console.error('Error loading settings:', error));
}


function loadLicenseData() {
    fetch('license.txt')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('UID', data.UID);
            console.log('UID loaded:', data.UID);
        })
        .catch(error => console.error('Error loading the license data:', error));
}

function fetchWithHeaders(endpoint, options = {}) {
    const url = BASE_URL + endpoint;
    const headers = new Headers({
        'UID': localStorage.getItem('UID'),
        'APPID': 'sfm',
        'SECRET': '<Secret>',
        ...options.headers
    });
    return fetch(url, {...options, headers});
}

function updateMenuVisibility() {
    const SID = localStorage.getItem('SID');
    document.querySelectorAll('.auth-only').forEach(item => item.style.display = SID ? 'block' : 'none');
    document.querySelectorAll('.no-auth').forEach(item => item.style.display = SID ? 'none' : 'block');
}

function attachEventListeners() {
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        performLogin();
    });

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', function(event) {
        localStorage.removeItem('SID');
        updateMenuVisibility();
        window.location.href = 'login.html';
    });
}

function performLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const credentials = btoa(username + ":" + password);
    let responseStatus;

    fetchWithHeaders('requesterUserLogin', {
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + credentials }
    })
        .then(response => {
            responseStatus = response.status; // Capture the response status
            if (!response.ok) {
                if(responseStatus === 401) {
                    alert('Anmeldung fehlgeschlagen oder Sitzung abgelaufen. Bitte erneut einloggen.');
                    window.location.href = 'login.html';
                    return null;
                }
                throw new Error('Login fehlgeschlagen');
            }
            return response.json();
        })
        .then(data => {
            if (responseStatus !== 200) {
                // Handle other non-200 status codes if needed
                return;
            }

            if (data && data.SID) {
                localStorage.setItem('SID', data.SID);
                localStorage.setItem('username', username); // Save only username
                deleteAllIndexedDBs(); // Löschfunktion für IndexedDB-Datenbanken
                updateMenuVisibility();
                window.location.href = 'Menue.html';
            } else {
                throw new Error('Loginfehler - fehlerhafte Rückmeldung vom Server.');
            }
        })
        .catch(error => {
            console.error('Login failed:', error);
            alert('Login fehlgeschlagen: ' + error.message);
        });
}

function populateUsernameField() {
    const savedUsername = localStorage.getItem('username');
    const usernameField = document.getElementById('username');
    if (usernameField && savedUsername) {
        usernameField.value = savedUsername;
    }
}

function deleteAllIndexedDBs() {
    const databases = ['IDNRDatabase', 'Auftraege', 'OrderDatabase']; // Beispiel-Datenbanknamen
    databases.forEach(dbName => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = function() {
            console.log(`Deleted IndexedDB database: ${dbName}`);
        };
        request.onerror = function(event) {
            console.error(`Error deleting IndexedDB database: ${dbName}`, event);
        };
        request.onblocked = function() {
            console.warn(`Delete blocked for IndexedDB database: ${dbName}`);
        };
    });
}
