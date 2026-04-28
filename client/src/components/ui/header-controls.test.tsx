import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderControls } from './header-controls';

describe('HeaderControls', () => {
  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<HeaderControls />);
      expect(screen.getByRole('group', { name: /header controls/i })).toBeInTheDocument();
    });

    it('should render all three control buttons', () => {
      render(<HeaderControls />);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render buttons in correct order', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveAttribute('aria-label', 'Refresh');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Minimize');
      expect(buttons[2]).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Styling and Design Tokens', () => {
    it('should apply muted text color to icons by default', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveStyle({ color: 'var(--text-muted)' });
      });
    });

    it('should have proper button dimensions', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-6', 'h-6');
      });
    });

    it('should apply correct border radius', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-radius-sm');
      });
    });

    it('should have proper spacing between buttons', () => {
      render(<HeaderControls />);
      const container = screen.getByRole('group', { name: /header controls/i });
      expect(container).toHaveClass('gap-spacing-sm');
    });

    it('should be positioned as a flex container', () => {
      render(<HeaderControls />);
      const container = screen.getByRole('group', { name: /header controls/i });
      expect(container).toHaveClass('flex', 'items-center');
    });
  });

  describe('Interaction', () => {
    it('should handle refresh click event', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();
      render(<HeaderControls onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledOnce();
    });

    it('should handle minimize click event', async () => {
      const user = userEvent.setup();
      const onMinimize = vi.fn();
      render(<HeaderControls onMinimize={onMinimize} />);

      const minimizeButton = screen.getByRole('button', { name: /minimize/i });
      await user.click(minimizeButton);

      expect(onMinimize).toHaveBeenCalledOnce();
    });

    it('should handle close click event', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<HeaderControls onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should work without event handlers', () => {
      expect(() => render(<HeaderControls />)).not.toThrow();
    });
  });

  describe('Hover states', () => {
    it('should apply hover styles correctly', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:text-text-primary', 'hover:bg-input-bg');
      });
    });

    it('should have smooth transition', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<HeaderControls />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      const minimizeButton = screen.getByRole('button', { name: /minimize/i });
      const closeButton = screen.getByRole('button', { name: /close/i });

      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh');
      expect(minimizeButton).toHaveAttribute('aria-label', 'Minimize');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should be keyboard navigable', () => {
      render(<HeaderControls />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should have group role for container', () => {
      render(<HeaderControls />);
      const container = screen.getByRole('group', { name: /header controls/i });
      expect(container).toHaveAttribute('role', 'group');
    });
  });

  describe('Props and customization', () => {
    it('should accept and apply custom className to container', () => {
      render(<HeaderControls className="custom-controls" />);
      const container = screen.getByRole('group', { name: /header controls/i });
      expect(container).toHaveClass('custom-controls');
    });

    it('should merge custom className with default classes', () => {
      render(<HeaderControls className="custom-controls" />);
      const container = screen.getByRole('group', { name: /header controls/i });
      expect(container).toHaveClass('custom-controls', 'flex', 'items-center', 'gap-spacing-sm');
    });
  });

  describe('Component API', () => {
    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<HeaderControls ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});