// server/index.ts
import express2 from "express";
import { createServer } from "http";

// server/lib/webScraper.ts
import { JSDOM } from "jsdom";
async function getImageSize(imageUrl, baseUrl) {
  try {
    const fullUrl = new URL(imageUrl, baseUrl.origin).toString();
    const response = await fetch(fullUrl, { method: "HEAD" });
    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    }
    return void 0;
  } catch (error) {
    console.log(`Error getting size for image ${imageUrl}:`, error);
    return void 0;
  }
}
async function scrapeWebpage(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`;
  }
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const baseUrl = new URL(url);
    const title = document.querySelector("title")?.textContent?.trim() || "";
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const ogMetadata = {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
      imageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute("content") || "",
      imageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute("content") || ""
    };
    const content = document.body.textContent?.trim() || "";
    console.log("Scraping paragraphs...");
    const allParagraphElements = document.querySelectorAll("article p, main p, .content p, #content p, .post-content p, p");
    const paragraphs = Array.from(allParagraphElements).map((el) => {
      const text = el.textContent?.trim() || "";
      const parentClass = el.parentElement?.getAttribute("class") || "no-parent-class";
      return text;
    }).filter((text) => text.length > 0);
    const subheadings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) => el.textContent?.trim() || "").filter((text) => text.length > 0);
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) => {
      const tagName = el.tagName.toLowerCase();
      const level = parseInt(tagName.substring(1), 10);
      return {
        level,
        text: el.textContent?.trim() || ""
      };
    }).filter((heading) => heading.text.length > 0);
    const imageElements = Array.from(document.querySelectorAll("img")).map((el) => ({
      src: el.getAttribute("src") || "",
      alt: el.getAttribute("alt") || ""
    }));
    const images = await Promise.all(
      imageElements.map(async (img) => {
        if (!img.src) return img;
        const size = await getImageSize(img.src, baseUrl);
        return {
          ...img,
          size
        };
      })
    );
    const internalLinks = [];
    const outboundLinks = [];
    document.querySelectorAll("a[href]").forEach((el) => {
      const href = el.getAttribute("href");
      if (!href) return;
      try {
        const linkUrl = new URL(href, baseUrl.origin);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(href);
        } else {
          outboundLinks.push(href);
        }
      } catch (error) {
      }
    });
    const jsResources = [];
    const cssResources = [];
    document.querySelectorAll("script[src]").forEach((el) => {
      const src = el.getAttribute("src");
      if (src) {
        try {
          const fullUrl = new URL(src, baseUrl.origin).toString();
          jsResources.push({ url: fullUrl });
        } catch (error) {
        }
      }
    });
    document.querySelectorAll("link[rel='stylesheet']").forEach((el) => {
      const href = el.getAttribute("href");
      if (href) {
        try {
          const fullUrl = new URL(href, baseUrl.origin).toString();
          cssResources.push({ url: fullUrl });
        } catch (error) {
        }
      }
    });
    document.querySelectorAll("style").forEach((el) => {
      const content2 = el.textContent;
      if (content2 && content2.trim()) {
        cssResources.push({
          url: "inline-style",
          content: content2.trim(),
          minified: isMinified(content2.trim())
        });
      }
    });
    document.querySelectorAll("script:not([src])").forEach((el) => {
      const content2 = el.textContent;
      if (content2 && content2.trim()) {
        jsResources.push({
          url: "inline-script",
          content: content2.trim(),
          minified: isMinified(content2.trim())
        });
      }
    });
    const jsonLdBlocks = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const jsonContent = el.textContent;
        if (jsonContent) {
          const parsed = JSON.parse(jsonContent);
          jsonLdBlocks.push(parsed);
        }
      } catch (error) {
        console.log("Error parsing JSON-LD:", error);
      }
    });
    const microdataTypes = [];
    document.querySelectorAll("[itemscope]").forEach((el) => {
      const itemtype = el.getAttribute("itemtype");
      if (itemtype) {
        try {
          const match = itemtype.match(/schema\.org\/([a-zA-Z]+)/);
          if (match && match[1]) {
            microdataTypes.push(match[1]);
          } else {
            microdataTypes.push(itemtype);
          }
        } catch (error) {
          console.log("Error extracting microdata type:", error);
        }
      }
    });
    const schemaTypes = /* @__PURE__ */ new Set();
    jsonLdBlocks.forEach((block) => {
      if (block["@type"]) {
        if (Array.isArray(block["@type"])) {
          block["@type"].forEach((type) => schemaTypes.add(type));
        } else {
          schemaTypes.add(block["@type"]);
        }
      }
    });
    microdataTypes.forEach((type) => schemaTypes.add(type));
    return {
      title,
      metaDescription,
      content,
      paragraphs,
      subheadings,
      headings,
      images,
      internalLinks,
      outboundLinks,
      ogMetadata,
      resources: {
        js: jsResources,
        css: cssResources
      },
      schema: {
        detected: jsonLdBlocks.length > 0 || microdataTypes.length > 0,
        types: Array.from(schemaTypes),
        jsonLdBlocks,
        microdataTypes
      }
    };
  } catch (error) {
    console.error("Failed to scrape webpage:", error);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}
function isMinified(code) {
  if (!code || code.length < 50) return true;
  const newlineRatio = (code.match(/\n/g) || []).length / code.length;
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;
  const lines = code.split("\n").filter((line) => line.trim().length > 0);
  let avgLineLength = 0;
  if (lines.length > 0) {
    avgLineLength = code.length / lines.length;
  }
  return newlineRatio < 0.01 && whitespaceRatio < 0.15 || avgLineLength > 500;
}

// server/lib/gpt.ts
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
var useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";
var recommendationCache = {};
var CACHE_TTL = 24 * 60 * 60 * 1e3;
var openai = useGPT ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
var hasValidOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
async function getGPTRecommendation(checkType, keyphrase, context) {
  if (!useGPT || !hasValidOpenAIKey) {
    console.log("GPT recommendations are disabled or API key is invalid");
    return "GPT recommendations are currently disabled. Enable them by setting USE_GPT_RECOMMENDATIONS=true and providing a valid OPENAI_API_KEY.";
  }
  try {
    const cacheKey = `${checkType}_${keyphrase}_${context?.substring(0, 50) || ""}`;
    const cachedEntry = recommendationCache[cacheKey];
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log(`Using cached recommendation for ${checkType}`);
      return cachedEntry.recommendation;
    }
    const truncatedContext = context && context.length > 300 ? context.substring(0, 300) + "..." : context;
    if (!openai) {
      throw new Error("OpenAI is not initialized.");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      // Use the most cost-effective model
      messages: [
        {
          role: "system",
          content: `You are an SEO expert providing concise, actionable recommendations.
          Keep responses under 100 words.
          Format: "Here is a better [element]: [example]"
          Avoid quotation marks.`
        },
        {
          role: "user",
          content: `Fix this SEO issue: "${checkType}" for keyphrase "${keyphrase}".
          ${truncatedContext ? `Current content: ${truncatedContext}` : ""}`
        }
      ],
      max_tokens: 100,
      // Reduce token limit to save costs
      temperature: 0.5
      // Lower temperature for more predictable outputs
    });
    const recommendation = response.choices[0].message.content?.trim() || "Unable to generate recommendation at this time.";
    recommendationCache[cacheKey] = {
      recommendation,
      timestamp: Date.now()
    };
    return recommendation;
  } catch (error) {
    console.error("GPT API Error:", error);
    if (error.status === 401) {
      return "API key error. Please check your OpenAI API key and ensure it's valid.";
    }
    return "Unable to generate recommendation. Please try again later.";
  }
}

// server/lib/seoAnalyzer.ts
var enabledGPTChecks = process.env.ENABLED_GPT_CHECKS ? process.env.ENABLED_GPT_CHECKS.split(",") : [
  "Keyphrase in Title",
  "Keyphrase in Meta Description",
  "Keyphrase in Introduction",
  "Keyphrase in H1 Heading",
  "Keyphrase in H2 Headings"
];
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function calculateKeyphraseDensity(content, keyphrase) {
  const normalizedContent = content.toLowerCase().trim();
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();
  const escapedKeyphrase = escapeRegExp(normalizedKeyphrase);
  const totalWords = normalizedContent.split(/\s+/).filter((word) => word.length > 0).length;
  const regex = new RegExp(`\\b${escapedKeyphrase}\\b`, "gi");
  const matches = normalizedContent.match(regex) || [];
  const occurrences = matches.length;
  const density = occurrences * normalizedKeyphrase.split(/\s+/).length / totalWords * 100;
  return {
    density,
    occurrences,
    totalWords
  };
}
function isHomePage(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname === "/" || urlObj.pathname === "";
  } catch {
    return false;
  }
}
var checkPriorities = {
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
  "Image File Size": "medium"
  // Added new check with medium priority
};
var fallbackRecommendations = {
  "Keyphrase in Title": ({ keyphrase, title }) => `Consider rewriting your title to include '${keyphrase}', preferably at the beginning.`,
  "Keyphrase in Meta Description": ({ keyphrase }) => `Add '${keyphrase}' to your meta description in a natural way that encourages clicks.`,
  "Keyphrase in Introduction": ({ keyphrase }) => `Mention '${keyphrase}' in your first paragraph to establish relevance early.`,
  "Keyphrase in H1 Heading": ({ keyphrase }) => `Include '${keyphrase}' in your main H1 heading to improve SEO.`,
  "Keyphrase in H2 Headings": ({ keyphrase }) => `Use '${keyphrase}' in at least one H2 subheading to reinforce topic relevance.`,
  "Image Alt Attributes": ({ keyphrase }) => `Add descriptive alt text containing '${keyphrase}' to at least one relevant image.`,
  "Internal Links": () => `Add links to other relevant pages on your site to improve navigation and SEO.`,
  "Outbound Links": () => `Link to reputable external sources to increase your content's credibility.`,
  "Image File Size": ({ largeImages }) => {
    if (largeImages.length === 0) return "";
    const imageListText = largeImages.map((img) => {
      const imageLabel = img.alt ? img.alt.length > 40 ? img.alt.substring(0, 40) + "..." : img.alt : "Image with missing alt text";
      return `\u2022 ${imageLabel} (${formatBytes(img.size)})`;
    }).join("\n");
    return `Compress these large images to improve page load times:
${imageListText}

Consider using tools like TinyPNG, Squoosh, or ImageOptim.`;
  }
};
function formatBytes(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}
async function analyzeSEOElements(url, keyphrase) {
  console.log(`[SEO Analyzer] Starting analysis for URL: ${url} with keyphrase: ${keyphrase}`);
  const startTime = Date.now();
  try {
    console.log(`[SEO Analyzer] Scraping webpage...`);
    const scrapingStartTime = Date.now();
    const scrapedData = await scrapeWebpage(url);
    console.log(`[SEO Analyzer] Webpage scraped in ${Date.now() - scrapingStartTime}ms`);
    const checks = [];
    let passedChecks = 0;
    let failedChecks = 0;
    const messages = {
      "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
      "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
      "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! \u2728" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
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
    const addCheck = async (title, description, passed, context, skipRecommendation = false) => {
      let recommendation = "";
      if (passed) {
        passedChecks++;
      } else {
        failedChecks++;
        if (!skipRecommendation) {
          const useGPT2 = enabledGPTChecks.includes(title);
          if (useGPT2) {
            try {
              recommendation = await getGPTRecommendation(title, keyphrase, context);
            } catch (error) {
              console.log(`GPT API Error: ${error}`);
              if (title === "Schema Markup") {
                recommendation = generateSchemaMarkupRecommendation(scrapedData, url);
              } else if (fallbackRecommendations[title]) {
                recommendation = fallbackRecommendations[title]({ keyphrase, title, context });
              } else {
                recommendation = `Consider optimizing your content for the keyphrase "${keyphrase}" in relation to ${title.toLowerCase()}.`;
              }
            }
          } else {
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
      const priority = checkPriorities[title] || "medium";
      checks.push({
        title,
        description: successDescription,
        passed,
        recommendation,
        priority
      });
    };
    const titleHasKeyphrase = scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in Title",
      "The focus keyphrase should appear in the page title",
      titleHasKeyphrase,
      scrapedData.title
    );
    const metaDescHasKeyphrase = scrapedData.metaDescription?.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in Meta Description",
      "The meta description should contain the focus keyphrase",
      metaDescHasKeyphrase,
      scrapedData.metaDescription
    );
    const isHome = isHomePage(url);
    const slugHasKeyphrase = isHome || url.toLowerCase().includes(keyphrase.toLowerCase());
    await addCheck(
      "Keyphrase in URL",
      isHome ? "This is the homepage URL, so the keyphrase is not required in the URL \u2728" : "The URL should contain the focus keyphrase",
      slugHasKeyphrase,
      url
    );
    const minWordCount = 300;
    const wordCount = scrapedData.content.split(/\s+/).length;
    await addCheck(
      "Content Length",
      `Your content has ${wordCount} words. For good SEO, aim for at least ${minWordCount} words to provide comprehensive coverage of your topic.`,
      wordCount >= minWordCount,
      `Current word count: ${wordCount}`,
      true
      // Skip GPT recommendation as we have custom message
    );
    const densityResult = calculateKeyphraseDensity(scrapedData.content, keyphrase);
    const goodDensity = densityResult.density >= 0.5 && densityResult.density <= 2.5;
    await addCheck(
      "Keyphrase Density",
      `Keyphrase density should be between 0.5% and 2.5%. Current density: ${densityResult.density.toFixed(1)}% (${densityResult.occurrences} occurrences in ${densityResult.totalWords} words)`,
      goodDensity,
      `Content length: ${densityResult.totalWords} words, Keyphrase occurrences: ${densityResult.occurrences}`,
      true
      // Skip GPT recommendation for density
    );
    console.log("Analyzing first paragraph...");
    let firstParagraph = scrapedData.paragraphs[0] || "";
    let keyphraseInIntro = false;
    let introContext = "No introduction paragraph found";
    if (firstParagraph) {
      const words = firstParagraph.toLowerCase().split(/\s+/);
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/);
      const normalizedParagraph = words.join(" ");
      const normalizedKeyphrase = keyphraseWords.join(" ");
      keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
      introContext = firstParagraph;
      console.log("Keyphrase found in intro:", keyphraseInIntro);
    } else {
      console.log("No first paragraph found");
    }
    await addCheck(
      "Keyphrase in Introduction",
      keyphraseInIntro ? "The focus keyphrase appears naturally in the first paragraph" : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
      keyphraseInIntro,
      introContext
    );
    const altTextsWithKeyphrase = scrapedData.images.some(
      (img) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
    );
    await addCheck(
      "Image Alt Attributes",
      "At least one image should have an alt attribute containing the focus keyphrase",
      altTextsWithKeyphrase,
      JSON.stringify(scrapedData.images)
    );
    const hasInternalLinks = scrapedData.internalLinks.length > 0;
    await addCheck(
      "Internal Links",
      "The page should contain internal links to other pages",
      hasInternalLinks,
      `Found ${scrapedData.internalLinks.length} internal links`
    );
    const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
    await addCheck(
      "Outbound Links",
      "The page should contain outbound links to authoritative sources",
      hasOutboundLinks,
      `Found ${scrapedData.outboundLinks.length} outbound links`
    );
    const nextGenFormats = [".webp", ".avif", ".svg"];
    let imageFormatRecommendation = "";
    let hasNextGenImages = false;
    if (scrapedData.images.length === 0) {
      imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
      hasNextGenImages = false;
    } else {
      const nonOptimizedImages = scrapedData.images.filter((img) => {
        const imgUrl = img.src.toLowerCase();
        return !nextGenFormats.some((format) => imgUrl.endsWith(format));
      });
      hasNextGenImages = nonOptimizedImages.length === 0;
      if (!hasNextGenImages) {
        const imageList = nonOptimizedImages.map((img) => img.src).join("\n");
        imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:
${imageList}

Use tools like cwebp or online converters to optimize these images.`;
      }
    }
    await addCheck(
      "Next-Gen Image Formats",
      "Images should use modern formats like WebP, AVIF, or SVG for better performance",
      hasNextGenImages,
      scrapedData.images.map((img) => img.src).join(", "),
      true
      // Skip GPT recommendation as we have custom recommendations
    );
    const hasOGImage = Boolean(scrapedData.ogMetadata.image);
    const validOGImageSize = Boolean(
      scrapedData.ogMetadata.imageWidth && scrapedData.ogMetadata.imageHeight && parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 && parseInt(scrapedData.ogMetadata.imageHeight) >= 630
    );
    const currentSize = hasOGImage ? `Current image size: ${scrapedData.ogMetadata.imageWidth || "unknown"}x${scrapedData.ogMetadata.imageHeight || "unknown"}px.` : "No OG image found.";
    await addCheck(
      "OG Image",
      hasOGImage ? validOGImageSize ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}` : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.` : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
      hasOGImage,
      // Changed to only check for image presence
      `Current Open Graph image: ${scrapedData.ogMetadata.image || "none"}. ${currentSize}`,
      true
      // Skip GPT recommendation since we have detailed custom message
    );
    const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
    const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
    const ogTitleLength = scrapedData.ogMetadata.title.length;
    const ogDescLength = scrapedData.ogMetadata.description.length;
    const validOGMeta = hasOGTitle && hasOGDescription && ogTitleLength >= 10 && ogTitleLength <= 70 && ogDescLength >= 100 && ogDescLength <= 200;
    await addCheck(
      "OG Title and Description",
      validOGMeta ? "Open Graph title and description are properly set with optimal lengths" : "Open Graph title and/or description need optimization",
      validOGMeta,
      JSON.stringify({
        title: scrapedData.ogMetadata.title,
        description: scrapedData.ogMetadata.description
      })
    );
    const h1Tags = scrapedData.headings.filter((heading) => heading.level === 1);
    const h2Tags = scrapedData.headings.filter((heading) => heading.level === 2);
    let h1HasKeyphrase = h1Tags.some(
      (heading) => heading.text.toLowerCase().includes(keyphrase.toLowerCase())
    );
    if (!h1HasKeyphrase && h1Tags.length > 0) {
      console.log("H1 exact match failed, trying word-by-word matching...");
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
      if (keyphraseWords.length > 0) {
        const normalizedParagraph = keyphraseWords.join(" ");
        const normalizedKeyphrase = keyphraseWords.join(" ");
        h1HasKeyphrase = normalizedParagraph.includes(normalizedKeyphrase);
      }
    }
    const h1Context = h1Tags.length > 0 ? `H1 heading ${h1HasKeyphrase ? "(contains keyphrase)" : "(missing keyphrase)"}: ${h1Tags.map((h) => `"${h.text}"`).join(", ")}
Target keyphrase: "${keyphrase}"` : "No H1 headings found on page";
    await addCheck(
      "Keyphrase in H1 Heading",
      h1Tags.length === 0 ? "Your page is missing an H1 heading. Add an H1 heading that includes your keyphrase." : h1Tags.length > 1 ? "You have multiple H1 headings. Best practice is to have a single H1 heading that includes your keyphrase." : "Your H1 heading should include your target keyphrase for optimal SEO.",
      h1HasKeyphrase && h1Tags.length === 1,
      `${h1Context}
Target keyphrase: "${keyphrase}"`
    );
    let h2HasKeyphrase = h2Tags.some(
      (heading) => heading.text.toLowerCase().includes(keyphrase.toLowerCase())
    );
    if (!h2HasKeyphrase && h2Tags.length > 0) {
      console.log("H2 exact match failed, trying word-by-word matching...");
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
      if (keyphraseWords.length > 0) {
        const allWordsFoundInAnyH2 = h2Tags.some((heading) => {
          const headingText = heading.text.toLowerCase();
          return keyphraseWords.every((word) => headingText.includes(word));
        });
        const allWordsFoundAcrossH2s = keyphraseWords.every(
          (word) => h2Tags.some((heading) => heading.text.toLowerCase().includes(word))
        );
        h2HasKeyphrase = allWordsFoundInAnyH2 || allWordsFoundAcrossH2s;
      }
    }
    let h2Context = "";
    if (h2Tags.length === 0) {
      h2Context = "No H2 headings found on page";
    } else {
      h2Context = `H2 headings ${h2HasKeyphrase ? "(contains keyphrase)" : "(missing keyphrase)"}:
`;
      h2Tags.forEach((h, i) => {
        h2Context += `${i + 1}. "${h.text}"
`;
      });
      h2Context += `
Target keyphrase: "${keyphrase}"
`;
      if (!h2HasKeyphrase) {
        h2Context += "\nConsider updating at least one H2 to include your target keyphrase.";
      }
    }
    await addCheck(
      "Keyphrase in H2 Headings",
      h2Tags.length === 0 ? "Your page doesn't have any H2 headings. Add H2 subheadings that include your keyphrase to structure your content." : "Your H2 headings should include your target keyphrase at least once to reinforce your topic focus.",
      h2HasKeyphrase && h2Tags.length > 0,
      `${h2Context}
Target keyphrase: "${keyphrase}"`
    );
    const hasH1 = h1Tags.length > 0;
    const hasH2 = h2Tags.length > 0;
    const hasProperHeadingStructure = hasH1 && hasH2 && h1Tags.length === 1;
    let hasProperLevelOrder = true;
    const allHeadings = [...scrapedData.headings].sort((a, b) => {
      return scrapedData.headings.indexOf(a) - scrapedData.headings.indexOf(b);
    });
    let prevLevel = 0;
    let skippedLevel = null;
    for (const heading of allHeadings) {
      if (heading.level > prevLevel + 1 && prevLevel > 0) {
        hasProperLevelOrder = false;
        skippedLevel = `H${prevLevel} \u2192 H${heading.level}`;
        break;
      }
      prevLevel = heading.level;
    }
    const hasProperHeadingHierarchy = hasProperHeadingStructure && hasProperLevelOrder;
    const headingStructureVisual = allHeadings.map((h) => {
      const prefix = `H${h.level}`;
      const text = h.text.length > 30 ? h.text.substring(0, 30) + "..." : h.text;
      return `${prefix}: "${text}"`;
    }).join("\n");
    let hierarchyIssue = "";
    if (!hasH1) {
      hierarchyIssue = "\u26A0\uFE0F Issue: Missing H1 heading";
    } else if (h1Tags.length > 1) {
      hierarchyIssue = `\u26A0\uFE0F Issue: Multiple H1 headings (${h1Tags.length} found)`;
    } else if (!hasH2) {
      hierarchyIssue = "\u26A0\uFE0F Issue: Missing H2 headings";
    } else if (!hasProperLevelOrder) {
      hierarchyIssue = `\u26A0\uFE0F Issue: Heading level skip detected (${skippedLevel})`;
    }
    const fullHierarchyContext = `Current heading structure:
${headingStructureVisual}

${hierarchyIssue}`;
    await addCheck(
      "Heading Hierarchy",
      hasProperHeadingHierarchy ? "Your page has a proper heading structure with a single H1 followed by appropriate subheadings." : !hasH1 ? "Your page is missing an H1 heading, which is crucial for SEO and document structure." : h1Tags.length > 1 ? "Your page has multiple H1 headings. Best practice is to have a single H1 heading per page." : !hasH2 ? "Your page is missing H2 headings. Use H2 headings to structure your content under the main H1 heading." : !hasProperLevelOrder ? "Your heading structure skips levels (e.g., H1 followed directly by H3). This can confuse search engines and assistive technologies." : "Your heading structure needs improvement. Follow a logical hierarchy (H1 \u2192 H2 \u2192 H3) for better SEO.",
      hasProperHeadingHierarchy,
      fullHierarchyContext,
      true
      // Use our custom recommendation
    );
    const jsResources = scrapedData.resources.js;
    const cssResources = scrapedData.resources.css;
    const totalJsResources = jsResources.length;
    const totalCssResources = cssResources.length;
    const minifiedJsCount = jsResources.filter((r) => r.minified).length;
    const minifiedCssCount = cssResources.filter((r) => r.minified).length;
    const totalResources = totalJsResources + totalCssResources;
    const minifiedResources = minifiedJsCount + minifiedCssCount;
    const minificationPercentage = totalResources > 0 ? Math.round(minifiedResources / totalResources * 100) : 100;
    const nonMinifiedJs = jsResources.filter((r) => !r.minified && r.url !== "inline-script").map((r) => r.url);
    const nonMinifiedCss = cssResources.filter((r) => !r.minified && r.url !== "inline-style").map((r) => r.url);
    const hasNonMinified = nonMinifiedJs.length > 0 || nonMinifiedCss.length > 0;
    const hasInlineNonMinified = jsResources.some((r) => r.url === "inline-script" && !r.minified) || cssResources.some((r) => r.url === "inline-style" && !r.minified);
    let minificationContext = "";
    if (totalResources === 0) {
      minificationContext = "No JavaScript or CSS resources found on the page.";
    } else {
      minificationContext = `Found ${totalJsResources} JavaScript and ${totalCssResources} CSS resources. `;
      minificationContext += `${minifiedJsCount} of ${totalJsResources} JavaScript and ${minifiedCssCount} of ${totalCssResources} CSS resources are minified. `;
      if (nonMinifiedJs.length > 0) {
        minificationContext += `

Non-minified JavaScript files:
${nonMinifiedJs.join("\n")}`;
      }
      if (nonMinifiedCss.length > 0) {
        minificationContext += `

Non-minified CSS files:
${nonMinifiedCss.join("\n")}`;
      }
      if (hasInlineNonMinified) {
        minificationContext += `

Non-minified inline scripts or styles detected. Consider minifying them as well.`;
      }
    }
    const minificationPasses = minificationPercentage >= 40;
    await addCheck(
      "Code Minification",
      minificationPasses ? `Your JavaScript and CSS resources are well optimized. ${minificationPercentage}% are minified.` : `${minificationPercentage}% of your JavaScript and CSS resources are minified. Aim for at least 40% minification.`,
      minificationPasses,
      minificationContext,
      true
      // Skip GPT recommendation for this technical check
    );
    const hasSchemaMarkup = scrapedData.schema.detected;
    const schemaTypesDetected = scrapedData.schema.types;
    let schemaContext = "";
    if (hasSchemaMarkup) {
      schemaContext = `Schema markup found on page. Types detected: ${schemaTypesDetected.join(", ") || "Unknown"}`;
    } else {
      schemaContext = `
No schema markup detected on page.
Page title: ${scrapedData.title}
Meta description: ${scrapedData.metaDescription}
URL: ${url}
Content type indicators:
- First H1: ${h1Tags.length > 0 ? h1Tags[0].text : "None"}
- First few H2s: ${h2Tags.slice(0, 3).map((h) => h.text).join(", ")}
- Has images: ${scrapedData.images.length > 0 ? "Yes" : "No"}
- Is homepage: ${isHomePage(url) ? "Yes" : "No"}
- Content preview: ${scrapedData.paragraphs.slice(0, 2).join(" ").substring(0, 200)}...
`;
    }
    let schemaRecommendation = "";
    if (hasSchemaMarkup) {
      schemaRecommendation = `Your page has schema markup implemented. The following schema types were detected:

`;
      if (schemaTypesDetected.length > 0) {
        schemaTypesDetected.forEach((type, index) => {
          schemaRecommendation += `${index + 1}. **${type}** - This helps search engines understand that your content represents a ${type.toLowerCase()}
`;
        });
        schemaRecommendation += `
You can further optimize your schema markup by ensuring all required properties are included for each type.`;
      } else {
        schemaRecommendation += `Schema markup was detected but the specific type couldn't be determined. Consider using more specific schema types from schema.org.`;
      }
    } else {
      schemaRecommendation = generateSchemaMarkupRecommendation(scrapedData, url);
    }
    await addCheck(
      "Schema Markup",
      hasSchemaMarkup ? `Your page has schema markup implemented (${schemaTypesDetected.join(", ") || "Unknown type"})` : "Your page is missing schema markup (structured data)",
      hasSchemaMarkup,
      schemaContext,
      true
      // Skip GPT recommendation as we're using our custom one
    );
    const schemaCheck = checks.find((check) => check.title === "Schema Markup");
    if (schemaCheck) {
      schemaCheck.recommendation = schemaRecommendation;
    }
    const MAX_IMAGE_SIZE = 300 * 1024;
    let hasLargeImages = false;
    const largeImages = [];
    if (scrapedData.images.length === 0) {
      hasLargeImages = false;
    } else {
      scrapedData.images.forEach((img) => {
        if (img.size && img.size > MAX_IMAGE_SIZE) {
          hasLargeImages = true;
          largeImages.push({
            src: img.src,
            alt: img.alt || "",
            size: img.size
          });
        }
      });
    }
    const totalImages = scrapedData.images.length;
    const imagesWithSize = scrapedData.images.filter((img) => img.size !== void 0).length;
    const oversizedCount = largeImages.length;
    let imageSizesContext = `Found ${totalImages} images, ${imagesWithSize} with retrievable size information.
`;
    imageSizesContext += `${oversizedCount} images exceed the recommended size of 300KB.

`;
    if (largeImages.length > 0) {
      imageSizesContext += "Large images:\n";
      largeImages.forEach((img) => {
        const imageLabel = img.alt ? img.alt.length > 40 ? img.alt.substring(0, 40) + "..." : img.alt : "Image with missing alt text";
        imageSizesContext += `- ${imageLabel} (${formatBytes(img.size)})
`;
      });
    }
    await addCheck(
      "Image File Size",
      oversizedCount === 0 ? `All images are optimized with file sizes under 300KB.` : `${oversizedCount} out of ${totalImages} images exceed the recommended size of 300KB. Large images slow down page loading.`,
      !hasLargeImages,
      imageSizesContext,
      true
      // Skip GPT recommendation as we'll use our custom one
    );
    if (hasLargeImages) {
      const imageFileCheck = checks.find((check) => check.title === "Image File Size");
      if (imageFileCheck) {
        imageFileCheck.recommendation = fallbackRecommendations["Image File Size"]({ largeImages });
      }
    }
    console.log(`[SEO Analyzer] Analysis completed in ${Date.now() - startTime}ms`);
    return {
      checks,
      passedChecks,
      failedChecks,
      url,
      score: Math.round(passedChecks / checks.length * 100)
    };
  } catch (error) {
    console.error(`[SEO Analyzer] Error during analysis:`, error);
    throw error;
  }
}
function generateSchemaMarkupRecommendation(scrapedData, url) {
  const isHome = isHomePage(url);
  const hasProductIndicators = scrapedData.title.toLowerCase().includes("product") || scrapedData.content.toLowerCase().includes("price") || scrapedData.content.toLowerCase().includes("buy now") || scrapedData.content.toLowerCase().includes("add to cart");
  const hasArticleIndicators = scrapedData.paragraphs.length > 3 || scrapedData.content.split(/\s+/).length > 500 || scrapedData.title.toLowerCase().includes("article") || scrapedData.title.toLowerCase().includes("blog") || scrapedData.title.toLowerCase().includes("news");
  const hasFAQIndicators = scrapedData.content.toLowerCase().includes("faq") || scrapedData.content.toLowerCase().includes("frequently asked") || scrapedData.headings.filter((h) => h.text.toLowerCase().includes("faq") || h.text.toLowerCase().includes("question")).length > 0;
  const hasOrganizationIndicators = scrapedData.content.toLowerCase().includes("about us") || scrapedData.content.toLowerCase().includes("contact us") || scrapedData.content.toLowerCase().includes("our team") || scrapedData.content.toLowerCase().includes("company");
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
  if (!isHome && schemaTypes.length === 0) {
    schemaTypes.push("WebPage Schema");
  }
  schemaTypes.forEach((type) => {
    recommendation += `\u2022 ${type}
`;
  });
  recommendation += "\nTip: Test implementations with Google's Rich Results Test tool.";
  return recommendation;
}

// server/lib/security.ts
import * as ip from "ip";
import IPCIDR from "ip-cidr";
import { URL as URL2 } from "url";
var ALLOWED_DOMAINS = [
  "example.com",
  "pull-list.net",
  "*.pull-list.net",
  "www.pmds.pull-list.net",
  "pmds.pull-list.net"
];
var ENFORCE_ALLOWLIST = process.env.ENFORCE_DOMAIN_ALLOWLIST !== "false";
function addDomainToAllowlist(domain) {
  domain = domain.toLowerCase().trim();
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain already in allowlist: ${domain}`);
    return false;
  }
  ALLOWED_DOMAINS.push(domain);
  console.log(`Added ${domain} to allowlist. Current list has ${ALLOWED_DOMAINS.length} domains.`);
  return true;
}
function getAllowedDomains() {
  return [...ALLOWED_DOMAINS];
}
function isIPv4Format(address) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipv4Regex.test(address)) return false;
  const octets = address.split(".").map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255);
}
function isIPv6Format(address) {
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(address);
}
function isValidUrl(urlString) {
  try {
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = "https://" + urlString;
    } else if (/^http:\/\//i.test(urlString)) {
      urlString = urlString.replace(/^http:/i, "https:");
    }
    const url = new URL2(urlString);
    if (url.protocol !== "https:") {
      console.log(`Rejected non-HTTPS URL: ${urlString}`);
      return false;
    }
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(url.hostname)) {
      console.warn(`Domain not in allowlist: ${url.hostname}`);
      return false;
    }
    const pathname = url.pathname;
    if (pathname.includes("../") || pathname.includes("/..")) {
      console.warn(`Path traversal detected in URL path: ${pathname}`);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
function isAllowedDomain(domain) {
  if (!ENFORCE_ALLOWLIST) return true;
  if (ALLOWED_DOMAINS.length === 0) return true;
  domain = domain.toLowerCase();
  console.log(`Checking if domain '${domain}' is in allowlist:`, JSON.stringify(ALLOWED_DOMAINS));
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain '${domain}' found in allowlist (exact match)`);
    return true;
  }
  const matchedWildcard = ALLOWED_DOMAINS.find((allowedDomain) => {
    if (allowedDomain.startsWith("*.")) {
      const baseDomain = allowedDomain.substring(2);
      const matches = domain.endsWith(baseDomain) && domain.length > baseDomain.length;
      if (matches) {
        console.log(`Domain '${domain}' matches wildcard '${allowedDomain}'`);
      }
      return matches;
    }
    return false;
  });
  return !!matchedWildcard;
}
function validateIPAddress(address) {
  if (!address) return false;
  let normalizedAddr;
  try {
    if (isIPv4Format(address)) {
      try {
        const buffer = ip.toBuffer(address);
        normalizedAddr = ip.toString(buffer);
      } catch (e) {
        normalizedAddr = address;
      }
    } else if (isIPv6Format(address)) {
      normalizedAddr = address;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
  if (normalizedAddr === "127.0.0.1" || normalizedAddr.startsWith("127.") || normalizedAddr === "::1" || normalizedAddr.toLowerCase().includes("127.0.0.1") || normalizedAddr.toLowerCase().includes("::1")) {
    return false;
  }
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Pattern.test(normalizedAddr)) {
    const matches = normalizedAddr.match(ipv4Pattern);
    if (!matches) return false;
    const octets = matches.slice(1).map(Number);
    if (octets[0] === 127) return false;
    if (octets[0] === 10 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31 || octets[0] === 192 && octets[1] === 168) {
      return false;
    }
  }
  try {
    return ip.isPublic(normalizedAddr);
  } catch (e) {
    return !isPrivateIP(normalizedAddr);
  }
}
function validateUrl(url) {
  try {
    console.log(`validateUrl - Checking URL: ${url}`);
    const urlObj = new URL2(url);
    const protocol = urlObj.protocol.toLowerCase();
    console.log(`validateUrl - Protocol detected: ${protocol}`);
    if (protocol !== "https:") {
      console.log(`Rejected non-HTTPS URL in validateUrl: ${url}`);
      return false;
    }
    const hostname = urlObj.hostname;
    console.log(`validateUrl - Hostname: ${hostname}`);
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(hostname)) {
      console.warn(`Domain not in allowlist: ${hostname}`);
      return false;
    }
    console.log(`validateUrl - Domain allowlist check passed`);
    if (isIPv4Format(hostname) || isIPv6Format(hostname)) {
      console.log(`validateUrl - Hostname is an IP address: ${hostname}`);
      const ipValid = validateIPAddress(hostname);
      console.log(`validateUrl - IP validation result: ${ipValid}`);
      return ipValid;
    }
    console.log(`validateUrl - Validation successful for: ${url}`);
    return true;
  } catch (e) {
    console.error(`validateUrl - Error validating URL: ${e}`);
    return false;
  }
}
function isPrivateIP(ip2) {
  const privateRanges = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "127.0.0.0/8",
    "169.254.0.0/16"
  ];
  return privateRanges.some((range) => {
    try {
      const cidr = new IPCIDR(range);
      return cidr.contains(ip2);
    } catch (error) {
      console.error(`Error checking IP range ${range}:`, error);
      return false;
    }
  });
}

