import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkNextGenImageFormats } from '../../utils/analysis';

// Hardcoded URL for testing
const NEXT_GEN_DOCS_URL = "https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation/images/next-gen-image-formats";

describe('Next-Gen Image Format Analysis', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  it('should pass when all images use next-gen formats', () => {
    const data = {
      images: [
        { src: 'image1.webp', alt: 'Image 1', isNextGen: true },
        { src: 'image2.avif', alt: 'Image 2', isNextGen: true },
        { src: 'image3.svg', alt: 'Image 3', isNextGen: true }
      ]
    };
    
    const result = checkNextGenImageFormats(data);
    
    expect(result.passed).toBe(true);
    expect(result.result).toContain('100%');
    expect(result.learnMoreLink).toBe(NEXT_GEN_DOCS_URL);
  });

  it('should pass when more than 70% of images use next-gen formats', () => {
    const data = {
      images: [
        { src: 'image1.webp', alt: 'Image 1', isNextGen: true },
        { src: 'image2.avif', alt: 'Image 2', isNextGen: true },
        { src: 'image3.svg', alt: 'Image 3', isNextGen: true },
        { src: 'image4.jpg', alt: 'Image 4', isNextGen: false }
      ]
    };
    
    const result = checkNextGenImageFormats(data);
    
    expect(result.passed).toBe(true);
    expect(result.result).toContain('75%');
    expect(result.learnMoreLink).toBe(NEXT_GEN_DOCS_URL);
  });

  it('should fail when less than 70% of images use next-gen formats', () => {
    const data = {
      images: [
        { src: 'image1.webp', alt: 'Image 1', isNextGen: true },
        { src: 'image2.jpg', alt: 'Image 2', isNextGen: false },
        { src: 'image3.png', alt: 'Image 3', isNextGen: false },
        { src: 'image4.gif', alt: 'Image 4', isNextGen: false }
      ]
    };
    
    const result = checkNextGenImageFormats(data);
    
    expect(result.passed).toBe(false);
    expect(result.result).toContain('25%');
    expect(result.result).toContain('Convert more images');
    expect(result.learnMoreLink).toBe(NEXT_GEN_DOCS_URL);
  });

  it('should handle empty image array', () => {
    const data = { images: [] };
    
    const result = checkNextGenImageFormats(data);
    
    expect(result.passed).toBe(true);
    expect(result.result).toBe('No images found on the page');
    expect(result.learnMoreLink).toBe(NEXT_GEN_DOCS_URL);
  });

  it('should handle missing image array', () => {
    const data = {};
    
    const result = checkNextGenImageFormats(data);
    
    expect(result.passed).toBe(true);
    expect(result.result).toBe('No images found on the page');
    expect(result.learnMoreLink).toBe(NEXT_GEN_DOCS_URL);
  });
});