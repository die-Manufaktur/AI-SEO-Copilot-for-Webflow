import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea, ScrollBar } from './scroll-area';

// Mock Radix UI ScrollArea
vi.mock('@radix-ui/react-scroll-area', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="scroll-area-root" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  Viewport: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="scroll-area-viewport" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  ScrollAreaScrollbar: React.forwardRef<HTMLDivElement, any>(({ children, className, orientation, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="scroll-area-scrollbar" 
      data-orientation={orientation}
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  ScrollAreaThumb: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="scroll-area-thumb" 
      className={className}
      {...props}
    />
  )),
  Corner: () => <div data-testid="scroll-area-corner" />,
}));

// Mock styled-components
vi.mock('styled-components', () => ({
  createGlobalStyle: () => () => null,
}));

describe('ScrollArea', () => {
  it('should render scroll area component', () => {
    render(
      <ScrollArea>
        <div>Scrollable content</div>
      </ScrollArea>
    );
    
    expect(screen.getByTestId('scroll-area-root')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-area-viewport')).toBeInTheDocument();
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('should apply default styling classes', () => {
    render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    );
    
    const root = screen.getByTestId('scroll-area-root');
    expect(root).toHaveClass('relative', 'overflow-hidden');
    
    const viewport = screen.getByTestId('scroll-area-viewport');
    expect(viewport).toHaveClass('h-full', 'w-full', 'rounded-[inherit]');
  });

  it('should merge custom className with default styles', () => {
    render(
      <ScrollArea className="custom-scroll-area max-h-96">
        <div>Content</div>
      </ScrollArea>
    );
    
    const root = screen.getByTestId('scroll-area-root');
    expect(root).toHaveClass('relative', 'overflow-hidden', 'custom-scroll-area', 'max-h-96');
  });

  it('should render scrollbar and corner components', () => {
    render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    );
    
    expect(screen.getByTestId('scroll-area-scrollbar')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-area-corner')).toBeInTheDocument();
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref}>
        <div>Ref content</div>
      </ScrollArea>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should pass through additional props', () => {
    render(
      <ScrollArea 
        data-testid="custom-scroll-area"
        id="scroll-1"
        role="region"
        aria-label="Scrollable content"
      >
        <div>Props content</div>
      </ScrollArea>
    );
    
    const root = screen.getByTestId('custom-scroll-area');
    expect(root).toHaveAttribute('id', 'scroll-1');
    expect(root).toHaveAttribute('role', 'region');
    expect(root).toHaveAttribute('aria-label', 'Scrollable content');
  });

  it('should contain content within viewport', () => {
    render(
      <ScrollArea>
        <div data-testid="scroll-content">
          <p>Line 1</p>
          <p>Line 2</p>
          <p>Line 3</p>
        </div>
      </ScrollArea>
    );
    
    const viewport = screen.getByTestId('scroll-area-viewport');
    const content = screen.getByTestId('scroll-content');
    
    expect(viewport).toContainElement(content);
    expect(content).toContainElement(screen.getByText('Line 1'));
    expect(content).toContainElement(screen.getByText('Line 2'));
    expect(content).toContainElement(screen.getByText('Line 3'));
  });

  it('should have correct display name', () => {
    expect(ScrollArea.displayName).toBeDefined();
  });
});

describe('ScrollBar', () => {
  it('should render scrollbar component', () => {
    render(<ScrollBar />);
    
    expect(screen.getByTestId('scroll-area-scrollbar')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-area-thumb')).toBeInTheDocument();
  });

  it('should use vertical orientation by default', () => {
    render(<ScrollBar />);
    
    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
    expect(scrollbar).toHaveClass('h-full', 'w-2.5', 'border-l', 'border-l-transparent');
  });

  it('should apply horizontal orientation when specified', () => {
    render(<ScrollBar orientation="horizontal" />);
    
    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveAttribute('data-orientation', 'horizontal');
    expect(scrollbar).toHaveClass('h-2.5', 'flex-col', 'border-t', 'border-t-transparent');
  });

  it('should apply base styling classes', () => {
    render(<ScrollBar />);
    
    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveClass('flex', 'touch-none', 'select-none', 'transition-colors');
    
    const thumb = screen.getByTestId('scroll-area-thumb');
    expect(thumb).toHaveClass('relative', 'flex-1', 'rounded-full', 'bg-border');
  });

  it('should merge custom className with default styles', () => {
    render(<ScrollBar className="custom-scrollbar opacity-50" />);
    
    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveClass('flex', 'touch-none', 'select-none', 'custom-scrollbar', 'opacity-50');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ScrollBar ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should pass through additional props', () => {
    render(
      <ScrollBar 
        data-testid="custom-scrollbar"
        id="scrollbar-1"
        role="scrollbar"
      />
    );
    
    const scrollbar = screen.getByTestId('custom-scrollbar');
    expect(scrollbar).toHaveAttribute('id', 'scrollbar-1');
    expect(scrollbar).toHaveAttribute('role', 'scrollbar');
  });

  it('should handle both orientation options correctly', () => {
    const { rerender } = render(<ScrollBar orientation="vertical" />);
    let scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveClass('h-full', 'w-2.5');
    expect(scrollbar).not.toHaveClass('h-2.5', 'flex-col');

    rerender(<ScrollBar orientation="horizontal" />);
    scrollbar = screen.getByTestId('scroll-area-scrollbar');
    expect(scrollbar).toHaveClass('h-2.5', 'flex-col');
    expect(scrollbar).not.toHaveClass('h-full', 'w-2.5');
  });

  it('should have correct display name', () => {
    expect(ScrollBar.displayName).toBeDefined();
  });

  it('should contain thumb component', () => {
    render(<ScrollBar />);
    
    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    const thumb = screen.getByTestId('scroll-area-thumb');
    
    expect(scrollbar).toContainElement(thumb);
  });
});

describe('ScrollArea Integration', () => {
  it('should work with large content requiring scrolling', () => {
    render(
      <ScrollArea className="h-32">
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} data-testid={`item-${i}`}>
              Item {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
    
    // Should render the container with height constraint
    const root = screen.getByTestId('scroll-area-root');
    expect(root).toHaveClass('h-32');
    
    // Should contain all items
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-19')).toBeInTheDocument();
  });

  it('should render custom scrollbar with different orientation', () => {
    render(
      <ScrollArea>
        <div>Content</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
    
    const scrollbars = screen.getAllByTestId('scroll-area-scrollbar');
    expect(scrollbars).toHaveLength(2); // Default vertical + custom horizontal
    
    // Check that we have both orientations
    const orientations = scrollbars.map(sb => sb.getAttribute('data-orientation'));
    expect(orientations).toContain('vertical');
    expect(orientations).toContain('horizontal');
  });

  it('should work with nested content structure', () => {
    render(
      <ScrollArea>
        <div className="container">
          <header>Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      </ScrollArea>
    );
    
    const viewport = screen.getByTestId('scroll-area-viewport');
    expect(viewport).toContainElement(screen.getByText('Header'));
    expect(viewport).toContainElement(screen.getByText('Section 1'));
    expect(viewport).toContainElement(screen.getByText('Section 2'));
    expect(viewport).toContainElement(screen.getByText('Footer'));
  });
});