import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

// Mock Radix UI Popover
vi.mock('@radix-ui/react-popover', () => ({
  Root: ({ children, ...props }: any) => {
    // Convert boolean props to string attributes for testing
    const attrs: any = {};
    Object.keys(props).forEach(key => {
      if (typeof props[key] === 'boolean' && props[key]) {
        attrs[key] = '';
      } else if (props[key] !== undefined && typeof props[key] !== 'boolean') {
        attrs[key] = props[key];
      }
    });
    return <div data-testid="popover-root" {...attrs}>{children}</div>;
  },
  Trigger: ({ children, ...props }: any) => (
    <button data-testid="popover-trigger" {...props}>{children}</button>
  ),
  Portal: ({ children }: any) => <div data-testid="popover-portal">{children}</div>,
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="popover-content" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
}));

describe('Popover Components', () => {
  describe('Popover Root', () => {
    it('should render popover root component', () => {
      render(
        <Popover>
          <div>Popover content</div>
        </Popover>
      );
      
      expect(screen.getByTestId('popover-root')).toBeInTheDocument();
    });

    it('should pass props to root component', () => {
      render(
        <Popover defaultOpen={true}>
          <div>Popover content</div>
        </Popover>
      );
      
      const root = screen.getByTestId('popover-root');
      expect(root).toHaveAttribute('defaultOpen');
    });
  });

  describe('PopoverTrigger', () => {
    it('should render trigger button', () => {
      render(
        <Popover>
          <PopoverTrigger>Click me</PopoverTrigger>
        </Popover>
      );
      
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(
        <Popover>
          <PopoverTrigger onClick={handleClick}>Trigger</PopoverTrigger>
        </Popover>
      );
      
      fireEvent.click(screen.getByTestId('popover-trigger'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should pass through props', () => {
      render(
        <Popover>
          <PopoverTrigger disabled aria-label="Open popover">
            Disabled Trigger
          </PopoverTrigger>
        </Popover>
      );
      
      const trigger = screen.getByTestId('popover-trigger');
      expect(trigger).toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('aria-label', 'Open popover');
    });
  });

  describe('PopoverContent', () => {
    it('should render content with default styling', () => {
      render(
        <Popover>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('popover-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('z-50', 'w-72', 'rounded-md', 'border');
    });

    it('should apply custom className', () => {
      render(
        <Popover>
          <PopoverContent className="custom-popover">
            Custom content
          </PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('popover-content');
      expect(content).toHaveClass('custom-popover');
      expect(content).toHaveClass('z-50'); // Should still have default classes
    });

    it('should use default align and sideOffset values', () => {
      render(
        <Popover>
          <PopoverContent>Default positioning</PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('popover-content');
      expect(content).toHaveAttribute('align', 'center');
      expect(content).toHaveAttribute('sideOffset', '4');
    });

    it('should allow custom align and sideOffset', () => {
      render(
        <Popover>
          <PopoverContent align="start" sideOffset={8}>
            Custom positioning
          </PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('popover-content');
      expect(content).toHaveAttribute('align', 'start');
      expect(content).toHaveAttribute('sideOffset', '8');
    });

    it('should render inside portal', () => {
      render(
        <Popover>
          <PopoverContent>Portal content</PopoverContent>
        </Popover>
      );
      
      expect(screen.getByTestId('popover-portal')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Popover>
          <PopoverContent ref={ref}>Ref content</PopoverContent>
        </Popover>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Ref content');
    });

    it('should pass through additional props', () => {
      render(
        <Popover>
          <PopoverContent 
            data-testid="custom-content" 
            id="popover-1"
            role="dialog"
          >
            Props content
          </PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('custom-content');
      expect(content).toHaveAttribute('id', 'popover-1');
      expect(content).toHaveAttribute('role', 'dialog');
    });

    it('should have animation and styling classes', () => {
      render(
        <Popover>
          <PopoverContent>Animated content</PopoverContent>
        </Popover>
      );
      
      const content = screen.getByTestId('popover-content');
      expect(content).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0',
        'data-[state=open]:fade-in-0'
      );
    });
  });

  describe('Popover Integration', () => {
    it('should work together as a complete popover', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div>Popover content here</div>
          </PopoverContent>
        </Popover>
      );
      
      expect(screen.getByTestId('popover-root')).toBeInTheDocument();
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      expect(screen.getByText('Popover content here')).toBeInTheDocument();
    });

    it('should handle multiple popovers', () => {
      render(
        <div>
          <Popover>
            <PopoverTrigger>First</PopoverTrigger>
            <PopoverContent>First content</PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger>Second</PopoverTrigger>
            <PopoverContent>Second content</PopoverContent>
          </Popover>
        </div>
      );
      
      expect(screen.getAllByTestId('popover-root')).toHaveLength(2);
      expect(screen.getByText('First content')).toBeInTheDocument();
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });
  });
});