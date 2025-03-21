import { Auditor } from "./auditor";

(async function main() {
  let auditor: Auditor;

  try {
    auditor = await Auditor.create();
  } catch (error) {
    chrome.runtime.sendMessage({
      action: "missingOAuth",
    });
    return; 
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

        button.addEventListener("click", async () => {
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
            const color = getGradientColor(response.score);
            
            document
              .querySelectorAll(`a.js-usercard[data-user-id="${id}"]`)
              .forEach((link) => {
                (link as HTMLElement).style.color = color;
              });
              
            button.textContent = `(${response.score}) ↻`;
            localStorage.setItem(`mapper_${id}`, JSON.stringify({
              score: response.score,
              color
            }));
          } catch (error) {
            console.error(error);
            button.textContent = "!";
          } finally {
            button.disabled = false;
          }
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
  new MutationObserver(debounce(addAuditButtons, 100)).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
