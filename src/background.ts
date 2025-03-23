import * as osu from "osu-api-v2-js";
import {calculateScore } from "./score";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === "checkAuth") {
    (async () => {
      const setErrorBadge = () => {
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      };
  
      const setValidBadge = () => {
        chrome.action.setBadgeText({ text: "" });
        chrome.action.setBadgeBackgroundColor({ color: "#000000" });
      };
  
      try {
        const { auditOAuth } = await chrome.storage.local.get('auditOAuth');
        const isValid = auditOAuth?.clientId && auditOAuth?.clientSecret;
  
        if (!isValid) throw new Error('Missing credentials');
  
        await osu.API.createAsync(
          Number(auditOAuth.clientId),
          auditOAuth.clientSecret
        );
        
        sendResponse({ valid: true });
        setValidBadge();
      } catch (error) {
        sendResponse({ valid: false });
        setErrorBadge();
      }
    })();
    return true;
  }

  if (request.action === "audit") {
    (async () => {
      try {
        const { auditOAuth, auditParameters } = await chrome.storage.local.get([
          'auditOAuth', 
          'auditParameters'
        ]);
  
        if (!auditOAuth?.clientId || !auditOAuth?.clientSecret) {
          throw new Error("OAuth credentials missing");
        }
  
        if (!auditParameters) {
          throw new Error("Parameters not configured");
        }
  
        const id = parseInt(request.id);
        
        const api = await osu.API.createAsync(
          Number(auditOAuth.clientId),
          auditOAuth.clientSecret
        );
  
        const [user, ranked, graveyard] = await Promise.all([
          api.getUser(id) as Promise<osu.User.Extended>,
          api.getUserBeatmaps(id, "ranked", { limit: 50 }) as Promise<osu.Beatmapset.Extended.WithBeatmap[]>,
          api.getUserBeatmaps(id, "graveyard", { limit: 100 }) as Promise<osu.Beatmapset.Extended.WithBeatmap[]>
        ]);
  
        const graveyardPlayCounts = graveyard.map(map => map.play_count || 0);
        const averageGraveyardPlayCount = graveyard.length > 0 
          ? graveyardPlayCounts.reduce((sum, count) => sum + count, 0) / graveyard.length
          : 0;
  
        const mapperValues = {
          hasLeaderboardCount: ranked.length + (user.guest_beatmapset_count || 0) + (user.loved_beatmapset_count || 0),
          averageGraveyardPlayCount,
          graveyardCount: user.graveyard_beatmapset_count || 0,
          graveyardFavorites: graveyard.reduce((sum, map) => sum + (map.favourite_count || 0), 0),
          kudosu: user.kudosu?.total || 0,
          mappingSubscribers: user.mapping_follower_count || 0,
          pp: user.statistics?.pp || 0
        };
  
        const result = calculateScore(auditParameters, mapperValues);
  
        sendResponse({ mapper: user.username, ...result });
      } catch (error) {
        sendResponse({ 
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    })();
    
    return true;
  }
});

// Reinitialize content script on history state update. Handles SPA navigation.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  chrome.tabs.sendMessage(details.tabId, { action: 'reinitialize' });
});
