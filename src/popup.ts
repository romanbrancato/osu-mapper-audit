import { Params, OAuth, Colors, defaultColors, Display, defaultParams } from "./types";

type StorageData = {
  auditOAuth?: OAuth;
  auditParameters?: Params;
  auditDisplay?: Display;
};

const rgbToHex = (rgb: number[]): string => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const hexToRgb = (hex: string): number[] => {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

async function initialize() {
  const { auditOAuth, auditParameters, auditDisplay } = (await chrome.storage.local.get([
    "auditOAuth",
    "auditParameters",
    "auditDisplay",
  ])) as StorageData;

  // Initialize OAuth form
  const oauthForm = document.getElementById("oauthForm")!;
  (oauthForm.querySelector('[name="clientId"]') as HTMLInputElement).value = auditOAuth?.clientId || "";
  (oauthForm.querySelector('[name="clientSecret"]') as HTMLInputElement).value = auditOAuth?.clientSecret || "";

  // Initialize parameters form
  const params = auditParameters;
  Object.entries(params!).forEach(([name, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      const input = document.querySelector<HTMLInputElement>(`[name="${name}_${key}"]`);
      if (input) input.value = value.toString();
    });
  });

  // Initialize display form
  const display = auditDisplay || { colors: defaultColors, showScore: true };
  Object.entries(display.colors).forEach(([key, rgb]) => {
    const input = document.querySelector<HTMLInputElement>(`[name="color_${key}"]`);
    if (input) input.value = rgbToHex(rgb);
  });
  (document.querySelector('[name="show_score"]') as HTMLInputElement).checked = display.showScore;
}

document.addEventListener("DOMContentLoaded", async () => {
  await initialize();

  // OAuth Form Handler
  document.getElementById("oauthForm")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusElement = document.getElementById("oauthStatus")!;
    statusElement.textContent = "...";
    statusElement.style.color = "#aaaeb1";

    const clientId = (document.querySelector('[name="clientId"]') as HTMLInputElement).value;
    const clientSecret = (document.querySelector('[name="clientSecret"]') as HTMLInputElement).value;

    await chrome.storage.local.set({
      auditOAuth: { clientId, clientSecret },
    });

    const { valid } = await chrome.runtime.sendMessage({
      action: "VALIDATE_OAUTH",
    });
    statusElement.textContent = valid ? "success" : "invalid";
    statusElement.style.color = valid ? "#28a745" : "#ff4444";
  });

  // Parameters Form Handler
  document.getElementById("paramsForm")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const parameters = Object.keys(defaultParams).reduce(
      (acc, name) => ({
        ...acc,
        [name]: {
          weight: Number(formData.get(`${name}_weight`)),
          midpoint: Number(formData.get(`${name}_midpoint`)),
          steepness: Number(formData.get(`${name}_steepness`)),
        },
      }),
      {} as Params
    );

    chrome.storage.local.set({ auditParameters: parameters });
  });

  // Display Form Handler
  document.getElementById("displayForm")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const colors = Object.keys(defaultColors).reduce(
      (acc, key) => ({
        ...acc,
        [key]: hexToRgb(formData.get(`color_${key}`) as string),
      }),
      {} as Colors
    );

    const display: Display = {
      colors,
      showScore: formData.get("show_score") === "on",
    };

    chrome.storage.local.set({ auditDisplay: display });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id!, { action: "REFRESH" });
    });
  });

  // Reset Buttons
  document.getElementById("resetParams")!.addEventListener("click", () => {
    Object.entries(defaultParams).forEach(([name, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        const input = document.querySelector<HTMLInputElement>(`[name="${name}_${key}"]`);
        if (input) input.value = value.toString();
      });
    });
    chrome.storage.local.set({ auditParameters: defaultParams });
  });

  document.getElementById("resetDisplay")!.addEventListener("click", () => {
    Object.entries(defaultColors).forEach(([key, rgb]) => {
      const input = document.querySelector<HTMLInputElement>(`[name="color_${key}"]`);
      if (input) input.value = rgbToHex(rgb);
    });
    (document.querySelector('[name="show_score"]') as HTMLInputElement).checked = true;
    chrome.storage.local.set({
      auditDisplay: { colors: defaultColors, showScore: true },
    });
  });

  // Copy Callback URL
  document.getElementById("copy")!.addEventListener("click", async (e) => {
    e.preventDefault();
    const id = chrome.runtime.id;
    await navigator.clipboard.writeText(`https://${id}.chromiumapp.org/`);
  });

  // Clear Scores
  document.getElementById("clearScores")!.addEventListener("click", () => {
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items)
        .filter((key) => key.startsWith("audit_"))
        .filter((key) => key !== "auditParameters" && key !== "auditDisplay" && key !== "auditOAuth");
      chrome.storage.local.remove(keysToRemove);
    });
  });
});
