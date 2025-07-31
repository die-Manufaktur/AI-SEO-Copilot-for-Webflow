import { SchemaRecommendation, WebflowSiteInfo, WebflowPageData, ScrapedPageData } from '../types';

interface SiteData {
  siteInfo?: WebflowSiteInfo;
  webflowPageData?: WebflowPageData;
  scrapedData?: ScrapedPageData;
  url?: string;
}

/**
 * Populates schema JSON-LD code with actual site data
 */
export function populateSchemaWithSiteData(
  schemas: SchemaRecommendation[],
  siteData: SiteData
): SchemaRecommendation[] {
  return schemas.map(schema => ({
    ...schema,
    jsonLdCode: populateSchemaCode(schema.jsonLdCode, siteData)
  }));
}

/**
 * Intelligent data inference helpers
 */

/**
 * Infers service/product name from page title and headings
 */
function inferServiceName(siteData: SiteData): string | undefined {
  // Priority: H1 heading > Page title > Extract from URL
  const h1 = siteData.scrapedData?.headings?.find(h => h.level === 1)?.text;
  if (h1) return h1;
  
  if (siteData.webflowPageData?.title) return siteData.webflowPageData.title;
  if (siteData.scrapedData?.title) return siteData.scrapedData.title;
  
  // Extract from URL - convert "/services/web-development" to "Web Development"
  if (siteData.url) {
    const urlParts = siteData.url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart !== '') {
      return lastPart.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return undefined;
}

/**
 * Infers detailed description from meta description and content
 */
function inferDetailedDescription(siteData: SiteData): string | undefined {
  // Priority: Meta description > First paragraph > Extract from content
  if (siteData.webflowPageData?.metaDescription) {
    return siteData.webflowPageData.metaDescription;
  }
  
  if (siteData.scrapedData?.metaDescription) {
    return siteData.scrapedData.metaDescription;
  }
  
  // Use first meaningful paragraph
  const firstParagraph = siteData.scrapedData?.paragraphs?.find(p => p.length > 50);
  if (firstParagraph) {
    // Truncate if too long
    return firstParagraph.length > 200 ? firstParagraph.substring(0, 197) + '...' : firstParagraph;
  }
  
  return undefined;
}

/**
 * Infers author name from content or site info
 */
function inferAuthorName(siteData: SiteData): string | undefined {
  // Could be enhanced to extract from content, for now use site name
  return siteData.siteInfo?.siteName;
}

/**
 * Infers article/blog headline from title and headings
 */
function inferHeadline(siteData: SiteData): string | undefined {
  // For articles, prefer H1 > page title
  const h1 = siteData.scrapedData?.headings?.find(h => h.level === 1)?.text;
  if (h1 && h1 !== siteData.webflowPageData?.title) return h1;
  
  return siteData.webflowPageData?.title || siteData.scrapedData?.title;
}

/**
 * Infers brand name from site info
 */
function inferBrandName(siteData: SiteData): string | undefined {
  return siteData.siteInfo?.siteName;
}

/**
 * Infers category name from URL structure and headings
 */
function inferCategoryName(siteData: SiteData): string | undefined {
  // Try H1 first
  const h1 = siteData.scrapedData?.headings?.find(h => h.level === 1)?.text;
  if (h1) return h1;
  
  // Extract from URL structure - "/services/web-development" -> "Services"
  if (siteData.url) {
    const urlParts = siteData.url.split('/').filter(part => part !== '');
    if (urlParts.length >= 2) {
      const categoryPart = urlParts[urlParts.length - 2]; // Second to last part
      return categoryPart.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return siteData.webflowPageData?.title || siteData.scrapedData?.title;
}

/**
 * Infers event name from title and headings
 */
function inferEventName(siteData: SiteData): string | undefined {
  return inferServiceName(siteData); // Same logic as service name
}

/**
 * Infers job title from title and headings
 */
function inferJobTitle(siteData: SiteData): string | undefined {
  return inferServiceName(siteData); // Same logic as service name
}

/**
 * Infers organization/business name for local business
 */
function inferBusinessName(siteData: SiteData): string | undefined {
  return siteData.siteInfo?.siteName;
}

/**
 * Gets current date in ISO format for datePublished
 */
function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Infers specific service offerings from content
 */
function inferSpecificServices(siteData: SiteData): string[] {
  const services: string[] = [];
  
  // Extract from H2/H3 headings that might indicate services
  const subHeadings = siteData.scrapedData?.headings?.filter(h => h.level >= 2 && h.level <= 3) || [];
  
  for (const heading of subHeadings) {
    // Look for patterns that suggest services
    if (heading.text.match(/(service|solution|offering|package|plan)/i)) {
      services.push(heading.text);
    }
  }
  
  // If no specific services found, return the main service
  if (services.length === 0) {
    const mainService = inferServiceName(siteData);
    if (mainService) services.push(mainService);
  }
  
  return services.slice(0, 3); // Limit to 3 services
}

/**
 * Populates a single schema JSON-LD code string with actual site data and intelligent inference
 */
function populateSchemaCode(jsonLdCode: string, siteData: SiteData): string {
  let populatedCode = jsonLdCode;

  // Intelligent inference - get inferred data once
  const inferredServiceName = inferServiceName(siteData);
  const inferredDescription = inferDetailedDescription(siteData);
  const inferredHeadline = inferHeadline(siteData);
  const inferredAuthor = inferAuthorName(siteData);
  const inferredBrand = inferBrandName(siteData);
  const inferredCategory = inferCategoryName(siteData);
  const inferredEventName = inferEventName(siteData);
  const inferredJobTitle = inferJobTitle(siteData);
  const inferredBusiness = inferBusinessName(siteData);
  const currentDate = getCurrentISODate();
  const specificServices = inferSpecificServices(siteData);

  // Site-level data
  if (siteData.siteInfo) {
    populatedCode = populatedCode
      .replace(/\{Your Website Name\}/g, siteData.siteInfo.siteName || '{Your Website Name}')
      .replace(/\{Your Organization Name\}/g, siteData.siteInfo.siteName || '{Your Organization Name}')
      .replace(/\{Organization Name\}/g, siteData.siteInfo.siteName || '{Organization Name}')
      .replace(/\{Publisher Name\}/g, siteData.siteInfo.siteName || '{Publisher Name}')
      .replace(/\{Provider Name\}/g, siteData.siteInfo.siteName || '{Provider Name}')
      .replace(/\{Seller Name\}/g, siteData.siteInfo.siteName || '{Seller Name}')
      .replace(/\{Business Name\}/g, inferredBusiness || siteData.siteInfo.siteName || '{Business Name}')
      .replace(/\{Company Name\}/g, siteData.siteInfo.siteName || '{Company Name}');

    // Get the site URL with fallback to primary domain
    const siteUrl = siteData.siteInfo.siteUrl || getPrimaryDomainUrl(siteData.siteInfo);
    
    if (siteUrl) {
      populatedCode = populatedCode
        .replace(/\{Your Website URL\}/g, siteUrl)
        .replace(/\{Website URL\}/g, siteUrl)
        .replace(/\{Business URL\}/g, siteUrl)
        .replace(/\{Company Website\}/g, siteUrl)
        .replace(/\{Organizer URL\}/g, siteUrl);
    }
  }

  // Intelligent WebPage Schema Population (basic pages)
  if (inferredServiceName) {
    populatedCode = populatedCode
      .replace(/\{Page Title\}/g, inferredServiceName)
      .replace(/\{Service Name\}/g, inferredServiceName)
      .replace(/\{Product Name\}/g, inferredServiceName)
      .replace(/\{Software Name\}/g, inferredServiceName);
  }
  
  if (inferredDescription) {
    populatedCode = populatedCode
      .replace(/\{Page Description\}/g, inferredDescription)
      .replace(/\{Service Description\}/g, inferredDescription)
      .replace(/\{Product Description\}/g, inferredDescription)
      .replace(/\{Software Description\}/g, inferredDescription)
      .replace(/\{Job Description\}/g, inferredDescription)
      .replace(/\{Event Description\}/g, inferredDescription);
  }

  // Intelligent Article/Blog Schema Population
  if (inferredHeadline) {
    populatedCode = populatedCode
      .replace(/\{Article Title\}/g, inferredHeadline)
      .replace(/\{Article Headline\}/g, inferredHeadline)
      .replace(/\{Event Name\}/g, inferredEventName || inferredHeadline);
  }

  if (inferredAuthor) {
    populatedCode = populatedCode
      .replace(/\{Author Name\}/g, inferredAuthor);
  }

  if (inferredBrand) {
    populatedCode = populatedCode
      .replace(/\{Brand Name\}/g, inferredBrand);
  }

  // Intelligent Category/Job Schema Population
  if (inferredCategory) {
    populatedCode = populatedCode
      .replace(/\{Category Name\}/g, inferredCategory)
      .replace(/\{Service Catalog Name\}/g, `${inferredCategory} Catalog`);
  }

  if (inferredJobTitle) {
    populatedCode = populatedCode
      .replace(/\{Job Title\}/g, inferredJobTitle);
  }

  // Add current date for articles/events where publication date is needed
  populatedCode = populatedCode
    .replace(/\{2024-01-05T08:00:00\+08:00\}/g, currentDate)
    .replace(/\{2024-01-18\}/g, currentDate.split('T')[0])
    .replace(/\{Creation Date\}/g, currentDate);

  // Intelligent URL Population
  if (siteData.url) {
    populatedCode = populatedCode
      .replace(/\{Page URL\}/g, siteData.url)
      .replace(/\{Contact Page URL\}/g, siteData.url)
      .replace(/\{About Page URL\}/g, siteData.url)
      .replace(/\{Product URL\}/g, siteData.url)
      .replace(/\{Project URL\}/g, siteData.url)
      .replace(/\{Ticket URL\}/g, siteData.url);
  }

  // Intelligent specific services population
  if (specificServices.length > 0) {
    const firstService = specificServices[0];
    populatedCode = populatedCode
      .replace(/\{Specific Service\}/g, firstService);
    
    // If there are multiple services, create a more detailed offer catalog
    if (specificServices.length > 1) {
      const serviceOffers = specificServices.map((service, index) => `
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "${service}"
        }
      }`).join(',');
      
      // Replace the single offer with multiple offers if the schema supports it
      populatedCode = populatedCode.replace(
        /"itemListElement": \[\s*\{\s*"@type": "Offer",\s*"itemOffered": \{\s*"@type": "Service",\s*"name": "[^"]*"\s*\}\s*\}\s*\]/,
        `"itemListElement": [${serviceOffers}]`
      );
    }
  }

  // Page-level data from Webflow
  if (siteData.webflowPageData) {
    populatedCode = populatedCode
      .replace(/\{Page Title\}/g, siteData.webflowPageData.title || '{Page Title}')
      .replace(/\{Article Title\}/g, siteData.webflowPageData.title || '{Article Title}')
      .replace(/\{Article Headline\}/g, siteData.webflowPageData.title || '{Article Headline}')
      .replace(/\{Event Name\}/g, siteData.webflowPageData.title || '{Event Name}')
      .replace(/\{Job Title\}/g, siteData.webflowPageData.title || '{Job Title}')
      .replace(/\{Product Name\}/g, siteData.webflowPageData.title || '{Product Name}')
      .replace(/\{Software Name\}/g, siteData.webflowPageData.title || '{Software Name}')
      .replace(/\{Service Name\}/g, siteData.webflowPageData.title || '{Service Name}')
      .replace(/\{Project Name\}/g, siteData.webflowPageData.title || '{Project Name}');

    populatedCode = populatedCode
      .replace(/\{Page Description\}/g, siteData.webflowPageData.metaDescription || '{Page Description}')
      .replace(/\{Article Description\}/g, siteData.webflowPageData.metaDescription || '{Article Description}')
      .replace(/\{Event Description\}/g, siteData.webflowPageData.metaDescription || '{Event Description}')
      .replace(/\{Job Description\}/g, siteData.webflowPageData.metaDescription || '{Job Description}')
      .replace(/\{Product Description\}/g, siteData.webflowPageData.metaDescription || '{Product Description}')
      .replace(/\{Software Description\}/g, siteData.webflowPageData.metaDescription || '{Software Description}')
      .replace(/\{Service Description\}/g, siteData.webflowPageData.metaDescription || '{Service Description}')
      .replace(/\{Project Description\}/g, siteData.webflowPageData.metaDescription || '{Project Description}')
      .replace(/\{Organization Description\}/g, siteData.webflowPageData.metaDescription || '{Organization Description}')
      .replace(/\{Contact Page Description\}/g, siteData.webflowPageData.metaDescription || '{Contact Page Description}')
      .replace(/\{About Page Description\}/g, siteData.webflowPageData.metaDescription || '{About Page Description}')
      .replace(/\{Legal Page Description\}/g, siteData.webflowPageData.metaDescription || '{Legal Page Description}');

    if (siteData.webflowPageData.ogImage || siteData.webflowPageData.openGraphImage) {
      const imageUrl = siteData.webflowPageData.ogImage || siteData.webflowPageData.openGraphImage;
      populatedCode = populatedCode
        .replace(/\{Featured Image URL\}/g, imageUrl!)
        .replace(/\{Article Image URL 1\}/g, imageUrl!)
        .replace(/\{Article Image URL 4:3 ratio\}/g, imageUrl!)
        .replace(/\{Article Image URL 16:9 ratio\}/g, imageUrl!)
        .replace(/\{Event Image URL\}/g, imageUrl!)
        .replace(/\{Business Image URL\}/g, imageUrl!)
        .replace(/\{Product Image URL 1\}/g, imageUrl!)
        .replace(/\{Project Image URL\}/g, imageUrl!)
        .replace(/\{Company Logo URL\}/g, imageUrl!)
        .replace(/\{Publisher Logo URL\}/g, imageUrl!)
        .replace(/\{Logo URL\}/g, imageUrl!)
        .replace(/\{Your Logo URL\}/g, imageUrl!);
    }
  }

  // URL data is now handled in intelligent inference section above

  // Scraped data can provide additional context
  if (siteData.scrapedData) {
    // Use first H1 heading as category name for category pages
    const h1Heading = siteData.scrapedData.headings.find(h => h.level === 1);
    if (h1Heading) {
      populatedCode = populatedCode
        .replace(/\{Category Name\}/g, h1Heading.text || '{Category Name}');
    }

    // Use meta description for category description if not already populated
    if (siteData.scrapedData.metaDescription && !siteData.webflowPageData?.metaDescription) {
      populatedCode = populatedCode
        .replace(/\{Category Description\}/g, siteData.scrapedData.metaDescription);
    }

    // Use canonical URL if available
    if (siteData.scrapedData.canonicalUrl) {
      populatedCode = populatedCode
        .replace(/\{Page URL\}/g, siteData.scrapedData.canonicalUrl)
        .replace(/\{Contact Page URL\}/g, siteData.scrapedData.canonicalUrl)
        .replace(/\{About Page URL\}/g, siteData.scrapedData.canonicalUrl)
        .replace(/\{Product URL\}/g, siteData.scrapedData.canonicalUrl)
        .replace(/\{Project URL\}/g, siteData.scrapedData.canonicalUrl);
    }
  }

  // Add search functionality for WebSite schema
  if (populatedCode.includes('"@type": "WebSite"') && siteData.siteInfo) {
    const siteUrl = siteData.siteInfo.siteUrl || getPrimaryDomainUrl(siteData.siteInfo);
    if (siteUrl) {
      populatedCode = populatedCode
        .replace(/\{Your Website URL\}\/search\?q=\{search_term_string\}/g, 
          `${siteUrl}/search?q={search_term_string}`);
    }
  }

  return populatedCode;
}

/**
 * Gets the primary domain URL from site info
 */
function getPrimaryDomainUrl(siteInfo?: WebflowSiteInfo): string | undefined {
  if (!siteInfo?.domains || siteInfo.domains.length === 0) {
    return siteInfo?.siteUrl;
  }

  // Handle different domain structures - check for both 'url' and 'publicUrl' properties
  const domains = siteInfo.domains.map(d => ({
    url: (d as any).url || (d as any).publicUrl,
    isWebflow: ((d as any).url || (d as any).publicUrl || '').includes('.webflow.io')
  })).filter(d => d.url);

  // Find custom domain first, then fall back to webflow domain
  const customDomain = domains.find(d => !d.isWebflow);
  const webflowDomain = domains.find(d => d.isWebflow);
  
  return customDomain?.url || webflowDomain?.url || siteInfo.siteUrl;
}