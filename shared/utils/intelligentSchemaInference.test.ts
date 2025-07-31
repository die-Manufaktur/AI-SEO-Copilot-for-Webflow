import { describe, it, expect } from 'vitest';
import { populateSchemaWithSiteData } from './schemaPopulation';
import { SchemaRecommendation, WebflowSiteInfo, WebflowPageData, ScrapedPageData } from '../types';

describe('Intelligent Schema Inference', () => {
  // Mock data for a service page like "/services/web-development"
  const mockServiceSiteData = {
    siteInfo: {
      id: 'site123',
      siteName: 'PMDS',
      siteUrl: 'https://www.pmds.pull-list.net',
      domains: [
        {
          id: 'domain1',
          name: 'pmds.pull-list.net',
          host: 'pmds.pull-list.net',
          publicUrl: 'https://www.pmds.pull-list.net',
          publishedOn: '2024-01-01'
        }
      ]
    } as WebflowSiteInfo,
    webflowPageData: {
      title: 'Web Development Services | PMDS',
      metaDescription: 'Professional web development services including custom websites, e-commerce solutions, and web applications for modern businesses.',
      canonicalUrl: 'https://www.pmds.pull-list.net/services/web-development',
      ogImage: 'https://www.pmds.pull-list.net/images/web-dev-hero.jpg'
    } as WebflowPageData,
    scrapedData: {
      url: 'https://www.pmds.pull-list.net/services/web-development',
      title: 'Web Development Services',
      metaDescription: 'Professional web development services including custom websites, e-commerce solutions, and web applications for modern businesses.',
      headings: [
        { level: 1, text: 'Professional Web Development' },
        { level: 2, text: 'Custom Website Development' },
        { level: 2, text: 'E-commerce Solutions' },
        { level: 2, text: 'Web Application Development' }
      ],
      paragraphs: [
        'We create stunning, responsive websites that drive business growth and engage your audience.',
        'Our team specializes in modern web technologies and best practices to deliver exceptional results.'
      ],
      images: [
        { src: 'https://www.pmds.pull-list.net/portfolio-1.jpg', alt: 'Portfolio example', size: 245760 }
      ],
      internalLinks: ['/about', '/contact'],
      outboundLinks: [],
      resources: { js: [], css: [] },
      canonicalUrl: 'https://www.pmds.pull-list.net/services/web-development',
      metaKeywords: 'web development, custom websites, e-commerce',
      ogImage: 'https://www.pmds.pull-list.net/images/web-dev-hero.jpg',
      content: 'Professional web development services content...',
      schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
    } as ScrapedPageData,
    url: 'https://www.pmds.pull-list.net/services/web-development'
  };

  describe('Service Schema Intelligent Population', () => {
    const serviceSchema: SchemaRecommendation = {
      name: 'Service',
      description: 'Service schema with intelligent inference',
      documentationUrl: 'https://schema.org/Service',
      googleSupport: 'no',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{Service Name}",
  "description": "{Service Description}",
  "provider": {
    "@type": "Organization",
    "name": "{Provider Name}"
  },
  "areaServed": {
    "@type": "Place",
    "name": "{Service Area}"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "{Service Catalog Name}",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "{Specific Service}"
        }
      }
    ]
  }
}`,
      isRequired: true
    };

    it('should infer service name from H1 heading', () => {
      const result = populateSchemaWithSiteData([serviceSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Professional Web Development"');
      expect(result[0].jsonLdCode).not.toContain('{Service Name}');
    });

    it('should infer service description from meta description', () => {
      const result = populateSchemaWithSiteData([serviceSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"description": "Professional web development services including custom websites, e-commerce solutions, and web applications for modern businesses."');
      expect(result[0].jsonLdCode).not.toContain('{Service Description}');
    });

    it('should populate provider from site info', () => {
      const result = populateSchemaWithSiteData([serviceSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "PMDS"');
      expect(result[0].jsonLdCode).not.toContain('{Provider Name}');
    });

    it('should infer service catalog name from URL structure', () => {
      const result = populateSchemaWithSiteData([serviceSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Services Catalog"');
      expect(result[0].jsonLdCode).not.toContain('{Service Catalog Name}');
    });

    it('should populate specific service from H1 heading', () => {
      const result = populateSchemaWithSiteData([serviceSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Professional Web Development"');
      expect(result[0].jsonLdCode).not.toContain('{Specific Service}');
    });

    it('should fallback to URL parsing when no H1 exists', () => {
      const dataWithoutH1 = {
        ...mockServiceSiteData,
        scrapedData: {
          ...mockServiceSiteData.scrapedData,
          headings: [
            { level: 2, text: 'Our Services' },
            { level: 3, text: 'Development Process' }
          ]
        } as ScrapedPageData
      };

      const result = populateSchemaWithSiteData([serviceSchema], dataWithoutH1);
      
      expect(result[0].jsonLdCode).toContain('"name": "Web Development"'); // From URL
    });
  });

  describe('Product Schema Intelligent Population', () => {
    const productSchema: SchemaRecommendation = {
      name: 'Product',
      description: 'Product schema with intelligent inference',
      documentationUrl: 'https://schema.org/Product',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{Product Name}",
  "description": "{Product Description}",
  "brand": {
    "@type": "Brand",
    "name": "{Brand Name}"
  },
  "offers": {
    "@type": "Offer",
    "url": "{Product URL}",
    "seller": {
      "@type": "Organization",
      "name": "{Seller Name}"
    }
  }
}`,
      isRequired: true
    };

    it('should infer product name from H1 heading', () => {
      const result = populateSchemaWithSiteData([productSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Professional Web Development"');
    });

    it('should infer brand name from site info', () => {
      const result = populateSchemaWithSiteData([productSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "PMDS"'); // Brand name
    });

    it('should populate product URL from provided URL', () => {
      const result = populateSchemaWithSiteData([productSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"url": "https://www.pmds.pull-list.net/services/web-development"');
    });
  });

  describe('BlogPosting Schema Intelligent Population', () => {
    const blogData = {
      siteInfo: mockServiceSiteData.siteInfo,
      webflowPageData: {
        title: 'How to Build Modern Web Applications',
        metaDescription: 'Learn the best practices for building scalable, modern web applications using the latest technologies and frameworks.',
        ogImage: 'https://www.pmds.pull-list.net/blog/modern-web-apps.jpg'
      } as WebflowPageData,
      scrapedData: {
        ...mockServiceSiteData.scrapedData,
        url: 'https://www.pmds.pull-list.net/blog/modern-web-applications',
        headings: [
          { level: 1, text: 'Building Modern Web Applications in 2024' },
          { level: 2, text: 'Choosing the Right Framework' },
          { level: 2, text: 'Performance Optimization' }
        ],
        paragraphs: [
          'Modern web applications require careful planning and the right technology stack to succeed.',
          'In this comprehensive guide, we\'ll explore the key considerations for building scalable web apps.'
        ]
      } as ScrapedPageData,
      url: 'https://www.pmds.pull-list.net/blog/modern-web-applications'
    };

    const blogSchema: SchemaRecommendation = {
      name: 'BlogPosting',
      description: 'Blog post with intelligent inference',
      documentationUrl: 'https://schema.org/BlogPosting',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{Article Headline}",
  "image": ["{Featured Image URL}"],
  "datePublished": "{2024-01-05T08:00:00+08:00}",
  "author": {
    "@type": "Person",
    "name": "{Author Name}"
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

    it('should infer headline from H1 when different from page title', () => {
      const result = populateSchemaWithSiteData([blogSchema], blogData);
      
      expect(result[0].jsonLdCode).toContain('"headline": "Building Modern Web Applications in 2024"');
    });

    it('should infer author name from site info', () => {
      const result = populateSchemaWithSiteData([blogSchema], blogData);
      
      expect(result[0].jsonLdCode).toContain('"name": "PMDS"'); // Author name
    });

    it('should add current date for publication', () => {
      const result = populateSchemaWithSiteData([blogSchema], blogData);
      
      // Should contain a valid ISO date
      expect(result[0].jsonLdCode).toMatch(/"datePublished": "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/);
    });

    it('should infer article description from meta description', () => {
      const result = populateSchemaWithSiteData([blogSchema], blogData);
      
      expect(result[0].jsonLdCode).toContain('"description": "Learn the best practices for building scalable, modern web applications using the latest technologies and frameworks."');
    });
  });

  describe('Event Schema Intelligent Population', () => {
    const eventData = {
      siteInfo: mockServiceSiteData.siteInfo,
      webflowPageData: {
        title: 'Web Development Workshop 2024',
        metaDescription: 'Join our intensive web development workshop covering modern frameworks, best practices, and hands-on coding exercises.',
        ogImage: 'https://www.pmds.pull-list.net/events/workshop-2024.jpg'
      } as WebflowPageData,
      scrapedData: {
        ...mockServiceSiteData.scrapedData,
        url: 'https://www.pmds.pull-list.net/events/web-dev-workshop',
        headings: [
          { level: 1, text: 'Web Development Intensive Workshop' },
          { level: 2, text: 'What You\'ll Learn' },
          { level: 2, text: 'Schedule & Location' }
        ]
      } as ScrapedPageData,
      url: 'https://www.pmds.pull-list.net/events/web-dev-workshop'
    };

    const eventSchema: SchemaRecommendation = {
      name: 'Event',
      description: 'Event schema with intelligent inference',
      documentationUrl: 'https://schema.org/Event',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "{Event Name}",
  "description": "{Event Description}",
  "organizer": {
    "@type": "Organization",
    "name": "{Organization Name}",
    "url": "{Organizer URL}"
  }
}`,
      isRequired: true
    };

    it('should infer event name from H1 heading', () => {
      const result = populateSchemaWithSiteData([eventSchema], eventData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Web Development Intensive Workshop"');
    });

    it('should infer event description from meta description', () => {
      const result = populateSchemaWithSiteData([eventSchema], eventData);
      
      expect(result[0].jsonLdCode).toContain('"description": "Join our intensive web development workshop covering modern frameworks, best practices, and hands-on coding exercises."');
    });
  });

  describe('JobPosting Schema Intelligent Population', () => {
    const jobData = {
      siteInfo: mockServiceSiteData.siteInfo,
      webflowPageData: {
        title: 'Senior Frontend Developer Position',
        metaDescription: 'Join our team as a Senior Frontend Developer. Work on exciting projects using React, TypeScript, and modern web technologies.',
        ogImage: 'https://www.pmds.pull-list.net/careers/frontend-dev.jpg'
      } as WebflowPageData,
      scrapedData: {
        ...mockServiceSiteData.scrapedData,
        url: 'https://www.pmds.pull-list.net/careers/senior-frontend-developer',
        headings: [
          { level: 1, text: 'Senior Frontend Developer' },
          { level: 2, text: 'Responsibilities' },
          { level: 2, text: 'Requirements' }
        ]
      } as ScrapedPageData,
      url: 'https://www.pmds.pull-list.net/careers/senior-frontend-developer'
    };

    const jobSchema: SchemaRecommendation = {
      name: 'JobPosting',
      description: 'Job posting with intelligent inference',
      documentationUrl: 'https://schema.org/JobPosting',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "{Job Title}",
  "description": "{Job Description}",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "{Company Name}"
  },
  "datePosted": "{2024-01-18}"
}`,
      isRequired: true
    };

    it('should infer job title from H1 heading', () => {
      const result = populateSchemaWithSiteData([jobSchema], jobData);
      
      expect(result[0].jsonLdCode).toContain('"title": "Senior Frontend Developer"');
    });

    it('should add current date for posting', () => {
      const result = populateSchemaWithSiteData([jobSchema], jobData);
      
      // Should contain current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      expect(result[0].jsonLdCode).toContain(`"datePosted": "${today}"`);
    });
  });

  describe('LocalBusiness Schema Intelligent Population', () => {
    const businessSchema: SchemaRecommendation = {
      name: 'LocalBusiness',
      description: 'Local business with intelligent inference',
      documentationUrl: 'https://schema.org/LocalBusiness',
      googleSupport: 'yes',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{Business Name}",
  "url": "{Business URL}"
}`,
      isRequired: true
    };

    it('should infer business name from site info', () => {
      const result = populateSchemaWithSiteData([businessSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "PMDS"');
    });

    it('should populate business URL from site URL', () => {
      const result = populateSchemaWithSiteData([businessSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"url": "https://www.pmds.pull-list.net"');
    });
  });

  describe('Multiple Service Inference', () => {
    const multiServiceData = {
      ...mockServiceSiteData,
      scrapedData: {
        ...mockServiceSiteData.scrapedData,
        headings: [
          { level: 1, text: 'Our Development Services' },
          { level: 2, text: 'Custom Website Development Service' },
          { level: 2, text: 'E-commerce Solutions Package' },
          { level: 2, text: 'Mobile App Development Service' }
        ]
      } as ScrapedPageData
    };

    const serviceSchema: SchemaRecommendation = {
      name: 'Service',
      description: 'Service with multiple offerings',
      documentationUrl: 'https://schema.org/Service',
      googleSupport: 'no',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Service",
  "hasOfferCatalog": {
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
  }
}`,
      isRequired: true
    };

    it('should extract multiple services from H2 headings', () => {
      const result = populateSchemaWithSiteData([serviceSchema], multiServiceData);
      
      // Should contain multiple service offerings
      expect(result[0].jsonLdCode).toContain('Custom Website Development Service');
      expect(result[0].jsonLdCode).toContain('E-commerce Solutions Package');
      expect(result[0].jsonLdCode).toContain('Mobile App Development Service');
    });
  });

  describe('WebPage Schema Intelligent Population', () => {
    const webPageSchema: SchemaRecommendation = {
      name: 'WebPage',
      description: 'WebPage schema with intelligent inference',
      documentationUrl: 'https://schema.org/WebPage',
      googleSupport: 'no',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{Page Title}",
  "description": "{Page Description}",
  "url": "{Page URL}"
}`,
      isRequired: true
    };

    it('should populate page title from H1 heading when available', () => {
      const result = populateSchemaWithSiteData([webPageSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Professional Web Development"');
      expect(result[0].jsonLdCode).not.toContain('{Page Title}');
    });

    it('should populate page description from meta description', () => {
      const result = populateSchemaWithSiteData([webPageSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"description": "Professional web development services including custom websites, e-commerce solutions, and web applications for modern businesses."');
      expect(result[0].jsonLdCode).not.toContain('{Page Description}');
    });

    it('should populate page URL from provided URL', () => {
      const result = populateSchemaWithSiteData([webPageSchema], mockServiceSiteData);
      
      expect(result[0].jsonLdCode).toContain('"url": "https://www.pmds.pull-list.net/services/web-development"');
      expect(result[0].jsonLdCode).not.toContain('{Page URL}');
    });

    it('should fallback from H1 to page title when H1 is not available', () => {
      const dataWithoutH1 = {
        ...mockServiceSiteData,
        scrapedData: {
          ...mockServiceSiteData.scrapedData,
          headings: [
            { level: 2, text: 'Service Details' },
            { level: 3, text: 'Our Process' }
          ]
        } as ScrapedPageData
      };

      const result = populateSchemaWithSiteData([webPageSchema], dataWithoutH1);
      
      expect(result[0].jsonLdCode).toContain('"name": "Web Development Services | PMDS"'); // From page title
    });

    it('should extract page name from URL when no headings or titles are available', () => {
      const minimalPageData = {
        siteInfo: mockServiceSiteData.siteInfo,
        url: 'https://www.pmds.pull-list.net/services/web-development'
      };

      const result = populateSchemaWithSiteData([webPageSchema], minimalPageData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Web Development"'); // From URL parsing
      expect(result[0].jsonLdCode).toContain('"url": "https://www.pmds.pull-list.net/services/web-development"');
    });
  });

  describe('Fallback Behavior', () => {
    const minimalData = {
      siteInfo: {
        id: 'site123',
        siteName: 'Test Site',
        siteUrl: 'https://example.com'
      } as WebflowSiteInfo,
      url: 'https://example.com/some/page'
    };

    const basicSchema: SchemaRecommendation = {
      name: 'Service',
      description: 'Minimal service schema',
      documentationUrl: 'https://schema.org/Service',
      googleSupport: 'no',
      jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{Service Name}",
  "description": "{Service Description}"
}`,
      isRequired: true
    };

    it('should extract service name from URL when no other data available', () => {
      const result = populateSchemaWithSiteData([basicSchema], minimalData);
      
      expect(result[0].jsonLdCode).toContain('"name": "Page"'); // From URL "/some/page"
    });

    it('should preserve placeholders when no data can be inferred', () => {
      const result = populateSchemaWithSiteData([basicSchema], minimalData);
      
      expect(result[0].jsonLdCode).toContain('{Service Description}'); // No description data available
    });
  });
});