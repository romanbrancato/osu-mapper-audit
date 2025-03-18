import * as osu from "osu-api-v2-js";

// Get these from osu! API client settings
const CLIENT_ID = 1111;
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "getBeatmapCount") {
    try {
      const api = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET);
      const beatmaps = await api.getUserBeatmaps(
        parseInt(request.userId),
        "ranked"
      );
      sendResponse({ count: beatmaps.length });
    } catch (error) {
      console.error("API Error:", error);
      sendResponse({ error: "Failed to fetch beatmaps" });
    }
    return true; // Keep channel open
  }
});
