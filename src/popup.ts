document.addEventListener('DOMContentLoaded', () => {
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const clientSecretInput = document.getElementById('clientSecret') as HTMLInputElement;
    const saveButton = document.getElementById('saveCredentials');

    // Load saved credentials from localStorage
    const savedOAuthData = localStorage.getItem('osuMapperAuditOAuth');
    
    if (savedOAuthData) {
        const parsedData = JSON.parse(savedOAuthData);
        if (parsedData.clientId) clientIdInput.value = parsedData.clientId;
        if (parsedData.clientSecret) clientSecretInput.value = parsedData.clientSecret;
    }

    saveButton?.addEventListener('click', (e) => {
        e.preventDefault();
        
        const clientId = clientIdInput.value;
        const clientSecret = clientSecretInput.value;

        const oAuthData = {
            clientId,
            clientSecret
        };

        localStorage.setItem('osuMapperAuditOAuth', JSON.stringify(oAuthData));
        
        window.close();
    });
});