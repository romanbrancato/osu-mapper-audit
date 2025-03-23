import { Colors, Display } from "./types";

const DEBOUNCE_DELAY = 100;
const STORAGE_PREFIX = "audit_";

let observer: MutationObserver | null = null;
let display: Display;

// Event listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "REFRESH") initialize();
});

function getColor(score: number, colors: Colors): string {
  const pos = Math.max(0, Math.min(1, score / 100));

  const segments = [
    { threshold: 0.33, start: 0, end: 33 },
    { threshold: 0.66, start: 33, end: 66 },
    { threshold: 1, start: 66, end: 100 },
  ];

  const segment = segments.find((s) => pos <= s.threshold) || segments[segments.length - 1];
  const { start: startKey, end: endKey } = segment;

  const start = colors[startKey as 0 | 33 | 66 | 100];
  const end = colors[endKey as 0 | 33 | 66 | 100];

  const startPos = startKey / 100;
  const endPos = endKey / 100;
  const t = (pos - startPos) / (endPos - startPos);

  const r = Math.round(start[0] + t * (end[0] - start[0]));
  const g = Math.round(start[1] + t * (end[1] - start[1]));
  const b = Math.round(start[2] + t * (end[2] - start[2]));

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

async function updateButton(button: HTMLButtonElement) {
  const id = button.dataset.userId;
  if (!id) return;

  try {
    const storageKey = `${STORAGE_PREFIX}${id}`;
    const colors = display.colors;

    // Get score from dataset or storage
    const score = button.dataset.score
      ? parseInt(button.dataset.score)
      : (await chrome.storage.local.get(storageKey))[storageKey];

    if (score >= 0) {
      const color = getColor(score, colors);
      button.textContent = display?.showScore ? `(${score}) ↻` : `↻`;

      // Update color of user link
      const link = button.previousElementSibling as HTMLElement;
      link.style.color = color;
    } else {
      button.textContent = "?";
    }
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

  Object.assign(button.style, {
    marginLeft: "8px",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: "0",
  });

  button.addEventListener("click", async () => {
    button.textContent = "...";
    button.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({ action: "AUDIT", id });
      console.log(JSON.stringify(response, null, 2));

      await chrome.storage.local.set({ [`${STORAGE_PREFIX}${id}`]: response.score });

      document.querySelectorAll<HTMLButtonElement>(`.audit-button[data-user-id="${id}"]`).forEach((button) => {
        button.dataset.score = response.score.toString();
        updateButton(button);
      });
    } catch (error) {
      button.textContent = "!";
      console.error(error);
    } finally {
      button.disabled = false;
    }
  });

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
