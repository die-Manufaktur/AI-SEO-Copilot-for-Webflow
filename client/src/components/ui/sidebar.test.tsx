import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useMobile } from '../../hooks/use-mobile';
import { 
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInput,
  SidebarInset,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from './sidebar';

// Mock dependencies
vi.mock('../../hooks/use-mobile', () => ({
  useMobile: vi.fn(() => false)
}));

vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('lucide-react', () => ({
  PanelLeft: () => <svg data-testid="panel-left-icon">PanelLeft</svg>
}));

// Mock Sheet component
vi.mock('./sheet', () => ({
  Sheet: ({ children, ...props }: any) => <div data-testid="sheet" {...props}>{children}</div>,
  SheetContent: ({ children, ...props }: any) => <div data-testid="sheet-content" {...props}>{children}</div>
}));

// Mock other UI components
vi.mock('./button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="button" {...props}>{children}</button>
  ))
}));

vi.mock('./input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <input ref={ref} data-testid="input" {...props} />
  ))
}));

vi.mock('./separator', () => ({
  Separator: React.forwardRef<HTMLDivElement, any>((props, ref) => (
    <div ref={ref} data-testid="separator" {...props} />
  ))
}));

vi.mock('./skeleton', () => ({
  Skeleton: ({ ...props }: any) => <div data-testid="skeleton" {...props} />
}));

vi.mock('./tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props);
    }
    return <div data-testid="tooltip-trigger" {...props}>{children}</div>;
  },
  TooltipContent: ({ children, ...props }: any) => <div data-testid="tooltip-content" {...props}>{children}</div>
}));

