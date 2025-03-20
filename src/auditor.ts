import * as osu from "osu-api-v2-js";

export class Auditor {
  private clientId: number;
  private clientSecret: string;
  private api: osu.API | null = null;

  constructor() {
    const oAuthData = localStorage.getItem("osuMapperAuditOAuth");
    if (!oAuthData) throw new Error("OAuth credentials not found");

    const parsed = JSON.parse(oAuthData);
    this.clientId = parsed.clientId;
    this.clientSecret = parsed.clientSecret;

    osu.API.createAsync(this.clientId, this.clientSecret).then((api) => {
        this.api = api;
    });
    
  }

  async auditMapper(id: string): Promise<{score: number}> {
    const response = await chrome.runtime.sendMessage({
      action: "auditMapper",
      id: id,
      api: this.api,
    });
    
    if (response.error) {
      throw new Error(response.error);
    }

    localStorage.setItem(`mapper_${id}`, JSON.stringify(response.score));
    return { score: response.score };
  }
}
