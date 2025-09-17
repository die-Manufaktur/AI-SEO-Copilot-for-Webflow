import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

// Mock Radix UI Separator
vi.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ className, orientation, decorative, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="separator" 
      data-orientation={orientation}
      data-decorative={decorative}
      className={className}
      {...props}
    />
  )),
}));

describe('Separator', () => {
  it('should render separator component', () => {
    render(<Separator />);
    
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('should apply default styling classes', () => {
    render(<Separator />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('should use horizontal orientation by default', () => {
    render(<Separator />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('should apply vertical orientation when specified', () => {
    render(<Separator orientation="vertical" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('should be decorative by default', () => {
    render(<Separator />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-decorative', 'true');
  });

  it('should allow non-decorative mode', () => {
    render(<Separator decorative={false} />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-decorative', 'false');
  });

  it('should merge custom className with default styles', () => {
    render(<Separator className="custom-separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border', 'custom-separator');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should pass through additional props', () => {
    render(
      <Separator 
        data-testid="custom-separator"
        id="separator-1"
        role="separator"
        aria-label="Content divider"
      />
    );
    
    const separator = screen.getByTestId('custom-separator');
    expect(separator).toHaveAttribute('id', 'separator-1');
    expect(separator).toHaveAttribute('role', 'separator');
    expect(separator).toHaveAttribute('aria-label', 'Content divider');
  });

  it('should handle both orientation options correctly', () => {
    const { rerender } = render(<Separator orientation="horizontal" />);
    let separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
    expect(separator).not.toHaveClass('h-full', 'w-[1px]');

    rerender(<Separator orientation="vertical" />);
    separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
    expect(separator).not.toHaveClass('h-[1px]', 'w-full');
  });

  it('should override default props when specified', () => {
    render(
      <Separator 
        orientation="vertical" 
        decorative={false}
        className="border-red-500"
      />
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-decorative', 'false');
    expect(separator).toHaveClass('border-red-500');
  });

  it('should have correct display name', () => {
    expect(Separator.displayName).toBeDefined();
  });

  it('should work with accessibility roles', () => {
    render(<Separator role="separator" aria-orientation="horizontal" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('should support custom styling for different orientations', () => {
    const { rerender } = render(
      <Separator 
        orientation="horizontal" 
        className="border-t-2 border-blue-500"
      />
    );
    
    let separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-[1px]', 'w-full', 'border-t-2', 'border-blue-500');

    rerender(
      <Separator 
        orientation="vertical" 
        className="border-l-2 border-red-500"
      />
    );
    
    separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full', 'w-[1px]', 'border-l-2', 'border-red-500');
  });

  it('should maintain base classes regardless of orientation', () => {
    const { rerender } = render(<Separator orientation="horizontal" />);
    let separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border');

    rerender(<Separator orientation="vertical" />);
    separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('should work in different semantic contexts', () => {
    render(
      <div>
        <div>Content above</div>
        <Separator data-testid="section-separator" />
        <div>Content below</div>
      </div>
    );
    
    const separator = screen.getByTestId('section-separator');
    expect(separator).toBeInTheDocument();
  });
});