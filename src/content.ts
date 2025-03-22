const DEBOUNCE_DELAY = 100;
const STORAGE_PREFIX = "mapper_";
const COLOR_STOPS = [
  [0.0, 0, 0, 0], // Black
  [0.33, 255, 0, 0], // Red
  [0.66, 255, 255, 0], // Yellow
  [1.0, 0, 255, 0], // Green
] as const;

(async function main() {
  const response = await chrome.runtime.sendMessage({ action: "checkAuth" });
    if (!response.valid) {
      chrome.runtime.sendMessage({ action: "missingOAuth" });
      return;
    }

  function updateUserColor(id: string, color: string) {
    document
      .querySelectorAll(`a.js-usercard[data-user-id="${id}"]`)
      .forEach((link) => {
        (link as HTMLElement).style.color = color;
      });
  }

  function createAuditButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "audit-button beatmapset-panel__mapper-link u-hover";
    button.textContent = "?";
    Object.assign(button.style, {
      marginLeft: "8px",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: "0",
    });
    return button;
  }

  function addAuditButtons() {
    document
      .querySelectorAll<HTMLElement>(
        ".beatmapset-panel__info-row--mapper:not([data-audit-processed])"
      )
      .forEach((row) => {
        const userLink = row.querySelector<HTMLAnchorElement>(
          "a.js-usercard[data-user-id]"
        );
        const id = userLink?.dataset.userId;
        if (!id) return;

        const button = createAuditButton();
        
        const hoverHandler = (state: string) => () =>
          (button.style.textDecoration = state);
        button.addEventListener("mouseenter", hoverHandler("underline"));
        button.addEventListener("mouseleave", hoverHandler("none"));

        button.addEventListener("click", async () => {
          button.textContent = "...";
          button.disabled = true;

          try {
            const response = await chrome.runtime.sendMessage({
              action: "audit",
              id,
            });

            console.log(JSON.stringify(response, null, 2));

            const color = getColorFromGradient(response.score);

            updateUserColor(id, color);
            button.textContent = `(${response.score}) ↻`;
            localStorage.setItem(
              `${STORAGE_PREFIX}${id}`,
              response.score.toString()
            );
          } catch (error) {
            button.textContent = "!";
            console.error(error);
          } finally {
            button.disabled = false;
          }
        });

        // Load stored data
        const storedScore = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (storedScore) {
          const score = parseInt(storedScore, 10);
          const color = getColorFromGradient(score);
          button.textContent = `(${score}) ↻`;
          updateUserColor(id, color);
        }

        row.appendChild(button);
        row.dataset.auditProcessed = "true";
      });
  }

  function getColorFromGradient(score: number): string {
    const pos = Math.max(0, Math.min(1, score / 100));
    let start: readonly [number, number, number, number],
      end: readonly [number, number, number, number];

    if (pos <= 0.33) {
      [start, end] = [COLOR_STOPS[0], COLOR_STOPS[1]];
    } else if (pos <= 0.66) {
      [start, end] = [COLOR_STOPS[1], COLOR_STOPS[2]];
    } else {
      [start, end] = [COLOR_STOPS[2], COLOR_STOPS[3]];
    }

    const t = (pos - start[0]) / (end[0] - start[0]);
    const r = Math.round(start[1] + t * (end[1] - start[1]));
    const g = Math.round(start[2] + t * (end[2] - start[2]));
    const b = Math.round(start[3] + t * (end[3] - start[3]));

    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
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

  addAuditButtons();
  new MutationObserver(debounce(addAuditButtons, DEBOUNCE_DELAY)).observe(
    document.body,
    {
      childList: true,
      subtree: true,
    }
  );
})();
