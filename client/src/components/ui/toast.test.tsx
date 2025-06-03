import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className, ...props }: any) => (
    <svg data-testid="x-icon" className={className} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
}));

// Mock cn utility - reusing existing pattern
vi.mock('../../lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cva: vi.fn((base, config) => ({ variant }: any) => {
    if (variant === 'destructive') {
      return `${base} destructive group border-destructive bg-destructive text-destructive-foreground`;
    }
    return `${base} border bg-background text-foreground`;
  }),
}));

// Mock Radix UI Toast primitives without React dependencies in hoisted scope
vi.mock('@radix-ui/react-toast', () => {
  // Create mock components that match the real component structure
  const createMockComponent = (displayName: string, testId: string, tag: 'div' | 'button' = 'div') => {
    const Component = React.forwardRef<any, any>(({ children, className, onClick, altText, ...props }, ref) => {
      return React.createElement(
        tag,
        {
          ref,
          'data-testid': testId,
          className,
          onClick,
          ...props
        },
        children
      );
    });
    
    Component.displayName = displayName;
    return Component;
  };

  const MockProvider = ({ children, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'toast-provider', ...props }, children);
  MockProvider.displayName = 'ToastProvider';

  return {
    Provider: MockProvider,
    Viewport: createMockComponent('ToastViewport', 'toast-viewport'),
    Root: createMockComponent('ToastRoot', 'toast-root'),
    Title: createMockComponent('ToastTitle', 'toast-title'),
    Description: createMockComponent('ToastDescription', 'toast-description'),
    Close: createMockComponent('ToastClose', 'toast-close', 'button'),
    Action: createMockComponent('ToastAction', 'toast-action', 'button'),
  };
});

