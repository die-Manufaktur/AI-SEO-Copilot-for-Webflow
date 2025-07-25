import { PageTypeSchema, SchemaRecommendation } from '../types';

/**
 * Mapping of page types to their recommended schema markups
 */
export const schemaRecommendations: PageTypeSchema[] = [
  {
    pageType: 'Homepage',
    schemas: [
      {
        name: 'WebSite',
        description: 'Helps Google understand your site structure and enables sitelinks search box',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/site-names',
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
      },
      {
        name: 'Organization',
        description: 'Provides information about your organization for knowledge panel',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/organization',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Your Organization Name}",
  "url": "{Your Website URL}",
  "logo": "{Your Logo URL}",
  "sameAs": [
    "{Your Facebook URL}",
    "{Your Twitter URL}",
    "{Your LinkedIn URL}"
  ]
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'Category page',
    schemas: [
      {
        name: 'ItemList',
        description: 'Helps structure category listings, works with Product/Recipe items for carousels',
        documentationUrl: 'https://schema.org/ItemList',
        googleSupport: 'partial',
        googleSupportNote: 'Used in carousel with rich-result items like Product/Recipe',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "{Category Name}",
  "description": "{Category Description}",
  "numberOfItems": {number},
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "@id": "{Product URL}",
        "name": "{Product Name}"
      }
    }
  ]
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'Product page',
    schemas: [
      {
        name: 'Product',
        description: 'Enables rich product results with pricing, availability, and reviews',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/product',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{Product Name}",
  "description": "{Product Description}",
  "image": [
    "{Product Image URL 1}",
    "{Product Image URL 2}"
  ],
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
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{Average Rating}",
    "reviewCount": "{Number of Reviews}"
  }
}`,
        isRequired: true
      },
      {
        name: 'FAQPage',
        description: 'Add frequently asked questions about the product',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question 1}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer 1}"
    }
  }, {
    "@type": "Question",
    "name": "{Question 2}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer 2}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Product software page',
    schemas: [
      {
        name: 'SoftwareApplication',
        description: 'Enables rich software app results with ratings and details',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/software-app',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{Software Name}",
  "operatingSystem": "{Operating System}",
  "applicationCategory": "{Category}",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{Rating}",
    "ratingCount": "{Number of Ratings}"
  },
  "offers": {
    "@type": "Offer",
    "price": "{Price}",
    "priceCurrency": "{Currency Code}"
  }
}`,
        isRequired: true
      },
      {
        name: 'Product',
        description: 'Alternative product markup for software',
        documentationUrl: 'https://schema.org/Product',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{Software Name}",
  "description": "{Software Description}",
  "category": "Software",
  "offers": {
    "@type": "Offer",
    "price": "{Price}",
    "priceCurrency": "{Currency Code}"
  }
}`,
        isRequired: false
      },
      {
        name: 'FAQPage',
        description: 'Add frequently asked questions about the software',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Blog post',
    schemas: [
      {
        name: 'BlogPosting',
        description: 'Enables article rich results with headline, images, and publish date',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{Article Title}",
  "image": [
    "{Featured Image URL}"
  ],
  "datePublished": "{2024-01-05T08:00:00+08:00}",
  "dateModified": "{2024-02-05T09:20:00+08:00}",
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
      },
      {
        name: 'FAQPage',
        description: 'Add frequently asked questions from the article',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Landing page',
    schemas: [
      {
        name: 'WebPage',
        description: 'Basic webpage markup for landing pages',
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
      },
      {
        name: 'FAQPage',
        description: 'If FAQ section is present on the landing page',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Contact page',
    schemas: [
      {
        name: 'ContactPage',
        description: 'Identifies the page as a contact page',
        documentationUrl: 'https://schema.org/ContactPage',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Us",
  "description": "{Contact Page Description}",
  "url": "{Contact Page URL}"
}`,
        isRequired: true
      },
      {
        name: 'Organization',
        description: 'Organization contact information',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/organization',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Organization Name}",
  "url": "{Website URL}",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "{Phone Number}",
    "contactType": "customer service",
    "email": "{Email Address}",
    "availableLanguage": "English"
  }
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'About page',
    schemas: [
      {
        name: 'AboutPage',
        description: 'Identifies the page as an about page',
        documentationUrl: 'https://schema.org/AboutPage',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Us",
  "description": "{About Page Description}",
  "url": "{About Page URL}"
}`,
        isRequired: true
      },
      {
        name: 'Organization',
        description: 'Detailed organization information',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/organization',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Organization Name}",
  "url": "{Website URL}",
  "logo": "{Logo URL}",
  "description": "{Organization Description}",
  "foundingDate": "{Founding Date}",
  "founders": [{
    "@type": "Person",
    "name": "{Founder Name}"
  }],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{Street Address}",
    "addressLocality": "{City}",
    "addressRegion": "{State/Region}",
    "postalCode": "{Postal Code}",
    "addressCountry": "{Country}"
  }
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Service page',
    schemas: [
      {
        name: 'Service',
        description: 'Describes a service offered',
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
      },
      {
        name: 'FAQPage',
        description: 'Add frequently asked questions about the service',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Portfolio/project page',
    schemas: [
      {
        name: 'CreativeWork',
        description: 'Describes a creative work or project',
        documentationUrl: 'https://schema.org/CreativeWork',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "{Project Name}",
  "description": "{Project Description}",
  "creator": {
    "@type": "Person",
    "name": "{Creator Name}"
  },
  "dateCreated": "{Creation Date}",
  "image": "{Project Image URL}",
  "url": "{Project URL}"
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'Testimonial page',
    schemas: [
      {
        name: 'Review',
        description: 'Customer reviews (only if about a specific product/service)',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/review-snippet',
        googleSupport: 'yes',
        googleSupportNote: 'Only if about a product or service',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "{Product/Service Name}"
  },
  "author": {
    "@type": "Person",
    "name": "{Reviewer Name}"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "{Rating}",
    "bestRating": "5"
  },
  "reviewBody": "{Review Text}"
}`,
        isRequired: true
      },
      {
        name: 'WebPage',
        description: 'Fallback for general testimonial pages',
        documentationUrl: 'https://schema.org/WebPage',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Testimonials",
  "description": "{Page Description}",
  "url": "{Page URL}"
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Location page',
    schemas: [
      {
        name: 'LocalBusiness',
        description: 'Enables local business rich results with location and hours',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/local-business',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{Business Name}",
  "image": "{Business Image URL}",
  "@id": "{Business URL}",
  "url": "{Business URL}",
  "telephone": "{Phone Number}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{Street Address}",
    "addressLocality": "{City}",
    "addressRegion": "{State}",
    "postalCode": "{Postal Code}",
    "addressCountry": "{Country Code}"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": {latitude},
    "longitude": {longitude}
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  },
  "sameAs": [
    "{Facebook Page URL}",
    "{Twitter Profile URL}"
  ]
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'Legal page',
    schemas: [
      {
        name: 'WebPage',
        description: 'Legal document pages (Terms of Service, Privacy Policy)',
        documentationUrl: 'https://schema.org/WebPage',
        googleSupport: 'no',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{Terms of Service or Privacy Policy}",
  "description": "{Legal Page Description}",
  "url": "{Page URL}",
  "inLanguage": "en-US",
  "isPartOf": {
    "@type": "WebSite",
    "url": "{Website URL}"
  }
}`,
        isRequired: true
      }
    ]
  },
  {
    pageType: 'Event page',
    schemas: [
      {
        name: 'Event',
        description: 'Enables event rich results with date, location, and tickets',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/event',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "{Event Name}",
  "startDate": "{2024-07-21T19:00-05:00}",
  "endDate": "{2024-07-21T23:00-05:00}",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "{Venue Name}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{Street Address}",
      "addressLocality": "{City}",
      "postalCode": "{Postal Code}",
      "addressRegion": "{State}",
      "addressCountry": "{Country Code}"
    }
  },
  "image": [
    "{Event Image URL}"
  ],
  "description": "{Event Description}",
  "offers": {
    "@type": "Offer",
    "url": "{Ticket URL}",
    "price": "{Price}",
    "priceCurrency": "{Currency Code}",
    "availability": "https://schema.org/InStock",
    "validFrom": "{2024-05-21T12:00}"
  },
  "performer": {
    "@type": "PerformingGroup",
    "name": "{Performer Name}"
  },
  "organizer": {
    "@type": "Organization",
    "name": "{Organizer Name}",
    "url": "{Organizer URL}"
  }
}`,
        isRequired: true
      },
      {
        name: 'FAQPage',
        description: 'Add frequently asked questions about the event',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
        isRequired: false
      }
    ]
  },
  {
    pageType: 'Press/news page',
    schemas: [
      {
        name: 'NewsArticle',
        description: 'Enables news article rich results with headline and publish date',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "{Article Headline}",
  "image": [
    "{Article Image URL 1}",
    "{Article Image URL 4:3 ratio}",
    "{Article Image URL 16:9 ratio}"
  ],
  "datePublished": "{2024-01-05T08:00:00+08:00}",
  "dateModified": "{2024-02-05T09:20:00+08:00}",
  "author": [{
    "@type": "Person",
    "name": "{Author Name}",
    "url": "{Author Profile URL}"
  }],
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
      }
    ]
  },
  {
    pageType: 'Job/career page',
    schemas: [
      {
        name: 'JobPosting',
        description: 'Enables job posting rich results with salary and requirements',
        documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/job-posting',
        googleSupport: 'yes',
        jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "{Job Title}",
  "description": "{Job Description}",
  "identifier": {
    "@type": "PropertyValue",
    "name": "{Company Name}",
    "value": "{Job ID}"
  },
  "datePosted": "{2024-01-18}",
  "validThrough": "{2024-03-18T00:00}",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "{Company Name}",
    "sameAs": "{Company Website}",
    "logo": "{Company Logo URL}"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{Street Address}",
      "addressLocality": "{City}",
      "addressRegion": "{State}",
      "postalCode": "{Postal Code}",
      "addressCountry": "{Country Code}"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "{Currency Code}",
    "value": {
      "@type": "QuantitativeValue",
      "value": {Salary},
      "unitText": "YEAR"
    }
  }
}`,
        isRequired: true
      }
    ]
  }
];

/**
 * Get schema recommendations for a specific page type
 */
export function getSchemaRecommendations(pageType: string): SchemaRecommendation[] {
  const pageSchema = schemaRecommendations.find(ps => ps.pageType === pageType);
  return pageSchema?.schemas || [];
}

/**
 * Get all available page types
 */
export function getPageTypes(): string[] {
  return schemaRecommendations.map(ps => ps.pageType);
}