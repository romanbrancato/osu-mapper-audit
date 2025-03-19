type MapperStatus = 'good' | 'ok' | 'bad';
const STATUS_CONFIG = {
  good: { color: '#66CC66' },
  ok: { color: '#FFD700' },
  bad: { color: '#FF4444' }
};

// Debounce function
function debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
  let timeoutId: number;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

document.addEventListener('click', async (event) => {
  const button = (event.target as Element)?.closest<HTMLButtonElement>('.audit-button');
  if (!button) return;
  const row = button.closest('.beatmapset-panel__info-row--mapper');
  const userLink = row?.querySelector<HTMLAnchorElement>('a.js-usercard[data-user-id]');
  const userId = userLink?.dataset.userId;
  if (!userId) return;
  
  button.textContent = '...';
  button.disabled = true;

  const response = await chrome.runtime.sendMessage({
    action: 'auditMapper',
    userId: userId
  });
  
  if (response.error) {
    console.log("Error:", response.error);
    button.textContent = '!';
    return;
  }
  
  // Update localStorage
  localStorage.setItem(`mapper_${userId}`, response.status);
  
  // Update all instances
  document.querySelectorAll(`a.js-usercard[data-user-id="${userId}"]`)
    .forEach(link => {
      (link as HTMLElement).style.color = STATUS_CONFIG[response.status as MapperStatus].color;
    });
  button.textContent = '?';
  button.disabled = false;
});

function addAuditButtons() {
  document.querySelectorAll('.beatmapset-panel__info-row--mapper').forEach(row => {
    if (row.querySelector('.audit-button')) return;
    
    const button = document.createElement('button');
    button.className = 'audit-button beatmapset-panel__mapper-link u-hover';
    button.textContent = '?';
    Object.assign(button.style, {
      marginLeft: '8px',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: '0'
    });
    
    const userId = row.querySelector('a.js-usercard[data-user-id]')?.getAttribute('data-user-id');
    if (userId) {
      const status = localStorage.getItem(`mapper_${userId}`);
      if (status && ['good', 'ok', 'bad'].includes(status)) {
        const color = STATUS_CONFIG[status as MapperStatus].color;
        document.querySelectorAll(`a.js-usercard[data-user-id="${userId}"]`)
          .forEach(link => (link as HTMLElement).style.color = color);
      }
    }
    
    row.appendChild(button);
  });
}

function initialize() {
  // Load stored statuses
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('mapper_')) {
      const userId = key.substring(7);
      const status = localStorage.getItem(key);
      if (status && ['good', 'ok', 'bad'].includes(status)) {
        document.querySelectorAll(`a.js-usercard[data-user-id="${userId}"]`)
          .forEach(link => {
            (link as HTMLElement).style.color = STATUS_CONFIG[status as MapperStatus].color;
          });
      }
    }
  });
  
  addAuditButtons();
}

// Initial setup
initialize();

// Debounced Mutation Observer
const debouncedAddAuditButtons = debounce(addAuditButtons, 100);
new MutationObserver(debouncedAddAuditButtons).observe(document.body, {
  childList: true,
  subtree: true
});