import { describe, it, expect } from 'vitest';
import { populateSchemaWithSiteData } from './schemaPopulation';
import { SchemaRecommendation, WebflowSiteInfo, WebflowPageData, ScrapedPageData } from '../types';

describe('Schema Population with Site Data', () => {
  // Mock data setup
  const mockSiteInfo: WebflowSiteInfo = {
    id: 'site123',
    siteName: 'PMDS Creative Agency',
    siteUrl: 'https://pmds.com',
    domains: [
      {
        id: 'domain1',
        name: 'pmds.com',
        host: 'pmds.com',
        publicUrl: 'https://pmds.com',
        publishedOn: '2024-01-01'
      },
      {
        id: 'domain2',
        name: 'staging.webflow.io',
        host: 'pmds-staging.webflow.io',
        publicUrl: 'https://pmds-staging.webflow.io',
        publishedOn: '2024-01-02'
      }
    ]
  };

  const mockWebflowPageData: WebflowPageData = {
    title: 'Professional Web Design Services',
    metaDescription: 'Award-winning web design and development services for modern businesses',
    canonicalUrl: 'https://pmds.com/services',
    ogImage: 'https://pmds.com/images/hero-image.jpg',
    openGraphImage: 'https://pmds.com/images/og-image.jpg',
    ogTitle: 'Web Design Services | PMDS',
    ogDescription: 'Transform your business with professional web design',
    usesTitleAsOpenGraphTitle: false,
    usesDescriptionAsOpenGraphDescription: false
  };

  const mockScrapedData: ScrapedPageData = {
    url: 'https://pmds.com/services',
    title: 'Professional Web Design Services',
    metaDescription: 'Award-winning web design and development services',
    headings: [
      { level: 1, text: 'Web Design Services' },
      { level: 2, text: 'Custom Website Development' },
      { level: 2, text: 'E-commerce Solutions' }
    ],
    paragraphs: ['We create stunning websites that convert visitors into customers.'],
    images: [
      { src: 'https://pmds.com/portfolio-1.jpg', alt: 'Portfolio example 1', size: 245760 }
    ],
    internalLinks: ['/about', '/contact'],
    outboundLinks: ['https://external-tool.com'],
    resources: { js: [], css: [] },
    canonicalUrl: 'https://pmds.com/services',
    metaKeywords: 'web design, development, services',
    ogImage: 'https://pmds.com/images/og-image.jpg',
    content: 'Professional web design services content...',
    schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
  };

  const mockUrl = 'https://pmds.com/services';

  describe('Organization Schema Population', () => {
    const organizationSchema: SchemaRecommendation = {
      name: 'Organization',
      description: 'Organization schema for business information',
      documentationUrl: 'https://schema.org/Organization',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Your Organization Name}",
  "url": "{Your Website URL}",
  "logo": "{Your Logo URL}",
  "description": "{Organization Description}",
  "sameAs": [
    "{Your Facebook URL}",
    "{Your Twitter URL}",
    "{Your LinkedIn URL}"
  ]
}`,
      isRequired: true
    };

    it('should populate organization name from site info', () => {
      const result = populateSchemaWithSiteData([organizationSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
      expect(result[0].jsonLdCode).not.toContain('{Your Organization Name}');
    });

    it('should populate website URL from site info', () => {
      const result = populateSchemaWithSiteData([organizationSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com"');
      expect(result[0].jsonLdCode).not.toContain('{Your Website URL}');
    });

    it('should populate logo URL from page Open Graph image', () => {
      const result = populateSchemaWithSiteData([organizationSchema], {
        siteInfo: mockSiteInfo,
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"logo": "https://pmds.com/images/hero-image.jpg"');
      expect(result[0].jsonLdCode).not.toContain('{Your Logo URL}');
    });

    it('should populate description from page meta description', () => {
      const result = populateSchemaWithSiteData([organizationSchema], {
        siteInfo: mockSiteInfo,
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"description": "Award-winning web design and development services for modern businesses"');
      expect(result[0].jsonLdCode).not.toContain('{Organization Description}');
    });

    it('should leave social media URLs as placeholders when not provided', () => {
      const result = populateSchemaWithSiteData([organizationSchema], {
        siteInfo: mockSiteInfo,
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('{Your Facebook URL}');
      expect(result[0].jsonLdCode).toContain('{Your Twitter URL}');
      expect(result[0].jsonLdCode).toContain('{Your LinkedIn URL}');
    });
  });

  describe('WebSite Schema Population', () => {
    const websiteSchema: SchemaRecommendation = {
      name: 'WebSite',
      description: 'Website schema with search functionality',
      documentationUrl: 'https://schema.org/WebSite',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{Your Website Name}",
  "url": "{Your Website URL}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "{Your Website URL}/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}`,
      isRequired: true
    };

    it('should populate website name and URL correctly', () => {
      const result = populateSchemaWithSiteData([websiteSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com"');
    });

    it('should populate search action target URL', () => {
      const result = populateSchemaWithSiteData([websiteSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"target": "https://pmds.com/search?q={search_term_string}"');
    });

    it('should preserve search_term_string placeholder for schema.org compliance', () => {
      const result = populateSchemaWithSiteData([websiteSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('{search_term_string}');
      expect(result[0].jsonLdCode).toContain('"query-input": "required name=search_term_string"');
    });
  });

  describe('Page-Specific Schema Population', () => {
    const blogPostSchema: SchemaRecommendation = {
      name: 'BlogPosting',
      description: 'Blog post article schema',
      documentationUrl: 'https://schema.org/BlogPosting',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{Article Title}",
  "image": ["{Featured Image URL}"],
  "datePublished": "{2024-01-05T08:00:00+08:00}",
  "author": {
    "@type": "Person",
    "name": "{Author Name}",
    "url": "{Author Profile URL}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{Publisher Name}",
    "logo": {
      "@type": "ImageObject",
      "url": "{Publisher Logo URL}"
    }
  },
  "description": "{Article Description}"
}`,
      isRequired: true
    };

    it('should populate article title from page title', () => {
      const result = populateSchemaWithSiteData([blogPostSchema], {
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"headline": "Professional Web Design Services"');
    });

    it('should populate featured image from page OG image', () => {
      const result = populateSchemaWithSiteData([blogPostSchema], {
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"image": ["https://pmds.com/images/hero-image.jpg"]');
    });

    it('should populate publisher info from site data', () => {
      const result = populateSchemaWithSiteData([blogPostSchema], {
        siteInfo: mockSiteInfo,
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com/images/hero-image.jpg"');
    });

    it('should populate article description from meta description', () => {
      const result = populateSchemaWithSiteData([blogPostSchema], {
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"description": "Award-winning web design and development services for modern businesses"');
    });
  });

  describe('Product Schema Population', () => {
    const productSchema: SchemaRecommendation = {
      name: 'Product',
      description: 'Product schema with pricing and availability',
      documentationUrl: 'https://schema.org/Product',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{Product Name}",
  "description": "{Product Description}",
  "image": ["{Product Image URL 1}"],
  "brand": {
    "@type": "Brand",
    "name": "{Brand Name}"
  },
  "offers": {
    "@type": "Offer",
    "url": "{Product URL}",
    "priceCurrency": "{Currency Code}",
    "price": "{Price}",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "{Seller Name}"
    }
  }
}`,
      isRequired: true
    };

    it('should populate product name from page title', () => {
      const result = populateSchemaWithSiteData([productSchema], {
        webflowPageData: mockWebflowPageData
      });

      expect(result[0].jsonLdCode).toContain('"name": "Professional Web Design Services"');
    });

    it('should populate product URL from provided URL', () => {
      const result = populateSchemaWithSiteData([productSchema], {
        url: mockUrl
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com/services"');
    });

    it('should populate seller name from site info', () => {
      const result = populateSchemaWithSiteData([productSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
    });
  });

  describe('URL Fallback Behavior', () => {
    const basicSchema: SchemaRecommendation = {
      name: 'Organization',
      description: 'Test schema for URL fallback',
      documentationUrl: 'https://schema.org/Organization',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Organization Name}",
  "url": "{Website URL}"
}`,
      isRequired: true
    };

    it('should use siteUrl when available', () => {
      const result = populateSchemaWithSiteData([basicSchema], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com"');
    });

    it('should fallback to custom domain when siteUrl is not available', () => {
      const siteInfoWithoutUrl: WebflowSiteInfo = {
        id: 'site456',
        siteName: 'Test Company',
        domains: [
          {
            id: 'custom-domain',
            name: 'custom.com',
            host: 'custom.com',
            publicUrl: 'https://custom.com',
            publishedOn: '2024-01-01'
          },
          {
            id: 'webflow-domain',
            name: 'staging.webflow.io',
            host: 'test-staging.webflow.io',
            publicUrl: 'https://test-staging.webflow.io',
            publishedOn: '2024-01-02'
          }
        ]
      };

      const result = populateSchemaWithSiteData([basicSchema], {
        siteInfo: siteInfoWithoutUrl
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://custom.com"');
    });

    it('should fallback to webflow domain when no custom domain exists', () => {
      const siteInfoWebflowOnly: WebflowSiteInfo = {
        id: 'site789',
        siteName: 'Webflow Only Site',
        domains: [
          {
            id: 'webflow-domain',
            name: 'staging.webflow.io',
            host: 'webflow-only.webflow.io',
            publicUrl: 'https://webflow-only.webflow.io',
            publishedOn: '2024-01-01'
          }
        ]
      };

      const result = populateSchemaWithSiteData([basicSchema], {
        siteInfo: siteInfoWebflowOnly
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://webflow-only.webflow.io"');
    });
  });

  describe('Category Page Schema with Scraped Data', () => {
    const categorySchema: SchemaRecommendation = {
      name: 'ItemList',
      description: 'Category page item list',
      documentationUrl: 'https://schema.org/ItemList',
      googleSupport: 'partial',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "{Category Name}",
  "description": "{Category Description}",
  "url": "{Page URL}"
}`,
      isRequired: true
    };

    it('should populate category name from H1 heading in scraped data', () => {
      const result = populateSchemaWithSiteData([categorySchema], {
        scrapedData: mockScrapedData
      });

      expect(result[0].jsonLdCode).toContain('"name": "Web Design Services"');
    });

    it('should use canonical URL from scraped data', () => {
      const result = populateSchemaWithSiteData([categorySchema], {
        scrapedData: mockScrapedData
      });

      expect(result[0].jsonLdCode).toContain('"url": "https://pmds.com/services"');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    const testSchema: SchemaRecommendation = {
      name: 'Test',
      description: 'Test schema',
      documentationUrl: 'https://schema.org/Thing',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Thing",
  "name": "{Your Organization Name}",
  "url": "{Your Website URL}"
}`,
      isRequired: true
    };

    it('should handle empty site data gracefully', () => {
      const result = populateSchemaWithSiteData([testSchema], {});

      expect(result).toHaveLength(1);
      expect(result[0].jsonLdCode).toContain('{Your Organization Name}');
      expect(result[0].jsonLdCode).toContain('{Your Website URL}');
    });

    it('should handle null/undefined values gracefully', () => {
      const siteInfoWithNulls: WebflowSiteInfo = {
        id: 'test',
        siteName: '',
        siteUrl: undefined,
        domains: []
      };

      const result = populateSchemaWithSiteData([testSchema], {
        siteInfo: siteInfoWithNulls
      });

      expect(result[0].jsonLdCode).toContain('{Your Organization Name}');
      expect(result[0].jsonLdCode).toContain('{Your Website URL}');
    });

    it('should handle empty schema array', () => {
      const result = populateSchemaWithSiteData([], {
        siteInfo: mockSiteInfo
      });

      expect(result).toHaveLength(0);
    });

    it('should preserve original schema structure when no data matches', () => {
      const schemaWithUnmatchedPlaceholders: SchemaRecommendation = {
        name: 'Custom',
        description: 'Custom schema with unique placeholders',
        documentationUrl: 'https://schema.org/Thing',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Thing",
  "customField": "{Unique Placeholder}",
  "anotherField": "{Another Unique Placeholder}"
}`,
        isRequired: false
      };

      const result = populateSchemaWithSiteData([schemaWithUnmatchedPlaceholders], {
        siteInfo: mockSiteInfo
      });

      expect(result[0].jsonLdCode).toContain('{Unique Placeholder}');
      expect(result[0].jsonLdCode).toContain('{Another Unique Placeholder}');
    });
  });

  describe('Multiple Schema Processing', () => {
    const multipleSchemas: SchemaRecommendation[] = [
      {
        name: 'Organization',
        description: 'Organization schema',
        documentationUrl: 'https://schema.org/Organization',
        googleSupport: 'yes',
        jsonLdCode: `{"@type": "Organization", "name": "{Organization Name}"}`,
        isRequired: true
      },
      {
        name: 'WebSite',
        description: 'Website schema',
        documentationUrl: 'https://schema.org/WebSite',
        googleSupport: 'yes',
        jsonLdCode: `{"@type": "WebSite", "name": "{Your Website Name}", "url": "{Your Website URL}"}`,
        isRequired: true
      }
    ];

    it('should process multiple schemas independently', () => {
      const result = populateSchemaWithSiteData(multipleSchemas, {
        siteInfo: mockSiteInfo
      });

      expect(result).toHaveLength(2);
      expect(result[0].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
      expect(result[1].jsonLdCode).toContain('"name": "PMDS Creative Agency"');
      expect(result[1].jsonLdCode).toContain('"url": "https://pmds.com"');
    });

    it('should maintain schema order and metadata', () => {
      const result = populateSchemaWithSiteData(multipleSchemas, {
        siteInfo: mockSiteInfo
      });

      expect(result[0].name).toBe('Organization');
      expect(result[0].description).toBe('Organization schema');
      expect(result[0].isRequired).toBe(true);
      
      expect(result[1].name).toBe('WebSite');
      expect(result[1].description).toBe('Website schema');
      expect(result[1].isRequired).toBe(true);
    });
  });

  describe('Image Data Priority', () => {
    const imageSchema: SchemaRecommendation = {
      name: 'Article',
      description: 'Article with image',
      documentationUrl: 'https://schema.org/Article',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Article",
  "image": "{Featured Image URL}",
  "publisher": {
    "logo": "{Publisher Logo URL}"
  }
}`,
      isRequired: true
    };

    it('should prioritize ogImage over openGraphImage', () => {
      const pageDataWithBothImages: WebflowPageData = {
        title: 'Test Article',
        metaDescription: 'Test description',
        ogImage: 'https://pmds.com/priority-image.jpg',
        openGraphImage: 'https://pmds.com/fallback-image.jpg'
      };

      const result = populateSchemaWithSiteData([imageSchema], {
        webflowPageData: pageDataWithBothImages
      });

      expect(result[0].jsonLdCode).toContain('https://pmds.com/priority-image.jpg');
      expect(result[0].jsonLdCode).not.toContain('https://pmds.com/fallback-image.jpg');
    });

    it('should use openGraphImage when ogImage is not available', () => {
      const pageDataWithOpenGraphOnly: WebflowPageData = {
        title: 'Test Article',
        metaDescription: 'Test description',
        openGraphImage: 'https://pmds.com/og-image.jpg'
      };

      const result = populateSchemaWithSiteData([imageSchema], {
        webflowPageData: pageDataWithOpenGraphOnly
      });

      expect(result[0].jsonLdCode).toContain('https://pmds.com/og-image.jpg');
    });
  });
});