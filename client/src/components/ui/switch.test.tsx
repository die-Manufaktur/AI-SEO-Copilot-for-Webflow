import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './switch';

// Mock @radix-ui/react-switch
vi.mock('@radix-ui/react-switch', () => ({
  Root: React.forwardRef<HTMLButtonElement, any>(({ children, className, checked, onCheckedChange, ...props }, ref) => (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      className={className}
      onClick={() => onCheckedChange?.(!checked)}
      data-testid="switch-root"
      data-state={checked ? 'checked' : 'unchecked'}
      {...props}
    >
      {children}
    </button>
  )),
  Thumb: ({ className }: any) => (
    <div className={className} data-testid="switch-thumb" />
  ),
}));

describe('Switch', () => {
  it('renders with default props', () => {
    render(<Switch />);
    const switchEl = screen.getByTestId('switch-root');
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveAttribute('role', 'switch');
    expect(switchEl).toHaveClass('peer', 'inline-flex', 'h-[34px]', 'w-[62px]');
  });

  it('handles checked state', () => {
    render(<Switch checked />);
    const switchEl = screen.getByTestId('switch-root');
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
    expect(switchEl).toHaveAttribute('data-state', 'checked');
  });

  it('handles unchecked state', () => {
    render(<Switch checked={false} />);
    const switchEl = screen.getByTestId('switch-root');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onCheckedChange when clicked', async () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} />);
    
    await userEvent.click(screen.getByTestId('switch-root'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('applies custom className', () => {
    render(<Switch className="custom-switch" />);
    expect(screen.getByTestId('switch-root')).toHaveClass('custom-switch');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders thumb component', () => {
    render(<Switch />);
    expect(screen.getByTestId('switch-thumb')).toBeInTheDocument();
    expect(screen.getByTestId('switch-thumb')).toHaveClass('pointer-events-none', 'block', 'h-[26px]', 'w-[26px]');
  });

  it('handles disabled state', () => {
    render(<Switch disabled />);
    const switchEl = screen.getByTestId('switch-root');
    expect(switchEl).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });
});