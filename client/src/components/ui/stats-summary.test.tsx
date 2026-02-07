import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsSummary } from './stats-summary';

describe('StatsSummary', () => {
  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      expect(screen.getByText(/5 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/3 to improve/i)).toBeInTheDocument();
    });

    it('should display correct passed and to improve counts', () => {
      render(<StatsSummary passed={8} toImprove={2} />);
      expect(screen.getByText(/8 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/2 to improve/i)).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      render(<StatsSummary passed={1} toImprove={1} />);
      const summary = screen.getByRole('status');
      expect(summary.tagName).toBe('DIV');
    });

    it('should format text correctly with triangle indicators', () => {
      render(<StatsSummary passed={10} toImprove={5} />);
      const summary = screen.getByRole('status');
      // SVG triangles are now used instead of text characters
      const svgs = summary.querySelectorAll('svg');
      expect(svgs.length).toBe(2);
    });
  });

  describe('Edge cases and zero values', () => {
    it('should handle zero passed items', () => {
      render(<StatsSummary passed={0} toImprove={7} />);
      expect(screen.getByText(/0 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/7 to improve/i)).toBeInTheDocument();
    });

    it('should handle zero items to improve', () => {
      render(<StatsSummary passed={12} toImprove={0} />);
      expect(screen.getByText(/12 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/0 to improve/i)).toBeInTheDocument();
    });

    it('should handle both values as zero', () => {
      render(<StatsSummary passed={0} toImprove={0} />);
      expect(screen.getByText(/0 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/0 to improve/i)).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      render(<StatsSummary passed={999} toImprove={123} />);
      expect(screen.getByText(/999 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/123 to improve/i)).toBeInTheDocument();
    });
  });

  describe('Styling and Design Tokens', () => {
    it('should use flex layout with gap for icons and text', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const passedText = screen.getByText(/5 passed/i).closest('span');
      expect(passedText).toHaveClass('flex', 'items-center', 'gap-1.5');
    });

    it('should use correct font size from design token', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('text-sm');
    });

    it('should have vertical margin', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('my-6');
    });

    it('should use medium font weight', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('font-medium');
    });
  });

  describe('Props and customization', () => {
    it('should accept and apply custom className', () => {
      render(<StatsSummary passed={5} toImprove={3} className="custom-stats" />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('custom-stats');
    });

    it('should merge custom className with default classes', () => {
      render(<StatsSummary passed={5} toImprove={3} className="custom-stats" />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('custom-stats', 'text-sm', 'font-medium', 'my-6');
    });

    it('should accept passed as a required prop', () => {
      // This test ensures TypeScript compilation catches missing required props
      expect(() => render(<StatsSummary passed={5} toImprove={3} />)).not.toThrow();
    });

    it('should accept toImprove as a required prop', () => {
      // This test ensures TypeScript compilation catches missing required props
      expect(() => render(<StatsSummary passed={5} toImprove={3} />)).not.toThrow();
    });
  });

  describe('Semantic HTML and Accessibility', () => {
    it('should use semantic div element', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary.tagName).toBe('DIV');
    });

    it('should have proper aria-label for screen readers', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveAttribute('aria-label', 'Summary: 5 items passed, 3 items need improvement');
    });

    it('should have role status for dynamic updates', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveAttribute('role', 'status');
    });

    it('should be accessible to screen readers', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toBeInTheDocument();
    });
  });

  describe('Component API', () => {
    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<StatsSummary passed={5} toImprove={3} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should handle numeric props correctly', () => {
      render(<StatsSummary passed={15} toImprove={8} />);
      expect(screen.getByText(/15 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/8 to improve/i)).toBeInTheDocument();
    });
  });

  describe('Text formatting', () => {
    it('should use proper triangle indicators', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      // SVG triangles are now used instead of text characters
      const svgs = summary.querySelectorAll('svg');
      expect(svgs.length).toBe(2);
    });

    it('should have proper text content', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary.textContent).toContain('5 passed');
      expect(summary.textContent).toContain('3 to improve');
    });

    it('should handle singular and plural correctly', () => {
      render(<StatsSummary passed={1} toImprove={1} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveTextContent('1 passed');
      expect(summary).toHaveTextContent('1 to improve');
    });
  });

  describe('StatsSummary Color Styling', () => {
    it('should display passed count with up triangle SVG indicator', () => {
      render(<StatsSummary passed={5} toImprove={3} />);

      const passedText = screen.getByText(/5 passed/i);
      const passedSpan = passedText.closest('span');

      // Check for SVG triangle indicator
      const svg = passedSpan?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Success triangle has #A2FFB4 fill
      expect(svg?.querySelector('path[fill="#A2FFB4"]')).toBeInTheDocument();
    });

    it('should display to improve count with down triangle SVG indicator', () => {
      render(<StatsSummary passed={5} toImprove={3} />);

      const improveText = screen.getByText(/3 to improve/i);
      const improveSpan = improveText.closest('span');

      // Check for SVG triangle indicator
      const svg = improveSpan?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Fail triangle has #FF4343 fill
      expect(svg?.querySelector('path[fill="#FF4343"]')).toBeInTheDocument();
    });
  });
});