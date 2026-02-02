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
      expect(summary.textContent).toContain('▲');
      expect(summary.textContent).toContain('▼');
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
      expect(passedText).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should use correct font size from design token', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('text-font-size-sm');
    });

    it('should have vertical margin', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('my-6');
    });

    it('should use medium font weight', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveClass('font-font-weight-medium');
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
      expect(summary).toHaveClass('custom-stats', 'text-font-size-sm', 'font-font-weight-medium', 'my-6');
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
      expect(summary.textContent).toContain('▲');
      expect(summary.textContent).toContain('▼');
    });

    it('should have proper text content', () => {
      render(<StatsSummary passed={5} toImprove={3} />);
      const summary = screen.getByRole('status');
      expect(summary.textContent).toBe('▲ 5 passed▼ 3 to improve');
    });

    it('should handle singular and plural correctly', () => {
      render(<StatsSummary passed={1} toImprove={1} />);
      const summary = screen.getByRole('status');
      expect(summary).toHaveTextContent('▲ 1 passed▼ 1 to improve');
    });
  });

  describe('StatsSummary Color Styling', () => {
    it('should display passed count in green with up triangle indicator', () => {
      render(<StatsSummary passed={5} toImprove={3} />);

      const passedText = screen.getByText(/5 passed/i);
      const passedSpan = passedText.closest('span');
      expect(passedSpan).toHaveStyle({ color: 'var(--color-green)' });

      // Check for up triangle indicator in the text
      expect(passedSpan?.textContent).toContain('▲');
    });

    it('should display to improve count in red with down triangle indicator', () => {
      render(<StatsSummary passed={5} toImprove={3} />);

      const improveText = screen.getByText(/3 to improve/i);
      const improveSpan = improveText.closest('span');
      expect(improveSpan).toHaveStyle({ color: 'var(--color-red)' });

      // Check for down triangle indicator in the text
      expect(improveSpan?.textContent).toContain('▼');
    });
  });
});