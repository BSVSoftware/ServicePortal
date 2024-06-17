$(document).ready(function () {
    const dbName = "IDNRDatabase";
    const storeName = "idnrStore";
    const API_ENDPOINT_IDNR = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=requesterPortale&ARGUMENTS=-Agetpoidnr';
    const API_ENDPOINT_SETTINGS = 'Einstellungen.txt'; // URL zu Einstellungen.txt im Root-Verzeichnis der Webanwendung
    const API_ENDPOINT_PRODUKTBEREICHE = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=requesterPortale&ARGUMENTS=-Agetproduktbereiche';
    const currentSID = localStorage.getItem('SID');
    let db;
    let customersData = [];

    // Prüfen, ob ein API-Key vorhanden ist, sonst zur Login-Seite umleiten
    if (!currentSID) {
        window.location.href = 'login.html';
        return;
    }

    initDB();

    // Einstellungen laden und ComboBox für Priorität initialisieren
    loadSettings();

    // Produktbereiche laden und ComboBox initialisieren
    loadProduktbereiche();

    function initDB() {
        let request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                let store = db.createObjectStore(storeName, { keyPath: ["SID", "IDNR"] });
                store.createIndex("SID", "SID", { unique: false });
            }
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            loadDataFromDB();
        };

        request.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
        };
    }

    function loadDataFromDB() {
        try {
            let transaction = db.transaction(storeName, "readonly");
            let store = transaction.objectStore(storeName);
            let index = store.index("SID");
            let request = index.getAll(currentSID);

            request.onsuccess = function() {
                if (request.result.length === 0) {
                    fetchDataFromAPI();
                } else {
                    customersData = request.result;
                    populateCustomerComboBox(request.result);
                    populateInitialIDNRComboBox(request.result);
                }
            };

            request.onerror = function(event) {
                console.error("Error fetching data from IndexedDB:", event.target.errorCode);
            };
        } catch (error) {
            console.error("Failed to create a transaction on IndexedDB:", error);
        }
    }

    function fetchDataFromAPI() {
        $.ajax({
            url: API_ENDPOINT_IDNR,
            method: 'GET',
            headers: { 'SID': currentSID },
            success: function(response) {
                const data = JSON.parse(response).map(item => sanitizeData(item));
                customersData = data;
                saveDataToDB(data);
                populateCustomerComboBox(data);
                populateInitialIDNRComboBox(data); // Populate IDNR based on the first customer
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    alert("Sitzung abgelaufen. Bitte erneut einloggen.");
                    window.location.href = 'login.html';
                } else {
                    console.error('AJAX Error:', textStatus, errorThrown);
                }
            }
        });
    }

    function saveDataToDB(data) {
        try {
            let transaction = db.transaction(storeName, "readwrite");
            let store = transaction.objectStore(storeName);
            data.forEach(function(item) {
                store.put({ ...item, SID: currentSID });
            });

            transaction.oncomplete = function() {
                loadDataFromDB(); // Load data from IndexedDB after saving
            };

            transaction.onerror = function(event) {
                console.error("Error saving data to IndexedDB:", event.target.errorCode);
            };
        } catch (error) {
            console.error("Failed to open a readwrite transaction on IndexedDB:", error);
        }
    }

    function loadSettings() {
        $.ajax({
            url: API_ENDPOINT_SETTINGS,
            method: 'GET',
            success: function(response) {
                console.log("Einstellungen.txt Inhalt:", response); // Debug-Ausgabe des reinen Inhalts
                try {
                    const settings = JSON.parse(response);
                    console.log("Einstellungen geladen:", settings); // Debug-Ausgabe des geparsten Inhalts
                    initializePriorityComboBox(settings.Prioritaet);
                } catch (e) {
                    console.error('Fehler beim Parsen der Einstellungen:', e);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Fehler beim Abrufen der Einstellungen:', textStatus, errorThrown);
            }
        });
    }

    function initializePriorityComboBox(priorities) {
        if (!priorities) {
            console.error("Prioritaet Daten fehlen in den Einstellungen.");
            return;
        }

        $("#Prioritaet").kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: priorities,
            index: 0, // Erste Option vorauswählen
            suggest: true,
            filter: "contains"
        }).closest(".k-widget").css("max-width", "200px");
    }

    function sanitizeData(item) {
        for (let key in item) {
            if (item[key] === null) {
                item[key] = '';
            }
        }
        return item;
    }

    function populateCustomerComboBox(data) {
        const uniqueCustomers = [...new Set(data.map(item => item.Kunde))];
        $("#Kunde").kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: uniqueCustomers.map(customer => ({
                text: customer,
                value: customer
            })),
            filter: "contains",
            suggest: true,
            index: 0,
            change: onCustomerChange,
            clearButton: false // Disable clear button
        }).data("kendoComboBox");
    }

    function populateInitialIDNRComboBox(data) {
        const initialCustomer = $("#Kunde").data("kendoComboBox").value();
        const initialData = data.filter(item => item.Kunde === initialCustomer);
        populateIDNRComboBox(initialData);
    }

    function onCustomerChange() {
        const selectedCustomer = $("#Kunde").data("kendoComboBox").value();
        const filteredData = customersData.filter(item => selectedCustomer ? item.Kunde === selectedCustomer : true);
        populateIDNRComboBox(filteredData);
    }

    function populateIDNRComboBox(data) {
        let idnrComboBox = $("#IDNR").data("kendoComboBox");
        if (!idnrComboBox) {
            $("#IDNR").kendoComboBox({
                dataTextField: "text",
                dataValueField: "IDNR",
                dataSource: data.map(item => ({
                    text: `${item.IDNR} - ${item.Modell} - ${item.Standort1}`,
                    IDNR: item.IDNR
                })),
                filter: "contains",
                suggest: true,
                index: 0,
                optionLabel: "Keine Identnummer"
            });
        } else {
            idnrComboBox.setDataSource(new kendo.data.DataSource({
                data: data.map(item => ({
                    text: `${item.IDNR} - ${item.Modell} - ${item.Standort1}`,
                    IDNR: item.IDNR
                }))
            }));
        }

        // IDNR aus URL auswählen, falls vorhanden
        const urlParams = new URLSearchParams(window.location.search);
        const idnrFromUrl = urlParams.get('IDNR');
        if (idnrFromUrl) {
            $("#IDNR").data("kendoComboBox").value(idnrFromUrl);
        }
    }

    // QR-Code-Scanner initialisieren
    $('#startScanner').click(function() {
        $('#qr-reader').show();
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,    // Optional, frame per seconds for qr code scanning
                qrbox: 250  // Optional, if you want bounded box UI
            },
            qrCodeMessage => {
                $('#qr-reader').hide();
                html5QrCode.stop().then((ignore) => {
                    // QR Code gelesen
                    $("#IDNR").data("kendoComboBox").value(qrCodeMessage);
                }).catch((err) => {
                    console.error('Fehler beim Stoppen des Scanners:', err);
                });
            },
            errorMessage => {
                console.warn(`QR Code Scan Error: ${errorMessage}`);
            })
            .catch(err => {
                console.error('Fehler beim Starten des Scanners:', err);
            });
    });

    // Produktbereiche laden
    function loadProduktbereiche() {
        $.ajax({
            url: API_ENDPOINT_PRODUKTBEREICHE,
            method: 'GET',
            headers: { 'SID': currentSID },
            success: function(response) {
                const data = JSON.parse(response);
                if (data && Array.isArray(data)) {
                    const produktbereiche = data.map(item => item.Produktbereich);
                    initializeProduktbereicheComboBox(produktbereiche);
                } else {
                    console.error('Ungültiges Datenformat für Produktbereiche:', data);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Fehler beim Abrufen der Produktbereiche:', textStatus, errorThrown);
            }
        });
    }

    function initializeProduktbereicheComboBox(data) {
        $("#Produktbereich").kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: data.map(item => ({
                text: item,
                value: item
            })),
            filter: "contains",
            suggest: true,
            index: 0
        });
    }

    // Cancel button functionality
    $('#cancelButton').click(function() {
        window.location.href = 'Menue.html';
    });
});
