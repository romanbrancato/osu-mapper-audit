
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "auditMapper") {
    (async () => {
      try {
        // const id = parseInt(request.id);
        // const api = request.client.api;
        //
        // const [user, ranked, graveyard] = await Promise.all([
        //   api.getUser(id),
        //   api.getUserBeatmaps(id, "ranked", { limit: 50 }),
        //   api.getUserBeatmaps(id, "graveyard", { limit: 100 })
        // ]);

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

