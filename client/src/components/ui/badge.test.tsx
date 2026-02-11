import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

// Mock dependencies
vi.mock('../../lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('class-variance-authority', () => ({
  cva: vi.fn((baseClasses, config) => {
    return (props: any) => {
      const variant = props?.variant || config.defaultVariants?.variant || 'default';
      const variantClass = config.variants?.variant?.[variant] || '';
      return `${baseClasses} ${variantClass}`;
    };
  }),
}));

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Default Badge');
  });

  it('should apply default classes', () => {
    render(<Badge data-testid="badge">Test Badge</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'text-xs',
      'font-semibold',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  describe('Variants', () => {
    it('should render default variant correctly', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground',
        'hover:bg-primary/80'
      );
    });

    it('should render secondary variant correctly', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-secondary',
        'text-secondary-foreground',
        'hover:bg-secondary/80'
      );
    });

    it('should render destructive variant correctly', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'bg-[#FF4343]',
        'text-black',
        'hover:brightness-105'
      );
    });

    it('should render outline variant correctly', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-foreground');
    });
  });

  describe('Props and Attributes', () => {
    it('should accept additional className', () => {
      render(<Badge className="custom-class" data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should forward HTML attributes', () => {
      render(<Badge id="test-badge" role="status" data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('id', 'test-badge');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should render as div element', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('DIV');
    });

    it('should render children correctly', () => {
      render(
        <Badge data-testid="badge">
          <span>Icon</span>
          Badge Text
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('IconBadge Text');
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('should support event handlers', () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick} data-testid="badge">Clickable Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      badge.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling Combinations', () => {
    it('should combine variant classes with custom className', () => {
      render(
        <Badge 
          variant="secondary" 
          className="extra-margin" 
          data-testid="badge"
        >
          Combined
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      // Should have both variant classes and custom class
      expect(badge).toHaveClass('extra-margin');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('should handle empty content', () => {
      render(<Badge data-testid="badge"></Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility attributes', () => {
      render(
        <Badge 
          aria-label="Status indicator" 
          role="status"
          data-testid="badge"
        >
          Status
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('aria-label', 'Status indicator');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should be focusable when interactive', () => {
      render(
        <Badge 
          tabIndex={0}
          onClick={() => {}}
          data-testid="badge"
        >
          Interactive Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      badge.focus();
      expect(badge).toHaveFocus();
    });
  });

  describe('badgeVariants Export', () => {
    it('should export badgeVariants function', () => {
      expect(badgeVariants).toBeDefined();
      expect(typeof badgeVariants).toBe('function');
    });

    it('should return class string when called with variant', () => {
      const result = badgeVariants({ variant: 'default' });
      expect(typeof result).toBe('string');
      expect(result).toContain('inline-flex');
    });

    it('should handle undefined variant', () => {
      const result = badgeVariants();
      expect(typeof result).toBe('string');
      expect(result).toContain('inline-flex');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<Badge data-testid="badge">{null}</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle undefined variant gracefully', () => {
      render(<Badge variant={undefined} data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      render(<Badge data-testid="badge">{true}</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle number children', () => {
      render(<Badge data-testid="badge">{42}</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('42');
    });
  });

  describe('Component Interface', () => {
    it('should extend HTML div attributes', () => {
      // This test ensures the component accepts all standard div attributes
      render(
        <Badge 
          data-testid="badge"
          title="Tooltip text"
          style={{ margin: '10px' }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('title', 'Tooltip text');
      expect(badge).toHaveStyle('margin: 10px');
    });
  });
});