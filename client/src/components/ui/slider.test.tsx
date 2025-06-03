import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './slider';

// Mock @radix-ui/react-slider
vi.mock('@radix-ui/react-slider', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, value, onValueChange, min, max, step, disabled, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-testid="slider-root"
      data-value={Array.isArray(value) ? value.join(',') : value}
      data-min={min}
      data-max={max}
      data-step={step}
      data-disabled={disabled}
      onClick={() => {
        // Simulate value change on click
        if (!disabled && onValueChange) {
          const newValue = Array.isArray(value) ? [50] : 50;
          onValueChange(newValue);
        }
      }}
      {...props}
    >
      {children}
    </div>
  )),
  Track: ({ className, children }: any) => (
    <div className={className} data-testid="slider-track">
      {children}
    </div>
  ),
  Range: ({ className }: any) => (
    <div className={className} data-testid="slider-range" />
  ),
  Thumb: ({ className }: any) => (
    <div className={className} data-testid="slider-thumb" />
  ),
}));

describe('Slider', () => {
  it('renders with default props', () => {
    render(<Slider />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveClass('relative', 'flex', 'w-full', 'touch-none', 'select-none', 'items-center');
  });

  it('renders slider track and thumb components', () => {
    render(<Slider />);
    
    expect(screen.getByTestId('slider-track')).toBeInTheDocument();
    expect(screen.getByTestId('slider-range')).toBeInTheDocument();
    expect(screen.getByTestId('slider-thumb')).toBeInTheDocument();
  });

  it('applies correct styling classes to components', () => {
    render(<Slider />);
    
    const track = screen.getByTestId('slider-track');
    expect(track).toHaveClass('relative', 'h-2', 'w-full', 'grow', 'overflow-hidden', 'rounded-full', 'bg-secondary');
    
    const range = screen.getByTestId('slider-range');
    expect(range).toHaveClass('absolute', 'h-full', 'bg-primary');
    
    const thumb = screen.getByTestId('slider-thumb');
    expect(thumb).toHaveClass('block', 'h-5', 'w-5', 'rounded-full', 'border-2', 'border-primary', 'bg-background');
  });

  it('handles value prop correctly', () => {
    render(<Slider value={[75]} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-value', '75');
  });

  it('handles single value', () => {
    render(<Slider value={[30]} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-value', '30');
  });

  it('handles multiple values', () => {
    render(<Slider value={[20, 80]} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-value', '20,80');
  });

  it('handles min and max props', () => {
    render(<Slider min={0} max={100} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-min', '0');
    expect(slider).toHaveAttribute('data-max', '100');
  });

  it('handles step prop', () => {
    render(<Slider step={5} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-step', '5');
  });

  it('calls onValueChange when interacted with', async () => {
    const handleValueChange = vi.fn();
    render(<Slider value={[25]} onValueChange={handleValueChange} />);
    
    await userEvent.click(screen.getByTestId('slider-root'));
    expect(handleValueChange).toHaveBeenCalledWith([50]);
  });

  it('handles disabled state', () => {
    render(<Slider disabled />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-disabled', 'true');
    
    const thumb = screen.getByTestId('slider-thumb');
    expect(thumb).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Slider className="custom-slider" />);
    
    expect(screen.getByTestId('slider-root')).toHaveClass('custom-slider');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Slider ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles focus and ring styles', () => {
    render(<Slider />);
    
    const thumb = screen.getByTestId('slider-thumb');
    expect(thumb).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2'
    );
  });

  it('does not call onValueChange when disabled', async () => {
    const handleValueChange = vi.fn();
    render(<Slider disabled value={[25]} onValueChange={handleValueChange} />);
    
    await userEvent.click(screen.getByTestId('slider-root'));
    expect(handleValueChange).not.toHaveBeenCalled();
  });

  it('handles range slider with multiple thumbs', () => {
    render(<Slider value={[25, 75]} />);
    
    const slider = screen.getByTestId('slider-root');
    expect(slider).toHaveAttribute('data-value', '25,75');
    expect(screen.getByTestId('slider-thumb')).toBeInTheDocument();
  });
});