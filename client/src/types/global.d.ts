// Add TypeScript definitions for the Webflow global object

// Webflow Site Information Types
interface WebflowDomain {
  url: string;
  lastPublished: string | null;
  default: boolean;
  stage: string;
}

interface WebflowSiteInfo {
  siteId: string;
  siteName: string;
  shortName: string;
  isPasswordProtected: boolean;
  isPrivateStaging: boolean;
  domains: WebflowDomain[];
}

interface WebflowPage {
  id: string;
  name: string;
  path: string;
}

// Webflow API Extension Interface
interface WebflowExtension {
  setExtensionSize(preset: 'small' | 'medium' | 'large' | 'full' | { width: number; height: number }): Promise<void>;
  getSiteInfo(): Promise<WebflowSiteInfo>;
  getCurrentPage(): Promise<WebflowPage>;
  getPublishPath(pageId: string): Promise<string>;
  subscribe(event: 'currentpage', callback: (page: WebflowPage) => void): () => void;
  subscribe(event: string, callback: (data: any) => void): () => void;
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
}

// Global Window Interface
interface Window {
  webflow?: WebflowExtension;
}