// server/routes.ts
import { URL as URL3 } from "url";
import dns from "dns";
import { promisify } from "util";
var dnsLookup = promisify(dns.lookup);
function registerRoutes(app2) {
  const useGPT2 = process.env.USE_GPT_RECOMMENDATIONS !== "false";
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
  if (useGPT2 && !hasOpenAIKey) {
    console.warn("[SEO Analyzer] WARNING: GPT recommendations are enabled but no valid OpenAI API key was provided. Will use fallback recommendations.");
  }
  const enabledChecks = process.env.ENABLED_GPT_CHECKS ? process.env.ENABLED_GPT_CHECKS.split(",") : ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in Introduction", "Keyphrase in H1 Heading", "Keyphrase in H2 Headings"];
  app2.post("/api/register-domains", async (req, res) => {
    console.log("Received POST request to /api/register-domains");
    const { domains } = req.body;
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of domains to register"
      });
    }
    try {
      const registeredDomains = [];
      const failedDomains = [];
      for (const domainUrl of domains) {
        try {
          const url = new URL3(domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`);
          const domain = url.hostname;
          console.log(`Registering domain: ${domain}`);
          const added = addDomainToAllowlist(domain);
          const wildcardAdded = addDomainToAllowlist(`*.${domain}`);
          if (added || wildcardAdded) {
            registeredDomains.push(domain);
          } else {
            console.log(`Domain already in allowlist: ${domain}`);
          }
        } catch (err) {
          console.error(`Failed to process domain ${domainUrl}:`, err);
          failedDomains.push(domainUrl);
        }
      }
      return res.json({
        success: true,
        registered: registeredDomains,
        failed: failedDomains,
        message: `Successfully registered ${registeredDomains.length} domains. ${failedDomains.length > 0 ? `Failed to register ${failedDomains.length} domains.` : ""}`
      });
    } catch (error) {
      console.error("Error registering domains:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while registering domains"
      });
    }
  });
  app2.post("/api/analyze", async (req, res) => {
    console.log("======= API ANALYZE REQUEST START =======");
    console.log("Received POST request to /api/analyze at:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("Request body:", JSON.stringify(req.body));
    try {
      let { url, keyphrase } = req.body;
      if (!url || !keyphrase) {
        console.log("Missing URL or keyphrase in request body");
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }
      console.log("Processing request for URL:", url, "with keyphrase:", keyphrase);
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
        console.log("Added HTTPS protocol to URL:", url);
      } else if (/^http:\/\//i.test(url)) {
        url = url.replace(/^http:/i, "https:");
        console.log("Converted HTTP to HTTPS:", url);
      }
      try {
        const parsedUrl2 = new URL3(url);
        const domain = parsedUrl2.hostname;
        console.log(`Auto-registering domain to allowlist: ${domain}`);
        const domainAdded = addDomainToAllowlist(domain);
        const wildcardAdded = addDomainToAllowlist(`*.${domain}`);
        if (domainAdded || wildcardAdded) {
          console.log(`Successfully added ${domain} to allowlist`);
        } else {
          console.log(`Domain ${domain} was already in allowlist`);
        }
        console.log("Current allowlist:", getAllowedDomains());
      } catch (error) {
        console.error("Error auto-registering domain:", error);
      }
      console.log("Validating URL format and allowlist...");
      if (!isValidUrl(url)) {
        console.log("Invalid or disallowed URL format:", url);
        return res.status(400).json({
          message: "Invalid URL format, non-HTTPS protocol, or domain not allowed"
        });
      }
      const parsedUrl = new URL3(url);
      console.log("URL parsed successfully:", parsedUrl.toString());
      try {
        console.log("Resolving hostname to IP address:", parsedUrl.hostname);
        const { address } = await dnsLookup(parsedUrl.hostname);
        console.log("Hostname resolved to IP address:", address);
        console.log("Checking if IP is private...");
        if (isPrivateIP(address)) {
          console.log("Private IP address detected:", address);
          return res.status(400).json({
            message: "Requests to private IP addresses are not allowed"
          });
        }
        console.log("Performing final URL validation...");
        if (!validateUrl(url)) {
          console.log("URL failed security validation:", url);
          return res.status(400).json({
            message: "URL failed security validation"
          });
        }
        console.log("Starting SEO analysis...");
        const analysisStartTime = Date.now();
        try {
          const results = await analyzeSEOElements(url, keyphrase);
          const analysisEndTime = Date.now();
          console.log(`SEO analysis completed in ${analysisEndTime - analysisStartTime}ms`);
          console.log("Analysis results:", JSON.stringify(results).substring(0, 200) + "...");
          console.log("======= API ANALYZE REQUEST END =======");
          return res.json(results);
        } catch (analysisError) {
          console.error("Error during SEO analysis:", analysisError);
          console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
          return res.status(500).json({
            message: "Error analyzing SEO elements: " + (analysisError.message || "Unknown error")
          });
        }
      } catch (dnsError) {
        console.error("DNS or validation error:", dnsError);
        console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
        return res.status(500).json({
          message: "Failed to resolve hostname or validate URL: " + (dnsError.message || "Unknown error")
        });
      }
    } catch (error) {
      console.error("Unexpected error analyzing SEO elements:", error);
      console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
      return res.status(500).json({ message: error.message || "Unknown error" });
    }
  });
  return app2;
}

// server/vite.ts
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
var ROOT_DIR = process.cwd();
var CLIENT_DIR = path.join(ROOT_DIR, "client");
var PUBLIC_DIR = path.join(ROOT_DIR, "public");
var viteLogger = createLogger();
function log(...args) {
  console.log("\x1B[36m[server]\x1B[0m", ...args);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    // Define config inline instead of importing it
    plugins: [],
    root: CLIENT_DIR,
    // Remove the reference to viteConfig
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "spa",
    build: {
      outDir: "../public",
      emptyOutDir: true
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (msg.includes("[TypeScript] Found 0 errors. Watching for file changes")) {
          log("no errors found", "tsc");
          return;
        }
        if (msg.includes("[TypeScript] ")) {
          const [errors, summary] = msg.split("[TypeScript] ", 2);
          log(`${summary} ${errors}\x1B[0m`, "tsc");
          return;
        } else {
          viteLogger.error(msg, options);
          process.exit(1);
        }
      }
    }
  });
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100
    // limit each IP to 100 requests per windowMs
  });
  app2.use(limiter);
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        CLIENT_DIR,
        "index.html"
      );
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  log("Vite development server set up");
  return vite;
}
function serveStatic(app2) {
  app2.use(express.static(PUBLIC_DIR));
  const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100
    // limit each IP to 100 requests per windowMs
  });
  app2.use("*", staticLimiter, (_req, res) => {
    res.sendFile(path.resolve(PUBLIC_DIR, "index.html"));
  });
  log("Static files being served from:", PUBLIC_DIR);
}

// server/index.ts
import dotenv2 from "dotenv";
import cors from "cors";
import path2 from "path";
dotenv2.config();
var ROOT_DIR2 = process.cwd();
var app = express2();
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  maxAge: 86400
  // 24 hours
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "clipboard-write=*, clipboard-read=*");
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
(async () => {
  const server = createServer(app);
  registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(express2.static(path2.join(ROOT_DIR2, "public")));
  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();
