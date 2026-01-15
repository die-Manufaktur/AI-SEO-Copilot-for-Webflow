import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './circular-progress';

/**
 * CircularProgress Component Tests
 * 
 * Tests for the SEO score circular progress indicator
 * that displays score as a circular progress bar with
 * the score number in the center.
 */

describe('CircularProgress', () => {
  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<CircularProgress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display the correct score value', () => {
      render(<CircularProgress value={75} />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should show "SEO Score" label by default', () => {
      render(<CircularProgress value={50} />);
      expect(screen.getByText('SEO Score')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<CircularProgress value={50} label="Performance Score" />);
      expect(screen.getByText('Performance Score')).toBeInTheDocument();
    });
  });

  describe('Progress visualization', () => {
    it('should have correct size (160px diameter)', () => {
      render(<CircularProgress value={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveStyle({
        width: '160px',
        height: '160px'
      });
    });

    it('should apply coral color for score display', () => {
      render(<CircularProgress value={33} />);
      const scoreText = screen.getByText('33');
      expect(scoreText).toHaveClass('text-score-coral');
    });

    it('should have proper stroke width for visibility', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const progressCircle = svg?.querySelector('circle:last-child');
      expect(progressCircle).toHaveAttribute('stroke-width', '8');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CircularProgress value={75} />);
      const progressbar = screen.getByRole('progressbar');
      
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have accessible label', () => {
      render(<CircularProgress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'SEO Score: 50 out of 100');
    });

    it('should use custom aria-label when provided', () => {
      render(<CircularProgress value={75} ariaLabel="Custom progress indicator" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Custom progress indicator');
    });
  });

  describe('Edge cases', () => {
    it('should handle 0 value correctly', () => {
      render(<CircularProgress value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100 value correctly', () => {
      render(<CircularProgress value={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('should clamp values above 100', () => {
      render(<CircularProgress value={150} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('should clamp negative values to 0', () => {
      render(<CircularProgress value={-10} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle decimal values by rounding', () => {
      render(<CircularProgress value={75.7} />);
      expect(screen.getByText('76')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes', () => {
      render(<CircularProgress value={50} className="custom-class" />);
      const container = screen.getByRole('progressbar').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should have dark background circle', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const backgroundCircle = svg?.querySelector('circle:first-child');
      expect(backgroundCircle).toHaveClass('text-muted');
    });

    it('should use coral color for progress arc', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const progressCircle = svg?.querySelector('circle:last-child');
      expect(progressCircle).toHaveClass('text-score-coral');
    });
  });

  describe('Animation', () => {
    it('should have smooth transition animation', () => {
      render(<CircularProgress value={50} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const progressCircle = svg?.querySelector('circle:last-child');
      expect(progressCircle).toHaveClass('transition-all', 'duration-700', 'ease-in-out');
    });
  });
});