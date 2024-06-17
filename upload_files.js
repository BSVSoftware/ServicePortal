function uploadFiles(ticketNr, files, apiKey) {
    const API_ENDPOINT_UPLOAD = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=requesterPortaleUpload&ARGUMENTS=-Auploadpofile';
    let fileIndex = 0;

    function uploadNextFile() {
        if (fileIndex >= files.length) {
            alert('Alle Dateien erfolgreich hochgeladen!');
            deleteAllIndexedDBs(); // Löschfunktion für IndexedDB-Datenbanken
            window.location.href = 'menue.html';
            return;
        }

        let fileData = files[fileIndex];
        let reader = new FileReader();

        reader.onload = function() {
            const fileString = reader.result;
            $.ajax({
                url: API_ENDPOINT_UPLOAD,
                headers: {
                    'SID': apiKey,
                    'TicketNr': ticketNr,
                    'Filename': fileData.name
                },
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ Datei: fileString }),
                success: function(response) {
                    fileIndex++;
                    uploadNextFile();
                },
                error: function(error) {
                    console.error('Fehler beim Hochladen der Datei:', error);
                    alert('Fehler beim Hochladen der Datei!');
                }
            });
        };

        reader.onerror = function(error) {
            console.error('Fehler beim Lesen der Datei:', error);
            alert('Fehler beim Lesen der Datei: ' + error.message);
        };

        reader.readAsDataURL(fileData);
    }

    uploadNextFile();
}

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
