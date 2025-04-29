import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopyTooltip } from './copy-tooltip';

// Mock the tooltip components
vi.mock('./tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
  TooltipContent: ({ 
    children, 
    style, 
    side 
  }: { 
    children: React.ReactNode; 
    style?: React.CSSProperties; 
    side?: string;
  }) => (
    <div 
      data-testid="tooltip-content" 
      data-side={side}
      style={style}
    >
      {children}
    </div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  TooltipTrigger: ({ 
    children, 
    asChild 
  }: { 
    children: React.ReactNode; 
    asChild?: boolean;
  }) => (
    <div 
      data-testid="tooltip-trigger"
      data-as-child={asChild ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
}));

describe('CopyTooltip', () => {
  it('renders with the correct structure', () => {
    render(
      <CopyTooltip content="Tooltip content">
        <button>Click me</button>
      </CopyTooltip>
    );

    // Check that all required components are rendered
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    
    // Check the button is rendered inside the trigger
    expect(screen.getByTestId('tooltip-trigger')).toContainElement(
      screen.getByText('Click me')
    );
    
    // Check the tooltip content
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'Tooltip content'
    );
  });

  it('passes asChild prop to TooltipTrigger', () => {
    render(
      <CopyTooltip content="Tooltip content">
        <button>Click me</button>
      </CopyTooltip>
    );

    expect(screen.getByTestId('tooltip-trigger')).toHaveAttribute(
      'data-as-child',
      'true'
    );
  });

  it('positions tooltip above the trigger', () => {
    render(
      <CopyTooltip content="Tooltip content">
        <button>Click me</button>
      </CopyTooltip>
    );

    expect(screen.getByTestId('tooltip-content')).toHaveAttribute('data-side', 'top');
  });

  it('applies transform style to position the tooltip', () => {
    render(
      <CopyTooltip content="Tooltip content">
        <button>Click me</button>
      </CopyTooltip>
    );

    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toHaveStyle({ transform: 'translateX(-54px)' });
  });

  it('renders complex content in tooltip', () => {
    render(
      <CopyTooltip 
        content={
          <div>
            <span>Complex</span>
            <strong>Content</strong>
          </div>
        }
      >
        <button>Click me</button>
      </CopyTooltip>
    );

    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toContainHTML('<span>Complex</span>');
    expect(tooltipContent).toContainHTML('<strong>Content</strong>');
  });

  it('renders complex children', () => {
    render(
      <CopyTooltip content="Tooltip content">
        <div className="complex-trigger">
          <span>Trigger</span>
          <img src="icon.png" alt="icon" />
        </div>
      </CopyTooltip>
    );

    const trigger = screen.getByTestId('tooltip-trigger');
    expect(trigger).toContainElement(screen.getByText('Trigger'));
    expect(trigger).toContainElement(screen.getByAltText('icon'));
  });
});