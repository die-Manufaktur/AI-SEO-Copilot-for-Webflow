/**
 * Mock Service Worker (MSW) handlers for Webflow API
 * Provides realistic API mocking for comprehensive testing
 */

import { http, HttpResponse } from 'msw';
import { mockWebflowApiResponses } from '../fixtures/webflowApiResponses';
import { userFactory, oauthTokenFactory } from '../factories/userFactory';
import { siteFactory, pageFactory, cmsCollectionFactory, cmsItemFactory } from '../factories/siteFactory';

// Base URL for Webflow API
const WEBFLOW_API_BASE = 'https://api.webflow.com';
const WEBFLOW_OAUTH_BASE = 'https://webflow.com/oauth';

/**
 * OAuth API handlers
 */
export const oauthHandlers = [
  // OAuth token exchange
  http.post(`${WEBFLOW_OAUTH_BASE}/access_token`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const grantType = params.get('grant_type');
    const code = params.get('code');
    const refreshToken = params.get('refresh_token');

    // Simulate various OAuth scenarios
    if (grantType === 'authorization_code' && code) {
      if (code === 'invalid_code') {
        return HttpResponse.json({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid'
        }, { status: 400 });
      }
      
      return HttpResponse.json(mockWebflowApiResponses.oauthToken);
    }

    if (grantType === 'refresh_token' && refreshToken) {
      if (refreshToken === 'expired_refresh_token') {
        return HttpResponse.json({
          error: 'invalid_grant',
          error_description: 'The refresh token is expired'
        }, { status: 400 });
      }
      
      return HttpResponse.json({
        ...mockWebflowApiResponses.oauthToken,
        access_token: 'wf_new_access_token_12345',
      });
    }

    return HttpResponse.json({
      error: 'unsupported_grant_type',
      error_description: 'Grant type not supported'
    }, { status: 400 });
  }),

  // OAuth user info
  http.get(`${WEBFLOW_API_BASE}/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (token === 'invalid_token') {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    return HttpResponse.json(mockWebflowApiResponses.userInfo);
  }),
];

/**
 * Sites API handlers
 */
export const sitesHandlers = [
  // List sites
  http.get(`${WEBFLOW_API_BASE}/sites`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    return HttpResponse.json(mockWebflowApiResponses.sitesList);
  }),

  // Get site details
  http.get(`${WEBFLOW_API_BASE}/sites/:siteId`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { siteId } = params as { siteId: string };
    
    if (siteId === 'site_not_found') {
      return HttpResponse.json(mockWebflowApiResponses.errors.notFound, { status: 404 });
    }

    return HttpResponse.json(mockWebflowApiResponses.siteDetails);
  }),
];

/**
 * Pages API handlers
 */
export const pagesHandlers = [
  // List pages
  http.get(`${WEBFLOW_API_BASE}/sites/:siteId/pages`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { siteId } = params as { siteId: string };
    
    if (siteId === 'site_forbidden') {
      return HttpResponse.json(mockWebflowApiResponses.errors.forbidden, { status: 403 });
    }

    return HttpResponse.json(mockWebflowApiResponses.pagesList);
  }),

  // Get page details
  http.get(`${WEBFLOW_API_BASE}/pages/:pageId`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { pageId } = params as { pageId: string };
    
    if (pageId === 'page_not_found') {
      return HttpResponse.json(mockWebflowApiResponses.errors.notFound, { status: 404 });
    }

    return HttpResponse.json(mockWebflowApiResponses.pageDetails);
  }),

  // Update page
  http.patch(`${WEBFLOW_API_BASE}/pages/:pageId`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { pageId } = params as { pageId: string };
    const body = await request.json() as any;
    
    // Simulate rate limiting
    const rateLimitHeader = request.headers.get('X-Test-Rate-Limit');
    if (rateLimitHeader === 'trigger') {
      return HttpResponse.json(mockWebflowApiResponses.errors.rateLimited, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + 60000).toString(),
        },
      });
    }

    // Simulate validation errors
    if (!body.title || body.title.length === 0) {
      return HttpResponse.json({
        ...mockWebflowApiResponses.errors.validationError,
        details: { field: 'title', message: 'Title is required' },
      }, { status: 400 });
    }

    if (pageId === 'page_forbidden') {
      return HttpResponse.json(mockWebflowApiResponses.errors.forbidden, { status: 403 });
    }

    // Return success response with updated data
    return HttpResponse.json({
      ...mockWebflowApiResponses.pageUpdateSuccess,
      _id: pageId,
      title: body.title || mockWebflowApiResponses.pageUpdateSuccess.title,
      seo: {
        ...mockWebflowApiResponses.pageUpdateSuccess.seo,
        title: body.seo?.title || mockWebflowApiResponses.pageUpdateSuccess.seo.title,
        description: body.seo?.description || mockWebflowApiResponses.pageUpdateSuccess.seo.description,
      },
    });
  }),
];

/**
 * CMS API handlers
 */
export const cmsHandlers = [
  // List collections
  http.get(`${WEBFLOW_API_BASE}/sites/:siteId/collections`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    return HttpResponse.json(mockWebflowApiResponses.cmsCollections);
  }),

  // List collection items
  http.get(`${WEBFLOW_API_BASE}/collections/:collectionId/items`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    let items = mockWebflowApiResponses.cmsItems.items;
    
    // Handle pagination
    if (offset && limit) {
      const offsetNum = parseInt(offset, 10);
      const limitNum = parseInt(limit, 10);
      items = items.slice(offsetNum, offsetNum + limitNum);
    }

    return HttpResponse.json({ items });
  }),

  // Create collection item
  http.post(`${WEBFLOW_API_BASE}/collections/:collectionId/items`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const body = await request.json() as any;
    
    // Validate required fields
    if (!body.fields || !body.fields.name) {
      return HttpResponse.json({
        ...mockWebflowApiResponses.errors.validationError,
        details: { field: 'name', message: 'Name field is required' },
      }, { status: 400 });
    }

    // Create new item
    const newItem = cmsItemFactory({
      fieldData: body.fields,
    });

    return HttpResponse.json(newItem, { status: 201 });
  }),

  // Update collection item
  http.patch(`${WEBFLOW_API_BASE}/collections/:collectionId/items/:itemId`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { itemId } = params as { itemId: string };
    const body = await request.json() as any;
    
    if (itemId === 'item_not_found') {
      return HttpResponse.json(mockWebflowApiResponses.errors.notFound, { status: 404 });
    }

    // Return success response
    return HttpResponse.json({
      ...mockWebflowApiResponses.cmsItemUpdateSuccess,
      _id: itemId,
      fieldData: {
        ...mockWebflowApiResponses.cmsItemUpdateSuccess.fieldData,
        ...body.fields,
      },
    });
  }),

  // Delete collection item
  http.delete(`${WEBFLOW_API_BASE}/collections/:collectionId/items/:itemId`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(mockWebflowApiResponses.errors.unauthorized, { status: 401 });
    }

    const { itemId } = params as { itemId: string };
    
    if (itemId === 'item_not_found') {
      return HttpResponse.json(mockWebflowApiResponses.errors.notFound, { status: 404 });
    }

    return new Response(null, { status: 204 });
  }),
];

/**
 * Worker API handlers (for internal API calls)
 */
export const workerHandlers = [
  // Health check
  http.get('*/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: Date.now() });
  }),

  // SEO analysis
  http.post('*/api/analyze', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.url) {
      return HttpResponse.json({
        error: 'Missing required parameter: url',
      }, { status: 400 });
    }

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return HttpResponse.json({
      url: body.url,
      analysis: {
        title: 'Example Page Title',
        metaDescription: 'Example meta description',
        recommendations: [
          {
            type: 'title',
            message: 'Consider making your title more specific',
            priority: 'medium',
          },
        ],
      },
    });
  }),

  // Generic test endpoints
  http.get('*/test-endpoint', () => {
    return HttpResponse.json({ success: true, data: 'test response' });
  }),

  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: 'This is a test AI response',
            role: 'assistant'
          }
        }
      ]
    });
  }),
];

/**
 * External API handlers (for third-party services)
 */
export const externalHandlers = [
  // Example.com for web scraping tests
  http.get('https://example.com/*', () => {
    return HttpResponse.text(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Example Page Title</title>
          <meta name="description" content="Example meta description">
        </head>
        <body>
          <h1>Example Heading</h1>
          <p>Example content</p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }),

  // Generic catch-all for external URLs
  http.get('https://*', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({ 
      message: 'Mock response for external URL',
      url: url.href 
    });
  }),

  http.post('https://*', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({ 
      message: 'Mock response for external POST',
      url: url.href 
    });
  }),
];

/**
 * Error simulation handlers
 */
export const errorHandlers = [
  // Simulate network errors
  http.get(`${WEBFLOW_API_BASE}/sites/network_error`, () => {
    return HttpResponse.error();
  }),

  // Simulate timeout
  http.get(`${WEBFLOW_API_BASE}/sites/timeout`, async () => {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
    return HttpResponse.json({ data: 'This should timeout' });
  }),
];

/**
 * All handlers combined
 */
export const allHandlers = [
  ...oauthHandlers,
  ...sitesHandlers,
  ...pagesHandlers,
  ...cmsHandlers,
  ...workerHandlers,
  ...externalHandlers,
  ...errorHandlers,
];