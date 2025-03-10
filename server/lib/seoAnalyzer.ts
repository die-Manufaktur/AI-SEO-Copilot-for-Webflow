import { scrapeWebpage } from "./webScraper";
import { getGPTRecommendation } from "./gpt";
import type { SEOCheck } from "../../client/src/lib/types";

interface SuccessMessages {
  [key: string]: string;
}

// Checks that can use GPT recommendations (can be controlled via environment variable)
// Empty array means no GPT recommendations for any checks
const enabledGPTChecks = process.env.ENABLED_GPT_CHECKS ?
  process.env.ENABLED_GPT_CHECKS.split(',') :
  [
    "Keyphrase in Title",
    "Keyphrase in Meta Description",
    "Keyphrase in Introduction",
    "Keyphrase in H1 Heading",
    "Keyphrase in H2 Headings"
  ];

// Helper function to calculate keyphrase density
function calculateKeyphraseDensity(content: string, keyphrase: string): {
  density: number;
  occurrences: number;
  totalWords: number;
} {
  // Normalize content and keyphrase
  const normalizedContent = content.toLowerCase().trim();
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();

  // Count total words in content
  const totalWords = normalizedContent.split(/\s+/).filter(word => word.length > 0).length;

  // Count non-overlapping occurrences of the keyphrase
  const regex = new RegExp(`\\b${normalizedKeyphrase}\\b`, 'gi');
  const matches = normalizedContent.match(regex) || [];
  const occurrences = matches.length;

  // Calculate density as percentage
  const density = (occurrences * (normalizedKeyphrase.split(/\s+/).length)) / totalWords * 100;

  return {
    density,
    occurrences,
    totalWords
  };
}

// Add this helper function at the top with other helpers
function isHomePage(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Consider it a homepage if the path is "/" or empty, ignoring query parameters
    return urlObj.pathname === "/" || urlObj.pathname === "";
  } catch {
    return false;
  }
}

// Map of check titles to their SEO priority
const checkPriorities: Record<string, 'high' | 'medium' | 'low'> = {
  "Keyphrase in Title": "high",
  "Keyphrase in Meta Description": "high",
  "Keyphrase in URL": "medium",
  "Content Length": "high",
  "Keyphrase Density": "medium",
  "Keyphrase in Introduction": "medium",
  "Image Alt Attributes": "low",
  "Internal Links": "medium",
  "Outbound Links": "low",
  "Next-Gen Image Formats": "low",
  "OG Image": "medium",
  "OG Title and Description": "medium",
  "Keyphrase in H1 Heading": "high",
  "Keyphrase in H2 Headings": "medium",
  "Heading Hierarchy": "high",
  "Code Minification": "low",
  "Schema Markup": "medium",
  "Image File Size": "medium" // Added new check with medium priority
};

// Custom recommendation templates for non-GPT fallbacks
const fallbackRecommendations: Record<string, (params: any) => string> = {
  "Keyphrase in Title": ({ keyphrase, title }) =>
    `Consider rewriting your title to include '${keyphrase}', preferably at the beginning.`,

  "Keyphrase in Meta Description": ({ keyphrase }) =>
    `Add '${keyphrase}' to your meta description in a natural way that encourages clicks.`,

  "Keyphrase in Introduction": ({ keyphrase }) =>
    `Mention '${keyphrase}' in your first paragraph to establish relevance early.`,

  "Keyphrase in H1 Heading": ({ keyphrase }) =>
    `Include '${keyphrase}' in your main H1 heading to improve SEO.`,

  "Keyphrase in H2 Headings": ({ keyphrase }) =>
    `Use '${keyphrase}' in at least one H2 subheading to reinforce topic relevance.`,

  "Image Alt Attributes": ({ keyphrase }) =>
    `Add descriptive alt text containing '${keyphrase}' to at least one relevant image.`,

  "Internal Links": () =>
    `Add links to other relevant pages on your site to improve navigation and SEO.`,

  "Outbound Links": () =>
    `Link to reputable external sources to increase your content's credibility.`,

  "Image File Size": ({ largeImages }) => {
    if (largeImages.length === 0) return '';

    const imageListText = largeImages.map((img: { src: string; alt: string; size?: number }) => {
      // Use alt text if available, otherwise use a default message
      const imageLabel = img.alt ?
        (img.alt.length > 40 ? img.alt.substring(0, 40) + '...' : img.alt) :
        'Image with missing alt text';
      return `• ${imageLabel} (${formatBytes(img.size)})`;
    }).join('\n');

    return `Compress these large images to improve page load times:\n${imageListText}\n\nConsider using tools like TinyPNG, Squoosh, or ImageOptim.`;
  }
};

