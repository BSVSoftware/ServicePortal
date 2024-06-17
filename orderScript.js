$(document).ready(function () {
    kendo.culture("de-DE");
    const dbName = "OrderDatabase";
    const storeName = "orderStore";
    const currentSID = localStorage.getItem('SID');
    let db;
    let retryCount = 0;

    if (!currentSID) {
        window.location.href = 'login.html';
        return;
    }

    initDB();

    function initDB() {
        let request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                let store = db.createObjectStore(storeName, { keyPath: ["SID", "AuftragNr", "PositionNr"] });
                store.createIndex("SID", "SID", { unique: false });
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
        try {
            let transaction = db.transaction(storeName, "readonly");
            let store = transaction.objectStore(storeName);
            let index = store.index("SID");
            let request = index.getAll(currentSID);

            request.onsuccess = function() {
                if (request.result.length === 0) {
                    fetchData();
                }
                initializeGrid(request.result);
            };

            request.onerror = function(event) {
                console.error("Error fetching data from IndexedDB:", event.target.errorCode);
            };
        } catch (error) {
            console.error("Failed to create a transaction on IndexedDB:", error);
        }
    }

    function fetchData() {
        const API_ENDPOINT = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=requesterPortale&ARGUMENTS=-Agetpoorders';

        showOverlay();

        $.ajax({
            url: API_ENDPOINT,
            method: 'GET',
            headers: { 'SID': currentSID },
            success: function(response) {
                const data = JSON.parse(response).map(item => sanitizeData(item));
                if (data.length === 0) {
                    console.warn('No data returned from API');
                } else {
                    saveData(data);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown);
                if (jqXHR.status === 401) {
                    alert('Sitzung abgelaufen. Bitte erneut einloggen.');
                    window.location.href = 'login.html';
                }
                hideOverlay();
            },
            complete: function() {
                hideOverlay();
            }
        });
    }

    function saveData(data) {
        try {
            let transaction = db.transaction(storeName, "readwrite");
            let store = transaction.objectStore(storeName);
            data.forEach(function(item) {
                store.put({ ...item, SID: currentSID });
            });

            transaction.oncomplete = function() {
                loadData(); // Load data from IndexedDB after saving
            };

            transaction.onerror = function(event) {
                console.error("Error saving data to IndexedDB:", event.target.errorCode);
                hideOverlay();
            };
        } catch (error) {
            console.error("Failed to open a readwrite transaction on IndexedDB:", error);
            hideOverlay();
        }
    }

    function sanitizeData(item) {
        for (let key in item) {
            if (item[key] === null) {
                item[key] = '';
            }
        }
        return item;
    }

    function initializeGrid(data) {
        if ($("#orderGrid").data("kendoGrid")) {
            $("#orderGrid").data("kendoGrid").setDataSource(new kendo.data.DataSource({
                data: data,
                pageSize: 10,
                schema: {
                    model: {
                        fields: {
                            AuftragNr: { type: "string" },
                            PositionNr: { type: "string" },
                            Datum: { type: "string" },
                            Idnr: { type: "string" },
                            Modell: { type: "string" },
                            Standort1: { type: "string" },
                            Standort2: { type: "string" },
                            ArtikelNr: { type: "string" },
                            Artikel: { type: "string" },
                            Liefermenge: { type: "number" },
                            PaketNr: { type: "string" },
                            Kunde: { type: "string" }
                        }
                    }
                },
                sort: {
                    field: "AuftragNr",
                    dir: "desc"
                }
            }));
        } else {
            $("#orderGrid").kendoGrid({
                dataSource: {
                    data: data,
                    pageSize: 10,
                    schema: {
                        model: {
                            fields: {
                                AuftragNr: { type: "string" },
                                PositionNr: { type: "string" },
                                Datum: { type: "string" },
                                Idnr: { type: "string" },
                                Modell: { type: "string" },
                                Standort1: { type: "string" },
                                Standort2: { type: "string" },
                                ArtikelNr: { type: "string" },
                                Artikel: { type: "string" },
                                Liefermenge: { type: "number" },
                                PaketNr: { type: "string" },
                                Kunde: { type: "string" }
                            }
                        }
                    },
                    sort: {
                        field: "AuftragNr",
                        dir: "desc"
                    }
                },
                height: 550,
                scrollable: true,
                sortable: true,
                resizable: true,
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
                    refresh: true,
                    pageSizes: true,
                    buttonCount: 5,
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
                detailInit: function(e) {
                    e.detailRow.find(".details-container").show();
                },
                columns: [
                    { field: "AuftragNr", title: "Auftrag Nr.", width: "80px" },
                    { field: "PositionNr", title: "Pos.", width: "40px" },
                    { field: "Datum", title: "Datum", format: "{0:dd.MM.yyyy}", width: "80px" },
                    { field: "Idnr", title: "ID-Nr.", width: "80px" },
                    { field: "Modell", title: "Modell", width: "150px" },
                    { field: "Standort1", title: "Standort 1", width: "120px" },
                    { field: "Standort2", title: "Standort 2", width: "120px" },
                    { field: "ArtikelNr", title: "Artikel Nr.", width: "100px" },
                    { field: "Artikel", title: "Artikel", width: "150px" },
                    { field: "Liefermenge", title: "Liefermenge", width: "100px" },
                    { field: "PaketNr", title: "Paket Nr.", width: "100px", template: function(dataItem) {
                            return dataItem.PaketNr ? `<a href="https://www.dhl.de/de/privatkunden/dhl-sendungsverfolgung.html?piececode=${dataItem.PaketNr}" target="_blank" style="color: blue; text-decoration: underline;">${dataItem.PaketNr}</a>` : '';
                        }},
                    { field: "Kunde", title: "Kunde", width: "120px" }
                ]
            });
        }
    }

    // Setup event handler for search box
    $('#searchBox').on('input', function() {
        var grid = $("#orderGrid").data("kendoGrid");
        var value = $(this).val();
        grid.dataSource.filter({
            logic: "or",
            filters: [
                { field: "AuftragNr", operator: "contains", value: value },
                { field: "Kunde", operator: "contains", value: value },
                { field: "Idnr", operator: "contains", value: value },
                { field: "Modell", operator: "contains", value: value },
                { field: "Standort1", operator: "contains", value: value },
                { field: "Standort2", operator: "contains", value: value },
                { field: "ArtikelNr", operator: "contains", value: value },
                { field: "Artikel", operator: "contains", value: value },
                { field: "PaketNr", operator: "contains", value: value }
            ]
        });
    });

    // Setup event handler for refresh button
    $('#refreshButton').click(function() {
        fetchData();
        setTimeout(function() {
            closeAllDetailRows();
            loadData();  // Use loadData to re-initialize the grid with data from IndexedDB
        }, 1000);
    });

    function closeAllDetailRows() {
        var grid = $("#orderGrid").data("kendoGrid");
        grid.tbody.find("tr.k-master-row").each(function () {
            grid.collapseRow($(this));
        });
    }

    function showOverlay() {
        $("#overlay").show();
    }

    function hideOverlay() {
        $("#overlay").hide();
    }
});
