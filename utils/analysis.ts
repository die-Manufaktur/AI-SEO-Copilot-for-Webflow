// Constants
const NEXT_GEN_DOCS_URL = "https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation/images/next-gen-image-formats";

/**
 * Checks if a sufficient percentage of images use next-gen formats
 * @param data Object containing images array
 * @returns Analysis result with pass/fail status and descriptive message
 */
export function checkNextGenImageFormats(data: any) {
  // Handle cases with no images
  if (!data.images || data.images.length === 0) {
    return {
      passed: true,
      result: 'No images found on the page',
      learnMoreLink: NEXT_GEN_DOCS_URL
    };
  }

  // Calculate percentage of next-gen images
  const totalImages = data.images.length;
  const nextGenImages = data.images.filter((img: any) => img.isNextGen).length;
  const percentage = Math.round((nextGenImages / totalImages) * 100);
  
  // Determine if check passes (70% or more next-gen images)
  const passed = percentage >= 70;
  
  // Create result message
  let result = `${percentage}% of images use next-gen formats (${nextGenImages}/${totalImages})`;
  if (!passed) {
    result += '. Convert more images to next-gen formats for better performance.';
  }
  
  return {
    passed,
    result,
    learnMoreLink: NEXT_GEN_DOCS_URL
  };
}