document.addEventListener('DOMContentLoaded', () => {
    const oauthForm = document.getElementById('oauthForm') as HTMLFormElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const clientSecretInput = document.getElementById('clientSecret') as HTMLInputElement;

    // Load saved credentials from chrome.storage.local
    chrome.storage.local.get(['osuMapperAuditOAuth'], (result) => {
        const savedOAuthData = result.osuMapperAuditOAuth;

        if (savedOAuthData) {
            if (savedOAuthData.clientId) clientIdInput.value = savedOAuthData.clientId;
            if (savedOAuthData.clientSecret) clientSecretInput.value = savedOAuthData.clientSecret;
        }
    });

    oauthForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent form submission reload

        const oAuthData = {
            clientId: this.clientId.value,
            clientSecret: this.clientSecret.value
        };

        chrome.storage.local.set({ osuMapperAuditOAuth: oAuthData }, () => {
            const checkmark = document.getElementById('save-confirmation');
            if(!checkmark) return;
            checkmark.style.display = 'inline';

            setTimeout(() => {
                checkmark.style.display = 'none';
            }, 3000);
        });
    });
});