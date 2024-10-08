$(document).ready(function () {
    let API_ENDPOINT_CREATE_TICKET;
    const API_ENDPOINT_SETTINGS = './Einstellungen.txt'; // URL zu Einstellungen.txt im Root-Verzeichnis der Webanwendung
    const apiKey = localStorage.getItem('SID');
    let ticketquelleValue = ""; // Variable für den Wert der Ticketquelle

    // Prüfen, ob ein API-Key vorhanden ist, sonst zur Login-Seite umleiten
    if (!apiKey) {
        window.location.href = 'login.html';
        return;
    }

    waitForBaseUrlAndInitialize();

    function waitForBaseUrlAndInitialize() {
        if (typeof BASE_URL !== 'undefined' && BASE_URL) {
            API_ENDPOINT_CREATE_TICKET = BASE_URL + 'requesterPortale&ARGUMENTS=-Acreatepoticket';
            loadSettings();
            // Other initialization code can go here
        } else {
            setTimeout(waitForBaseUrlAndInitialize, 100); // Check again after 100ms
        }
    }

    function loadSettings() {
        $.ajax({
            url: API_ENDPOINT_SETTINGS,
            method: 'GET',
            success: function(response) {
                const settings = JSON.parse(response);
                ticketquelleValue = settings.Ticketquelle; // Wert der Ticketquelle setzen
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Fehler beim Abrufen der Einstellungen:', textStatus, errorThrown);
            }
        });
    }

    // Formular-Submit-Event
    $('#createTicketForm').on('submit', function(e) {
        e.preventDefault();
        $('#spinner').show();
        $('#submitButton').attr('disabled', true);
        const kundeValue = $('#Kunde').data("kendoComboBox").value();
        const idnrValue = $('#IDNR').data("kendoComboBox").value();
        const produktbereichValue = $('#Produktbereich').data("kendoComboBox").value();
        const produktValue = $('#Produkt').val();

        // Validierung
        if (!kundeValue) {
            alert("Bitte wählen Sie einen Kunden aus.");
            $('#spinner').hide();
            return false; // Stop the form submission
        }

        if (!idnrValue && !produktValue) {
            alert("Bitte geben Sie ein Produkt an, wenn keine Identnummer vorhanden ist.");
            $('#spinner').hide();
            return false; // Stop the form submission
        }

        let files = $('#Dateien').prop('files');
        let formData = {
            IDNR: parseInt(idnrValue) || null, // IDNR aus der ComboBox, optional
            Produkt: produktValue, // Neues Produktfeld
            Produktbereich: produktbereichValue, // Neues Produktbereichfeld
            Prioritaet: parseInt($('#Prioritaet').data("kendoComboBox").value()), // Priorität aus der ComboBox
            Stichwort: $('#Stichwort').val(),
            Problem: $('#Problem').val(),
            Kontakt: $('#Kontakt').val(),
            EMail: $('#Email').val(),
            Telefon: $('#Telefon').val(),
            Workflow: "Neu",
            Ticketquelle: ticketquelleValue // Fester Wert für Ticketquelle
        };

        // Erster API-Aufruf zum Erstellen des Tickets
        $.ajax({
            url: API_ENDPOINT_CREATE_TICKET,
            headers: { 'SID': apiKey },
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                const ticketNr = JSON.parse(response).TicketNr;
                alert('Ticket erfolgreich erstellt! Ticketnummer: ' + ticketNr);
                if (files.length > 0) {
                    uploadFiles(ticketNr, files, apiKey);
                } else {
                    deleteAllIndexedDBs(); // Löschfunktion für IndexedDB-Datenbanken
                    window.location.href = 'Menue.html';
                }
                $('#spinner').hide();
                $('#submitButton').attr('disabled', false);
            },
            error: function(error) {
                console.error('Fehler beim Senden an die API:', error);
                alert('Fehler beim Erstellen des Tickets!');
                $('#spinner').hide();
                $('#submitButton').attr('disabled', false);

            }
        });
    });

    function deleteAllIndexedDBs() {
        const databases = ['Auftraege']; // Beispiel-Datenbanknamen
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
});
