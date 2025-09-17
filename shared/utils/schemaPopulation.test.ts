import { describe, it, expect, vi, beforeEach } from 'vitest';
import { populateSchemaWithSiteData } from './schemaPopulation';
import type { SchemaRecommendation, WebflowSiteInfo, WebflowPageData, ScrapedPageData } from '../types';

// Mock data for testing
const mockSiteInfo: WebflowSiteInfo = {
  id: 'site123',
  siteName: 'Test Business',
  siteUrl: 'https://testbusiness.com',
  domains: [
    {
      id: 'domain1',
      name: 'testbusiness.com',
      host: 'testbusiness.com',
      publicUrl: 'https://testbusiness.com',
      publishedOn: '2024-01-01T00:00:00Z'
    },
    {
      id: 'domain2',
      name: 'testbusiness.webflow.io',
      host: 'testbusiness.webflow.io',
      publicUrl: 'https://testbusiness.webflow.io',
      publishedOn: '2024-01-01T00:00:00Z'
    }
  ]
};

const mockWebflowPageData: WebflowPageData = {
  title: 'Professional Web Development Services',
  metaDescription: 'We provide expert web development services for businesses of all sizes.',
  canonicalUrl: 'https://testbusiness.com/services/web-development',
  openGraphImage: 'https://testbusiness.com/og-image.jpg',
  ogTitle: 'Web Development Services',
  ogDescription: 'Professional web development',
  usesTitleAsOpenGraphTitle: false,
  usesDescriptionAsOpenGraphDescription: false
};

const mockScrapedPageData: ScrapedPageData = {
  url: 'https://testbusiness.com/services/web-development',
  title: 'Web Development Services',
  metaDescription: 'Expert web development solutions',
  metaKeywords: 'web development, custom websites, e-commerce, programming',
  ogImage: 'https://testbusiness.com/og-image.jpg',
  headings: [
    { level: 1, text: 'Custom Web Development' },
    { level: 2, text: 'E-commerce Solutions' },
    { level: 2, text: 'Web Application Development' },
    { level: 3, text: 'Our Development Process' }
  ],
  paragraphs: [
    'We create stunning websites that drive results for your business.',
    'Our team of experienced developers uses the latest technologies to build fast, secure, and scalable web solutions.'
  ],
  images: [
    { src: 'https://testbusiness.com/hero-image.jpg', alt: 'Web development team', size: 1024 }
  ],
  internalLinks: ['/about', '/contact'],
  outboundLinks: ['https://github.com'],
  resources: {
    js: [{ url: 'https://testbusiness.com/script.js' }],
    css: [{ url: 'https://testbusiness.com/style.css' }]
  },
  canonicalUrl: 'https://testbusiness.com/services/web-development',
  content: 'Full page content here',
  schemaMarkup: {
    hasSchema: false,
    schemaTypes: [],
    schemaCount: 0
  }
};

const mockSchema: SchemaRecommendation = {
  name: 'Service',
  description: 'A service offered by an organization',
  documentationUrl: 'https://schema.org/Service',
  googleSupport: 'yes',
  jsonLdCode: `{
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "{Service Name}",
    "description": "{Service Description}",
    "provider": {
      "@type": "Organization",
      "name": "{Organization Name}",
      "url": "{Website URL}"
    }
  }`,
  isRequired: true
};

