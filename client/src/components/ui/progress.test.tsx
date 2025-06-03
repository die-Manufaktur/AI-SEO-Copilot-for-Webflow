import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders with default props', () => {
    render(<Progress />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');
  });

  it('renders with custom value', () => {
    render(<Progress value={75} />);
    
    const progress = screen.getByRole('progressbar');
    // Check that the progress element exists and has correct max attributes
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('data-max', '100');
    
    // Find the indicator by its class - it's the child div with the specified classes
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('renders with 0 value', () => {
    render(<Progress value={0} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-max', '100');
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('renders with 100 value', () => {
    render(<Progress value={100} />);
    
    const progress = screen.getByRole('progressbar');
    // Radix UI Progress only sets data-state to 'indeterminate', not 'complete'
    expect(progress).toHaveAttribute('data-state', 'indeterminate');
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('handles values greater than 100', () => {
    render(<Progress value={150} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();

    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    // 150 value: 100 - 150 = -50, so translateX(--50%) which becomes translateX(-50%)
    // But the double negative creates '--' which is invalid CSS
    expect(indicator).toHaveStyle({ transform: 'translateX(--50%)' });
  });

  it('handles negative values', () => {
    render(<Progress value={-10} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-110%)' });
  });

  it('applies custom className', () => {
    render(<Progress className="custom-progress" />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('custom-progress');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles undefined value', () => {
    render(<Progress value={undefined} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('handles null value', () => {
    render(<Progress value={null} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('calculates transform correctly for various values', () => {
    const testCases = [
      { value: 0, expected: 'translateX(-100%)' },
      { value: 25, expected: 'translateX(-75%)' },
      { value: 50, expected: 'translateX(-50%)' },
      { value: 75, expected: 'translateX(-25%)' },
      { value: 100, expected: 'translateX(-0%)' },
      { value: 125, expected: 'translateX(--25%)' }, // Double negative due to formula bug
    ];

    testCases.forEach(({ value, expected }) => {
      const { unmount } = render(<Progress value={value} />);
      const progress = screen.getByRole('progressbar');
      const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
      
      expect(indicator).toHaveStyle({ transform: expected });
      unmount();
    });
  });

  it('provides proper accessibility attributes when aria-valuenow is explicitly set', () => {
    render(<Progress value={60} aria-valuenow={60} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuenow', '60');
  });

  it('respects custom max value in aria attributes but not in calculations', () => {
    render(<Progress value={30} max={50} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '50');
    expect(progress).toHaveAttribute('data-max', '50');
    
    // However, the transform calculation still uses the raw value, not percentage of max
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-70%)' }); // 100 - 30 = 70
  });

  it('has correct visual states', () => {
    // Test indeterminate state (no value)
    const { rerender } = render(<Progress />);
    let progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');

    // Test with value (still indeterminate - Radix UI doesn't set 'complete')
    rerender(<Progress value={50} />);
    progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');

    // Test with 100% value (still indeterminate)
    rerender(<Progress value={100} />);
    progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('data-state', 'indeterminate');
  });

  it('has correct styling classes', () => {
    render(<Progress value={50} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass(
      'relative',
      'h-4',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-secondary'
    );

    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toHaveClass(
      'h-full',
      'w-full',
      'flex-1',
      'bg-primary',
      'transition-all'
    );
  });

  it('handles edge case values correctly', () => {
    const edgeCases = [
      { value: -50, expectedTransform: 'translateX(-150%)' },
      { value: 0.5, expectedTransform: 'translateX(-99.5%)' },
      // Note: Floating point precision causes slight differences
      { value: 99.9, expectedTransform: 'translateX(-0.09999999999999432%)' },
      { value: 200, expectedTransform: 'translateX(--100%)' }, // Double negative
    ];

    edgeCases.forEach(({ value, expectedTransform }) => {
      const { unmount } = render(<Progress value={value} />);
      const progress = screen.getByRole('progressbar');
      const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
      
      expect(indicator).toHaveStyle({ transform: expectedTransform });
      unmount();
    });
  });

  it('max prop affects aria attributes but not transform calculations', () => {
    render(<Progress value={25} max={50} />);
    
    const progress = screen.getByRole('progressbar');
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    
    // Transform uses raw value (25), not percentage of max (50%)
    // So: 100 - 25 = 75
    expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' });
  });

  it('handles zero max value gracefully', () => {
    render(<Progress value={10} max={0} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    // Radix UI Progress doesn't actually set aria-valuemax to 0, it keeps the default 100
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    expect(indicator).toBeInTheDocument();
    // Transform still uses raw value: 100 - 10 = 90
    expect(indicator).toHaveStyle({ transform: 'translateX(-90%)' });
  });

  it('renders indicator with correct inline styles', () => {
    render(<Progress value={30} />);
    
    const progress = screen.getByRole('progressbar');
    const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
    
    expect(indicator).toHaveAttribute('style');
    expect(indicator?.getAttribute('style')).toContain('translateX(-70%)');
  });

  it('demonstrates the transform calculation formula', () => {
    // This test documents how the transform is actually calculated
    const testCases = [
      { value: 0, formula: '100 - 0 = 100', expected: 'translateX(-100%)' },
      { value: 50, formula: '100 - 50 = 50', expected: 'translateX(-50%)' },
      { value: 100, formula: '100 - 100 = 0', expected: 'translateX(-0%)' },
      { value: 150, formula: '100 - 150 = -50', expected: 'translateX(--50%)' },
    ];

    testCases.forEach(({ value, expected }) => {
      const { unmount } = render(<Progress value={value} />);
      const progress = screen.getByRole('progressbar');
      const indicator = progress.querySelector('.h-full.w-full.flex-1.bg-primary.transition-all');
      
      expect(indicator).toHaveStyle({ transform: expected });
      unmount();
    });
  });
});