describe('Sidebar Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.cookie = 'sidebar:state=; max-age=0';
  });

  describe('SidebarProvider', () => {
    it('should render provider with children', () => {
      render(
        <SidebarProvider>
          <div>Sidebar content</div>
        </SidebarProvider>
      );
      
      expect(screen.getByText('Sidebar content')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    });

    it('should have default open state', () => {
      const TestComponent = () => {
        const { open } = useSidebar();
        return <div>Open: {open.toString()}</div>;
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('Open: true')).toBeInTheDocument();
    });

    it('should handle controlled open state', () => {
      const TestComponent = () => {
        const { open } = useSidebar();
        return <div>Open: {open.toString()}</div>;
      };

      const { rerender } = render(
        <SidebarProvider open={false}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('Open: false')).toBeInTheDocument();

      rerender(
        <SidebarProvider open={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('Open: true')).toBeInTheDocument();
    });

    it('should handle keyboard shortcut', () => {
      const TestComponent = () => {
        const { open } = useSidebar();
        return <div>Open: {open.toString()}</div>;
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('Open: true')).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
      });
      
      expect(screen.getByText('Open: false')).toBeInTheDocument();
    });

    it('should set cookie on state change', () => {
      const TestComponent = () => {
        const { setOpen } = useSidebar();
        return <button onClick={() => setOpen(false)}>Close</button>;
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      fireEvent.click(screen.getByText('Close'));
      
      expect(document.cookie).toContain('sidebar:state=true');
    });

    it('should apply custom styles', () => {
      const { container } = render(
        <SidebarProvider style={{ '--custom-var': 'value' } as React.CSSProperties}>
          <div>Content</div>
        </SidebarProvider>
      );
      
      const wrapper = container.querySelector('.group\\/sidebar-wrapper') as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('16rem');
      expect(wrapper.style.getPropertyValue('--sidebar-width-icon')).toBe('3rem');
    });

    it('should have correct display name', () => {
      expect(SidebarProvider.displayName).toBe('SidebarProvider');
    });
  });

  describe('Sidebar', () => {
    it('should render sidebar with default props', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <div>Sidebar content</div>
          </Sidebar>
        </SidebarProvider>
      );
      
      expect(screen.getByText('Sidebar content')).toBeInTheDocument();
    });

    it('should handle collapsible="none"', () => {
      render(
        <SidebarProvider>
          <Sidebar collapsible="none">
            <div>Non-collapsible</div>
          </Sidebar>
        </SidebarProvider>
      );
      
      const sidebar = screen.getByText('Non-collapsible').parentElement;
      expect(sidebar).toHaveClass('flex', 'h-full', 'w-[--sidebar-width]');
    });

    it('should render mobile sheet when isMobile is true', async () => {
      const { useMobile } = await import('../../hooks/use-mobile');
      (useMobile as any).mockReturnValue(true);

      render(
        <SidebarProvider>
          <Sidebar>
            <div>Mobile sidebar</div>
          </Sidebar>
        </SidebarProvider>
      );
      
      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    });

    it('should handle different sides', () => {
      vi.mocked(useMobile).mockReturnValue(false);
      
      render(
        <SidebarProvider>
          <Sidebar side="right">
            <div>Right sidebar</div>
          </Sidebar>
        </SidebarProvider>
      );
      
      const sidebar = screen.getByText('Right sidebar').closest('[data-sidebar="sidebar"]')?.parentElement?.parentElement;
      expect(sidebar).toHaveAttribute('data-side', 'right');
    });

    it('should handle different variants', () => {
      vi.mocked(useMobile).mockReturnValue(false);
      
      render(
        <SidebarProvider>
          <Sidebar variant="floating">
            <div>Floating sidebar</div>
          </Sidebar>
        </SidebarProvider>
      );
      
      const sidebar = screen.getByText('Floating sidebar').closest('[data-sidebar="sidebar"]')?.parentElement?.parentElement;
      expect(sidebar).toHaveAttribute('data-variant', 'floating');
    });

    it('should have correct display name', () => {
      expect(Sidebar.displayName).toBe('Sidebar');
    });
  });

  describe('SidebarTrigger', () => {
    it('should render trigger button', () => {
      render(
        <SidebarProvider>
          <SidebarTrigger />
        </SidebarProvider>
      );
      
      expect(screen.getByTestId('button')).toBeInTheDocument();
      expect(screen.getByTestId('panel-left-icon')).toBeInTheDocument();
      expect(screen.getByText('Toggle Sidebar')).toHaveClass('sr-only');
    });

    it('should toggle sidebar on click', () => {
      // Ensure we're not in mobile mode
      vi.mocked(useMobile).mockReturnValue(false);
      
      const TestComponent = () => {
        const { open } = useSidebar();
        return (
          <>
            <SidebarTrigger />
            <div>Open: {open.toString()}</div>
          </>
        );
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('Open: true')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('button'));
      
      expect(screen.getByText('Open: false')).toBeInTheDocument();
    });

    it('should handle custom onClick', () => {
      const handleClick = vi.fn();
      render(
        <SidebarProvider>
          <SidebarTrigger onClick={handleClick} />
        </SidebarProvider>
      );
      
      fireEvent.click(screen.getByTestId('button'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have correct display name', () => {
      expect(SidebarTrigger.displayName).toBe('SidebarTrigger');
    });
  });

  describe('SidebarRail', () => {
    it('should render rail button', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarRail />
          </Sidebar>
        </SidebarProvider>
      );
      
      const rail = screen.getByRole('button', { name: 'Toggle Sidebar' });
      expect(rail).toBeInTheDocument();
      expect(rail).toHaveAttribute('data-sidebar', 'rail');
    });

    it('should toggle sidebar on click', () => {
      vi.mocked(useMobile).mockReturnValue(false);
      
      const TestComponent = () => {
        const { open } = useSidebar();
        return (
          <>
            <Sidebar>
              <SidebarRail />
            </Sidebar>
            <div>Open: {open.toString()}</div>
          </>
        );
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
      
      expect(screen.getByText('Open: false')).toBeInTheDocument();
    });

    it('should have correct display name', () => {
      expect(SidebarRail.displayName).toBe('SidebarRail');
    });
  });

  describe('SidebarInset', () => {
    it('should render main content area', () => {
      render(
        <SidebarProvider>
          <SidebarInset>
            <div>Main content</div>
          </SidebarInset>
        </SidebarProvider>
      );
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('relative', 'flex', 'min-h-svh', 'flex-1');
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should have correct display name', () => {
      expect(SidebarInset.displayName).toBe('SidebarInset');
    });
  });

  describe('SidebarInput', () => {
    it('should render input with correct styling', () => {
      render(
        <SidebarProvider>
          <SidebarInput placeholder="Search..." />
        </SidebarProvider>
      );
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('data-sidebar', 'input');
      expect(input).toHaveClass('h-8', 'w-full', 'bg-background');
    });

    it('should have correct display name', () => {
      expect(SidebarInput.displayName).toBe('SidebarInput');
    });
  });

  describe('SidebarHeader', () => {
    it('should render header with correct styling', () => {
      render(
        <SidebarProvider>
          <SidebarHeader>
            <div>Header content</div>
          </SidebarHeader>
        </SidebarProvider>
      );
      
      const header = screen.getByText('Header content').parentElement;
      expect(header).toHaveAttribute('data-sidebar', 'header');
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'p-2');
    });

    it('should have correct display name', () => {
      expect(SidebarHeader.displayName).toBe('SidebarHeader');
    });
  });

  describe('SidebarFooter', () => {
    it('should render footer with correct styling', () => {
      render(
        <SidebarProvider>
          <SidebarFooter>
            <div>Footer content</div>
          </SidebarFooter>
        </SidebarProvider>
      );
      
      const footer = screen.getByText('Footer content').parentElement;
      expect(footer).toHaveAttribute('data-sidebar', 'footer');
      expect(footer).toHaveClass('flex', 'flex-col', 'gap-2', 'p-2');
    });

    it('should have correct display name', () => {
      expect(SidebarFooter.displayName).toBe('SidebarFooter');
    });
  });

  describe('SidebarSeparator', () => {
    it('should render separator with correct styling', () => {
      render(
        <SidebarProvider>
          <SidebarSeparator />
        </SidebarProvider>
      );
      
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-sidebar', 'separator');
      expect(separator).toHaveClass('mx-2', 'w-auto', 'bg-sidebar-border');
    });

    it('should have correct display name', () => {
      expect(SidebarSeparator.displayName).toBe('SidebarSeparator');
    });
  });

  describe('SidebarContent', () => {
    it('should render content area with correct styling', () => {
      render(
        <SidebarProvider>
          <SidebarContent>
            <div>Scrollable content</div>
          </SidebarContent>
        </SidebarProvider>
      );
      
      const content = screen.getByText('Scrollable content').parentElement;
      expect(content).toHaveAttribute('data-sidebar', 'content');
      expect(content).toHaveClass('flex', 'min-h-0', 'flex-1', 'flex-col', 'gap-2', 'overflow-auto');
    });

    it('should have correct display name', () => {
      expect(SidebarContent.displayName).toBe('SidebarContent');
    });
  });

  describe('SidebarGroup', () => {
    it('should render group container', () => {
      render(
        <SidebarProvider>
          <SidebarGroup>
            <div>Group content</div>
          </SidebarGroup>
        </SidebarProvider>
      );
      
      const group = screen.getByText('Group content').parentElement;
      expect(group).toHaveAttribute('data-sidebar', 'group');
      expect(group).toHaveClass('relative', 'flex', 'w-full', 'min-w-0');
    });

    it('should have correct display name', () => {
      expect(SidebarGroup.displayName).toBe('SidebarGroup');
    });
  });

  describe('SidebarGroupLabel', () => {
    it('should render group label', () => {
      render(
        <SidebarProvider>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        </SidebarProvider>
      );
      
      const label = screen.getByText('Navigation');
      expect(label).toHaveAttribute('data-sidebar', 'group-label');
      expect(label).toHaveClass('flex', 'h-8', 'shrink-0');
    });

    it('should support asChild prop', () => {
      render(
        <SidebarProvider>
          <SidebarGroupLabel asChild>
            <span>Custom Label</span>
          </SidebarGroupLabel>
        </SidebarProvider>
      );
      
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should have correct display name', () => {
      expect(SidebarGroupLabel.displayName).toBe('SidebarGroupLabel');
    });
  });

  describe('SidebarMenu', () => {
    it('should render menu list', () => {
      render(
        <SidebarProvider>
          <SidebarMenu>
            <li>Item 1</li>
            <li>Item 2</li>
          </SidebarMenu>
        </SidebarProvider>
      );
      
      const menu = screen.getByRole('list');
      expect(menu).toHaveAttribute('data-sidebar', 'menu');
      expect(menu).toHaveClass('flex', 'w-full', 'min-w-0');
    });

    it('should have correct display name', () => {
      expect(SidebarMenu.displayName).toBe('SidebarMenu');
    });
  });

  describe('SidebarMenuItem', () => {
    it('should render menu item', () => {
      render(
        <SidebarProvider>
          <SidebarMenu>
            <SidebarMenuItem>
              <div>Menu item</div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarProvider>
      );
      
      const item = screen.getByText('Menu item').parentElement;
      expect(item).toHaveAttribute('data-sidebar', 'menu-item');
      expect(item).toHaveClass('group/menu-item', 'relative');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuItem.displayName).toBe('SidebarMenuItem');
    });
  });

  describe('SidebarMenuButton', () => {
    it('should render menu button with default props', () => {
      render(
        <SidebarProvider>
          <SidebarMenuButton>Dashboard</SidebarMenuButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Dashboard');
      expect(button).toHaveAttribute('data-sidebar', 'menu-button');
      expect(button).toHaveAttribute('data-size', 'default');
      expect(button).toHaveAttribute('data-active', 'false');
    });

    it('should handle isActive prop', () => {
      render(
        <SidebarProvider>
          <SidebarMenuButton isActive={true}>Active Item</SidebarMenuButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Active Item');
      expect(button).toHaveAttribute('data-active', 'true');
    });

    it('should show tooltip when collapsed', () => {
      const TestComponent = () => {
        return (
          <SidebarMenuButton tooltip="Dashboard tooltip">
            Dashboard
          </SidebarMenuButton>
        );
      };

      render(
        <SidebarProvider defaultOpen={false}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    it('should handle different variants', () => {
      render(
        <SidebarProvider>
          <SidebarMenuButton variant="outline">Outline Button</SidebarMenuButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Outline Button');
      expect(button).toHaveClass('bg-background', 'shadow-[0_0_0_1px_hsl(var(--sidebar-border))]');
    });

    it('should handle different sizes', () => {
      const { rerender } = render(
        <SidebarProvider>
          <SidebarMenuButton size="sm">Small</SidebarMenuButton>
        </SidebarProvider>
      );
      
      let button = screen.getByText('Small');
      expect(button).toHaveAttribute('data-size', 'sm');
      
      rerender(
        <SidebarProvider>
          <SidebarMenuButton size="lg">Large</SidebarMenuButton>
        </SidebarProvider>
      );
      
      button = screen.getByText('Large');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuButton.displayName).toBe('SidebarMenuButton');
    });
  });

  describe('SidebarMenuAction', () => {
    it('should render menu action button', () => {
      render(
        <SidebarProvider>
          <SidebarMenuItem>
            <SidebarMenuButton>Item</SidebarMenuButton>
            <SidebarMenuAction>
              <span>Action</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarProvider>
      );
      
      const action = screen.getByText('Action').parentElement;
      expect(action).toHaveAttribute('data-sidebar', 'menu-action');
      expect(action).toHaveClass('absolute', 'right-1');
    });

    it('should handle showOnHover prop', () => {
      render(
        <SidebarProvider>
          <SidebarMenuItem>
            <SidebarMenuButton>Item</SidebarMenuButton>
            <SidebarMenuAction showOnHover={true}>
              <span>Hover Action</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarProvider>
      );
      
      const action = screen.getByText('Hover Action').parentElement;
      expect(action).toHaveClass('md:opacity-0');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuAction.displayName).toBe('SidebarMenuAction');
    });
  });

  describe('SidebarMenuBadge', () => {
    it('should render menu badge', () => {
      render(
        <SidebarProvider>
          <SidebarMenuItem>
            <SidebarMenuButton>Notifications</SidebarMenuButton>
            <SidebarMenuBadge>5</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarProvider>
      );
      
      const badge = screen.getByText('5');
      expect(badge).toHaveAttribute('data-sidebar', 'menu-badge');
      expect(badge).toHaveClass('absolute', 'right-1', 'flex');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuBadge.displayName).toBe('SidebarMenuBadge');
    });
  });

  describe('SidebarMenuSkeleton', () => {
    it('should render skeleton loader', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSkeleton />
        </SidebarProvider>
      );
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.parentElement).toHaveAttribute('data-sidebar', 'menu-skeleton');
    });

    it('should show icon when showIcon is true', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSkeleton showIcon={true} />
        </SidebarProvider>
      );
      
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(2);
      expect(skeletons[0]).toHaveAttribute('data-sidebar', 'menu-skeleton-icon');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuSkeleton.displayName).toBe('SidebarMenuSkeleton');
    });
  });

  describe('SidebarMenuSub', () => {
    it('should render submenu list', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSub>
            <li>Sub item 1</li>
            <li>Sub item 2</li>
          </SidebarMenuSub>
        </SidebarProvider>
      );
      
      const submenu = screen.getByRole('list');
      expect(submenu).toHaveAttribute('data-sidebar', 'menu-sub');
      expect(submenu).toHaveClass('mx-3.5', 'flex', 'border-l');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuSub.displayName).toBe('SidebarMenuSub');
    });
  });

  describe('SidebarMenuSubButton', () => {
    it('should render submenu button', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSubButton href="#">
            Sub item
          </SidebarMenuSubButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Sub item');
      expect(button).toHaveAttribute('data-sidebar', 'menu-sub-button');
      expect(button).toHaveAttribute('data-size', 'md');
      expect(button).not.toHaveAttribute('data-active', 'true');
    });

    it('should handle isActive prop', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSubButton isActive={true}>
            Active sub item
          </SidebarMenuSubButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Active sub item');
      expect(button).toHaveAttribute('data-active', 'true');
    });

    it('should handle different sizes', () => {
      render(
        <SidebarProvider>
          <SidebarMenuSubButton size="sm">
            Small sub item
          </SidebarMenuSubButton>
        </SidebarProvider>
      );
      
      const button = screen.getByText('Small sub item');
      expect(button).toHaveAttribute('data-size', 'sm');
      expect(button).toHaveClass('text-xs');
    });

    it('should have correct display name', () => {
      expect(SidebarMenuSubButton.displayName).toBe('SidebarMenuSubButton');
    });
  });

  describe('useSidebar hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useSidebar();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useSidebar must be used within a SidebarProvider.'
      );
    });

    it('should provide sidebar context', () => {
      // Ensure we're not in mobile mode
      vi.mocked(useMobile).mockReturnValue(false);
      
      const TestComponent = () => {
        const { state, open, isMobile, toggleSidebar, setOpen, openMobile, setOpenMobile } = useSidebar();
        return (
          <div>
            <div>State: {state}</div>
            <div>Open: {open.toString()}</div>
            <div>Mobile: {isMobile.toString()}</div>
            <button onClick={toggleSidebar}>Toggle</button>
            <button onClick={() => setOpen(false)}>Close</button>
            <button onClick={() => setOpenMobile(true)}>Open Mobile</button>
          </div>
        );
      };

      render(
        <SidebarProvider defaultOpen={true}>
          <TestComponent />
        </SidebarProvider>
      );
      
      expect(screen.getByText('State: expanded')).toBeInTheDocument();
      expect(screen.getByText('Open: true')).toBeInTheDocument();
      expect(screen.getByText('Mobile: false')).toBeInTheDocument();
    });
  });

  describe('Sidebar Integration', () => {
    it('should work as complete sidebar system', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <SidebarInput placeholder="Search..." />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={true}>
                        Dashboard
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        Settings
                      </SidebarMenuButton>
                      <SidebarMenuBadge>3</SidebarMenuBadge>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Project 1</SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>Overview</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>Tasks</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenuButton>
                User Profile
              </SidebarMenuButton>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <main>
              <SidebarTrigger />
              <h1>Main Content</h1>
            </main>
          </SidebarInset>
        </SidebarProvider>
      );
      
      // Check all elements are rendered
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });
  });
});