import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SEOCheck } from 'shared/types';
import { renderRecommendation } from './Home';

describe('H1 Heading Check', () => {
  const mockH1Check: SEOCheck = {
    title: "Keyphrase in H1 Heading",
    description: "Your H1 heading should include your target keyphrase",
    passed: false,
    priority: "high",
    recommendation: 'Update the H1 heading to include the keyphrase "affordable website" for improved SEO optimization.'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('H1 Heading Display', () => {
    it('should render the recommendation text and suggested heading', () => {
      const { container } = render(renderRecommendation(mockH1Check));
      
      // Check if the recommendation text is displayed
      expect(container).toHaveTextContent('Update the H1 heading to include the keyphrase "affordable website"');
      
      // Check if the suggested heading is displayed
      expect(container).toHaveTextContent('Affordable Website Design Services | Professional & Custom Solutions');
      
      // Verify the suggested heading is in a background container
      const headingContainer = container.querySelector('.bg-background2');
      expect(headingContainer).not.toBeNull();
    });

    it('should not display "Suggested H1 Heading:" label', () => {
      const { container } = render(renderRecommendation(mockH1Check));
      expect(container).not.toHaveTextContent('Suggested H1 Heading:');
    });
  });

  describe('H1 Content Structure', () => {
    it('should have the recommendation in a paragraph with proper styling', () => {
      const { container } = render(renderRecommendation(mockH1Check));
      
      const recommendationParagraph = container.querySelector('p.text-sm.text-text2');
      expect(recommendationParagraph).not.toBeNull();
      expect(recommendationParagraph?.textContent).toContain('Update the H1 heading');
    });
    
    it('should have the suggested heading in a styled container', () => {
      const { container } = render(renderRecommendation(mockH1Check));
      
      const backgroundDiv = container.querySelector('.bg-background2.p-4.rounded-md');
      expect(backgroundDiv).not.toBeNull();
      
      const headingText = backgroundDiv?.querySelector('p.text-sm.text-text2');
      expect(headingText).not.toBeNull();
      expect(headingText?.textContent).toBe('Affordable Website Design Services | Professional & Custom Solutions');
    });
  });

  describe('Edge Cases', () => {
    it('should maintain consistent suggested heading across renders', () => {
      const { container: container1 } = render(renderRecommendation(mockH1Check));
      const { container: container2 } = render(renderRecommendation(mockH1Check));
      
      const heading1 = container1.textContent;
      const heading2 = container2.textContent;
      
      expect(heading1).toBe(heading2);
    });

    it('should handle undefined recommendation gracefully', () => {
      const checkWithNoRecommendation = { ...mockH1Check, recommendation: undefined };
      const { container } = render(renderRecommendation(checkWithNoRecommendation));
      
      // Should not throw error and should render empty container
      expect(container).toBeTruthy();
    });
  });
}); 