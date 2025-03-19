import * as osu from "osu-api-v2-js";

const CLIENT_ID = 39099;
const CLIENT_SECRET = ";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "auditMapper") {
    (async () => {
      try {
        const api = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET);
        const userId = parseInt(request.userId);

        // Fetch ranked, loved, and graveyard beatmaps in parallel
        const [ranked, loved, graveyard] = await Promise.all([
          api.getUserBeatmaps(userId, "ranked"),
          api.getUserBeatmaps(userId, "loved"),
          api.getUserBeatmaps(userId, "graveyard", {limit: 10})
        ]);

        const status = calculateStatus(ranked, loved, graveyard);
        sendResponse({ status });
      } catch (error) {
        if (error instanceof Error) {
          sendResponse({ error: error.message });
        } else {
          sendResponse({ error: String(error) });
        }
      }
    })();
    
    return true; // Keep message channel open for async response
  }
});

function calculateStatus(
  ranked: osu.Beatmapset.Extended.WithBeatmap[],
  loved: osu.Beatmapset.Extended.WithBeatmap[],
  graveyard: osu.Beatmapset.Extended.WithBeatmap[]
) {
  const rankedAndLovedCount = ranked.length + loved.length;
  const graveyardCount = graveyard.length;

  if (rankedAndLovedCount >= 1) {
    return "good";
  } else if (graveyardCount >= 10) {
    return "ok";
  } else {
    return "bad";
  }
}