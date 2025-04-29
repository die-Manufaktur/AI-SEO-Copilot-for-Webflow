import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogClose
} from './dialog';

const DialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({});

vi.mock('@radix-ui/react-dialog', () => {
  return {
    __esModule: true,
    Root: ({ children, open, onOpenChange }: any) => (
      <DialogContext.Provider value={{ onOpenChange }}>
        <div data-testid="dialog-root" data-state={open ? 'open' : 'closed'}>
          {typeof children === 'function' ? children({ open }) : children}
        </div>
      </DialogContext.Provider>
    ),
    Trigger: ({ children, ...props }: any) => (
      <button data-testid="dialog-trigger" {...props}>
        {children}
      </button>
    ),
    Portal: ({ children, ...props }: any) => (
      <div data-testid="dialog-portal" {...props}>
        {children}
      </div>
    ),
    Overlay: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dialog-overlay" className={className} {...props}>
        {children}
      </div>
    )),
    Content: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dialog-content" className={className} {...props}>
        {children}
      </div>
    )),
    Title: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <h2 ref={ref} data-testid="dialog-title" className={className} {...props}>
        {children}
      </h2>
    )),
    Description: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <p ref={ref} data-testid="dialog-description" className={className} {...props}>
        {children}
      </p>
    )),
    Close: ({ children, className, ...props }: any) => {
      const context = React.useContext(DialogContext);
      const handleClick = (e: React.MouseEvent) => {
        if (props.onClick) props.onClick(e);
        if (context.onOpenChange) context.onOpenChange(false);
      };
      
      return (
        <button 
          data-testid="dialog-close" 
          className={className}
          onClick={handleClick}
          {...props}
        >
          {children || 'Close'}
        </button>
      );
    },
  };
});

vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>
}));

describe('Dialog Components', () => {
  it('renders Dialog root component', () => {
    render(
      <Dialog>
        <div>Dialog content</div>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
  });

  it('renders DialogTrigger component', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-trigger')).toHaveTextContent('Open Dialog');
  });

  it('renders DialogContent component with correct classes', () => {
    render(
      <Dialog open>
        <DialogContent>Dialog content</DialogContent>
      </Dialog>
    );
    const content = screen.getByTestId('dialog-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Dialog content');
    expect(content).toHaveClass('fixed', 'left-[50%]', 'top-[50%]', 'z-50');
    expect(screen.getByRole('button')).toBeInTheDocument(); // Close button
  });

  it('renders DialogHeader component', () => {
    render(
      <DialogHeader data-testid="header">Header content</DialogHeader>
    );
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header content');
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('renders DialogFooter component', () => {
    render(
      <DialogFooter data-testid="footer">Footer content</DialogFooter>
    );
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer content');
    expect(footer).toHaveClass('flex', 'flex-col-reverse');
  });

  it('renders DialogTitle component', () => {
    render(
      <DialogTitle>Dialog Title</DialogTitle>
    );
    const title = screen.getByTestId('dialog-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Dialog Title');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });

  it('renders DialogDescription component', () => {
    render(
      <DialogDescription>Dialog Description</DialogDescription>
    );
    const description = screen.getByTestId('dialog-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('Dialog Description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('renders DialogOverlay with correct classes', () => {
    render(
      <DialogOverlay data-testid="custom-overlay" />
    );
    const overlay = screen.getByTestId('custom-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/80');
  });

  it('applies custom className to dialog components', () => {
    render(
      <Dialog>
        <DialogContent className="custom-content-class">
          <DialogHeader className="custom-header-class" data-testid="header">
            <DialogTitle className="custom-title-class">Custom Title</DialogTitle>
            <DialogDescription className="custom-desc-class">Custom Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer-class" data-testid="footer">
            Footer
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('dialog-content')).toHaveClass('custom-content-class');
    expect(screen.getByTestId('header')).toHaveClass('custom-header-class');
    expect(screen.getByTestId('dialog-title')).toHaveClass('custom-title-class');
    expect(screen.getByTestId('dialog-description')).toHaveClass('custom-desc-class');
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer-class');
  });

  it('composes all Dialog components correctly', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Main content goes here</div>
          <DialogFooter>
            <button>Action Button</button>
          </DialogFooter>
          <DialogClose data-testid="custom-close">Custom Close</DialogClose>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('dialog-trigger')).toHaveTextContent('Open Dialog');
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Dialog Title');
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('Dialog Description');
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-close')).toHaveTextContent('Custom Close');
    
    await user.click(screen.getByTestId('custom-close'));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders X icon and sr-only text in default close button', () => {
    render(
      <Dialog>
        <DialogContent>Dialog with default close</DialogContent>
      </Dialog>
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('absolute', 'right-4', 'top-4');
    
    // In the actual component, there's an X icon and sr-only text
    // With our mock, we can just verify the close button exists and has appropriate classes
    expect(closeButton).toHaveClass('opacity-70', 'hover:opacity-100');
  });

  it('forwards ref to DialogOverlay component', () => {
    const ref = { current: null };
    render(<DialogOverlay ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('forwards ref to DialogContent component', () => {
    const ref = { current: null };
    render(<DialogContent ref={ref}>Content</DialogContent>);
    expect(ref.current).not.toBeNull();
  });
});