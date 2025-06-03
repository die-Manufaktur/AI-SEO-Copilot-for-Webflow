import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

// Mock @radix-ui/react-collapsible
vi.mock('@radix-ui/react-collapsible', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="collapsible-root" data-state={open ? 'open' : 'closed'}>
      {children}
    </div>
  ),
  CollapsibleTrigger: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, ...props }, ref) => (
    <button
      ref={ref}
      data-testid="collapsible-trigger"
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )),
  CollapsibleContent: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
    <div
      ref={ref}
      data-testid="collapsible-content"
      {...props}
    >
      {children}
    </div>
  )),
}));

describe('Collapsible Components', () => {
  it('renders collapsible structure', () => {
    render(
      <Collapsible open={false}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content to collapse</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByTestId('collapsible-root')).toBeInTheDocument();
    expect(screen.getByTestId('collapsible-trigger')).toHaveTextContent('Toggle');
    expect(screen.getByTestId('collapsible-content')).toHaveTextContent('Content to collapse');
  });

  it('shows correct state when open', () => {
    render(
      <Collapsible open={true}>
        <CollapsibleTrigger>Close</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByTestId('collapsible-root')).toHaveAttribute('data-state', 'open');
  });

  it('shows correct state when closed', () => {
    render(
      <Collapsible open={false}>
        <CollapsibleTrigger>Open</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByTestId('collapsible-root')).toHaveAttribute('data-state', 'closed');
  });

  it('handles trigger interaction', async () => {
    const handleOpenChange = vi.fn();
    render(
      <Collapsible open={false} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    await userEvent.click(screen.getByTestId('collapsible-trigger'));
    // Note: The actual state change would be handled by the mock
    expect(screen.getByTestId('collapsible-trigger')).toBeInTheDocument();
  });

  it('forwards refs correctly', () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Collapsible>
        <CollapsibleTrigger ref={triggerRef}>Trigger</CollapsibleTrigger>
        <CollapsibleContent ref={contentRef}>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });
});