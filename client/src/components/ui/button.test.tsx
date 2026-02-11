import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
    expect(screen.getByRole('button')).toHaveClass('bg-primary-blue', 'text-text-primary');
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-error', 'text-text-primary');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border', 'border-color', 'bg-transparent');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-input-bg', 'text-text-primary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-input-bg', 'text-text-primary');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-primary', 'underline-offset-4');
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-button-height-lg', 'px-6', 'py-3');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-button-height-sm', 'px-4', 'py-2');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-button-height-lg', 'px-8', 'py-4');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-button-height-sm', 'w-8');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
  });

  it('forwards the ref correctly', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button with ref</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders as a different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );

    const linkButton = screen.getByRole('link');
    expect(linkButton).toHaveTextContent('Link Button');
    expect(linkButton).toHaveAttribute('href', 'https://example.com');
    expect(linkButton).toHaveClass('bg-primary-blue', 'text-text-primary');
  });

  describe('New Design System Features', () => {
    it('should have auto-width optimize variant with primary blue styling and pill border radius', () => {
      render(<Button variant="optimize" size="optimize">Optimize my SEO</Button>);
      const button = screen.getByRole('button');

      // Should NOT have w-full class - button sizes to content
      expect(button).not.toHaveClass('w-full');
      expect(button).toHaveClass('bg-[#1A72F5]');
      expect(button).toHaveClass('!rounded-[9999px]');
    });

    it('should apply optimize size variant correctly', () => {
      render(<Button variant="optimize" size="optimize">Optimize my SEO</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-14');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('py-4');
    });

    it('should use design tokens for primary variant', () => {
      render(<Button variant="default">Primary Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-primary-blue', 'text-text-primary');
      expect(button).toHaveClass('hover:bg-primary-blue-hover');
    });

    it('should have proper height with design tokens', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-button-height-lg');
    });

    it('should apply new border radius', () => {
      render(<Button>Modern Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('rounded-radius-xl');
    });
  });
});