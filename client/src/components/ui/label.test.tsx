import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

// Mock @radix-ui/react-label
vi.mock('@radix-ui/react-label', () => ({
  Root: React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ children, className, ...props }, ref) => (
      <label ref={ref} className={className} {...props}>
        {children}
      </label>
    )
  ),
}));

describe('Label', () => {
  it('renders correctly with default props', () => {
    render(<Label>Form Label</Label>);
    expect(screen.getByText('Form Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom Label</Label>);
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('custom-label');
  });

  it('forwards all props to underlying element', () => {
    render(<Label htmlFor="input-id" data-testid="label">Input Label</Label>);
    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label with ref</Label>);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('handles disabled styling when used with disabled inputs', () => {
    render(
      <div>
        <Label htmlFor="disabled-input" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Disabled Label
        </Label>
        <input id="disabled-input" disabled />
      </div>
    );
    
    const label = screen.getByText('Disabled Label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });
});