import { Colors, Display } from "./types";

const DEBOUNCE_DELAY = 100;
const STORAGE_PREFIX = "audit_";

let observer: MutationObserver | null = null;
let display: Display;

// Event listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "REFRESH") initialize();
});

const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    .audit-button {
      margin-left: 8px;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
    }
    .audit-button.u-hover:hover {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
};

// Event listener for audit button clicks
document.addEventListener("click", async (e) => {
  const button = e.target as HTMLButtonElement;
  if (!button.classList.contains("audit-button")) return;

  button.textContent = "...";
  button.disabled = true;
  const id = button.dataset.userId;

  try {
    const response = await chrome.runtime.sendMessage({ action: "AUDIT", id });
    await chrome.storage.local.set({ [`${STORAGE_PREFIX}${id}`]: response.score });
    
    document.querySelectorAll<HTMLButtonElement>(`.audit-button[data-user-id="${id}"]`)
      .forEach((btn) => {
        btn.dataset.score = response.score.toString();
        updateButton(btn);
      });
  } catch (error) {
    button.textContent = "!";
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

function getColor(score: number, colors: Colors): string {
  const pos = Math.max(0, Math.min(1, score / 100));
  const segmentIndex = Math.min(Math.floor(pos * 3), 2);
  const segments = [
    { start: 0, end: 33 },
    { start: 33, end: 66 },
    { start: 66, end: 100 },
  ];
  
  const { start, end } = segments[segmentIndex];
  const t = (pos - start/100) / ((end - start)/100);

  const [r1, g1, b1] = colors[start as keyof Colors];
  const [r2, g2, b2] = colors[end as keyof Colors];

  return `#${[
    Math.round(r1 + t * (r2 - r1)),
    Math.round(g1 + t * (g2 - g1)),
    Math.round(b1 + t * (b2 - b1))
  ].map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

async function updateButton(button: HTMLButtonElement) {
  const id = button.dataset.userId;
  if (!id) return;

    try {
      const storageKey = `${STORAGE_PREFIX}${id}`;
      const { [storageKey]: score } = await chrome.storage.local.get(storageKey);
      
      if (typeof score === "number" && score >= 0) {
        button.textContent = display?.showScore ? `(${score}) ↻` : `↻`;
        const link = button.previousElementSibling as HTMLElement;
        link.style.color = getColor(score, display.colors);
        return;
      }
      
      button.textContent = "?";
      return;
    } catch (error) {
      button.textContent = "!";
      console.error(error);
    }
}

// Create and attach a button to a user element
function createAuditButton(user: HTMLElement, id: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "audit-button u-hover";
  button.dataset.userId = id;

  // Insert button after user element
  user.parentNode!.insertBefore(button, user.nextSibling);
  return button;
}

// Process all user links and add audit buttons
async function addAuditButtons() {
  // Get all user links that are apart of a beatmapset panel
  document.querySelectorAll<HTMLElement>("a.js-usercard.beatmapset-panel__mapper-link").forEach(async (user) => {
    const id = user.dataset.userId;
    if (!id) return;

    const existingButton = user.nextElementSibling;
    if (existingButton?.classList?.contains("audit-button")) {
      const button = existingButton as HTMLButtonElement;
      // Skip updating if the button is in a loading state
      if (button.disabled) return;
      await updateButton(button);
      return;
    }

    // Create new button
    const button = createAuditButton(user, id);
    await updateButton(button);
  });
}

// Initialize the extension
async function initialize() {
  const { valid } = await chrome.runtime.sendMessage({ action: "VALIDATE_OAUTH" });
  if (!valid) return;
  
  injectStyles();

  // Clean up existing observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Get display settings
  const result = await chrome.storage.local.get("auditDisplay");
  display = result.auditDisplay as Display;

  await addAuditButtons();

  // Set up debounced DOM observer
  const debouncedAddAuditButtons = debounce(addAuditButtons, DEBOUNCE_DELAY);
  observer = new MutationObserver(debouncedAddAuditButtons);
  observer.observe(document.body, { childList: true, subtree: true });
}

function debounce(fn: Function, delay: number) {
  let timeoutId: number;
  return function () {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(), delay);
  };
}

// Start the extension
initialize();
