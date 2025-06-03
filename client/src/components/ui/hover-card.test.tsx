import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

// Mock @radix-ui/react-hover-card
vi.mock('@radix-ui/react-hover-card', () => ({
  Root: ({ children, openDelay, closeDelay }: any) => (
    <div data-testid="hover-card-root" data-open-delay={openDelay} data-close-delay={closeDelay}>
      {children}
    </div>
  ),
  Trigger: React.forwardRef<HTMLAnchorElement, any>(({ children, className, ...props }, ref) => (
    <a
      ref={ref}
      className={className}
      data-testid="hover-card-trigger"
      {...props}
    >
      {children}
    </a>
  )),
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, align, sideOffset, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-testid="hover-card-content"
      data-align={align}
      data-side-offset={sideOffset}
      {...props}
    >
      {children}
    </div>
  )),
}));

describe('HoverCard Components', () => {
  describe('HoverCard', () => {
    it('renders hover card structure', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Card content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId('hover-card-root')).toBeInTheDocument();
      expect(screen.getByTestId('hover-card-trigger')).toHaveTextContent('Hover me');
      expect(screen.getByTestId('hover-card-content')).toHaveTextContent('Card content');
    });

    it('handles timing props', () => {
      render(
        <HoverCard openDelay={200} closeDelay={300}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      const root = screen.getByTestId('hover-card-root');
      expect(root).toHaveAttribute('data-open-delay', '200');
      expect(root).toHaveAttribute('data-close-delay', '300');
    });
  });

  describe('HoverCardTrigger', () => {
    it('renders trigger with correct attributes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Click to hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByTestId('hover-card-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Click to hover');
    });

    it('applies custom className', () => {
      render(
        <HoverCard>
          <HoverCardTrigger className="custom-trigger">Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId('hover-card-trigger')).toHaveClass('custom-trigger');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(
        <HoverCard>
          <HoverCardTrigger ref={ref}>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });

    it('handles interaction', async () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Interactive trigger</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByTestId('hover-card-trigger');
      await userEvent.hover(trigger);
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('HoverCardContent', () => {
    it('renders with default props', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Default content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Default content');
      expect(content).toHaveAttribute('data-align', 'center');
      expect(content).toHaveAttribute('data-side-offset', '4');
    });

    it('applies correct styling classes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Styled content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toHaveClass(
        'z-50',
        'w-64',
        'rounded-md',
        'border',
        'bg-popover',
        'p-4',
        'text-popover-foreground',
        'shadow-md',
        'outline-none'
      );
    });

    it('applies animation classes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Animated content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0',
        'data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95',
        'data-[state=open]:zoom-in-95'
      );
    });

    it('applies directional slide classes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Directional content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toHaveClass(
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2'
      );
    });

    it('handles custom align prop', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent align="start">Left aligned</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toHaveAttribute('data-align', 'start');
    });

    it('handles custom sideOffset prop', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent sideOffset={10}>Offset content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toHaveAttribute('data-side-offset', '10');
    });

    it('applies custom className', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent className="custom-content">Custom content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId('hover-card-content')).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent ref={ref}>Content with ref</HoverCardContent>
        </HoverCard>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('renders complex content structure', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>SEO Info</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <h3>SEO Tip</h3>
              <p>This helps improve your page ranking.</p>
              <button>Learn more</button>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId('hover-card-content');
      expect(content).toContainHTML('<h3>SEO Tip</h3>');
      expect(content).toContainHTML('<p>This helps improve your page ranking.</p>');
      expect(content).toContainHTML('<button>Learn more</button>');
    });

    it('handles all alignment options', () => {
      const alignments = ['start', 'center', 'end'] as const;
      
      alignments.forEach(align => {
        const { unmount } = render(
          <HoverCard>
            <HoverCardTrigger>Trigger</HoverCardTrigger>
            <HoverCardContent align={align}>Content</HoverCardContent>
          </HoverCard>
        );

        const content = screen.getByTestId('hover-card-content');
        expect(content).toHaveAttribute('data-align', align);
        unmount();
      });
    });
  });

  describe('Integration', () => {
    it('handles complete hover interaction flow', async () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover for SEO tip</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <strong>Meta Description</strong>
              <p>Keep it between 150-160 characters for best results.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByTestId('hover-card-trigger');
      const content = screen.getByTestId('hover-card-content');

      expect(trigger).toHaveTextContent('Hover for SEO tip');
      expect(content).toHaveTextContent('Meta Description');
      expect(content).toHaveTextContent('Keep it between 150-160 characters for best results.');

      await userEvent.hover(trigger);
      await userEvent.unhover(trigger);
      
      expect(trigger).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('forwards all HTML attributes', () => {
      render(
        <HoverCard>
          <HoverCardTrigger data-custom="trigger-attr">Trigger</HoverCardTrigger>
          <HoverCardContent data-custom="content-attr" role="tooltip">Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId('hover-card-trigger')).toHaveAttribute('data-custom', 'trigger-attr');
      expect(screen.getByTestId('hover-card-content')).toHaveAttribute('data-custom', 'content-attr');
      expect(screen.getByTestId('hover-card-content')).toHaveAttribute('role', 'tooltip');
    });
  });
});