import { Colors, defaultColors } from "./types";

const DEBOUNCE_DELAY = 100;
const STORAGE_PREFIX = "audit_";

let observer: MutationObserver | null = null;

async function main() {
  const { valid } = await chrome.runtime.sendMessage({ action: "checkAuth" });
  if (!valid) return chrome.runtime.sendMessage({ action: "missingOAuth" });

  function getColor(score: number, colors: Colors): string {
    const pos = Math.max(0, Math.min(1, score / 100));

    let startKey: 0 | 33 | 66 | 100;
    let endKey: 0 | 33 | 66 | 100;

    if (pos <= 0.33) {
      startKey = 0;
      endKey = 33;
    } else if (pos <= 0.66) {
      startKey = 33;
      endKey = 66;
    } else {
      startKey = 66;
      endKey = 100;
    }

    const start = colors[startKey];
    const end = colors[endKey];

    const startPos = startKey / 100;
    const endPos = endKey / 100;
    const t = (pos - startPos) / (endPos - startPos);

    const r = Math.round(start[0] + t * (end[0] - start[0]));
    const g = Math.round(start[1] + t * (end[1] - start[1]));
    const b = Math.round(start[2] + t * (end[2] - start[2]));

    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }

  function addAuditButtons() {
    document
      .querySelectorAll<HTMLElement>(
        "a.js-usercard:not([data-has-audit-button])"
      )
      .forEach(async (user) => {
        const id = user.dataset.userId;
        if (!id) return;

        const button = document.createElement("button");
        button.className = "audit-button beatmapset-panel__mapper-link u-hover";
        button.textContent = "?";
        button.dataset.userId = id;
        Object.assign(button.style, {
          marginLeft: "8px",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: "0",
        });

        button.addEventListener(
          "mouseenter",
          () => (button.style.textDecoration = "underline")
        );
        button.addEventListener(
          "mouseleave",
          () => (button.style.textDecoration = "none")
        );

        button.addEventListener("click", async () => {
          button.textContent = "...";
          button.disabled = true;

          try {
            const response = await chrome.runtime.sendMessage({
              action: "audit",
              id,
            });

            console.log(JSON.stringify(response, null, 2));

            const { auditDisplay } = await chrome.storage.local.get(
              "auditDisplay"
            );
            const colors = auditDisplay?.colors || defaultColors;

            const color = getColor(response.score, colors);

            // Update all user links with new color
            document
              .querySelectorAll(`a.js-usercard[data-user-id="${id}"]`)
              .forEach((link) => {
                (link as HTMLElement).style.color = color;
              });

            // Update all audit buttons with new score
            document
              .querySelectorAll<HTMLButtonElement>(
                `.audit-button[data-user-id="${id}"]`
              )
              .forEach((btn) => {
                btn.textContent = auditDisplay?.showScore
                  ? `(${response.score}) ↻`
                  : `↻`;
              });

            await chrome.storage.local.set({
              [`${STORAGE_PREFIX}${id}`]: response.score,
            });
          } catch (error) {
            button.textContent = "!";
            console.error(error);
          } finally {
            button.disabled = false;
          }
        });

        // Check if score already exists for user
        const storageKey = `${STORAGE_PREFIX}${id}`;
        const result = await chrome.storage.local.get([
          storageKey,
          "auditDisplay",
        ]);

        const score = result[storageKey];
        const auditDisplay = result.auditDisplay;
        const colors = auditDisplay?.colors || defaultColors;

        if (score >= 0) {
          const color = getColor(score, colors);
          button.textContent =
            auditDisplay?.showScore === true ? `(${score}) ↻` : `↻`;

          user.style.color = color;
        }

        user.parentNode!.insertBefore(button, user.nextSibling);
        user.dataset.hasAuditButton = "true";
      });
  }

  function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
  ): T {
    let timeoutId: number;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    }) as T;
  }

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  addAuditButtons();

  observer = new MutationObserver(debounce(addAuditButtons, DEBOUNCE_DELAY));
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

main();

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "reinitialize") {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    main();
  }
});
