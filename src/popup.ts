import { Param, Params, defaults } from "./score";

document.addEventListener("DOMContentLoaded", async () => {
  const oauthForm = document.getElementById("oauthForm") as HTMLFormElement;
  const paramsForm = document.getElementById("paramsForm") as HTMLFormElement;
  const clientIdInput = document.getElementById("clientId") as HTMLInputElement;
  const clientSecretInput = document.getElementById(
    "clientSecret"
  ) as HTMLInputElement;

  // Load saved credentials
  const { auditOAuth } = await chrome.storage.local.get(["auditOAuth"]);
if (auditOAuth) {
  clientIdInput.value = auditOAuth.clientId || "";
  clientSecretInput.value = auditOAuth.clientSecret || "";
}

  // Load saved parameters
  const { auditParameters } = await chrome.storage.local.get("auditParameters");
  const params: Params = auditParameters || defaults;

  Object.entries(params).forEach(([name, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      const input = document.querySelector<HTMLInputElement>(
        `[name="${name}_${key}"]`
      );
      if (input) input.value = value.toString();
    });
  });

  // Save defaults if they didn't exist
  if (!auditParameters) {
    chrome.storage.local.set({ auditParameters: defaults });
  }

  paramsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(paramsForm);
    
    // Build parameters object with proper typing
    const parameters = Object.keys(defaults).reduce((acc, name) => {
      const getNumber = (field: keyof Param) => {
        const value = formData.get(`${name}_${field}`);
        return Number(value) || 0;  // Convert to number, fallback to 0
      };
  
      acc[name] = {
        weight: getNumber("weight"),
        midpoint: getNumber("midpoint"),
        steepness: getNumber("steepness"),
      };
      return acc;
    }, {} as Params);
  
    // Save to storage
    chrome.storage.local.set({ auditParameters: parameters });
  });

  oauthForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const statusElement = document.getElementById(
      "oauthStatus"
    ) as HTMLSpanElement;

    statusElement.textContent = "...";
    statusElement.style.color = "#aaaeb1";

    chrome.storage.local.set({
        auditOAuth: {
          clientId: clientIdInput.value,
          clientSecret: clientSecretInput.value,
        },
    });


    const result = await chrome.runtime.sendMessage({ action: "checkAuth" });
    if (!result.valid) {
      statusElement.style.color = "#ff4444";
      statusElement.textContent = "Invalid credentials";
      return;
    }

    // Show success message
    statusElement.style.color = "#4BB543";
    statusElement.textContent = "Success";

  });
});