// Helper function to format bytes to KB or MB
function formatBytes(bytes?: number): string {
  if (!bytes) return 'Unknown size';

  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

export async function analyzeSEOElements(url: string, keyphrase: string) {
  try {
    const scrapedData = await scrapeWebpage(url);
    const checks: SEOCheck[] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    // Success messages object moved inside the function to access url parameter
    const messages: SuccessMessages = {
      "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
      "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
      "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! ✨" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
      "Content Length": "Well done! Your content length is good for SEO.",
      "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
      "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
      "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
      "Internal Links": "Perfect! You have a good number of internal links.",
      "Outbound Links": "Excellent! You've included relevant outbound links.",
      "Next-Gen Image Formats": "Excellent! Your images use modern, optimized formats.",
      "OG Image": "Great job! Your page has a properly configured Open Graph image.",
      "OG Title and Description": "Perfect! Open Graph title and description are well configured.",
      "Keyphrase in H1 Heading": "Excellent! Your main H1 heading effectively includes the keyphrase.",
      "Keyphrase in H2 Headings": "Great job! Your H2 subheadings include the keyphrase, reinforcing your topic focus.",
      "Heading Hierarchy": "Great job! Your page has a proper heading tag hierarchy.",
      "Code Minification": "Excellent! Your JavaScript and CSS files are properly minified for better performance.",
      "Schema Markup": "Great job! Your page has schema markup implemented, making it easier for search engines to understand your content.",
      "Image File Size": "Great job! All your images are well-optimized, keeping your page loading times fast."
    };

    // Helper function to add check results
    const addCheck = async (
      title: string,
      description: string,
      passed: boolean,
      context?: string,
      skipRecommendation = false
    ) => {
      let recommendation = "";

      if (passed) {
        passedChecks++;
      } else {
        failedChecks++;
        if (!skipRecommendation) {
          // Check if this check type is enabled for GPT recommendations
          const useGPT = enabledGPTChecks.includes(title);

          if (useGPT) {
            try {
              recommendation = await getGPTRecommendation(title, keyphrase, context);
            } catch (error) {
              console.log(`GPT API Error: ${error}`);

              // Use fallback recommendation if GPT fails
              if (title === "Schema Markup") {
                recommendation = generateSchemaMarkupRecommendation(scrapedData, url);
              } else if (fallbackRecommendations[title]) {
                recommendation = fallbackRecommendations[title]({ keyphrase, title, context });
              } else {
                recommendation = `Consider optimizing your content for the keyphrase "${keyphrase}" in relation to ${title.toLowerCase()}.`;
              }
            }
          } else {
            // Use fallback recommendation directly if GPT is disabled for this check
            if (title === "Schema Markup") {
              recommendation = generateSchemaMarkupRecommendation(scrapedData, url);
            } else if (fallbackRecommendations[title]) {
              recommendation = fallbackRecommendations[title]({ keyphrase, title, context });
            } else {
              recommendation = `Consider optimizing your content for the keyphrase "${keyphrase}" in relation to ${title.toLowerCase()}.`;
            }
          }
        }
      }

      const successDescription = passed ? messages[title] : description;

      // Get priority for this check (default to medium if not found)
      const priority = checkPriorities[title] || "medium";

      checks.push({
        title,
        description: successDescription,
        passed,
        recommendation,
        priority
      });
    };

    // 1. Title analysis
    const titleHasKeyphrase = scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in Title",
      "The focus keyphrase should appear in the page title",
      titleHasKeyphrase,
      scrapedData.title
    );

    // 2. Meta description analysis
    const metaDescHasKeyphrase = scrapedData.metaDescription?.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in Meta Description",
      "The meta description should contain the focus keyphrase",
      metaDescHasKeyphrase,
      scrapedData.metaDescription
    );

    // 3. URL analysis
    const isHome = isHomePage(url);
    const slugHasKeyphrase = isHome || url.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in URL",
      isHome
        ? "This is the homepage URL, so the keyphrase is not required in the URL ✨"
        : "The URL should contain the focus keyphrase",
      slugHasKeyphrase,
      url
    );

    // 4. Content length
    const minWordCount = 300;
    const wordCount = scrapedData.content.split(/\s+/).length;
    await addCheck(
      "Content Length",
      `Your content has ${wordCount} words. For good SEO, aim for at least ${minWordCount} words to provide comprehensive coverage of your topic.`,
      wordCount >= minWordCount,
      `Current word count: ${wordCount}`,
      true // Skip GPT recommendation as we have custom message
    );

    // 5. Keyphrase density
    const densityResult = calculateKeyphraseDensity(scrapedData.content, keyphrase);
    const goodDensity = densityResult.density >= 0.5 && densityResult.density <= 2.5;

    await addCheck(
      "Keyphrase Density",
      `Keyphrase density should be between 0.5% and 2.5%. Current density: ${densityResult.density.toFixed(1)}% (${densityResult.occurrences} occurrences in ${densityResult.totalWords} words)`,
      goodDensity,
      `Content length: ${densityResult.totalWords} words, Keyphrase occurrences: ${densityResult.occurrences}`,
      true // Skip GPT recommendation for density
    );

    // 6. Keyphrase in first paragraph
    console.log("Analyzing first paragraph...");
    let firstParagraph = scrapedData.paragraphs[0] || "";
    let keyphraseInIntro = false;
    let introContext = "No introduction paragraph found";

    console.log("Total paragraphs available:", scrapedData.paragraphs.length);
    console.log("First paragraph content:", firstParagraph);
    console.log("Keyphrase to check:", keyphrase);

    if (firstParagraph) {
      // Convert both strings to lowercase and remove extra whitespace
      const words = firstParagraph.toLowerCase().split(/\s+/);
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/);

      // Check if all words from the keyphrase appear in sequence
      const normalizedParagraph = words.join(' ');
      const normalizedKeyphrase = keyphraseWords.join(' ');

      console.log("Normalized paragraph:", normalizedParagraph);
      console.log("Normalized keyphrase:", normalizedKeyphrase);

      // Check if the normalized keyphrase appears in the normalized paragraph
      keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
      introContext = firstParagraph;

      console.log("Keyphrase found in intro:", keyphraseInIntro);
    } else {
      console.log("No first paragraph found");
    }

    await addCheck(
      "Keyphrase in Introduction",
      keyphraseInIntro
        ? "The focus keyphrase appears naturally in the first paragraph"
        : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
      keyphraseInIntro,
      introContext
    );


    // 8. Image alt text analysis
    const altTextsWithKeyphrase = scrapedData.images.some(
      (img: { src: string; alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
    );
    await addCheck(
      "Image Alt Attributes",
      "At least one image should have an alt attribute containing the focus keyphrase",
      altTextsWithKeyphrase,
      JSON.stringify(scrapedData.images)
    );

    // 9. Internal links analysis
    const hasInternalLinks = scrapedData.internalLinks.length > 0;
    await addCheck(
      "Internal Links",
      "The page should contain internal links to other pages",
      hasInternalLinks,
      `Found ${scrapedData.internalLinks.length} internal links`
    );

    // 10. Outbound links analysis
    const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
    await addCheck(
      "Outbound Links",
      "The page should contain outbound links to authoritative sources",
      hasOutboundLinks,
      `Found ${scrapedData.outboundLinks.length} outbound links`
    );

    // Add new check for next-gen image formats
    const nextGenFormats = ['.webp', '.avif', '.svg'];
    let imageFormatRecommendation = "";
    let hasNextGenImages = false;

    if (scrapedData.images.length === 0) {
      imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
      hasNextGenImages = false;
    } else {
      const nonOptimizedImages = scrapedData.images.filter(img => {
        const imgUrl = img.src.toLowerCase();
        return !nextGenFormats.some(format => imgUrl.endsWith(format));
      });

      hasNextGenImages = nonOptimizedImages.length === 0;

      if (!hasNextGenImages) {
        const imageList = nonOptimizedImages.map(img => img.src).join('\n');
        imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:\n${imageList}\n\nUse tools like cwebp or online converters to optimize these images.`;
      }
    }

    await addCheck(
      "Next-Gen Image Formats",
      "Images should use modern formats like WebP, AVIF, or SVG for better performance",
      hasNextGenImages,
      scrapedData.images.map(img => img.src).join(', '),
      true // Skip GPT recommendation as we have custom recommendations
    );

    // Add new OG Image check
    const hasOGImage = Boolean(scrapedData.ogMetadata.image);
    const validOGImageSize = Boolean(
      scrapedData.ogMetadata.imageWidth &&
      scrapedData.ogMetadata.imageHeight &&
      parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
      parseInt(scrapedData.ogMetadata.imageHeight) >= 630
    );

    const currentSize = hasOGImage ?
      `Current image size: ${scrapedData.ogMetadata.imageWidth || 'unknown'}x${scrapedData.ogMetadata.imageHeight || 'unknown'}px.` :
      'No OG image found.';

    await addCheck(
      "OG Image",
      hasOGImage
        ? (validOGImageSize
          ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}`
          : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.`)
        : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
      hasOGImage, // Changed to only check for image presence
      `Current Open Graph image: ${scrapedData.ogMetadata.image || 'none'}. ${currentSize}`,
      true // Skip GPT recommendation since we have detailed custom message
    );

    // Add OG Title and Description check
    const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
    const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
    const ogTitleLength = scrapedData.ogMetadata.title.length;
    const ogDescLength = scrapedData.ogMetadata.description.length;

    const validOGMeta = hasOGTitle && hasOGDescription &&
      ogTitleLength >= 10 && ogTitleLength <= 70 &&
      ogDescLength >= 100 && ogDescLength <= 200;

    await addCheck(
      "OG Title and Description",
      validOGMeta
        ? "Open Graph title and description are properly set with optimal lengths"
        : "Open Graph title and/or description need optimization",
      validOGMeta,
      JSON.stringify({
        title: scrapedData.ogMetadata.title,
        description: scrapedData.ogMetadata.description
      })
    );

    // Add new H1/H2 keyword analysis check
    // Extract H1 and H2 headings using the new headings data structure
    const h1Tags = scrapedData.headings.filter(heading => heading.level === 1);
    const h2Tags = scrapedData.headings.filter(heading => heading.level === 2);

    // Check for keyphrase in H1 headings (separate check)
    // First check for exact inclusion
    let h1HasKeyphrase = h1Tags.some(heading =>
      heading.text.toLowerCase().includes(keyphrase.toLowerCase())
    );

    // If not found, check for all important words
    if (!h1HasKeyphrase && h1Tags.length > 0) {
      console.log("H1 exact match failed, trying word-by-word matching...");
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);

      if (keyphraseWords.length > 0) {
        // Check if all important words appear in the H1
        const normalizedParagraph = keyphraseWords.join(' ');
        const normalizedKeyphrase = keyphraseWords.join(' ');

        console.log("Normalized paragraph:", normalizedParagraph);
        console.log("Normalized keyphrase:", normalizedKeyphrase);

        // Check if the normalized keyphrase appears in the normalized paragraph
        keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
        introContext = firstParagraph;

        console.log("Keyphrase found in intro:", keyphraseInIntro);
      } else {
        console.log("No first paragraph found");
      }

      await addCheck(
        "Keyphrase in Introduction",
        keyphraseInIntro
          ? "The focus keyphrase appears naturally in the first paragraph"
          : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
        keyphraseInIntro,
        introContext
      );


      // 8. Image alt text analysis
      const altTextsWithKeyphrase = scrapedData.images.some(
        (img: { src: string; alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
      );
      await addCheck(
        "Image Alt Attributes",
        "At least one image should have an alt attribute containing the focus keyphrase",
        altTextsWithKeyphrase,
        JSON.stringify(scrapedData.images)
      );

      // 9. Internal links analysis
      const hasInternalLinks = scrapedData.internalLinks.length > 0;
      await addCheck(
        "Internal Links",
        "The page should contain internal links to other pages",
        hasInternalLinks,
        `Found ${scrapedData.internalLinks.length} internal links`
      );

      // 10. Outbound links analysis
      const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
      await addCheck(
        "Outbound Links",
        "The page should contain outbound links to authoritative sources",
        hasOutboundLinks,
        `Found ${scrapedData.outboundLinks.length} outbound links`
      );

      // Add new check for next-gen image formats
      const nextGenFormats = ['.webp', '.avif', '.svg'];
      let imageFormatRecommendation = "";
      let hasNextGenImages = false;

      if (scrapedData.images.length === 0) {
        imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
        hasNextGenImages = false;
      } else {
        const nonOptimizedImages = scrapedData.images.filter(img => {
          const imgUrl = img.src.toLowerCase();
          return !nextGenFormats.some(format => imgUrl.endsWith(format));
        });

        hasNextGenImages = nonOptimizedImages.length === 0;

        if (!hasNextGenImages) {
          const imageList = nonOptimizedImages.map(img => img.src).join('\n');
          imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:\n${imageList}\n\nUse tools like cwebp or online converters to optimize these images.`;
        }
      }

      await addCheck(
        "Next-Gen Image Formats",
        "Images should use modern formats like WebP, AVIF, or SVG for better performance",
        hasNextGenImages,
        scrapedData.images.map(img => img.src).join(', '),
        true // Skip GPT recommendation as we have custom recommendations
      );

      // Add new OG Image check
      const hasOGImage = Boolean(scrapedData.ogMetadata.image);
      const validOGImageSize = Boolean(
        scrapedData.ogMetadata.imageWidth &&
        scrapedData.ogMetadata.imageHeight &&
        parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
        parseInt(scrapedData.ogMetadata.imageHeight) >= 630
      );

      const currentSize = hasOGImage ?
        `Current image size: ${scrapedData.ogMetadata.imageWidth || 'unknown'}x${scrapedData.ogMetadata.imageHeight || 'unknown'}px.` :
        'No OG image found.';

      await addCheck(
        "OG Image",
        hasOGImage
          ? (validOGImageSize
            ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}`
            : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.`)
          : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
        hasOGImage, // Changed to only check for image presence
        `Current Open Graph image: ${scrapedData.ogMetadata.image || 'none'}. ${currentSize}`,
        true // Skip GPT recommendation since we have detailed custom message
      );

      // Add OG Title and Description check
      const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
      const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
      const ogTitleLength = scrapedData.ogMetadata.title.length;
      const ogDescLength = scrapedData.ogMetadata.description.length;

      const validOGMeta = hasOGTitle && hasOGDescription &&
        ogTitleLength >= 10 && ogTitleLength <= 70 &&
        ogDescLength >= 100 && ogDescLength <= 200;

      await addCheck(
        "OG Title and Description",
        validOGMeta
          ? "Open Graph title and description are properly set with optimal lengths"
          : "Open Graph title and/or description need optimization",
        validOGMeta,
        JSON.stringify({
          title: scrapedData.ogMetadata.title,
          description: scrapedData.ogMetadata.description
        })
      );

      // Add new H1/H2 keyword analysis check
      // Extract H1 and H2 headings using the new headings data structure
      const h1Tags = scrapedData.headings.filter(heading => heading.level === 1);
      const h2Tags = scrapedData.headings.filter(heading => heading.level === 2);

      // Check for keyphrase in H1 headings (separate check)
      // First check for exact inclusion
      let h1HasKeyphrase = h1Tags.some(heading =>
        heading.text.toLowerCase().includes(keyphrase.toLowerCase())
      );

      // If not found, check for all important words
      if (!h1HasKeyphrase && h1Tags.length > 0) {
        console.log("H1 exact match failed, trying word-by-word matching...");
        const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);

        if (keyphraseWords.length > 0) {
          // Check if all important words appear in the H1
          const normalizedParagraph = keyphraseWords.join(' ');
          const normalizedKeyphrase = keyphraseWords.join(' ');

          console.log("Normalized paragraph:", normalizedParagraph);
          console.log("Normalized keyphrase:", normalizedKeyphrase);

          // Check if the normalized keyphrase appears in the normalized paragraph
          keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
          introContext = firstParagraph;

          console.log("Keyphrase found in intro:", keyphraseInIntro);
        } else {
          console.log("No first paragraph found");
        }

        await addCheck(
          "Keyphrase in Introduction",
          keyphraseInIntro
            ? "The focus keyphrase appears naturally in the first paragraph"
            : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
          keyphraseInIntro,
          introContext
        );


        // 8. Image alt text analysis
        const altTextsWithKeyphrase = scrapedData.images.some(
          (img: { src: string; alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
        );
        await addCheck(
          "Image Alt Attributes",
          "At least one image should have an alt attribute containing the focus keyphrase",
          altTextsWithKeyphrase,
          JSON.stringify(scrapedData.images)
        );

        // 9. Internal links analysis
        const hasInternalLinks = scrapedData.internalLinks.length > 0;
        await addCheck(
          "Internal Links",
          "The page should contain internal links to other pages",
          hasInternalLinks,
          `Found ${scrapedData.internalLinks.length} internal links`
        );

        // 10. Outbound links analysis
        const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
        await addCheck(
          "Outbound Links",
          "The page should contain outbound links to authoritative sources",
          hasOutboundLinks,
          `Found ${scrapedData.outboundLinks.length} outbound links`
        );

        // Add new check for next-gen image formats
        const nextGenFormats = ['.webp', '.avif', '.svg'];
        let imageFormatRecommendation = "";
        let hasNextGenImages = false;

        if (scrapedData.images.length === 0) {
          imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
          hasNextGenImages = false;
        } else {
          const nonOptimizedImages = scrapedData.images.filter(img => {
            const imgUrl = img.src.toLowerCase();
            return !nextGenFormats.some(format => imgUrl.endsWith(format));
          });

          hasNextGenImages = nonOptimizedImages.length === 0;

          if (!hasNextGenImages) {
            const imageList = nonOptimizedImages.map(img => img.src).join('\n');
            imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:\n${imageList}\n\nUse tools like cwebp or online converters to optimize these images.`;
          }
        }

        await addCheck(
          "Next-Gen Image Formats",
          "Images should use modern formats like WebP, AVIF, or SVG for better performance",
          hasNextGenImages,
          scrapedData.images.map(img => img.src).join(', '),
          true // Skip GPT recommendation as we have custom recommendations
        );

        // Add new OG Image check
        const hasOGImage = Boolean(scrapedData.ogMetadata.image);
        const validOGImageSize = Boolean(
          scrapedData.ogMetadata.imageWidth &&
          scrapedData.ogMetadata.imageHeight &&
          parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
          parseInt(scrapedData.ogMetadata.imageHeight) >= 630
        );

        const currentSize = hasOGImage ?
          `Current image size: ${scrapedData.ogMetadata.imageWidth || 'unknown'}x${scrapedData.ogMetadata.imageHeight || 'unknown'}px.` :
          'No OG image found.';

        await addCheck(
          "OG Image",
          hasOGImage
            ? (validOGImageSize
              ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}`
              : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.`)
            : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
          hasOGImage, // Changed to only check for image presence
          `Current Open Graph image: ${scrapedData.ogMetadata.image || 'none'}. ${currentSize}`,
          true // Skip GPT recommendation since we have detailed custom message
        );

        // Add OG Title and Description check
        const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
        const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
        const ogTitleLength = scrapedData.ogMetadata.title.length;
        const ogDescLength = scrapedData.ogMetadata.description.length;

        const validOGMeta = hasOGTitle && hasOGDescription &&
          ogTitleLength >= 10 && ogTitleLength <= 70 &&
          ogDescLength >= 100 && ogDescLength <= 200;

        await addCheck(
          "OG Title and Description",
          validOGMeta
            ? "Open Graph title and description are properly set with optimal lengths"
            : "Open Graph title and/or description need optimization",
          validOGMeta,
          JSON.stringify({
            title: scrapedData.ogMetadata.title,
            description: scrapedData.ogMetadata.description
          })
        );

        // Add new H1/H2 keyword analysis check
        // Extract H1 and H2 headings using the new headings data structure
        const h1Tags = scrapedData.headings.filter(heading => heading.level === 1);
        const h2Tags = scrapedData.headings.filter(heading => heading.level === 2);

        // Check for keyphrase in H1 headings (separate check)
        // First check for exact inclusion
        let h1HasKeyphrase = h1Tags.some(heading =>
          heading.text.toLowerCase().includes(keyphrase.toLowerCase())
        );

        // If not found, check for all important words
        if (!h1HasKeyphrase && h1Tags.length > 0) {
          console.log("H1 exact match failed, trying word-by-word matching...");
          const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);

          if (keyphraseWords.length > 0) {
            // Check if all important words appear in the H1
            const normalizedParagraph = keyphraseWords.join(' ');
            const normalizedKeyphrase = keyphraseWords.join(' ');

            console.log("Normalized paragraph:", normalizedParagraph);
            console.log("Normalized keyphrase:", normalizedKeyphrase);

            // Check if the normalized keyphrase appears in the normalized paragraph
            keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
            introContext = firstParagraph;

            console.log("Keyphrase found in intro:", keyphraseInIntro);
          } else {
            console.log("No first paragraph found");
          }

          await addCheck(
            "Keyphrase in Introduction",
            keyphraseInIntro
              ? "The focus keyphrase appears naturally in the first paragraph"
              : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
            keyphraseInIntro,
            introContext
          );


          // 8. Image alt text analysis
          const altTextsWithKeyphrase = scrapedData.images.some(
            (img: { src: string; alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
          );
          await addCheck(
            "Image Alt Attributes",
            "At least one image should have an alt attribute containing the focus keyphrase",
            altTextsWithKeyphrase,
            JSON.stringify(scrapedData.images)
          );

          // 9. Internal links analysis
          const hasInternalLinks = scrapedData.internalLinks.length > 0;
          await addCheck(
            "Internal Links",
            "The page should contain internal links to other pages",
            hasInternalLinks,
            `Found ${scrapedData.internalLinks.length} internal links`
          );

          // 10. Outbound links analysis
          const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
          await addCheck(
            "Outbound Links",
            "The page should contain outbound links to authoritative sources",
            hasOutboundLinks,
            `Found ${scrapedData.outboundLinks.length} outbound links`
          );

          // Add new check for next-gen image formats
          const nextGenFormats = ['.webp', '.avif', '.svg'];
          let imageFormatRecommendation = "";
          let hasNextGenImages = false;

          if (scrapedData.images.length === 0) {
            imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
            hasNextGenImages = false;
          } else {
            const nonOptimizedImages = scrapedData.images.filter(img => {
              const imgUrl = img.src.toLowerCase();
              return !nextGenFormats.some(format => imgUrl.endsWith(format));
            });

            hasNextGenImages = nonOptimizedImages.length === 0;

            if (!hasNextGenImages) {
              const imageList = nonOptimizedImages.map(img => img.src).join('\n');
              imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:\n${imageList}\n\nUse tools like cwebp or online converters to optimize these images.`;
            }
          }

          await addCheck(
            "Next-Gen Image Formats",
            "Images should use modern formats like WebP, AVIF, or SVG for better performance",
            hasNextGenImages,
            scrapedData.images.map(img => img.src).join(', '),
            true // Skip GPT recommendation as we have custom recommendations
          );

          // Add new OG Image check
          const hasOGImage = Boolean(scrapedData.ogMetadata.image);
          const validOGImageSize = Boolean(
            scrapedData.ogMetadata.imageWidth &&
            scrapedData.ogMetadata.imageHeight &&
            parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
            parseInt(scrapedData.ogMetadata.imageHeight) >= 630
          );

          const currentSize = hasOGImage ?
            `Current image size: ${scrapedData.ogMetadata.imageWidth || 'unknown'}x${scrapedData.ogMetadata.imageHeight || 'unknown'}px.` :
            'No OG image found.';

          await addCheck(
            "OG Image",
            hasOGImage
              ? (validOGImageSize
                ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}`
                : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.`)
              : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
            hasOGImage, // Changed to only check for image presence
            `Current Open Graph image: ${scrapedData.ogMetadata.image || 'none'}. ${currentSize}`,
            true // Skip GPT recommendation since we have detailed custom message
          );

          // Add OG Title and Description check
          const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
          const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
          const ogTitleLength = scrapedData.ogMetadata.title.length;
          const ogDescLength = scrapedData.ogMetadata.description.length;

          const validOGMeta = hasOGTitle && hasOGDescription &&
            ogTitleLength >= 10 && ogTitleLength <= 70 &&
            ogDescLength >= 100 && ogDescLength <= 200;

          await addCheck(
            "OG Title and Description",
            validOGMeta
              ? "Open Graph title and description are properly set with optimal lengths"
              : "Open Graph title and/or description need optimization",
            validOGMeta,
            JSON.stringify({
              title: scrapedData.ogMetadata.title,
              description: scrapedData.ogMetadata.description
            })
          );

          // Add new H1/H2 keyword analysis check
          // Extract H1 and H2 headings using the new headings data structure
          const h1Tags = scrapedData.headings.filter(heading => heading.level === 1);
          const h2Tags = scrapedData.headings.filter(heading => heading.level === 2);

          // Check for keyphrase in H1 headings (separate check)
          // First check for exact inclusion
          let h1HasKeyphrase = h1Tags.some(heading =>
            heading.text.toLowerCase().includes(keyphrase.toLowerCase())
          );

          // If not found, check for all important words
          if (!h1HasKeyphrase && h1Tags.length > 0) {
            console.log("H1 exact match failed, trying word-by-word matching...");
            const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);

            if (keyphraseWords.length > 0) {
              // Check if all important words appear in the H1
              const allWordsFound = keyphraseWords.every(word =>
                h1Tags.some(heading => heading.text.toLowerCase().includes(word))
              );

              // Consider it a pass if all important words are found
              h1HasKeyphrase = allWordsFound;

              console.log("H1 tags:", h1Tags.map(h => h.text));
              console.log("Keyphrase words:", keyphraseWords);
              console.log("All words found in H1:", allWordsFound);
            }
          }

          // Create detailed context for H1 keyphrase check
          const h1Context = h1Tags.length > 0
            ? `H1 heading ${h1HasKeyphrase ? '(contains keyphrase)' : '(missing keyphrase)'}: ${h1Tags.map(h => `"${h.text}"`).join(', ')}\nTarget keyphrase: "${keyphrase}"`
            : 'No H1 headings found on page';

          // Add H1 keyphrase check
          await addCheck(
            "Keyphrase in H1 Heading",
            h1Tags.length === 0
              ? "Your page is missing an H1 heading. Add an H1 heading that includes your keyphrase."
              : h1Tags.length > 1
                ? "You have multiple H1 headings. Best practice is to have a single H1 heading that includes your keyphrase."
                : "Your H1 heading should include your target keyphrase for optimal SEO.",
            h1HasKeyphrase && h1Tags.length === 1,
            `${h1Context}\nTarget keyphrase: "${keyphrase}"`
          );

          // Check for keyphrase in H2 headings with more flexible matching
          let h2HasKeyphrase = h2Tags.some(heading =>
            heading.text.toLowerCase().includes(keyphrase.toLowerCase())
          );

          // If exact match fails, try checking for individual keywords
          if (!h2HasKeyphrase && h2Tags.length > 0) {
            console.log("H2 exact match failed, trying word-by-word matching...");
            const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);

            if (keyphraseWords.length > 0) {
              // Consider it a match if at least one H2 contains all important words from keyphrase
              const allWordsFoundInAnyH2 = h2Tags.some(heading => {
                const headingText = heading.text.toLowerCase();
                return keyphraseWords.every(word => headingText.includes(word));
              });

              // Or if all important words appear across multiple H2s
              const allWordsFoundAcrossH2s = keyphraseWords.every(word =>
                h2Tags.some(heading => heading.text.toLowerCase().includes(word))
              );

              // Consider it a pass if either condition is met
              h2HasKeyphrase = allWordsFoundInAnyH2 || allWordsFoundAcrossH2s;

              console.log("H2 tags:", h2Tags.map(h => h.text));
              console.log("Keyphrase words:", keyphraseWords);
              console.log("All words found in any H2:", allWordsFoundInAnyH2);
              console.log("All words found across H2s:", allWordsFoundAcrossH2s);
            }
          }

          // Create detailed context for H2 keyphrase check
          let h2Context = '';
          if (h2Tags.length === 0) {
            h2Context = 'No H2 headings found on page';
          } else {
            h2Context = `H2 headings ${h2HasKeyphrase ? '(contains keyphrase)' : '(missing keyphrase)'}:\n`;
            h2Tags.forEach((h, i) => {
              h2Context += `${i + 1}. "${h.text}"\n`;
            });
            h2Context += `\nTarget keyphrase: "${keyphrase}"\n`;

            // Add suggestions if keyphrase is missing
            if (!h2HasKeyphrase) {
              h2Context += '\nConsider updating at least one H2 to include your target keyphrase.';
            }
          }

          // Add H2 keyphrase check
          await addCheck(
            "Keyphrase in H2 Headings",
            h2Tags.length === 0
              ? "Your page doesn't have any H2 headings. Add H2 subheadings that include your keyphrase to structure your content."
              : "Your H2 headings should include your target keyphrase at least once to reinforce your topic focus.",
            h2HasKeyphrase && h2Tags.length > 0,
            `${h2Context}\nTarget keyphrase: "${keyphrase}"`
          );

          // Add heading hierarchy check
          // Check for proper heading hierarchy
          const hasH1 = h1Tags.length > 0;
          const hasH2 = h2Tags.length > 0;
          const hasProperHeadingStructure = hasH1 && hasH2 && h1Tags.length === 1;

          // Check if heading levels are used in proper order (no skipping levels)
          let hasProperLevelOrder = true;
          const allHeadings = [...scrapedData.headings].sort((a, b) => {
            // Sort by position in the original array
            return scrapedData.headings.indexOf(a) - scrapedData.headings.indexOf(b);
          });

          // Check for proper level progression (no jumps like H1 -> H3 without H2)
          let prevLevel = 0;
          let skippedLevel = null;
          for (const heading of allHeadings) {
            if (heading.level > prevLevel + 1 && prevLevel > 0) {
              // Skipped a level (e.g., H1 -> H3)
              hasProperLevelOrder = false;
              skippedLevel = `H${prevLevel} → H${heading.level}`;
              break;
            }
            prevLevel = heading.level;
          }

          const hasProperHeadingHierarchy = hasProperHeadingStructure && hasProperLevelOrder;

          // Create a visual heading structure representation
          const headingStructureVisual = allHeadings.map(h => {
            const prefix = `H${h.level}`;
            const text = h.text.length > 30 ? h.text.substring(0, 30) + '...' : h.text;
            return `${prefix}: "${text}"`;
          }).join('\n');

          let hierarchyIssue = "";
          if (!hasH1) {
            hierarchyIssue = "⚠️ Issue: Missing H1 heading";
          } else if (h1Tags.length > 1) {
            hierarchyIssue = `⚠️ Issue: Multiple H1 headings (${h1Tags.length} found)`;
          } else if (!hasH2) {
            hierarchyIssue = "⚠️ Issue: Missing H2 headings";
          } else if (!hasProperLevelOrder) {
            hierarchyIssue = `⚠️ Issue: Heading level skip detected (${skippedLevel})`;
          }

          const fullHierarchyContext = `Current heading structure:\n${headingStructureVisual}\n\n${hierarchyIssue}`;

          await addCheck(
            "Heading Hierarchy",
            hasProperHeadingHierarchy
              ? "Your page has a proper heading structure with a single H1 followed by appropriate subheadings."
              : !hasH1
                ? "Your page is missing an H1 heading, which is crucial for SEO and document structure."
                : h1Tags.length > 1
                  ? "Your page has multiple H1 headings. Best practice is to have a single H1 heading per page."
                  : !hasH2
                    ? "Your page is missing H2 headings. Use H2 headings to structure your content under the main H1 heading."
                    : !hasProperLevelOrder
                      ? "Your heading structure skips levels (e.g., H1 followed directly by H3). This can confuse search engines and assistive technologies."
                      : "Your heading structure needs improvement. Follow a logical hierarchy (H1 → H2 → H3) for better SEO.",
            hasProperHeadingHierarchy,
            fullHierarchyContext,
            true // Use our custom recommendation
          );

          // Add code minification check
          const jsResources = scrapedData.resources.js;
          const cssResources = scrapedData.resources.css;

          // Count resources and check minification status
          const totalJsResources = jsResources.length;
          const totalCssResources = cssResources.length;
          const minifiedJsCount = jsResources.filter(r => r.minified).length;
          const minifiedCssCount = cssResources.filter(r => r.minified).length;

          // Calculate percentage of minified resources
          const totalResources = totalJsResources + totalCssResources;
          const minifiedResources = minifiedJsCount + minifiedCssCount;
          const minificationPercentage = totalResources > 0
            ? Math.round((minifiedResources / totalResources) * 100)
            : 100; // If no resources, consider it 100% passed

          // List of non-minified resources to provide in the recommendation
          const nonMinifiedJs = jsResources
            .filter(r => !r.minified && r.url !== 'inline-script')
            .map(r => r.url);

          const nonMinifiedCss = cssResources
            .filter(r => !r.minified && r.url !== 'inline-style')
            .map(r => r.url);

          const hasNonMinified = nonMinifiedJs.length > 0 || nonMinifiedCss.length > 0;
          const hasInlineNonMinified = jsResources.some(r => r.url === 'inline-script' && !r.minified) ||
            cssResources.some(r => r.url === 'inline-style' && !r.minified);

          // Create context for recommendation
          let minificationContext = "";
          if (totalResources === 0) {
            minificationContext = "No JavaScript or CSS resources found on the page.";
          } else {
            minificationContext = `Found ${totalJsResources} JavaScript and ${totalCssResources} CSS resources. `;
            minificationContext += `${minifiedJsCount} of ${totalJsResources} JavaScript and ${minifiedCssCount} of ${totalCssResources} CSS resources are minified. `;

            if (nonMinifiedJs.length > 0) {
              minificationContext += `\n\nNon-minified JavaScript files:\n${nonMinifiedJs.join('\n')}`;
            }

            if (nonMinifiedCss.length > 0) {
              minificationContext += `\n\nNon-minified CSS files:\n${nonMinifiedCss.join('\n')}`;
            }

            if (hasInlineNonMinified) {
              minificationContext += `\n\nNon-minified inline scripts or styles detected. Consider minifying them as well.`;
            }
          }

          // Determine if the check passes (40% or more resources minified)
          const minificationPasses = minificationPercentage >= 40;

          await addCheck(
            "Code Minification",
            minificationPasses
              ? `Your JavaScript and CSS resources are well optimized. ${minificationPercentage}% are minified.`
              : `${minificationPercentage}% of your JavaScript and CSS resources are minified. Aim for at least 40% minification.`,
            minificationPasses,
            minificationContext,
            true // Skip GPT recommendation for this technical check
          );

          // Add schema markup check
          const hasSchemaMarkup = scrapedData.schema.detected;
          const schemaTypesDetected = scrapedData.schema.types;

          // Create context for recommendation
          let schemaContext = "";
          if (hasSchemaMarkup) {
            schemaContext = `Schema markup found on page. Types detected: ${schemaTypesDetected.join(', ') || 'Unknown'}`;
          } else {
            // Create detailed context to help generate a relevant recommendation
            schemaContext = `
No schema markup detected on page.
Page title: ${scrapedData.title}
Meta description: ${scrapedData.metaDescription}
URL: ${url}
Content type indicators:
- First H1: ${h1Tags.length > 0 ? h1Tags[0].text : 'None'}
- First few H2s: ${h2Tags.slice(0, 3).map(h => h.text).join(', ')}
- Has images: ${scrapedData.images.length > 0 ? 'Yes' : 'No'}
- Is homepage: ${isHomePage(url) ? 'Yes' : 'No'}
- Content preview: ${scrapedData.paragraphs.slice(0, 2).join(' ').substring(0, 200)}...
`;
          }

          // For schema markup, always use our custom recommendation instead of GPT
          let schemaRecommendation = "";
          if (hasSchemaMarkup) {
            schemaRecommendation = `Your page has schema markup implemented. The following schema types were detected:\n\n`;
            if (schemaTypesDetected.length > 0) {
              schemaTypesDetected.forEach((type, index) => {
                schemaRecommendation += `${index + 1}. **${type}** - This helps search engines understand that your content represents a ${type.toLowerCase()}\n`;
              });
              schemaRecommendation += `\nYou can further optimize your schema markup by ensuring all required properties are included for each type.`;
            } else {
              schemaRecommendation += `Schema markup was detected but the specific type couldn't be determined. Consider using more specific schema types from schema.org.`;
            }
          } else {
            // Use our custom recommendation generator instead of GPT
            schemaRecommendation = generateSchemaMarkupRecommendation(scrapedData, url);
          }

          await addCheck(
            "Schema Markup",
            hasSchemaMarkup ?
              `Your page has schema markup implemented (${schemaTypesDetected.join(', ') || 'Unknown type'})` :
              "Your page is missing schema markup (structured data)",
            hasSchemaMarkup,
            schemaContext,
            true // Skip GPT recommendation as we're using our custom one
          );

          // If the check failed, add our custom recommendation with specific image information
          const schemaCheck = checks.find(check => check.title === "Schema Markup");
          if (schemaCheck) {
            schemaCheck.recommendation = schemaRecommendation;
          }

          // Add NEW CHECK for Image File Size
          // Define the threshold for large images (300KB = 300 * 1024 bytes)
          const MAX_IMAGE_SIZE = 300 * 1024; // 300KB in bytes

          let hasLargeImages = false;
          const largeImages: Array<{ src: string; alt: string; size?: number }> = [];

          // Check if images are present and have size information
          if (scrapedData.images.length === 0) {
            // No images to check
            hasLargeImages = false;
          } else {
            scrapedData.images.forEach(img => {
              if (img.size && img.size > MAX_IMAGE_SIZE) {
                hasLargeImages = true;
                largeImages.push({
                  src: img.src,
                  alt: img.alt || '',
                  size: img.size
                });
              }
            });
          }

          const totalImages = scrapedData.images.length;
          const imagesWithSize = scrapedData.images.filter(img => img.size !== undefined).length;
          const oversizedCount = largeImages.length;

          // Create detailed context for the check
          let imageSizesContext = `Found ${totalImages} images, ${imagesWithSize} with retrievable size information.\n`;
          imageSizesContext += `${oversizedCount} images exceed the recommended size of 300KB.\n\n`;

          if (largeImages.length > 0) {
            imageSizesContext += "Large images:\n";
            largeImages.forEach(img => {
              const imageLabel = img.alt ?
                (img.alt.length > 40 ? img.alt.substring(0, 40) + '...' : img.alt) :
                'Image with missing alt text';
              imageSizesContext += `- ${imageLabel} (${formatBytes(img.size)})\n`;
            });
          }

          await addCheck(
            "Image File Size",
            oversizedCount === 0
              ? `All images are optimized with file sizes under 300KB.`
              : `${oversizedCount} out of ${totalImages} images exceed the recommended size of 300KB. Large images slow down page loading.`,
            !hasLargeImages,
            imageSizesContext,
            true // Skip GPT recommendation as we'll use our custom one
          );

          // If the check failed, add our custom recommendation with specific image information
          if (hasLargeImages) {
            const imageFileCheck = checks.find(check => check.title === "Image File Size");
            if (imageFileCheck) {
              imageFileCheck.recommendation = fallbackRecommendations["Image File Size"]({ largeImages });
            }
          }

          return {
            checks,
            passedChecks,
            failedChecks
          };
        }
      }
    }
  } catch (error) {
    console.error("Error analyzing SEO elements:", error);
    throw new Error(`Failed to analyze SEO elements: ${error.message}`);
  }
}

