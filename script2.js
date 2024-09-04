$(document).ready(function() {
    $('#ticketForm').submit(function(event) {
        event.preventDefault();

        const apiKey = localStorage.getItem('SID');
        if (!apiKey) {
            // Redirect to the login.html page if the API key is not found
            window.location.href = 'login.html';
            return;
        }

        // Initialize FormData object
        const formData = new FormData();
        formData.append('device', $('#device').val());
        formData.append('serialNumber', $('#serial').val());
        formData.append('contact', $('#contact').val());
        formData.append('phone', $('#phone').val());
        formData.append('email', $('#email').val());
        formData.append('description', $('#description').val());

        // Process file upload if a file is selected
        const fileField = $('#file')[0];
        if (fileField.files.length > 0) {
            const file = fileField.files[0];
            const reader = new FileReader();
            reader.onloadend = function() {
                // Append file data as Base64 to the FormData
                formData.append('fileData', reader.result);
                sendApiRequest(apiKey, formData);
            };
            reader.readAsDataURL(file);
        } else {
            sendApiRequest(apiKey, formData);
        }
    });
});

function sendApiRequest(apiKey, formData) {
    const apiEndpoint = 'YOUR_API_ENDPOINT_HERE';
    $.ajax({
        url: apiEndpoint,
        type: 'POST',
        headers: {
            'SID': apiKey
        },
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            console.log('Success:', response);
        },
        error: function(xhr, status, error) {
            console.error('Error from server:', xhr.responseText);
        }
    });
}
