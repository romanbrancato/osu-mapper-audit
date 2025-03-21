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
    
    oauthForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const clientId = clientIdInput.value;
        const clientSecret = clientSecretInput.value;

        const oAuthData = {
            clientId,
            clientSecret
        };
        
        // Save to chrome.storage.local
        chrome.storage.local.set({ osuMapperAuditOAuth: oAuthData }, () => {
            alert('OAuth credentials saved successfully!');
            // window.close();
        });
    });
});