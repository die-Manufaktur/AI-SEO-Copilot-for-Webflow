import { describe, it, expect } from 'vitest';
import { isNextGenImageFormat } from '../../utils/images';

describe('isNextGenImageFormat', () => {
  // Test next-gen formats
  it('should return true for WebP images', () => {
    expect(isNextGenImageFormat('https://example.com/image.webp')).toBe(true);
    expect(isNextGenImageFormat('/assets/image.webp')).toBe(true);
    expect(isNextGenImageFormat('image.webp')).toBe(true);
  });

  it('should return true for AVIF images', () => {
    expect(isNextGenImageFormat('https://example.com/image.avif')).toBe(true);
    expect(isNextGenImageFormat('/assets/image.avif')).toBe(true);
    expect(isNextGenImageFormat('image.avif')).toBe(true);
  });

  it('should return true for SVG images', () => {
    expect(isNextGenImageFormat('https://example.com/image.svg')).toBe(true);
    expect(isNextGenImageFormat('/assets/image.svg')).toBe(true);
    expect(isNextGenImageFormat('image.svg')).toBe(true);
  });

  // Test URLs with query parameters
  it('should return true for next-gen formats with query parameters', () => {
    expect(isNextGenImageFormat('https://example.com/image.webp?width=200')).toBe(true);
    expect(isNextGenImageFormat('/assets/image.avif?v=123')).toBe(true);
    expect(isNextGenImageFormat('image.svg?height=100&width=200')).toBe(true);
  });

  // Test old/standard formats
  it('should return false for standard image formats', () => {
    expect(isNextGenImageFormat('https://example.com/image.jpg')).toBe(false);
    expect(isNextGenImageFormat('/assets/image.jpeg')).toBe(false);
    expect(isNextGenImageFormat('image.png')).toBe(false);
    expect(isNextGenImageFormat('https://example.com/image.gif?v=123')).toBe(false);
  });

  // Test edge cases
  it('should handle edge cases correctly', () => {
    expect(isNextGenImageFormat('')).toBe(false);
    expect(isNextGenImageFormat('https://example.com/image')).toBe(false);
    expect(isNextGenImageFormat('https://example.com/image.webp.jpg')).toBe(false); // Ends with jpg
    expect(isNextGenImageFormat('https://example.com/image-webp.jpg')).toBe(false); // Contains webp but isn't webp
  });
});