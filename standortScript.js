$(document).ready(function () {
    const API_ENDPOINT_MODSTANDORT = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=requesterPortale&ARGUMENTS=-Amodstandort';
    const apiKey = localStorage.getItem('SID');
    const dbName = "IDNRDatabase";
    const storeName = "idnrStore";
    let db;

    // Prüfen, ob ein API-Key vorhanden ist, sonst zur Login-Seite umleiten
    if (!apiKey) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idnr = urlParams.get('idnr');
    const standort1 = urlParams.get('standort1');
    const standort2 = urlParams.get('standort2');
    const ansprechpartner = urlParams.get('ansprechpartner');

    // Populate the form fields with the data from the URL parameters
    if (idnr) {
        $('#IDNR').val(idnr);
    }
    if (standort1) {
        $('#Standort1').val(standort1);
    }
    if (standort2) {
        $('#Standort2').val(standort2);
    }
    if (ansprechpartner) {
        $('#Ansprechpartner').val(ansprechpartner);
    }

    // Formular-Submit-Event
    $('#changeLocationForm').on('submit', function(e) {
        e.preventDefault();

        const idnrValue = $('#IDNR').val();
        if (!$.isNumeric(idnrValue)) {
            alert('IDNR muss eine Zahl sein.');
            return;
        }

        const formData = {
            IDNR: Number(idnrValue),
            Standort1: $('#Standort1').val(),
            Standort2: $('#Standort2').val(),
            Ansprechpartner: $('#Ansprechpartner').val()
        };

        $.ajax({
            url: API_ENDPOINT_MODSTANDORT,
            headers: { 'SID': apiKey },
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                alert('Standort erfolgreich geändert!');
                clearIndexedDB();
                window.location.href = 'IDNR_Uebersicht.html';
            },
            error: function(error) {
                console.error('Fehler beim Senden an die API:', error);
                alert('Fehler beim Ändern des Standorts!');
            }
        });
    });

    function clearIndexedDB() {
        let request = indexedDB.deleteDatabase(dbName);

        request.onsuccess = function() {
            console.log("IndexedDB erfolgreich gelöscht");
        };

        request.onerror = function(event) {
            console.error("Fehler beim Löschen der IndexedDB:", event.target.errorCode);
        };

        request.onblocked = function() {
            console.warn("Löschen der IndexedDB blockiert");
        };
    }
});
