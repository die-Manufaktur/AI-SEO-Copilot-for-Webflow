import { describe, it, expect } from 'vitest';
import { 
  schemaRecommendations, 
  getSchemaRecommendations, 
  getPageTypes 
} from './schemaRecommendations';

describe('Schema Recommendations', () => {
  describe('getPageTypes', () => {
    it('should return exactly 16 page types from the spec', () => {
      const pageTypes = getPageTypes();
      
      expect(pageTypes).toHaveLength(16);
      expect(pageTypes).toEqual([
        'Homepage',
        'Category page',
        'Product page',
        'Product software page',
        'Blog post',
        'Landing page',
        'Contact page',
        'About page',
        'Service page',
        'Portfolio/project page',
        'Testimonial page',
        'Location page',
        'Legal page',
        'Event page',
        'Press/news page',
        'Job/career page'
      ]);
    });
  });

  describe('getSchemaRecommendations', () => {
    it('should return empty array for unknown page type', () => {
      const schemas = getSchemaRecommendations('Unknown page type');
      expect(schemas).toEqual([]);
    });

    it('should return Homepage schemas correctly', () => {
      const schemas = getSchemaRecommendations('Homepage');
      
      expect(schemas).toHaveLength(2);
      expect(schemas[0].name).toBe('WebSite');
      expect(schemas[0].googleSupport).toBe('yes');
      expect(schemas[0].isRequired).toBe(true);
      expect(schemas[1].name).toBe('Organization');
      expect(schemas[1].googleSupport).toBe('yes');
      expect(schemas[1].isRequired).toBe(true);
    });

    it('should return Product page schemas with required and optional', () => {
      const schemas = getSchemaRecommendations('Product page');
      
      expect(schemas).toHaveLength(2);
      
      const productSchema = schemas.find(s => s.name === 'Product');
      const faqSchema = schemas.find(s => s.name === 'FAQPage');
      
      expect(productSchema).toBeDefined();
      expect(productSchema?.isRequired).toBe(true);
      expect(productSchema?.googleSupport).toBe('yes');
      
      expect(faqSchema).toBeDefined();
      expect(faqSchema?.isRequired).toBe(false);
      expect(faqSchema?.googleSupport).toBe('yes');
    });

    it('should return Event page schemas correctly', () => {
      const schemas = getSchemaRecommendations('Event page');
      
      expect(schemas).toHaveLength(2);
      
      const eventSchema = schemas.find(s => s.name === 'Event');
      const faqSchema = schemas.find(s => s.name === 'FAQPage');
      
      expect(eventSchema).toBeDefined();
      expect(eventSchema?.isRequired).toBe(true);
      expect(eventSchema?.googleSupport).toBe('yes');
      
      expect(faqSchema).toBeDefined();
      expect(faqSchema?.isRequired).toBe(false);
    });
  });

  describe('Schema data integrity', () => {
    it('should have valid JSON-LD for all schemas', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        pageTypeSchema.schemas.forEach(schema => {
          expect(() => {
            JSON.parse(schema.jsonLdCode);
          }).not.toThrow();
        });
      });
    });

    it('should have required fields for all schemas', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        pageTypeSchema.schemas.forEach(schema => {
          expect(schema.name).toBeTruthy();
          expect(schema.description).toBeTruthy();
          expect(schema.documentationUrl).toMatch(/^https?:\/\//);
          expect(['yes', 'no', 'partial']).toContain(schema.googleSupport);
          expect(schema.jsonLdCode).toBeTruthy();
          expect(typeof schema.isRequired).toBe('boolean');
        });
      });
    });

    it('should have @context and @type in all JSON-LD schemas', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        pageTypeSchema.schemas.forEach(schema => {
          const parsed = JSON.parse(schema.jsonLdCode);
          expect(parsed['@context']).toBe('https://schema.org');
          expect(parsed['@type']).toBeTruthy();
        });
      });
    });

    it('should have Google support documentation for schemas with yes/partial support', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        pageTypeSchema.schemas.forEach(schema => {
          if (schema.googleSupport === 'yes' || schema.googleSupport === 'partial') {
            expect(schema.documentationUrl).toMatch(
              /developers\.google\.com\/search\/docs|schema\.org/
            );
          }
        });
      });
    });

    it('should have placeholder values in JSON-LD code', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        pageTypeSchema.schemas.forEach(schema => {
          // Check if placeholders are properly formatted with curly braces
          const placeholderPattern = /\{[^}]+\}/g;
          const placeholders = schema.jsonLdCode.match(placeholderPattern);
          
          if (placeholders) {
            placeholders.forEach(placeholder => {
              expect(placeholder).toMatch(/^\{.+\}$/);
              expect(placeholder.length).toBeGreaterThan(2); // More than just {}
            });
          }
        });
      });
    });
  });

  describe('Page type coverage', () => {
    it('should have schemas for all 16 specified page types', () => {
      const expectedPageTypes = [
        'Homepage',
        'Category page',
        'Product page',
        'Product software page',
        'Blog post',
        'Landing page',
        'Contact page',
        'About page',
        'Service page',
        'Portfolio/project page',
        'Testimonial page',
        'Location page',
        'Legal page',
        'Event page',
        'Press/news page',
        'Job/career page'
      ];

      expectedPageTypes.forEach(pageType => {
        const schemas = getSchemaRecommendations(pageType);
        expect(schemas.length).toBeGreaterThan(0);
      });
    });

    it('should have at least one required schema for each page type', () => {
      schemaRecommendations.forEach(pageTypeSchema => {
        const requiredSchemas = pageTypeSchema.schemas.filter(s => s.isRequired);
        expect(requiredSchemas.length).toBeGreaterThan(0);
      });
    });
  });
});