// Helper function to generate schema markup recommendations without relying on GPT
function generateSchemaMarkupRecommendation(scrapedData: any, url: string): string {
  // Check if it's a homepage
  const isHome = isHomePage(url);

  // Extract key data points for determining page type
  const hasProductIndicators = scrapedData.title.toLowerCase().includes('product') ||
    scrapedData.content.toLowerCase().includes('price') ||
    scrapedData.content.toLowerCase().includes('buy now') ||
    scrapedData.content.toLowerCase().includes('add to cart');

  const hasArticleIndicators = scrapedData.paragraphs.length > 3 ||
    scrapedData.content.split(/\s+/).length > 500 ||
    scrapedData.title.toLowerCase().includes('article') ||
    scrapedData.title.toLowerCase().includes('blog') ||
    scrapedData.title.toLowerCase().includes('news');

  const hasFAQIndicators = scrapedData.content.toLowerCase().includes('faq') ||
    scrapedData.content.toLowerCase().includes('frequently asked') ||
    (scrapedData.headings.filter((h: any) => h.text.toLowerCase().includes('faq') || h.text.toLowerCase().includes('question')).length > 0);

  const hasOrganizationIndicators = scrapedData.content.toLowerCase().includes('about us') ||
    scrapedData.content.toLowerCase().includes('contact us') ||
    scrapedData.content.toLowerCase().includes('our team') ||
    scrapedData.content.toLowerCase().includes('company');

  // Create a much more concise recommendation
  let recommendation = "**Recommended Schema for this page:**\n\n";
  const schemaTypes = [];

  if (isHome) {
    schemaTypes.push("Organization or WebSite Schema");
  }

  if (hasProductIndicators) {
    schemaTypes.push("Product Schema");
  }

  if (hasArticleIndicators) {
    schemaTypes.push("Article Schema");
  }

  if (hasFAQIndicators) {
    schemaTypes.push("FAQ Schema");
  }

  if (hasOrganizationIndicators && !isHome) {
    schemaTypes.push("Organization Schema");
  }

  // Default schema if no specific type detected
  if (!isHome && schemaTypes.length === 0) {
    schemaTypes.push("WebPage Schema");
  }

  // Add each schema type as a bullet point
  schemaTypes.forEach(type => {
    recommendation += `• ${type}\n`;
  });

  // Add a short note about testing
  recommendation += "\nTip: Test implementations with Google's Rich Results Test tool.";

  return recommendation;
}