import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './dropdown-menu';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
}));

// Complete mock for @radix-ui/react-dropdown-menu
vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  )),
  Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-content" {...props}>
      {children}
    </div>
  )),
  Item: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-item" {...props}>
      {children}
    </div>
  )),
  Separator: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-separator" {...props} />
  )),
  Group: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
  Label: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-label" {...props}>
      {children}
    </div>
  )),
  CheckboxItem: React.forwardRef<HTMLDivElement, any>(({ children, className, checked, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-checkbox-item" data-checked={checked} {...props}>
      {children}
    </div>
  )),
  RadioItem: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-radio-item" {...props}>
      {children}
    </div>
  )),
  RadioGroup: ({ children }: any) => <div data-testid="dropdown-radio-group">{children}</div>,
  Sub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
  SubTrigger: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-sub-trigger" {...props}>
      {children}
    </div>
  )),
  SubContent: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-sub-content" {...props}>
      {children}
    </div>
  )),
  ItemIndicator: ({ children }: any) => <span data-testid="dropdown-item-indicator">{children}</span>,
}));

describe('DropdownMenu Components', () => {
  it('renders dropdown menu structure', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Open Menu');
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('dropdown-item')).toHaveLength(2);
    expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
  });

  it('applies proper styling classes', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>Menu Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = screen.getByTestId('dropdown-content');
    expect(content).toHaveClass('z-50', 'min-w-[8rem]', 'overflow-hidden', 'rounded-md');
    
    const item = screen.getByTestId('dropdown-item');
    expect(item).toHaveClass('relative', 'flex', 'cursor-default', 'select-none');
  });

  it('renders dropdown menu with all component variants', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Section Label</DropdownMenuLabel>
          <DropdownMenuItem>Regular Item</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Checkbox Item</DropdownMenuCheckboxItem>
          <DropdownMenuRadioItem value="radio-item">Radio Item</DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Grouped Item
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Section Label');
    expect(screen.getByTestId('dropdown-checkbox-item')).toHaveAttribute('data-checked', 'true');
    expect(screen.getByTestId('dropdown-radio-item')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-group')).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('renders submenu components', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuSubTrigger>Submenu Trigger</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Submenu Item</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-sub-trigger')).toHaveTextContent('Submenu Trigger');
    expect(screen.getByTestId('dropdown-sub-content')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('applies inset prop correctly', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          <DropdownMenuSubTrigger inset>Inset SubTrigger</DropdownMenuSubTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-item')).toHaveClass('pl-8');
    expect(screen.getByTestId('dropdown-label')).toHaveClass('pl-8');
    expect(screen.getByTestId('dropdown-sub-trigger')).toHaveClass('pl-8');
  });

  it('applies custom className to all components', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
          <DropdownMenuSeparator className="custom-separator" />
          <DropdownMenuLabel className="custom-label">Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-content')).toHaveClass('custom-content');
    expect(screen.getByTestId('dropdown-item')).toHaveClass('custom-item');
    expect(screen.getByTestId('dropdown-separator')).toHaveClass('custom-separator');
    expect(screen.getByTestId('dropdown-label')).toHaveClass('custom-label');
  });

  it('renders icons correctly in checkbox and radio items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>
            Checkbox Item
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioItem value="radio-item">
            Radio Item
          </DropdownMenuRadioItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('dropdown-item-indicator')).toHaveLength(2);
  });

  it('forwards refs correctly', () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLDivElement>();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger ref={triggerRef}>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent ref={contentRef}>
          <DropdownMenuItem ref={itemRef}>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });
});