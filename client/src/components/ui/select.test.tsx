import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

// Mock @radix-ui/react-select
vi.mock('@radix-ui/react-select', () => ({
  Root: ({ children, onValueChange, defaultValue }: any) => (
    <div data-testid="select-root" data-value={defaultValue}>
      {children}
    </div>
  ),
  Trigger: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <button ref={ref} className={className} data-testid="select-trigger" {...props}>
      {children}
    </button>
  )),
  Value: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  Icon: ({ children }: any) => (
    <div data-testid="select-icon">{children}</div>
  ),
  Portal: ({ children }: any) => (
    <div data-testid="select-portal">{children}</div>
  ),
  Content: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="select-content" {...props}>
      {children}
    </div>
  )),
  Viewport: ({ children, className }: any) => (
    <div className={className} data-testid="select-viewport">{children}</div>
  ),
  Item: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="select-item" {...props}>
      {children}
    </div>
  )),
  ItemText: ({ children }: any) => <span>{children}</span>,
  ItemIndicator: ({ children }: any) => (
    <div data-testid="select-indicator">{children}</div>
  ),
  ScrollUpButton: React.forwardRef(({ className, ...props }: any, ref) => (
    <button ref={ref} className={className} data-testid="scroll-up" {...props} />
  )),
  ScrollDownButton: React.forwardRef(({ className, ...props }: any, ref) => (
    <button ref={ref} className={className} data-testid="scroll-down" {...props} />
  )),
  Group: ({ children }: any) => <div data-testid="select-group">{children}</div>,
  Label: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="select-label" {...props}>
      {children}
    </div>
  )),
  Separator: React.forwardRef(({ className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="select-separator" {...props} />
  )),
}));

describe('Select Components', () => {
  it('renders select trigger with proper styling', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option..." />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass('flex', 'h-10', 'w-full', 'items-center', 'justify-between');
    expect(screen.getByTestId('select-value')).toHaveTextContent('Select option...');
  });

  it('renders select content with items', () => {
    render(
      <Select>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('select-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('select-item')).toHaveLength(2);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('applies custom className to components', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem className="custom-item" value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('select-trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('select-content')).toHaveClass('custom-content');
    expect(screen.getByTestId('select-item')).toHaveClass('custom-item');
  });
});