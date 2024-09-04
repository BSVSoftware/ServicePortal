$(document).ready(function () {
    const BASE_URL = 'https://otc.bsv.net/api/mgwebrequester.dll?appname=FlowRequester&PRGNAME=';
    const API_ENDPOINT = BASE_URL + 'requesterPortale&ARGUMENTS=-Agetpoidnr';
    const apiKey = localStorage.getItem('SID');

    if (!apiKey) {
        window.location.href = 'login.html';
        return;
    }

    $.ajax({
        url: API_ENDPOINT,
        method: 'GET',
        headers: {
            'SID': apiKey
        },
        success: function (response) {
            let data = response;
            if (typeof response === 'string') {
                try {
                    data = JSON.parse(response);
                } catch (error) {
                    console.error('Error parsing JSON data:', error);
                    return;
                }
            }

            const select = $('#IDNR');
            data.forEach(item => {
                select.append($('<option>', {
                    value: item.IDNR,
                    text: item.IDNR
                }));
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('AJAX Error:', textStatus, errorThrown);
        }
    });
});