describe('populateSchemaWithSiteData', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  it('should populate schema with site data', () => {
    const schemas = [mockSchema];
    const siteData = {
      siteInfo: mockSiteInfo,
      webflowPageData: mockWebflowPageData,
      scrapedData: mockScrapedPageData,
      url: 'https://testbusiness.com/services/web-development'
    };

    const result = populateSchemaWithSiteData(schemas, siteData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Service');
    expect(result[0].jsonLdCode).toContain('Test Business');
    expect(result[0].jsonLdCode).toContain('Professional Web Development Services');
  });

  it('should handle empty schemas array', () => {
    const result = populateSchemaWithSiteData([], {});
    expect(result).toEqual([]);
  });

  it('should handle empty site data', () => {
    const schemas = [mockSchema];
    const result = populateSchemaWithSiteData(schemas, {});

    expect(result).toHaveLength(1);
    expect(result[0].jsonLdCode).toContain('{Service Name}');
    expect(result[0].jsonLdCode).toContain('{Organization Name}');
  });

  it('should populate with minimal data', () => {
    const schemas = [mockSchema];
    const siteData = {
      siteInfo: { id: 'test', siteName: 'Minimal Site' }
    };

    const result = populateSchemaWithSiteData(schemas, siteData);
    expect(result[0].jsonLdCode).toContain('Minimal Site');
  });
});

