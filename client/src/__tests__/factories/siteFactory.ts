/**
 * Test data factory for generating Webflow site-related test data
 * Provides dynamic test data generation for various site scenarios
 */

import { build, fake, sequence } from 'test-data-bot';

export interface TestSite {
  _id: string;
  name: string;
  shortName: string;
  lastPublished?: string;
  previewUrl: string;
  timezone: string;
  database: string;
  customDomains?: TestCustomDomain[];
  locales?: TestLocale[];
}

export interface TestCustomDomain {
  _id: string;
  url: string;
  sslStatus: 'pending' | 'active' | 'error';
}

export interface TestLocale {
  _id: string;
  cmsLocaleId: string;
  tag: string;
  displayName: string;
  enabled: boolean;
  primary: boolean;
}

export interface TestPage {
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
  seo: {
    title: string;
    description: string;
  };
  openGraph: {
    title: string;
    description: string;
    titleCopied?: boolean;
    descriptionCopied?: boolean;
  };
}

export interface TestCMSCollection {
  _id: string;
  lastUpdated: string;
  createdOn: string;
  name: string;
  slug: string;
  singularName: string;
  fields: TestCMSField[];
}

export interface TestCMSField {
  id: string;
  type: 'PlainText' | 'RichText' | 'Image' | 'Number' | 'Link' | 'DateTime' | 'Option' | 'Switch';
  slug: string;
  name: string;
  required: boolean;
  editable: boolean;
  helpText?: string;
  metadata?: any;
}

export interface TestCMSItem {
  _id: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, any>;
  cmsLocaleId?: string;
}

/**
 * Factory for generating test sites
 */
export const siteFactory = build<TestSite>('Site', {
  _id: sequence((x: number) => `site_${x.toString().padStart(5, '0')}`),
  name: fake((f) => `${f.company.name()} Website`),
  shortName: fake((f) => f.internet.domainWord()),
  lastPublished: fake((f) => f.date.recent().toISOString()),
  previewUrl: fake((f) => `https://${f.internet.domainWord()}.webflow.io`),
  timezone: fake((f) => f.location.timeZone()),
  database: sequence((x: number) => `db_${x.toString().padStart(5, '0')}`),
});

/**
 * Factory for generating custom domains
 */
export const customDomainFactory = build<TestCustomDomain>('CustomDomain', {
  _id: sequence((x: number) => `domain_${x.toString().padStart(5, '0')}`),
  url: fake((f) => `https://${f.internet.domainName()}`),
  sslStatus: fake((f) => f.helpers.arrayElement(['pending', 'active', 'error'])),
});

/**
 * Factory for generating locales
 */
export const localeFactory = build<TestLocale>('Locale', {
  _id: sequence((x: number) => `locale_${x.toString().padStart(5, '0')}`),
  cmsLocaleId: sequence((x: number) => `cms_locale_${x.toString().padStart(5, '0')}`),
  tag: fake((f) => f.helpers.arrayElement(['en-US', 'fr-FR', 'de-DE', 'es-ES', 'it-IT'])),
  displayName: fake((f) => f.helpers.arrayElement(['English (US)', 'French', 'German', 'Spanish', 'Italian'])),
  enabled: fake((f) => f.datatype.boolean()),
  primary: false,
});

/**
 * Factory for generating test pages
 */
export const pageFactory = build<TestPage>('Page', {
  _id: sequence((x: number) => `page_${x.toString().padStart(5, '0')}`),
  siteId: sequence((x: number) => `site_${x.toString().padStart(5, '0')}`),
  title: fake((f) => f.lorem.words({ min: 2, max: 4 })),
  slug: fake((f) => f.helpers.slugify(f.lorem.words({ min: 2, max: 4 }))),
  createdOn: fake((f) => f.date.past().toISOString()),
  lastUpdated: fake((f) => f.date.recent().toISOString()),
  isHomePage: false,
  isFolderHomePage: false,
  archived: false,
  draft: false,
  seo: {
    title: fake((f) => f.lorem.sentence({ min: 5, max: 10 })),
    description: fake((f) => f.lorem.paragraph({ min: 1, max: 3 })),
  },
  openGraph: {
    title: fake((f) => f.lorem.sentence({ min: 5, max: 10 })),
    description: fake((f) => f.lorem.paragraph({ min: 1, max: 3 })),
    titleCopied: false,
    descriptionCopied: false,
  },
});

/**
 * Factory for generating CMS collections
 */
export const cmsCollectionFactory = build<TestCMSCollection>('CMSCollection', {
  _id: sequence((x: number) => `collection_${x.toString().padStart(5, '0')}`),
  lastUpdated: fake((f) => f.date.recent().toISOString()),
  createdOn: fake((f) => f.date.past().toISOString()),
  name: fake((f) => f.helpers.arrayElement(['Blog Posts', 'Products', 'Team Members', 'Testimonials', 'Case Studies'])),
  slug: fake((f) => f.helpers.slugify(f.helpers.arrayElement(['blog-posts', 'products', 'team-members', 'testimonials', 'case-studies']))),
  singularName: fake((f) => f.helpers.arrayElement(['Blog Post', 'Product', 'Team Member', 'Testimonial', 'Case Study'])),
  fields: [],
});

/**
 * Factory for generating CMS fields
 */
