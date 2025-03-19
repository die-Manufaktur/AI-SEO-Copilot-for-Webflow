// Add TypeScript definitions for the Webflow global object
interface WebflowExtension {
  setExtensionSize(size: { width: number; height: number }): Promise<void>;
  getSiteInfo(): Promise<any>;
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
}

interface Window {
  webflow?: WebflowExtension;
}
