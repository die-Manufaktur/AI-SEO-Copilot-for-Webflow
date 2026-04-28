/**
 * Webflow Data API Client
 * REFACTOR Phase: Modular design with improved error handling and testability
 */

import { HttpClient, type HttpClientConfig, type RequestOptions } from './httpClient';
import type {
  WebflowDataApiConfig,
  WebflowOAuthToken,
  WebflowRateLimitInfo,
  WebflowSite,
  WebflowPage,
  WebflowPageUpdateRequest,
  WebflowCMSCollection,
  WebflowCMSItem,
  WebflowCMSItemCreateRequest,
  WebflowCMSItemUpdateRequest,
  WebflowApiListResponse,
} from '../types/webflow-data-api';

export class WebflowDataAPI {
  private httpClient: HttpClient;
  private config: Required<WebflowDataApiConfig>;

  constructor(token: WebflowOAuthToken, config: WebflowDataApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.webflow.com',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      rateLimitStrategy: config.rateLimitStrategy || 'queue',
    };

    const httpConfig: HttpClientConfig = {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      rateLimitStrategy: this.config.rateLimitStrategy,
    };

    this.httpClient = new HttpClient(token, httpConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<WebflowDataApiConfig> {
    return this.config;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders(): Record<string, string> {
    return this.httpClient.getAuthHeaders();
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): WebflowRateLimitInfo {
    return this.httpClient.getRateLimitInfo();
  }

  /**
   * Update token
   */
  updateToken(token: WebflowOAuthToken): void {
    this.httpClient.updateToken(token);
  }

  // HTTP methods now delegate to HttpClient

  // Sites API

  /**
   * List all sites
   */
  async listSites(): Promise<{ sites: WebflowSite[] }> {
    return this.httpClient.get<{ sites: WebflowSite[] }>('/sites');
  }

  /**
   * Get site details
   */
  async getSite(siteId: string): Promise<WebflowSite> {
    return this.httpClient.get<WebflowSite>(`/sites/${siteId}`);
  }

  // Pages API

  /**
   * List pages for a site
   */
  async listPages(siteId: string): Promise<{ pages: WebflowPage[] }> {
    return this.httpClient.get<{ pages: WebflowPage[] }>(`/sites/${siteId}/pages`);
  }

  /**
   * Get page details
   */
  async getPage(pageId: string): Promise<WebflowPage> {
    return this.httpClient.get<WebflowPage>(`/pages/${pageId}`);
  }

  /**
   * Update page metadata
   */
  async updatePage(pageId: string, data: WebflowPageUpdateRequest): Promise<WebflowPage> {
    return this.httpClient.patch<WebflowPage>(`/pages/${pageId}`, data);
  }

  // CMS API

  /**
   * List collections for a site
   */
  async listCollections(siteId: string): Promise<{ collections: WebflowCMSCollection[] }> {
    return this.httpClient.get<{ collections: WebflowCMSCollection[] }>(`/sites/${siteId}/collections`);
  }

  /**
   * List items in a collection
   */
  async listCollectionItems(
    collectionId: string,
    params?: { limit?: number; offset?: number; [key: string]: any }
  ): Promise<WebflowApiListResponse<WebflowCMSItem>> {
    return this.httpClient.get<WebflowApiListResponse<WebflowCMSItem>>(
      `/collections/${collectionId}/items`,
      params
    );
  }

  /**
   * Create collection item
   */
  async createCollectionItem(
    collectionId: string,
    data: WebflowCMSItemCreateRequest
  ): Promise<WebflowCMSItem> {
    return this.httpClient.post<WebflowCMSItem>(`/collections/${collectionId}/items`, data);
  }

  /**
   * Update collection item
   */
  async updateCollectionItem(
    collectionId: string,
    itemId: string,
    data: WebflowCMSItemUpdateRequest
  ): Promise<WebflowCMSItem> {
    return this.httpClient.patch<WebflowCMSItem>(`/collections/${collectionId}/items/${itemId}`, data);
  }

  /**
   * Delete collection item
   */
  async deleteCollectionItem(collectionId: string, itemId: string): Promise<void> {
    return this.httpClient.delete(`/collections/${collectionId}/items/${itemId}`);
  }

  /**
   * Generic HTTP methods for direct API access (primarily for testing)
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.httpClient.get<T>(endpoint, undefined, options);
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.httpClient.post<T>(endpoint, data, options);
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.httpClient.patch<T>(endpoint, data, options);
  }

  async delete(endpoint: string, options?: RequestOptions): Promise<void> {
    return this.httpClient.delete(endpoint, options);
  }
}