import React from 'react'; // Add this import
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// Mocking @radix-ui/react-tooltip
vi.mock('@radix-ui/react-tooltip', () => {
  return {
    Root: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-root">{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <button data-testid="tooltip-trigger">{children}</button>,
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-portal">{children}</div>,
    Content: React.forwardRef(({ children, className, sideOffset, ...props }: any, ref) => (
      <div 
        data-testid="tooltip-content" 
        className={className} 
        data-side-offset={sideOffset}
        {...props}
      >
        {children}
      </div>
    )),
    Provider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
  };
});

describe('Tooltip', () => {
  it('renders tooltip components correctly', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-root')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-trigger')).toHaveTextContent('Hover me');
    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Tooltip content');
  });

  it('applies correct classes to tooltip content', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-class">Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId('tooltip-content');
    expect(content).toHaveClass('custom-class');
    expect(content).toHaveClass('z-999999', 'rounded-[10px]', 'border', 'p-3', 'text-xs', 'text-white', 'text-center');
  });

  it('applies correct side offset to tooltip content', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-content')).toHaveAttribute('data-side-offset', '10');
  });

  it('uses default side offset of 4 when not provided', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByTestId('tooltip-content')).toHaveAttribute('data-side-offset', '4');
  });
});