describe('Intelligent inference functions', () => {
  describe('Service name inference', () => {
    it('should prefer H1 heading over page title for service name', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Service Name}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Generic Page Title', metaDescription: 'Test' },
        scrapedData: {
          ...mockScrapedPageData,
          headings: [{ level: 1, text: 'Specific H1 Service' }]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Specific H1 Service');
    });

    it('should extract service name from URL when no title or H1 available', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Service Name}"}'
      };
      
      const siteData = {
        url: 'https://example.com/services/web-development'
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Web Development');
    });

    it('should handle URL with no meaningful parts', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Service Name}"}'
      };
      
      const siteData = {
        url: 'https://example.com/'
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('{Service Name}');
    });

    it('should use webflow page title when available', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Service Name}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Webflow Title', metaDescription: 'Test' }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Webflow Title');
    });

    it('should use scraped title when webflow title not available', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Service Name}"}'
      };
      
      const siteData = {
        scrapedData: { ...mockScrapedPageData, title: 'Scraped Title', headings: [] }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Scraped Title');
    });
  });

  describe('Description inference', () => {
    it('should prefer meta description over first paragraph for description', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"description": "{Service Description}"}'
      };
      
      const siteData = {
        webflowPageData: { 
          title: 'Test', 
          metaDescription: 'Meta description from Webflow' 
        },
        scrapedData: {
          ...mockScrapedPageData,
          paragraphs: ['This is the first paragraph that is longer than 50 characters to qualify']
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Meta description from Webflow');
    });

    it('should use first meaningful paragraph when no meta description', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"description": "{Service Description}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          metaDescription: '',
          paragraphs: [
            'Short',
            'This is a meaningful paragraph that is longer than 50 characters and should be used as description'
          ]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('This is a meaningful paragraph');
    });

    it('should truncate long paragraphs to 200 characters', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"description": "{Service Description}"}'
      };
      
      const longParagraph = 'This is a very long paragraph that exceeds 200 characters and should be truncated with ellipsis at the end to ensure it fits within the recommended length limits for meta descriptions and schema markup descriptions which help with SEO optimization.';
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          metaDescription: '',
          paragraphs: [longParagraph]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('...');
      expect(result[0].jsonLdCode.length).toBeLessThan(longParagraph.length + 100);
    });

    it('should use scraped meta description when webflow meta not available', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"description": "{Service Description}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          metaDescription: 'Scraped meta description'
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Scraped meta description');
    });
  });

  describe('Author name inference', () => {
    it('should use site name as author name', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"author": {"name": "{Author Name}"}}'
      };
      
      const siteData = {
        siteInfo: { id: 'test', siteName: 'Test Company' }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Test Company');
    });

    it('should handle missing site info for author', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"author": {"name": "{Author Name}"}}'
      };
      
      const siteData = {};

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('{Author Name}');
    });
  });

  describe('Headline inference', () => {
    it('should prefer H1 different from page title for headline', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"headline": "{Article Headline}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Page Title', metaDescription: 'Test' },
        scrapedData: {
          ...mockScrapedPageData,
          headings: [{ level: 1, text: 'Different H1 Headline' }]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Different H1 Headline');
    });

    it('should use page title when H1 matches page title', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"headline": "{Article Headline}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Same Title', metaDescription: 'Test' },
        scrapedData: {
          ...mockScrapedPageData,
          headings: [{ level: 1, text: 'Same Title' }]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Same Title');
    });

    it('should fallback to scraped title when no webflow title', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"headline": "{Article Headline}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          title: 'Scraped Title',
          headings: []
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Scraped Title');
    });
  });

  describe('Brand name inference', () => {
    it('should use site name as brand name', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"brand": {"name": "{Brand Name}"}}'
      };
      
      const siteData = {
        siteInfo: { id: 'test', siteName: 'Brand Company' }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Brand Company');
    });
  });

  describe('Category name inference', () => {
    it('should prefer H1 for category name', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Category Name}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          headings: [{ level: 1, text: 'Premium Services Category' }]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Premium Services Category');
    });

    it('should extract category from URL structure', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Category Name}"}'
      };
      
      const siteData = {
        url: 'https://example.com/products/software-development',
        scrapedData: {
          ...mockScrapedPageData,
          headings: [] // No H1 to test URL extraction
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Products');
    });

    it('should handle URL with single segment', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Category Name}"}'
      };
      
      const siteData = {
        url: 'https://example.com/single',
        webflowPageData: { title: 'Fallback Title', metaDescription: 'Test' },
        scrapedData: {
          ...mockScrapedPageData,
          headings: []
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Fallback Title');
    });
  });

  describe('Event name inference', () => {
    it('should use same logic as service name for event', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Event Name}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          headings: [{ level: 1, text: 'Annual Conference 2024' }]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Annual Conference 2024');
    });
  });

  describe('Job title inference', () => {
    it('should use same logic as service name for job title', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"title": "{Job Title}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Senior Developer Position', metaDescription: 'Test' }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Senior Developer Position');
    });
  });

  describe('Business name inference', () => {
    it('should use site name as business name', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Business Name}"}'
      };
      
      const siteData = {
        siteInfo: { id: 'test', siteName: 'Local Business LLC' }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Local Business LLC');
    });
  });

  describe('Current date inference', () => {
    it('should replace date placeholders with current ISO date', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"datePublished": "{2024-01-05T08:00:00+08:00}", "dateCreated": "{Creation Date}", "date": "{2024-01-18}"}'
      };
      
      const result = populateSchemaWithSiteData([schema], {});
      expect(result[0].jsonLdCode).toContain('2024-01-15T10:30:00.000Z');
      expect(result[0].jsonLdCode).toContain('2024-01-15');
    });
  });

  describe('Specific services inference', () => {
    it('should extract services from H2/H3 headings with service keywords', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Specific Service}"}'
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          headings: [
            { level: 2, text: 'Web Development Service' },
            { level: 2, text: 'Mobile App Solutions' },
            { level: 2, text: 'E-commerce Package' },
            { level: 3, text: 'About Us' } // Should not match
          ]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Web Development Service');
    });

    it('should handle multiple services in OfferCatalog schema', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: `{
          "@type": "OfferCatalog",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "{Specific Service}"
              }
            }
          ]
        }`
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          headings: [
            { level: 2, text: 'Web Development Service' },
            { level: 2, text: 'Mobile App Service' },
            { level: 2, text: 'E-commerce Solutions' }
          ]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Web Development Service');
      expect(result[0].jsonLdCode).toContain('Mobile App Service');
      expect(result[0].jsonLdCode).toContain('E-commerce Solutions');
    });

    it('should fallback to main service when no specific services found', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: '{"name": "{Specific Service}"}'
      };
      
      const siteData = {
        webflowPageData: { title: 'Main Service Offering', metaDescription: 'Test' },
        scrapedData: {
          ...mockScrapedPageData,
          headings: [
            { level: 2, text: 'About Us' },
            { level: 2, text: 'Contact Info' }
          ]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      expect(result[0].jsonLdCode).toContain('Main Service Offering');
    });

    it('should limit services to 3 maximum', () => {
      const schema: SchemaRecommendation = {
        ...mockSchema,
        jsonLdCode: `{
          "@type": "OfferCatalog",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service", 
                "name": "{Specific Service}"
              }
            }
          ]
        }`
      };
      
      const siteData = {
        scrapedData: {
          ...mockScrapedPageData,
          headings: [
            { level: 2, text: 'First Service' },
            { level: 2, text: 'Second Service Offering' },
            { level: 2, text: 'Third Service Package' },
            { level: 2, text: 'Fourth Service Solution' },
            { level: 2, text: 'Fifth Service Plan' }
          ]
        }
      };

      const result = populateSchemaWithSiteData([schema], siteData);
      const serviceCount = (result[0].jsonLdCode.match(/"@type": "Service"/g) || []).length;
      expect(serviceCount).toBeLessThanOrEqual(3);
    });
  });
});