describe('Toast Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ToastProvider', () => {
    it('renders children correctly', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Test Child</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('passes props to underlying provider', () => {
      render(
        <ToastProvider swipeDirection="right">
          <div>Test</div>
        </ToastProvider>
      );

      const provider = screen.getByTestId('toast-provider');
      expect(provider).toHaveAttribute('swipeDirection', 'right');
    });
  });

  describe('ToastViewport', () => {
    it('renders with default classes', () => {
      render(
        <ToastViewport>
          <div>Viewport content</div>
        </ToastViewport>
      );

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveClass(
        'fixed', 'top-0', 'z-[100]', 'flex', 'max-h-screen', 'w-full', 
        'flex-col-reverse', 'p-4', 'sm:bottom-0', 'sm:right-0', 'sm:top-auto', 
        'sm:flex-col', 'md:max-w-[420px]'
      );
    });

    it('merges custom className with default classes', () => {
      render(
        <ToastViewport className="custom-class">
          <div>Content</div>
        </ToastViewport>
      );

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>(); // Use any for mock component ref
      render(
        <ToastViewport ref={ref}>
          <div>Content</div>
        </ToastViewport>
      );

      expect(ref.current).toBe(screen.getByTestId('toast-viewport'));
    });
  });

  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <Toast>
          <div>Toast content</div>
        </Toast>
      );

      const toast = screen.getByTestId('toast-root');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('solid-toast');
    });

    it('applies destructive variant classes', () => {
      render(
        <Toast variant="destructive">
          <div>Destructive toast</div>
        </Toast>
      );

      const toast = screen.getByTestId('toast-root');
      expect(toast).toHaveClass('destructive', 'group', 'border-destructive', 'bg-destructive', 'text-destructive-foreground');
    });

    it('merges custom className', () => {
      render(
        <Toast className="custom-toast">
          <div>Content</div>
        </Toast>
      );

      const toast = screen.getByTestId('toast-root');
      expect(toast).toHaveClass('custom-toast', 'solid-toast');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>(); // Use any for mock component ref
      render(
        <Toast ref={ref}>
          <div>Content</div>
        </Toast>
      );

      expect(ref.current).toBe(screen.getByTestId('toast-root'));
    });
  });

  describe('ToastTitle', () => {
    it('renders title content', () => {
      render(<ToastTitle>Test Title</ToastTitle>);

      const title = screen.getByTestId('toast-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test Title');
      expect(title).toHaveClass('text-sm', 'font-semibold');
    });

    it('applies custom className', () => {
      render(<ToastTitle className="custom-title">Title</ToastTitle>);

      const title = screen.getByTestId('toast-title');
      expect(title).toHaveClass('custom-title', 'text-sm', 'font-semibold');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>();
      render(<ToastTitle ref={ref}>Title</ToastTitle>);

      expect(ref.current).toBe(screen.getByTestId('toast-title'));
    });
  });

  describe('ToastDescription', () => {
    it('renders description content', () => {
      render(<ToastDescription>Test Description</ToastDescription>);

      const description = screen.getByTestId('toast-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Test Description');
      expect(description).toHaveClass('text-sm', 'opacity-90');
    });

    it('applies custom className', () => {
      render(<ToastDescription className="custom-description">Description</ToastDescription>);

      const description = screen.getByTestId('toast-description');
      expect(description).toHaveClass('custom-description', 'text-sm', 'opacity-90');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>();
      render(<ToastDescription ref={ref}>Description</ToastDescription>);

      expect(ref.current).toBe(screen.getByTestId('toast-description'));
    });
  });

  describe('ToastClose', () => {
    it('renders close button with X icon', () => {
      render(<ToastClose />);

      const closeButton = screen.getByTestId('toast-close');
      const xIcon = screen.getByTestId('x-icon');
      
      expect(closeButton).toBeInTheDocument();
      expect(xIcon).toBeInTheDocument();
      expect(xIcon).toHaveClass('h-4', 'w-4');
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<ToastClose onClick={handleClick} />);

      const closeButton = screen.getByTestId('toast-close');
      await user.click(closeButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies default styling classes', () => {
      render(<ToastClose />);

      const closeButton = screen.getByTestId('toast-close');
      expect(closeButton).toHaveClass(
        'absolute', 'right-2', 'top-2', 'rounded-md', 'p-1', 
        'text-foreground/50', 'opacity-0', 'transition-opacity'
      );
    });

    it('applies custom className', () => {
      render(<ToastClose className="custom-close" />);

      const closeButton = screen.getByTestId('toast-close');
      expect(closeButton).toHaveClass('custom-close');
    });

    it('has toast-close attribute', () => {
      render(<ToastClose />);

      const closeButton = screen.getByTestId('toast-close');
      expect(closeButton).toHaveAttribute('toast-close', '');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>();
      render(<ToastClose ref={ref} />);

      expect(ref.current).toBe(screen.getByTestId('toast-close'));
    });
  });

  describe('ToastAction', () => {
    it('renders action button with content', () => {
      render(<ToastAction altText="Action button">Action Button</ToastAction>);

      const actionButton = screen.getByTestId('toast-action');
      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent('Action Button');
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<ToastAction altText="Click me" onClick={handleClick}>Click me</ToastAction>);

      const actionButton = screen.getByTestId('toast-action');
      await user.click(actionButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies default styling classes', () => {
      render(<ToastAction altText="Action">Action</ToastAction>);

      const actionButton = screen.getByTestId('toast-action');
      expect(actionButton).toHaveClass(
        'inline-flex', 'h-8', 'shrink-0', 'items-center', 'justify-center', 
        'rounded-md', 'border', 'bg-transparent', 'px-3', 'text-sm', 'font-medium'
      );
    });

    it('applies custom className', () => {
      render(<ToastAction altText="Action" className="custom-action">Action</ToastAction>);

      const actionButton = screen.getByTestId('toast-action');
      expect(actionButton).toHaveClass('custom-action');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<any>();
      render(<ToastAction altText="Action" ref={ref}>Action</ToastAction>);

      expect(ref.current).toBe(screen.getByTestId('toast-action'));
    });
  });

  describe('Integration Tests', () => {
    it('renders complete toast structure', () => {
      render(
        <ToastProvider>
          <ToastViewport>
            <Toast>
              <ToastTitle>Success!</ToastTitle>
              <ToastDescription>Your action was completed successfully.</ToastDescription>
              <ToastClose />
              <ToastAction altText="Undo action">Undo</ToastAction>
            </Toast>
          </ToastViewport>
        </ToastProvider>
      );

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
      expect(screen.getByTestId('toast-root')).toBeInTheDocument();
      expect(screen.getByTestId('toast-title')).toHaveTextContent('Success!');
      expect(screen.getByTestId('toast-description')).toHaveTextContent('Your action was completed successfully.');
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
      expect(screen.getByTestId('toast-action')).toHaveTextContent('Undo');
    });

    it('handles multiple toasts', () => {
      render(
        <ToastProvider>
          <ToastViewport>
            <Toast>
              <ToastTitle>First Toast</ToastTitle>
            </Toast>
            <Toast variant="destructive">
              <ToastTitle>Second Toast</ToastTitle>
            </Toast>
          </ToastViewport>
        </ToastProvider>
      );

      const toasts = screen.getAllByTestId('toast-root');
      expect(toasts).toHaveLength(2);
      expect(screen.getByText('First Toast')).toBeInTheDocument();
      expect(screen.getByText('Second Toast')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content gracefully', () => {
      render(<Toast />);
      expect(screen.getByTestId('toast-root')).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      render(<Toast className={undefined}>Content</Toast>);
      expect(screen.getByTestId('toast-root')).toBeInTheDocument();
    });

    it('handles disabled action button', () => {
      render(<ToastAction altText="Disabled action" disabled>Disabled Action</ToastAction>);
      
      const actionButton = screen.getByTestId('toast-action');
      expect(actionButton).toBeDisabled();
    });

    it('preserves aria attributes', () => {
      render(<ToastTitle aria-level={2}>Accessible Title</ToastTitle>);
      
      const title = screen.getByTestId('toast-title');
      expect(title).toHaveAttribute('aria-level', '2');
    });
  });
});