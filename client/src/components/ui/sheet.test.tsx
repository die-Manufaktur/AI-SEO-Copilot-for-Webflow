import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetFooter, 
  SheetTitle, 
  SheetDescription,
  SheetClose,
  SheetOverlay,
  SheetPortal
} from './sheet';

// Mock Radix UI Dialog components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, ...props }: any) => <div data-testid="sheet-root" {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button data-testid="sheet-trigger" {...props}>{children}</button>
  ),
  Close: ({ children, ...props }: any) => (
    <button data-testid="sheet-close" {...props}>{children}</button>
  ),
  Portal: ({ children }: any) => <div data-testid="sheet-portal">{children}</div>,
  Overlay: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="sheet-overlay" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="sheet-content" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  Title: React.forwardRef<HTMLHeadingElement, any>(({ children, className, ...props }, ref) => (
    <h2 
      ref={ref}
      data-testid="sheet-title" 
      className={className}
      {...props}
    >
      {children}
    </h2>
  )),
  Description: React.forwardRef<HTMLParagraphElement, any>(({ children, className, ...props }, ref) => (
    <p 
      ref={ref}
      data-testid="sheet-description" 
      className={className}
      {...props}
    >
      {children}
    </p>
  )),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon">X</svg>,
}));

describe('Sheet Components', () => {
  describe('Sheet Root', () => {
    it('should render sheet root component', () => {
      render(
        <Sheet>
          <div>Sheet content</div>
        </Sheet>
      );
      
      expect(screen.getByTestId('sheet-root')).toBeInTheDocument();
    });

    it('should pass props to root component', () => {
      render(
        <Sheet defaultOpen={true}>
          <div>Sheet content</div>
        </Sheet>
      );
      
      const root = screen.getByTestId('sheet-root');
      expect(root).toBeInTheDocument();
    });
  });

  describe('SheetTrigger', () => {
    it('should render trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
        </Sheet>
      );
      
      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
      expect(screen.getByText('Open Sheet')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(
        <Sheet>
          <SheetTrigger onClick={handleClick}>Trigger</SheetTrigger>
        </Sheet>
      );
      
      fireEvent.click(screen.getByTestId('sheet-trigger'));
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('SheetClose', () => {
    it('should render close button', () => {
      render(
        <Sheet>
          <SheetClose>Close</SheetClose>
        </Sheet>
      );
      
      expect(screen.getByTestId('sheet-close')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('SheetOverlay', () => {
    it('should render overlay with default styling', () => {
      render(
        <Sheet>
          <SheetOverlay />
        </Sheet>
      );
      
      const overlay = screen.getByTestId('sheet-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/80');
    });

    it('should apply custom className', () => {
      render(
        <Sheet>
          <SheetOverlay className="custom-overlay" />
        </Sheet>
      );
      
      const overlay = screen.getByTestId('sheet-overlay');
      expect(overlay).toHaveClass('custom-overlay');
      expect(overlay).toHaveClass('fixed'); // Should still have default classes
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Sheet>
          <SheetOverlay ref={ref} />
        </Sheet>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(SheetOverlay.displayName).toBeDefined();
    });
  });

  describe('SheetContent', () => {
    it('should render content with default styling', () => {
      render(
        <Sheet>
          <SheetContent>Sheet content</SheetContent>
        </Sheet>
      );
      
      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('fixed', 'z-50', 'gap-4', 'bg-background');
    });

    it('should render with default side (right)', () => {
      render(
        <Sheet>
          <SheetContent>Right side content</SheetContent>
        </Sheet>
      );
      
      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('inset-y-0', 'right-0', 'h-full', 'w-3/4');
    });

    it('should support different sides', () => {
      const { rerender } = render(
        <Sheet>
          <SheetContent side="left">Left content</SheetContent>
        </Sheet>
      );
      
      let content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('inset-y-0', 'left-0');
      
      rerender(
        <Sheet>
          <SheetContent side="top">Top content</SheetContent>
        </Sheet>
      );
      
      content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('inset-x-0', 'top-0');
      
      rerender(
        <Sheet>
          <SheetContent side="bottom">Bottom content</SheetContent>
        </Sheet>
      );
      
      content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('inset-x-0', 'bottom-0');
    });

    it('should apply custom className', () => {
      render(
        <Sheet>
          <SheetContent className="custom-sheet">
            Custom content
          </SheetContent>
        </Sheet>
      );
      
      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('custom-sheet');
    });

    it('should render close button inside content', () => {
      render(
        <Sheet>
          <SheetContent>Content with close</SheetContent>
        </Sheet>
      );
      
      const closeButton = screen.getByTestId('sheet-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('absolute', 'right-4', 'top-4');
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByText('Close')).toHaveClass('sr-only');
    });

    it('should render inside portal', () => {
      render(
        <Sheet>
          <SheetContent>Portal content</SheetContent>
        </Sheet>
      );
      
      expect(screen.getByTestId('sheet-portal')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Sheet>
          <SheetContent ref={ref}>Ref content</SheetContent>
        </Sheet>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(SheetContent.displayName).toBeDefined();
    });
  });

  describe('SheetHeader', () => {
    it('should render header with correct styling', () => {
      render(
        <SheetHeader>
          <div>Header content</div>
        </SheetHeader>
      );
      
      const header = screen.getByText('Header content').parentElement;
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-2', 'text-center', 'sm:text-left');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SheetHeader className="custom-header">
          Header
        </SheetHeader>
      );
      
      const header = container.firstChild;
      expect(header).toHaveClass('custom-header');
    });

    it('should have correct display name', () => {
      expect(SheetHeader.displayName).toBe('SheetHeader');
    });
  });

  describe('SheetFooter', () => {
    it('should render footer with correct styling', () => {
      render(
        <SheetFooter>
          <div>Footer content</div>
        </SheetFooter>
      );
      
      const footer = screen.getByText('Footer content').parentElement;
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row', 'sm:justify-end');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SheetFooter className="custom-footer">
          Footer
        </SheetFooter>
      );
      
      const footer = container.firstChild;
      expect(footer).toHaveClass('custom-footer');
    });

    it('should have correct display name', () => {
      expect(SheetFooter.displayName).toBe('SheetFooter');
    });
  });

  describe('SheetTitle', () => {
    it('should render title with correct styling', () => {
      render(
        <Sheet>
          <SheetTitle>Sheet Title</SheetTitle>
        </Sheet>
      );
      
      const title = screen.getByTestId('sheet-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-foreground');
      expect(title.textContent).toBe('Sheet Title');
    });

    it('should apply custom className', () => {
      render(
        <Sheet>
          <SheetTitle className="custom-title">Custom Title</SheetTitle>
        </Sheet>
      );
      
      const title = screen.getByTestId('sheet-title');
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <Sheet>
          <SheetTitle ref={ref}>Ref Title</SheetTitle>
        </Sheet>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it('should have correct display name', () => {
      expect(SheetTitle.displayName).toBeDefined();
    });
  });

  describe('SheetDescription', () => {
    it('should render description with correct styling', () => {
      render(
        <Sheet>
          <SheetDescription>Sheet Description</SheetDescription>
        </Sheet>
      );
      
      const description = screen.getByTestId('sheet-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
      expect(description.textContent).toBe('Sheet Description');
    });

    it('should apply custom className', () => {
      render(
        <Sheet>
          <SheetDescription className="custom-description">
            Custom Description
          </SheetDescription>
        </Sheet>
      );
      
      const description = screen.getByTestId('sheet-description');
      expect(description).toHaveClass('custom-description');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Sheet>
          <SheetDescription ref={ref}>Ref Description</SheetDescription>
        </Sheet>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('should have correct display name', () => {
      expect(SheetDescription.displayName).toBeDefined();
    });
  });

  describe('Sheet Integration', () => {
    it('should work together as a complete sheet', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div>Form content here</div>
            <SheetFooter>
              <button>Save changes</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
      
      expect(screen.getByTestId('sheet-root')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
      expect(screen.getByText('Edit profile')).toBeInTheDocument();
      expect(screen.getByText('Make changes to your profile here. Click save when you\'re done.')).toBeInTheDocument();
      expect(screen.getByText('Form content here')).toBeInTheDocument();
      expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    it('should handle animation classes', () => {
      render(
        <Sheet>
          <SheetContent>Animated content</SheetContent>
        </Sheet>
      );
      
      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out'
      );
    });

    it('should apply max-width constraint on side sheets', () => {
      render(
        <Sheet>
          <SheetContent side="left">Side content</SheetContent>
        </Sheet>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveClass('w-3/4', 'max-w-sm');
    });
  });
});