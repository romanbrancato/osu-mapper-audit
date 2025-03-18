function addAuditButton() {
    const mapperRow = document.querySelector('.beatmapset-panelinfo-row--mapper');
    if (!mapperRow) return;
  
    const userLink = mapperRow.querySelector<HTMLAnchorElement>('a.js-usercard');
    const userId = userLink?.pathname.split('/').pop();
    if (!userId) return;
  
    const button = document.createElement('button');
    button.textContent = 'Audit';
    button.classList.add('osu-extension-button');
    
    button.addEventListener('click', async () => {
      button.textContent = '...';
      const response = await chrome.runtime.sendMessage({
        action: 'auditMapper',
        userId: userId
      });
      
      if (response.error) {
        button.textContent = 'Error';
      } else {
        button.textContent = `${response.count} maps`;
      }
    });
  
    mapperRow.appendChild(button);
  }
// Run when page loads
addAuditButton();
// Also run when navigating in SPA
new MutationObserver(addAuditButton).observe(document.body, {
  childList: true,
  subtree: true,
});
