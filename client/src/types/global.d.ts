// Add TypeScript definitions for the Webflow global object
interface WebflowExtension {
  setExtensionSize(preset: 'small' | 'medium' | 'large' | 'full' | { width: number; height: number }): Promise<void>;
  getSiteInfo(): Promise<any>;
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
}

interface Window {
  webflow?: WebflowExtension;
}
