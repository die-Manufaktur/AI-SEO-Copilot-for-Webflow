import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './toggle';

// Mock @radix-ui/react-toggle
vi.mock('@radix-ui/react-toggle', () => ({
  Root: React.forwardRef<HTMLButtonElement, any>(({ children, className, pressed, onPressedChange, ...props }, ref) => (
    <button
      ref={ref}
      role="button"
      aria-pressed={pressed}
      className={className}
      onClick={() => onPressedChange?.(!pressed)}
      data-testid="toggle-root"
      data-state={pressed ? 'on' : 'off'}
      {...props}
    >
      {children}
    </button>
  )),
}));

describe('Toggle', () => {
  it('renders with default props', () => {
    render(<Toggle>Toggle me</Toggle>);
    const toggle = screen.getByTestId('toggle-root');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('Toggle me');
    expect(toggle).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('handles pressed state', () => {
    render(<Toggle pressed>Pressed Toggle</Toggle>);
    const toggle = screen.getByTestId('toggle-root');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('handles unpressed state', () => {
    render(<Toggle pressed={false}>Unpressed Toggle</Toggle>);
    const toggle = screen.getByTestId('toggle-root');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('calls onPressedChange when clicked', async () => {
    const handleChange = vi.fn();
    render(<Toggle pressed={false} onPressedChange={handleChange}>Click me</Toggle>);
    
    await userEvent.click(screen.getByTestId('toggle-root'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Toggle variant="default">Default</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('bg-transparent');
    
    rerender(<Toggle variant="outline">Outline</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('border', 'border-input');
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Toggle size="default">Default</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('h-10', 'px-3');
    
    rerender(<Toggle size="sm">Small</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('h-9', 'px-2.5');
    
    rerender(<Toggle size="lg">Large</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('h-11', 'px-5');
  });

  it('applies custom className', () => {
    render(<Toggle className="custom-toggle">Custom</Toggle>);
    expect(screen.getByTestId('toggle-root')).toHaveClass('custom-toggle');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Toggle ref={ref}>Ref Toggle</Toggle>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('handles disabled state', () => {
    render(<Toggle disabled>Disabled</Toggle>);
    const toggle = screen.getByTestId('toggle-root');
    expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('shows pressed state styling', () => {
    render(<Toggle pressed>Pressed</Toggle>);
    const toggle = screen.getByTestId('toggle-root');
    expect(toggle).toHaveClass('data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground');
  });
});