describe('Domain URL handling', () => {
  it('should prefer custom domain over webflow domain', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Website URL}"}'
    };
    
    const siteData = {
      siteInfo: {
        ...mockSiteInfo,
        siteUrl: undefined,
        domains: [
          {
            id: 'webflow',
            name: 'test.webflow.io',
            host: 'test.webflow.io',
            publicUrl: 'https://test.webflow.io',
            publishedOn: '2024-01-01T00:00:00Z'
          },
          {
            id: 'custom',
            name: 'customdomain.com',
            host: 'customdomain.com', 
            publicUrl: 'https://customdomain.com',
            publishedOn: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://customdomain.com');
  });

  it('should fall back to webflow domain when no custom domain', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Website URL}"}'
    };
    
    const siteData = {
      siteInfo: {
        ...mockSiteInfo,
        siteUrl: undefined,
        domains: [
          {
            id: 'webflow',
            name: 'test.webflow.io',
            host: 'test.webflow.io',
            publicUrl: 'https://test.webflow.io',
            publishedOn: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://test.webflow.io');
  });

  it('should handle domains with url property instead of publicUrl', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Website URL}"}'
    };
    
    const siteData = {
      siteInfo: {
        ...mockSiteInfo,
        siteUrl: undefined,
        domains: [
          {
            id: 'domain1',
            name: 'test.com',
            host: 'test.com',
            url: 'https://test.com' // Using 'url' instead of 'publicUrl'
          } as any
        ]
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://test.com');
  });

  it('should handle empty domains array', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Website URL}"}'
    };
    
    const siteData = {
      siteInfo: {
        ...mockSiteInfo,
        domains: [],
        siteUrl: 'https://fallback-site.com'
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://fallback-site.com');
  });

  it('should filter out domains without URL properties', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Website URL}"}'
    };
    
    const siteData = {
      siteInfo: {
        ...mockSiteInfo,
        siteUrl: undefined,
        domains: [
          {
            id: 'invalid',
            name: 'invalid.com',
            host: 'invalid.com'
            // No url or publicUrl property
          } as any,
          {
            id: 'valid',
            name: 'valid.com',
            host: 'valid.com',
            publicUrl: 'https://valid.com',
            publishedOn: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://valid.com');
  });
});

describe('WebSite schema search functionality', () => {
  it('should populate WebSite schema with search functionality', () => {
    const websiteSchema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "@type": "WebSite",
        "url": "{Your Website URL}",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "{Your Website URL}/search?q={search_term_string}"
        }
      }`
    };
    
    const siteData = {
      siteInfo: mockSiteInfo
    };

    const result = populateSchemaWithSiteData([websiteSchema], siteData);
    expect(result[0].jsonLdCode).toContain('https://testbusiness.com/search?q={search_term_string}');
  });

  it('should handle WebSite schema without site info', () => {
    const websiteSchema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "@type": "WebSite",
        "url": "{Your Website URL}",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "{Your Website URL}/search?q={search_term_string}"
        }
      }`
    };
    
    const result = populateSchemaWithSiteData([websiteSchema], {});
    expect(result[0].jsonLdCode).toContain('{Your Website URL}/search?q={search_term_string}');
  });
});

