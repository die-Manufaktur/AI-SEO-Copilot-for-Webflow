import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders with default variant', () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });

    it('applies destructive variant correctly', () => {
      render(<Alert variant="destructive">Error alert</Alert>);
      const alert = screen.getByText('Error alert');
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Alert ref={ref}>Alert with ref</Alert>);
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('AlertTitle', () => {
    it('renders with proper styling', () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      const title = screen.getByText('Alert Title');
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
    });
  });

  describe('AlertDescription', () => {
    it('renders with proper styling', () => {
      render(<AlertDescription>Alert description</AlertDescription>);
      const description = screen.getByText('Alert description');
      expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
    });
  });

  it('composes alert components correctly', () => {
    render(
      <Alert>
        <AlertTitle>SEO Error</AlertTitle>
        <AlertDescription>Unable to analyze the webpage content.</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByText('SEO Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to analyze the webpage content.')).toBeInTheDocument();
  });
});