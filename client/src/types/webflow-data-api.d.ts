/**
 * TypeScript type definitions for Webflow Data API
 * Provides strongly typed interfaces for all API interactions
 */

// OAuth Types
export interface WebflowOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state?: string;
}

export interface WebflowOAuthToken {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  expires_at?: number; // Calculated field for client use
}

export interface WebflowOAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

// User Types
export interface WebflowUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdOn: string;
  lastLogin?: string;
}

// Site Types
export interface WebflowSite {
  _id: string;
  name: string;
  shortName: string;
  lastPublished?: string;
  previewUrl: string;
  timezone: string;
  database: string;
  customDomains?: WebflowCustomDomain[];
  locales?: WebflowLocale[];
}

export interface WebflowCustomDomain {
  _id: string;
  url: string;
  sslStatus: 'pending' | 'active' | 'error';
}

export interface WebflowLocale {
  _id: string;
  cmsLocaleId: string;
  tag: string;
  displayName: string;
  enabled: boolean;
  primary: boolean;
}

// Page Types
export interface WebflowPage {
  _id: string;
  siteId: string;
  title: string;
  slug: string;
  parentId?: string;
  createdOn: string;
  lastUpdated: string;
  isHomePage: boolean;
  isFolderHomePage: boolean;
  archived: boolean;
  draft: boolean;
  seo: WebflowPageSEO;
  openGraph: WebflowPageOpenGraph;
}

export interface WebflowPageSEO {
  title: string;
  description: string;
}

export interface WebflowPageOpenGraph {
  title: string;
  description: string;
  titleCopied?: boolean;
  descriptionCopied?: boolean;
}

export interface WebflowPageUpdateRequest {
  title?: string;
  slug?: string;
  seo?: Partial<WebflowPageSEO>;
  openGraph?: Partial<WebflowPageOpenGraph>;
  archived?: boolean;
  draft?: boolean;
}

// CMS Types
export interface WebflowCMSCollection {
  _id: string;
  lastUpdated: string;
  createdOn: string;
  name: string;
  slug: string;
  singularName: string;
  fields: WebflowCMSField[];
}

export interface WebflowCMSField {
  id: string;
  type: WebflowCMSFieldType;
  slug: string;
  name: string;
  required: boolean;
  editable: boolean;
  helpText?: string;
  metadata?: any;
}

export type WebflowCMSFieldType = 
  | 'PlainText' 
  | 'RichText' 
  | 'Image' 
  | 'Number' 
  | 'Link' 
  | 'DateTime' 
  | 'Option' 
  | 'Switch' 
  | 'Color'
  | 'Email'
  | 'Phone'
  | 'Video'
  | 'File'
  | 'MultiImage'
  | 'Reference'
  | 'MultiReference';

export interface WebflowCMSItem {
  _id: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, any>;
  cmsLocaleId?: string;
}

export interface WebflowCMSItemCreateRequest {
  fields: Record<string, any>;
  isArchived?: boolean;
  isDraft?: boolean;
}

export interface WebflowCMSItemUpdateRequest {
  fields?: Record<string, any>;
  isArchived?: boolean;
  isDraft?: boolean;
}

// API Response Types
export interface WebflowApiResponse<T> {
  data?: T;
  error?: WebflowApiError;
}

export interface WebflowApiError {
  err: string;
  code: number;
  msg: string;
  details?: any;
}

export interface WebflowApiListResponse<T> {
  items?: T[];
  count?: number;
  limit?: number;
  offset?: number;
  total?: number;
}

// Permission Types
export interface WebflowPermissions {
  sites: {
    read: boolean;
    write: boolean;
  };
  cms: {
    read: boolean;
    write: boolean;
  };
  pages: {
    read: boolean;
    write: boolean;
  };
}

// Rate Limiting Types
export interface WebflowRateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfter?: number;
}

// API Client Configuration
export interface WebflowDataApiConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  rateLimitStrategy?: 'queue' | 'throw' | 'retry';
}

// Insertion Types (for apply functionality)
export interface WebflowInsertionRequest {
  type: 'page_title' | 'meta_description' | 'page_seo' | 'cms_field';
  pageId?: string;
  cmsItemId?: string;
  fieldId?: string;
  value: any;
  preview?: boolean;
}

export interface WebflowInsertionResult {
  success: boolean;
  data?: any;
  error?: WebflowApiError;
  rateLimitInfo?: WebflowRateLimitInfo;
}

export interface WebflowBatchInsertionRequest {
  operations: WebflowInsertionRequest[];
  confirmationRequired?: boolean;
  rollbackEnabled?: boolean;
}

export interface WebflowBatchInsertionResult {
  success: boolean;
  results: WebflowInsertionResult[];
  failed: number;
  succeeded: number;
  rollbackId?: string;
}