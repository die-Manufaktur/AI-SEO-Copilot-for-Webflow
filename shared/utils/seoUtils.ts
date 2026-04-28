import type { SEOCheck } from '../types';

/**
 * Calculates the overall SEO score based on check priorities.
 * @param checks - An array of SEOCheck objects.
 * @returns The calculated SEO score (0-100).
 */
export const calculateSEOScore = (checks: SEOCheck[]): number => {
  if (!checks || checks.length === 0) return 0;

  // Define weights for different priority levels
  const weights = {
    high: 3,
    medium: 2,
    low: 1
  };

  // Calculate total possible points
  let totalPossiblePoints = 0;
  checks.forEach(check => {
    // Use medium as default weight if priority is somehow invalid
    totalPossiblePoints += weights[check.priority] || weights.medium;
  });

  // Calculate earned points
  let earnedPoints = 0;
  checks.forEach(check => {
    if (check.passed) {
      // Use medium as default weight if priority is somehow invalid
      earnedPoints += weights[check.priority] || weights.medium;
    }
  });

  // Prevent division by zero
  if (totalPossiblePoints === 0) return 0;

  // Calculate percentage score (0-100)
  return Math.round((earnedPoints / totalPossiblePoints) * 100);
};

/**
 * Determines whether a copy button should be shown for a specific SEO check type
 * @param checkTitle The title of the SEO check
 * @returns Boolean indicating whether a copy button should be displayed
 */
export function shouldShowCopyButton(checkTitle: string): boolean {
  return [
    // Meta SEO category checks
    "Keyphrase in Title",
    "Keyphrase in Meta Description",
    "Keyphrase in URL",
    // Content Optimization category checks
    "Keyphrase in Introduction",
    "Keyphrase in H1 Heading",
    "Keyphrase in H2 Headings",
    // Images and Assets category checks
    "Image Alt Attributes"
  ].includes(checkTitle);
}