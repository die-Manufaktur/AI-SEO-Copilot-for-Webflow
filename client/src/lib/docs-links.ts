/**
 * Map check titles to documentation URLs
 */
export const getLearnMoreUrl = (checkTitle: string): string => {
  const baseUrl = "https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation";

  const checkUrls: Record<string, string> = {
    "Keyphrase in Title": `${baseUrl}/meta-seo/keyphrase-in-title`,
    "Keyphrase in Meta Description": `${baseUrl}/meta-seo/keyphrase-in-meta-description`,
    "Keyphrase in URL": `${baseUrl}/meta-seo/keyphrase-in-url`,
    "Content Length on page": `${baseUrl}/content-optimization/content-length-on-page`,
    "Keyphrase Density": `${baseUrl}/content-optimization/keyphrase-density`,
    "Keyphrase in Introduction": `${baseUrl}/content-optimization/keyphrase-in-introduction`,
    "Image Alt Attributes": `${baseUrl}/images/image-alt-attributes`,
    "Internal Links": `${baseUrl}/links/internal-links`,
    "Outbound Links": `${baseUrl}/links/outbound-links`,
    "Next-Gen Image Formats": `${baseUrl}/images/next-gen-image-formats`,
    "OpenGraph Image": `${baseUrl}/images/opengraph-image`, 
    "Open Graph Title and Description": `${baseUrl}/meta-seo/open-graph-title-and-description`,
    "Keyphrase in H1 Heading": `${baseUrl}/content-optimization/keyphrase-in-h1-heading`,
    "Keyphrase in H2 Headings": `${baseUrl}/content-optimization/keyphrase-in-h2-headings`,
    "Heading Hierarchy": `${baseUrl}/content-optimization/heading-hierarchy`,
    "Code Minification": `${baseUrl}/tech-seo/code-minification`,
    "Schema Markup": `${baseUrl}/tech-seo/schema-markup`,
    "Image File Size": `${baseUrl}/images/image-file-size`,
  };

  return checkUrls[checkTitle] || `${baseUrl}/seo-optimization-guide`;
};
