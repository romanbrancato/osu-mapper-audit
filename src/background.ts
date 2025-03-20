import * as osu from "osu-api-v2-js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "auditMapper") {
    (async () => {
      try {
        const id = parseInt(request.id);
        const api = request.client.api;

        const [user, ranked, graveyard] = await Promise.all([
          api.getUser(id),
          api.getUserBeatmaps(id, "ranked", { limit: 10 }),
          api.getUserBeatmaps(id, "graveyard", { limit: 100 })
        ]);
        
        // const score = calculateScore(user, ranked, graveyard); 
        const score = Math.floor(Math.random() * 101);
        sendResponse({ score });
      } catch (error) {
          sendResponse({ error: error });
        }
    })();
    
    return true;
  }

  if(request.action === "missingOAuth") {
    chrome.action.setBadgeText({
      text: "!"
    });
    chrome.action.setBadgeBackgroundColor({
      color: "#FF0000"
    });
  }
});

function calculateScore(
  user: osu.User.Extended,
  ranked: osu.Beatmapset.Extended.WithBeatmap[], 
  graveyard: osu.Beatmapset.Extended.WithBeatmap[]
) {
  const rank = user.statistics.global_rank;
  const kudosu = user.kudosu.total;
  const mapperSubscribers = user.mapping_follower_count;

  const rankedCount = ranked.length;
  const guestCount = user.guest_beatmapset_count;
  const lovedCount = user.loved_beatmapset_count;
  const graveyardCount = user.graveyard_beatmapset_count;
  const graveyardFavorites = graveyard.reduce((acc, b) => acc + b.favourite_count, 0);
  
  if (rankedCount >= 1 || lovedCount >= 1 || guestCount >= 3 || mapperSubscribers >= 50) return "good";

  if (mapperSubscribers >= 10 || guestCount >=1) return "ok"

  return "bad";
}