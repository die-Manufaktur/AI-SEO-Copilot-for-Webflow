/**
 * Mock Webflow API response fixtures for testing
 * Used to provide consistent test data across all test suites
 */

export const mockWebflowApiResponses = {
  // OAuth Token Response
  oauthToken: {
    access_token: 'wf_test_access_token_12345',
    refresh_token: 'wf_test_refresh_token_12345',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
  },

  // User Info Response
  userInfo: {
    _id: 'user_12345',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'https://example.com/avatar.jpg',
    createdOn: '2024-01-01T00:00:00.000Z',
  },

  // Sites List Response
  sitesList: {
    sites: [
      {
        _id: 'site_12345',
        name: 'Test Site',
        shortName: 'test-site',
        lastPublished: '2024-01-15T12:00:00.000Z',
        previewUrl: 'https://test-site.webflow.io',
        timezone: 'America/New_York',
        database: 'db_12345',
      },
      {
        _id: 'site_67890',
        name: 'Demo Site',
        shortName: 'demo-site',
        lastPublished: '2024-01-10T10:00:00.000Z',
        previewUrl: 'https://demo-site.webflow.io',
        timezone: 'America/Los_Angeles',
        database: 'db_67890',
      },
    ],
  },

  // Site Details Response
  siteDetails: {
    _id: 'site_12345',
    name: 'Test Site',
    shortName: 'test-site',
    lastPublished: '2024-01-15T12:00:00.000Z',
    previewUrl: 'https://test-site.webflow.io',
    timezone: 'America/New_York',
    database: 'db_12345',
    customDomains: [
      {
        _id: 'domain_12345',
        url: 'https://example.com',
      },
    ],
  },

  // Pages List Response
  pagesList: {
    pages: [
      {
        _id: 'page_12345',
        siteId: 'site_12345',
        title: 'Home Page',
        slug: '',
        parentId: null,
        createdOn: '2024-01-01T00:00:00.000Z',
        lastUpdated: '2024-01-15T12:00:00.000Z',
        isHomePage: true,
        isFolderHomePage: false,
        archived: false,
        draft: false,
        seo: {
          title: 'Welcome to Test Site',
          description: 'This is the home page of our test site',
        },
        openGraph: {
          title: 'Welcome to Test Site',
          description: 'This is the home page of our test site',
        },
      },
      {
        _id: 'page_67890',
        siteId: 'site_12345',
        title: 'About Page',
        slug: 'about',
        parentId: null,
        createdOn: '2024-01-05T00:00:00.000Z',
        lastUpdated: '2024-01-12T10:00:00.000Z',
        isHomePage: false,
        isFolderHomePage: false,
        archived: false,
        draft: false,
        seo: {
          title: 'About Us - Test Site',
          description: 'Learn more about our company and mission',
        },
        openGraph: {
          title: 'About Us - Test Site',
          description: 'Learn more about our company and mission',
        },
      },
    ],
  },

  // Page Details Response
  pageDetails: {
    _id: 'page_12345',
    siteId: 'site_12345',
    title: 'Home Page',
    slug: '',
    parentId: null,
    createdOn: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-15T12:00:00.000Z',
    isHomePage: true,
    isFolderHomePage: false,
    archived: false,
    draft: false,
    seo: {
      title: 'Welcome to Test Site',
      description: 'This is the home page of our test site',
    },
    openGraph: {
      title: 'Welcome to Test Site',
      description: 'This is the home page of our test site',
      titleCopied: false,
      descriptionCopied: false,
    },
  },

  // CMS Collections Response
  cmsCollections: {
    collections: [
      {
        _id: 'collection_12345',
        lastUpdated: '2024-01-15T12:00:00.000Z',
        createdOn: '2024-01-01T00:00:00.000Z',
        name: 'Blog Posts',
        slug: 'blog-posts',
        singularName: 'Blog Post',
        fields: [
          {
            id: 'field_name',
            type: 'PlainText',
            slug: 'name',
            name: 'Name',
            required: true,
            editable: true,
          },
          {
            id: 'field_slug',
            type: 'PlainText',
            slug: 'slug',
            name: 'Slug',
            required: true,
            editable: true,
          },
          {
            id: 'field_content',
            type: 'RichText',
            slug: 'content',
            name: 'Content',
            required: false,
            editable: true,
          },
          {
            id: 'field_featured_image',
            type: 'Image',
            slug: 'featured-image',
            name: 'Featured Image',
            required: false,
            editable: true,
          },
        ],
      },
    ],
  },

  // CMS Items Response
  cmsItems: {
    items: [
      {
        _id: 'item_12345',
        lastUpdated: '2024-01-15T12:00:00.000Z',
        createdOn: '2024-01-10T00:00:00.000Z',
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: 'First Blog Post',
          slug: 'first-blog-post',
          content: '<p>This is the content of our first blog post.</p>',
          'featured-image': {
            url: 'https://example.com/image1.jpg',
            alt: 'Featured image for first blog post',
          },
        },
      },
      {
        _id: 'item_67890',
        lastUpdated: '2024-01-12T10:00:00.000Z',
        createdOn: '2024-01-08T00:00:00.000Z',
        isArchived: false,
        isDraft: true,
        fieldData: {
          name: 'Second Blog Post',
          slug: 'second-blog-post',
          content: '<p>This is the content of our second blog post.</p>',
          'featured-image': {
            url: 'https://example.com/image2.jpg',
            alt: 'Featured image for second blog post',
          },
        },
      },
    ],
  },

  // Success Response for Page Update
  pageUpdateSuccess: {
    _id: 'page_12345',
    siteId: 'site_12345',
    title: 'Updated Home Page',
    slug: '',
    seo: {
      title: 'Updated Welcome to Test Site',
      description: 'This is the updated home page of our test site',
    },
    openGraph: {
      title: 'Updated Welcome to Test Site',
      description: 'This is the updated home page of our test site',
    },
    lastUpdated: '2024-01-15T12:30:00.000Z',
  },

  // Success Response for CMS Item Update
  cmsItemUpdateSuccess: {
    _id: 'item_12345',
    lastUpdated: '2024-01-15T12:30:00.000Z',
    fieldData: {
      name: 'Updated First Blog Post',
      slug: 'updated-first-blog-post',
      content: '<p>This is the updated content of our first blog post.</p>',
    },
  },

  // Error Responses
  errors: {
    unauthorized: {
      err: 'Unauthorized',
      code: 401,
      msg: 'Authorization required',
    },
    forbidden: {
      err: 'Forbidden',
      code: 403,
      msg: 'Insufficient permissions',
    },
    notFound: {
      err: 'Not Found',
      code: 404,
      msg: 'Resource not found',
    },
    rateLimited: {
      err: 'Rate Limited',
      code: 429,
      msg: 'Too many requests',
    },
    validationError: {
      err: 'Validation Error',
      code: 400,
      msg: 'Invalid request data',
      details: {
        field: 'title',
        message: 'Title is required',
      },
    },
  },
};