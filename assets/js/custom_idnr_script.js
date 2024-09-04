$(document).ready(function () {
    const dbName = "IDNRDatabase";
    const storeName = "idnrData";
    let db;

    function initDB() {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "IDNR" });
            }
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            fetchOrLoadData();
        };
        request.onerror = function(event) {
            console.error('Database error: ' + event.target.errorCode);
        };
    }

    function fetchOrLoadData() {
        const transaction = db.transaction([storeName], "readonly");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.count();

        request.onsuccess = function() {
            if (request.result === 0) {
                fetchDataFromAPI(); // Fetch from API if store is empty
            } else {
                loadDataFromIndexedDB(); // Load from IndexedDB if data is already present
            }
        };
    }

    function fetchDataFromAPI() {
        const API_ENDPOINT_IDNR = BASE_URL + 'requesterPortale&ARGUMENTS=-Agetpoidnr';
        $.ajax({
            url: API_ENDPOINT_IDNR,
            method: 'GET',
            headers: { 'SID': localStorage.getItem('SID') },
            success: function(response) {
                const data = JSON.parse(response);
                saveDataToIndexedDB(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if(jqXHR.status === 401) {
                    alert("Sitzung abgelaufen. Bitte erneut einloggen.");
                    window.location.href = 'login.html';
                } else {
                    console.error('AJAX Error:', textStatus, errorThrown);
                }
            }
        });
    }

    function saveDataToIndexedDB(data) {
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        data.forEach(item => {
            objectStore.put(item);
        });
        transaction.oncomplete = function() {
            loadDataFromIndexedDB();
        };
    }

    function loadDataFromIndexedDB() {
        const transaction = db.transaction([storeName], "readonly");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();
        request.onsuccess = function() {
            populateSelectOptions(request.result);
        };
    }

    function populateSelectOptions(data) {
        const select = $('#IDNR');
        select.empty();
        data.forEach(item => {
            const optionText = item.Standort1 && item.Standort1 !== "null" ?
                `${item.IDNR} - ${item.Modell} - ${item.Standort1}` :
                `${item.IDNR} - ${item.Modell}`;
            select.append($('<option>', {
                value: item.IDNR,
                text: optionText
            }));
        });
    }

    // Initialize IndexedDB upon ready
    initDB();

    // Listen for IDNR selection change
    $('#IDNR').change(function() {
        const selectedIDNR = $(this).val();
        const transaction = db.transaction([storeName], "readonly");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(parseInt(selectedIDNR));
        request.onsuccess = function() {
            if (request.result) {
                $('#ModellInfo').text(request.result.Modell);
            }
        };
    });

    // Handling form submission for creating tickets
    $('#createTicketForm').on('submit', function(e) {
        e.preventDefault();
        const formData = {
            IDNR: parseInt($('#IDNR').val()),
            Prioritaet: $('#Prioritaet').val(),
            Stichwort: $('#Stichwort').val(),
            Problem: $('#Problem').val(),
            Kontakt: $('#Kontakt').val(),
            EMail: $('#Email').val(),
            Telefon: $('#Telefon').val(),
            Workflow: "Neu"
        };
        createTicket(formData);
    });

    function createTicket(formData) {
        const API_ENDPOINT_CREATE_TICKET = BASE_URL + 'requesterPortale&ARGUMENTS=-AcreateTicket';
        $.ajax({
            url: API_ENDPOINT_CREATE_TICKET,
            headers: { 'SID': localStorage.getItem('SID') },
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                alert('Ticket erfolgreich erstellt!');
                window.location.href = 'menue.html';
            },
            error: function(error) {
                console.error('Fehler beim Senden an die API:', error);
                alert('Fehler beim Erstellen des Tickets!');
            }
        });
    }
});
