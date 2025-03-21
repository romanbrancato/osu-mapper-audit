import * as osu from "osu-api-v2-js";
import { parameters, calculateScore } from "./score";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "auditMapper") {
    (async () => {
      try {
        const id = parseInt(request.id);
        const api = await osu.API.createAsync(request.oauth.clientId, request.oauth.clientSecret);
        
        const [user, ranked, graveyard] = await Promise.all([
          api.getUser(id),
          api.getUserBeatmaps(id, "ranked", { limit: 50 }),
          api.getUserBeatmaps(id, "graveyard", { limit: 100 })
        ]);

        // Extract relevant mapper data
        const mapperValues = {
          hasLeaderboardCount: ranked.length + user.guest_beatmapset_count + user.loved_beatmapset_count,
          averageGraveyardPlayCount: graveyard.reduce((sum: number, map: osu.Beatmapset.Extended.WithBeatmap) => sum + (map.play_count || 0), 0) / graveyard.length,
          graveyardCount: user.graveyard_beatmapset_count,
          graveyardFavorites: graveyard.reduce((sum: number, map: osu.Beatmapset.Extended.WithBeatmap) => sum + (map.favourite_count || 0), 0),
          kudosu: user.kudosu.total || 0,
          mappingSubs: user.mapping_follower_count || 0,
          pp: user.statistics.pp || 0
        };

        const result = calculateScore(parameters, mapperValues);

        sendResponse({ mapper: user.username, ...result });
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

