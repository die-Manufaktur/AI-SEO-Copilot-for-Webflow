import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Mock @radix-ui/react-tabs
vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, defaultValue, value, onValueChange }: any) => (
    <div data-testid="tabs-root" data-value={value || defaultValue}>
      {children}
    </div>
  ),
  List: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="tabs-list" role="tablist" {...props}>
      {children}
    </div>
  )),
  Trigger: React.forwardRef<HTMLButtonElement, any>(({ children, className, value, ...props }, ref) => (
    <button
      ref={ref}
      className={className}
      data-testid={`tabs-trigger-${value}`}
      role="tab"
      data-value={value}
      {...props}
    >
      {children}
    </button>
  )),
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-testid={`tabs-content-${value}`}
      role="tabpanel"
      data-value={value}
      {...props}
    >
      {children}
    </div>
  )),
}));

describe('Tabs Components', () => {
  it('renders complete tabs structure', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger-tab1')).toHaveTextContent('Tab 1');
    expect(screen.getByTestId('tabs-trigger-tab2')).toHaveTextContent('Tab 2');
    expect(screen.getByTestId('tabs-content-tab1')).toHaveTextContent('Content 1');
    expect(screen.getByTestId('tabs-content-tab2')).toHaveTextContent('Content 2');
  });

  it('applies correct styling classes', () => {
    render(
      <Tabs defaultValue="test">
        <TabsList>
          <TabsTrigger value="test">Test Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="test">Test Content</TabsContent>
      </Tabs>
    );

    const list = screen.getByTestId('tabs-list');
    expect(list).toHaveClass('inline-flex', 'h-10', 'items-center', 'justify-center', 'rounded-md', 'bg-muted');

    const trigger = screen.getByTestId('tabs-trigger-test');
    expect(trigger).toHaveClass('inline-flex', 'items-center', 'justify-center', 'whitespace-nowrap');

    const content = screen.getByTestId('tabs-content-test');
    expect(content).toHaveClass('mt-2', 'ring-offset-background');
  });

  it('applies custom className to all components', () => {
    render(
      <Tabs defaultValue="test">
        <TabsList className="custom-list">
          <TabsTrigger value="test" className="custom-trigger">Test</TabsTrigger>
        </TabsList>
        <TabsContent value="test" className="custom-content">Content</TabsContent>
      </Tabs>
    );

    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list');
    expect(screen.getByTestId('tabs-trigger-test')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('tabs-content-test')).toHaveClass('custom-content');
  });

  it('forwards refs correctly', () => {
    const listRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="test">
        <TabsList ref={listRef}>
          <TabsTrigger value="test" ref={triggerRef}>Test</TabsTrigger>
        </TabsList>
        <TabsContent value="test" ref={contentRef}>Content</TabsContent>
      </Tabs>
    );

    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles multiple tabs with proper ARIA attributes', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="analytics">Analytics content</TabsContent>
        <TabsContent value="reports">Reports content</TabsContent>
      </Tabs>
    );

    expect(screen.getByTestId('tabs-list')).toHaveAttribute('role', 'tablist');
    expect(screen.getByTestId('tabs-trigger-overview')).toHaveAttribute('role', 'tab');
    expect(screen.getByTestId('tabs-content-overview')).toHaveAttribute('role', 'tabpanel');
  });
});