describe('Complex schema replacement patterns', () => {
  it('should handle all organization name variations', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "org1": "{Your Organization Name}",
        "org2": "{Organization Name}",
        "pub": "{Publisher Name}",
        "prov": "{Provider Name}",
        "sell": "{Seller Name}",
        "bus": "{Business Name}",
        "comp": "{Company Name}"
      }`
    };
    
    const siteData = {
      siteInfo: { id: 'test', siteName: 'Test Org' }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('"org1": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"org2": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"pub": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"prov": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"sell": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"bus": "Test Org"');
    expect(result[0].jsonLdCode).toContain('"comp": "Test Org"');
  });

  it('should handle all URL variations', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "web": "{Your Website URL}",
        "site": "{Website URL}",
        "bus": "{Business URL}",
        "comp": "{Company Website}",
        "org": "{Organizer URL}"
      }`
    };
    
    const siteData = {
      siteInfo: { id: 'test', siteName: 'Test', siteUrl: 'https://test.com' }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('"web": "https://test.com"');
    expect(result[0].jsonLdCode).toContain('"site": "https://test.com"');
    expect(result[0].jsonLdCode).toContain('"bus": "https://test.com"');
    expect(result[0].jsonLdCode).toContain('"comp": "https://test.com"');
    expect(result[0].jsonLdCode).toContain('"org": "https://test.com"');
  });

  it('should handle all image URL variations', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "feat": "{Featured Image URL}",
        "art1": "{Article Image URL 1}",
        "art43": "{Article Image URL 4:3 ratio}",
        "art169": "{Article Image URL 16:9 ratio}",
        "event": "{Event Image URL}",
        "bus": "{Business Image URL}",
        "prod": "{Product Image URL 1}",
        "proj": "{Project Image URL}",
        "comp": "{Company Logo URL}",
        "pub": "{Publisher Logo URL}",
        "logo1": "{Logo URL}",
        "logo2": "{Your Logo URL}"
      }`
    };
    
    const siteData = {
      webflowPageData: {
        ...mockWebflowPageData,
        openGraphImage: 'https://test.com/image.jpg'
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('"feat": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"art1": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"art43": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"art169": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"event": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"bus": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"prod": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"proj": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"comp": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"pub": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"logo1": "https://test.com/image.jpg"');
    expect(result[0].jsonLdCode).toContain('"logo2": "https://test.com/image.jpg"');
  });

  it('should handle all page URL variations', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: `{
        "page": "{Page URL}",
        "contact": "{Contact Page URL}",
        "about": "{About Page URL}",
        "prod": "{Product URL}",
        "proj": "{Project URL}",
        "ticket": "{Ticket URL}"
      }`
    };
    
    const siteData = {
      url: 'https://test.com/page'
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('"page": "https://test.com/page"');
    expect(result[0].jsonLdCode).toContain('"contact": "https://test.com/page"');
    expect(result[0].jsonLdCode).toContain('"about": "https://test.com/page"');
    expect(result[0].jsonLdCode).toContain('"prod": "https://test.com/page"');
    expect(result[0].jsonLdCode).toContain('"proj": "https://test.com/page"');
    expect(result[0].jsonLdCode).toContain('"ticket": "https://test.com/page"');
  });

  it('should prioritize canonical URL over provided URL', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"url": "{Page URL}"}'
    };
    
    const siteData = {
      scrapedData: {
        ...mockScrapedPageData,
        canonicalUrl: 'https://canonical.com/page'
      },
      url: 'https://different.com/page'
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('https://canonical.com/page');
  });

  it('should handle category description from scraped data when webflow meta unavailable', () => {
    const schema: SchemaRecommendation = {
      ...mockSchema,
      jsonLdCode: '{"description": "{Category Description}"}'
    };
    
    const siteData = {
      scrapedData: {
        ...mockScrapedPageData,
        metaDescription: 'Scraped category description'
      }
    };

    const result = populateSchemaWithSiteData([schema], siteData);
    expect(result[0].jsonLdCode).toContain('Scraped category description');
  });
});