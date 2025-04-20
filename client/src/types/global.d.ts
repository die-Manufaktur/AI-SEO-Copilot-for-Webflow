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
  isHomepage(): Promise<boolean>;
  getTitle(): Promise<string>;
  getDescription(): Promise<string>;
  getSlug(): Promise<string>;
  getOpenGraphTitle(): Promise<string>;
  usesTitleAsOpenGraphTitle(): Promise<boolean>;
  getOpenGraphDescription(): Promise<string>;
  usesDescriptionAsOpenGraphDescription(): Promise<boolean>;
  getOpenGraphImage(): Promise<string>;
  getSearchTitle(): Promise<string>;
  usesTitleAsSearchTitle(): Promise<boolean>;
  getSearchDescription(): Promise<string>;
  usesDescriptionAsSearchDescription(): Promise<boolean>;
  getSearchImage(): Promise<string>;
  isExcludedFromSearch(): Promise<boolean>;
  getPublishPath(): Promise<string>;
}

// Webflow API Extension Interface
interface WebflowExtension {
  setExtensionSize(preset: 'small' | 'medium' | 'large' | 'full' | { width: number; height: number }): Promise<void>;
  getSiteInfo(): Promise<WebflowSiteInfo>;
  getCurrentPage(): Promise<WebflowPage>;
  getAllElements(): Promise<Array<{
    tagName: string;
    textContent: string;
    customAttributes?: Array<{ name: string; value: string }>;
    children?: () => Promise<Array<{ type: string; tagName: string; textContent: string }>>;
  }>>;
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

// SVG Module Declarations
declare module "*.svg" {
  import React from "react";
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
