$(document).ready(function () {
    const dbName = "Auftraege";
    const storeName = "auftraege";
    let db;
    kendo.culture("de-DE");

    initDB();

    function initDB() {
        let request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "AUFTNR" });
            }
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            loadData();
        };

        request.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
        };
    }

    function loadData() {
        let transaction = db.transaction(storeName, "readonly");
        let store = transaction.objectStore(storeName);
        let request = store.getAll();

        request.onsuccess = function() {
            if (request.result.length === 0) {
                fetchAndSaveData();
            } else {
                initializeGrid(request.result);
            }
        };
    }

    function fetchAndSaveData() {
        const API_ENDPOINT = BASE_URL + 'requesterPortale&ARGUMENTS=-Agetposerviceauftrag';
        const apiKey = localStorage.getItem('SID');

        if (!apiKey) {
            window.location.href = 'login.html';
            return;
        }

        $.ajax({
            url: API_ENDPOINT,
            method: 'GET',
            headers: { 'SID': apiKey },
            success: function(response) {
                const data = JSON.parse(response);
                saveData(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown);
            }
        });
    }

    function saveData(data) {
        let transaction = db.transaction(storeName, "readwrite");
        let store = transaction.objectStore(storeName);

        data.forEach(function(item) {
            store.put(item);
        });

        transaction.oncomplete = function() {
            initializeGrid(data);
        };
    }

    function initializeGrid(data) {
        $("#grid").kendoGrid({
            dataSource: {
                data: data,
                pageSize: 10
            },
            height: 550,
            scrollable: true,
            sortable: true,
            filterable: {
                messages: {
                    info: "Zeigen Sie Einträge mit Wert, der:",
                    isTrue: "wahr ist",
                    isFalse: "falsch ist",
                    filter: "Filtern",
                    clear: "Löschen",
                    and: "Und",
                    or: "Oder",
                    selectValue: "Wählen Sie einen Wert"
                },
                operators: {
                    string: {
                        eq: "Ist gleich",
                        neq: "Ist nicht gleich",
                        startswith: "Beginnt mit",
                        contains: "Enthält",
                        doesnotcontain: "Enthält nicht",
                        endswith: "Endet mit"
                    },
                    number: {
                        eq: "Gleich",
                        neq: "Nicht gleich",
                        gte: "Größer als oder gleich",
                        gt: "Größer als",
                        lte: "Kleiner als oder gleich",
                        lt: "Kleiner als"
                    },
                    date: {
                        eq: "Gleich",
                        neq: "Nicht gleich",
                        gte: "Nach oder gleich",
                        gt: "Nach",
                        lte: "Vor oder gleich",
                        lt: "Vor"
                    },
                    enums: {
                        eq: "Ist gleich",
                        neq: "Ist nicht gleich"
                    }
                }
            },
            pageable: {
                messages: {
                    display: "{0} - {1} von {2} Einträgen",
                    empty: "Keine Einträge verfügbar",
                    page: "Seite",
                    of: "von {0}",
                    itemsPerPage: "Einträge pro Seite",
                    first: "Erste Seite",
                    previous: "Vorherige Seite",
                    next: "Nächste Seite",
                    last: "Letzte Seite",
                    refresh: "Aktualisieren",
                    morePages: "Weitere Seiten"
                },
                input: true,
                numeric: false
            },
            detailTemplate: kendo.template($("#template").html()),
            detailInit: detailInit,
            columns: [
                { field: "AUFTNR", title: "Auftragsnummer", width: "120px" },
                { field: "Status", title: "Status", filterable: { multi: true, search: true }, width: "120px"},
                { field: "Modelltyp Name", title: "Modelltyp", width: "150px" },
                { field: "Klartext_char", title: "Beschreibung", width: "200px" },
                { field: "Techniker", title: "Techniker", width: "120px" },
                { field: "EingangDatum", title: "Eingangsdatum", format: "{0:dd.MM.yy}" },
                { field: "EingangZeit", title: "Eingangszeit" },
                { field: "TerminDatum", title: "Termin Datum", format: "{0:dd.MM.yy}" },
                { field: "TerminZeit", title: "Termin Zeit" },
                { field: "Event", title: "Event" }
            ]
        });

        // Search functionality
        $('#searchBox').on('input', function() {
            var grid = $('#grid').data('kendoGrid');
            var value = $(this).val();
            grid.dataSource.filter({
                logic: 'or',
                filters: [
                    { field: "Modelltyp Name", operator: "contains", value: value },
                    { field: "Klartext_char", operator: "contains", value: value },
                    { field: "Techniker", operator: "contains", value: value },
                    { field: "Status", operator: "contains", value: value }
                ]
            });
        });

        // Status filtering functionality
        $('#statusFilter').on('input', function() {
            var grid = $('#grid').data('kendoGrid');
            var value = $(this).val();
            grid.dataSource.filter({
                field: "Status",
                operator: "contains",
                value: value
            });
        });
    }

    function detailInit(e) {
        var detailRow = e.detailRow;

        detailRow.find(".tabstrip").kendoTabStrip({
            animation: {
                open: { effects: "fadeIn" }
            }
        });
    }
});
