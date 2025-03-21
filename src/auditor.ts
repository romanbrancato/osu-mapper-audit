interface OAuthData {
  osuMapperAuditOAuth?: {
    clientId: number;
    clientSecret: string;
  };
}

export class Auditor {
  private constructor(
    private clientId: number, 
    private clientSecret: string
  ) {}

  static async create(): Promise<Auditor> {
    // Get credentials from Chrome storage
    const data = await new Promise<OAuthData>((resolve) => {
      chrome.storage.local.get(['osuMapperAuditOAuth'], (result) => {
        resolve(result as OAuthData);
      });
    });

    // Check if credentials exist
    if (!data?.osuMapperAuditOAuth) {
      throw new Error("OAuth credentials not found in Chrome storage");
    }

    // Extract and validate credentials
    const { clientId, clientSecret } = data.osuMapperAuditOAuth;
    if (!clientId || !clientSecret) {
      throw new Error("Invalid OAuth credentials format in Chrome storage");
    }

    return new Auditor(clientId, clientSecret);
  }

  // Sends a request to audit a mapper and returns their score
  async auditMapper(id: string): Promise<{ mapper: string, score: number, report: Record<string, string> }> {
    const response = await chrome.runtime.sendMessage({
      action: "auditMapper",
      id,
      oauth: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      },
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return { ...response };
  }
}