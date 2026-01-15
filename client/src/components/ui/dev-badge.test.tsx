import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DevBadge } from './dev-badge';

describe('DevBadge', () => {
  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<DevBadge />);
      expect(screen.getByText('DEV')).toBeInTheDocument();
    });

    it('should display "DEV" text', () => {
      render(<DevBadge />);
      expect(screen.getByText('DEV')).toBeInTheDocument();
    });

    it('should render as a span element by default', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Styling and Design Tokens', () => {
    it('should apply blue background color using design token', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('bg-primary-blue');
    });

    it('should apply white text color using design token', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveStyle({ color: 'var(--text-primary)' });
    });

    it('should apply small font size using design token', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('text-font-size-xs');
    });

    it('should apply small border radius using design token', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('rounded-radius-sm');
    });

    it('should apply appropriate padding', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('px-spacing-xs', 'py-spacing-xs');
    });

    it('should apply medium font weight', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('font-font-weight-medium');
    });

    it('should apply uppercase text transform', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('uppercase');
    });
  });

  describe('Props and customization', () => {
    it('should accept and apply custom className', () => {
      render(<DevBadge className="custom-class" />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<DevBadge className="custom-class" />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveClass('custom-class', 'bg-primary-blue');
      expect(badge).toHaveStyle({ color: 'var(--text-primary)' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic meaning with role', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should have aria-label for screen readers', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveAttribute('aria-label', 'Development environment indicator');
    });

    it('should be focusable when interactive', () => {
      render(<DevBadge />);
      const badge = screen.getByText('DEV');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Component API', () => {
    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<DevBadge ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });
});