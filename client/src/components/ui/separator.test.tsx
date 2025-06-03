import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

// Mock @radix-ui/react-separator
vi.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={className}
      data-testid="separator"
      data-orientation={orientation}
      {...props}
    />
  )),
}));

describe('Separator', () => {
  it('renders with default props', () => {
    render(<Separator />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('renders horizontal separator correctly', () => {
    render(<Separator orientation="horizontal" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('renders vertical separator correctly', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-separator" />);
    expect(screen.getByTestId('separator')).toHaveClass('custom-separator');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles decorative prop', () => {
    render(<Separator decorative={false} />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('renders with default decorative=true', () => {
    render(<Separator />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'none');
  });
});