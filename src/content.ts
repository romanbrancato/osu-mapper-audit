import { Auditor } from "./auditor";

let auditor: Auditor;

try {
  auditor = new Auditor();
} catch (error) {
  chrome.runtime.sendMessage({
    action: "missingOAuth",
  });
}

function addAuditButtons() {
  document
    .querySelectorAll(".beatmapset-panel__info-row--mapper")
    .forEach((row) => {
      if (row.querySelector(".audit-button")) return;

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

      // Hover Effects
      button.addEventListener("mouseenter", () => {
        button.style.textDecoration = "underline";
      });

      button.addEventListener("mouseleave", () => {
        button.style.textDecoration = "none";
      });

      const userId = row
        .querySelector("a.js-usercard[data-user-id]")
        ?.getAttribute("data-user-id");
      if (userId) {
        const storedData = localStorage.getItem(`mapper_${userId}`);
        if (storedData) {
          const { score, color } = JSON.parse(storedData);
          button.textContent = `(${score}) ↻`;
          document
            .querySelectorAll(`a.js-usercard[data-user-id="${userId}"]`)
            .forEach((link) => ((link as HTMLElement).style.color = color));
        }
      }

      row.appendChild(button);
    });
}

addAuditButtons();

function getGradientColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const pos = clamped / 100;

  // Color stops: [position, R, G, B]
  const stops = [
    [0.0, 0, 0, 0], // Black
    [0.33, 255, 0, 0], // Red
    [0.66, 255, 255, 0], // Yellow
    [1.0, 0, 255, 0], // Green
  ];

  // Find surrounding stops
  let [start, end] = [stops[0], stops[stops.length - 1]];
  for (let i = 0; i < stops.length - 1; i++) {
    if (pos >= stops[i][0] && pos <= stops[i + 1][0]) {
      [start, end] = [stops[i], stops[i + 1]];
      break;
    }
  }

  // Interpolate between stops
  const t = (pos - start[0]) / (end[0] - start[0]);
  const [r, g, b] = start
    .slice(1)
    .map((c, i) => Math.round(c + t * (end[i + 1] - c)));

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

document.addEventListener("click", async (event) => {
  const button = (event.target as Element)?.closest<HTMLButtonElement>(
    ".audit-button"
  );
  if (!button) return;
  const row = button.closest(".beatmapset-panel__info-row--mapper");
  const userLink = row?.querySelector<HTMLAnchorElement>(
    "a.js-usercard[data-user-id]"
  );
  const id = userLink?.dataset.userId;
  if (!id) return;

  button.textContent = "...";
  button.disabled = true;

  try {
    const response = await auditor.auditMapper(id);

    // Update all instances of the mapper link with score and color
    const color = getGradientColor(response.score);
    document
      .querySelectorAll(`a.js-usercard[data-user-id="${id}"]`)
      .forEach((link) => {
        (link as HTMLElement).style.color = color;
      });
    button.textContent = `(${response.score}) ↻`;
    button.disabled = false;
  } catch (error) {
    console.error(error);
    button.textContent = "!";
    return;
  }
});

function debounce(
  func: (...args: any[]) => void,
  delay: number
): (...args: any[]) => void {
  let timeoutId: number;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

const debouncedAddAuditButtons = debounce(addAuditButtons, 100);
new MutationObserver(debouncedAddAuditButtons).observe(document.body, {
  childList: true,
  subtree: true,
});
