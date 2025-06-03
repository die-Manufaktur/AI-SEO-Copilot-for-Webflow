import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './checkbox';

// Mock @radix-ui/react-checkbox
vi.mock('@radix-ui/react-checkbox', () => ({
  Root: React.forwardRef<HTMLButtonElement, any>(({ children, className, checked, onCheckedChange, ...props }, ref) => (
    <button
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      className={className}
      onClick={() => onCheckedChange?.(!checked)}
      data-testid="checkbox-root"
      data-state={checked ? 'checked' : 'unchecked'}
      {...props}
    >
      {children}
    </button>
  )),
  Indicator: ({ children, className }: any) => (
    <span className={className} data-testid="checkbox-indicator">{children}</span>
  ),
}));

vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
}));

describe('Checkbox', () => {
  it('renders with default props', () => {
    render(<Checkbox />);
    const checkbox = screen.getByTestId('checkbox-root');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('role', 'checkbox');
    expect(checkbox).toHaveClass('peer', 'h-4', 'w-4', 'shrink-0', 'rounded-sm');
  });

  it('handles checked state', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByTestId('checkbox-root');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('handles unchecked state', () => {
    render(<Checkbox checked={false} />);
    const checkbox = screen.getByTestId('checkbox-root');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onCheckedChange when clicked', async () => {
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={handleChange} />);
    
    await userEvent.click(screen.getByTestId('checkbox-root'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders check icon when checked', () => {
    render(<Checkbox checked />);
    expect(screen.getByTestId('checkbox-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-checkbox" />);
    expect(screen.getByTestId('checkbox-root')).toHaveClass('custom-checkbox');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('handles disabled state', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByTestId('checkbox-root');
    expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('applies proper focus styles', () => {
    render(<Checkbox />);
    const checkbox = screen.getByTestId('checkbox-root');
    expect(checkbox).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });
});