export const cmsFieldFactory = build<TestCMSField>('CMSField', {
  id: sequence((x: number) => `field_${x.toString().padStart(5, '0')}`),
  type: fake((f) => f.helpers.arrayElement(['PlainText', 'RichText', 'Image', 'Number', 'Link', 'DateTime'])),
  slug: fake((f) => f.helpers.slugify(f.lorem.word())),
  name: fake((f) => f.lorem.words({ min: 1, max: 3 })),
  required: fake((f) => f.datatype.boolean()),
  editable: true,
  helpText: fake((f) => f.lorem.sentence()),
});

/**
 * Factory for generating CMS items
 */
export const cmsItemFactory = build<TestCMSItem>('CMSItem', {
  _id: sequence((x: number) => `item_${x.toString().padStart(5, '0')}`),
  lastUpdated: fake((f) => f.date.recent().toISOString()),
  createdOn: fake((f) => f.date.past().toISOString()),
  isArchived: false,
  isDraft: fake((f) => f.datatype.boolean()),
  fieldData: {
    name: fake((f) => f.lorem.words({ min: 2, max: 5 })),
    slug: fake((f) => f.helpers.slugify(f.lorem.words({ min: 2, max: 5 }))),
  },
});

/**
 * Utility functions for common site scenarios
 */
export const siteFactoryUtils = {
  /**
   * Create a site with custom domains
   */
  createSiteWithDomains: (domainCount = 2) => {
    const site = siteFactory();
    const domains = Array.from({ length: domainCount }, () => customDomainFactory());
    return { ...site, customDomains: domains };
  },

  /**
   * Create a multilingual site
   */
  createMultilingualSite: () => {
    const site = siteFactory();
    const locales = [
      localeFactory({ tag: 'en-US', displayName: 'English (US)', primary: true, enabled: true }),
      localeFactory({ tag: 'fr-FR', displayName: 'French', primary: false, enabled: true }),
      localeFactory({ tag: 'de-DE', displayName: 'German', primary: false, enabled: true }),
    ];
    return { ...site, locales };
  },

  /**
   * Create a site with pages
   */
  createSiteWithPages: (pageCount = 5) => {
    const site = siteFactory();
    const pages = Array.from({ length: pageCount }, (_, index) => 
      pageFactory({
        siteId: site._id,
        isHomePage: index === 0,
        slug: index === 0 ? '' : undefined,
      })
    );
    return { site, pages };
  },

  /**
   * Create a blog collection with items
   */
  createBlogCollection: (itemCount = 10) => {
    const collection = cmsCollectionFactory({
      name: 'Blog Posts',
      slug: 'blog-posts',
      singularName: 'Blog Post',
      fields: [
        cmsFieldFactory({ id: 'field_name', slug: 'name', name: 'Name', type: 'PlainText', required: true }),
        cmsFieldFactory({ id: 'field_slug', slug: 'slug', name: 'Slug', type: 'PlainText', required: true }),
        cmsFieldFactory({ id: 'field_content', slug: 'content', name: 'Content', type: 'RichText', required: false }),
        cmsFieldFactory({ id: 'field_featured_image', slug: 'featured-image', name: 'Featured Image', type: 'Image', required: false }),
        cmsFieldFactory({ id: 'field_publish_date', slug: 'publish-date', name: 'Publish Date', type: 'DateTime', required: false }),
      ],
    });

    const items = Array.from({ length: itemCount }, () => 
      cmsItemFactory({
        fieldData: {
          name: fake((f) => f.lorem.words({ min: 3, max: 8 })),
          slug: fake((f) => f.helpers.slugify(f.lorem.words({ min: 3, max: 8 }))),
          content: fake((f) => `<p>${f.lorem.paragraphs({ min: 2, max: 5 }, '<br/>')}</p>`),
          'featured-image': {
            url: fake((f) => f.image.url()),
            alt: fake((f) => f.lorem.sentence()),
          },
          'publish-date': fake((f) => f.date.past().toISOString()),
        },
      })
    );

    return { collection, items };
  },

  /**
   * Create an e-commerce site with products
   */
  createEcommerceSite: () => {
    const site = siteFactory({ name: 'E-commerce Store' });
    const { collection: productCollection, items: products } = siteFactoryUtils.createProductCollection();
    const pages = siteFactoryUtils.createSiteWithPages(8).pages;
    
    return { site, pages, productCollection, products };
  },

  /**
   * Create a product collection
   */
  createProductCollection: (itemCount = 20) => {
    const collection = cmsCollectionFactory({
      name: 'Products',
      slug: 'products',
      singularName: 'Product',
      fields: [
        cmsFieldFactory({ id: 'field_name', slug: 'name', name: 'Product Name', type: 'PlainText', required: true }),
        cmsFieldFactory({ id: 'field_slug', slug: 'slug', name: 'Slug', type: 'PlainText', required: true }),
        cmsFieldFactory({ id: 'field_description', slug: 'description', name: 'Description', type: 'RichText', required: false }),
        cmsFieldFactory({ id: 'field_price', slug: 'price', name: 'Price', type: 'Number', required: true }),
        cmsFieldFactory({ id: 'field_image', slug: 'main-image', name: 'Main Image', type: 'Image', required: false }),
      ],
    });

    const items = Array.from({ length: itemCount }, () => 
      cmsItemFactory({
        fieldData: {
          name: fake((f) => f.commerce.productName()),
          slug: fake((f) => f.helpers.slugify(f.commerce.productName())),
          description: fake((f) => `<p>${f.commerce.productDescription()}</p>`),
          price: fake((f) => parseFloat(f.commerce.price())),
          'main-image': {
            url: fake((f) => f.image.url()),
            alt: fake((f) => f.commerce.productName()),
          },
        },
      })
    );

    return { collection, items };
  },
};