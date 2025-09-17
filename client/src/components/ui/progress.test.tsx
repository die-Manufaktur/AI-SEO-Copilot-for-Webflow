import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

// Mock Radix UI Progress
vi.mock('@radix-ui/react-progress', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="progress-root" 
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  Indicator: React.forwardRef<HTMLDivElement, any>(({ className, style, ...props }, ref) => (
    <div 
      ref={ref}
      data-testid="progress-indicator" 
      className={className}
      style={style}
      {...props}
    />
  )),
}));

describe('Progress', () => {
  it('should render progress component', () => {
    render(<Progress value={50} />);
    
    expect(screen.getByTestId('progress-root')).toBeInTheDocument();
    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
  });

  it('should apply default styling classes', () => {
    render(<Progress value={30} />);
    
    const root = screen.getByTestId('progress-root');
    expect(root).toHaveClass(
      'relative',
      'h-4',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-secondary'
    );
  });

  it('should apply indicator styling classes', () => {
    render(<Progress value={75} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveClass(
      'h-full',
      'w-full',
      'flex-1',
      'bg-primary',
      'transition-all'
    );
  });

  it('should set correct transform style for value', () => {
    render(<Progress value={60} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-40%)');
  });

  it('should handle 0% progress', () => {
    render(<Progress value={0} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('should handle 100% progress', () => {
    render(<Progress value={100} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-0%)');
  });

  it('should handle undefined value gracefully', () => {
    render(<Progress />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('should handle null value gracefully', () => {
    render(<Progress value={null as any} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('should merge custom className with default styles', () => {
    render(<Progress value={50} className="custom-progress" />);
    
    const root = screen.getByTestId('progress-root');
    expect(root).toHaveClass('relative', 'h-4', 'w-full', 'custom-progress');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} value={40} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should pass through additional props', () => {
    render(
      <Progress 
        value={80} 
        data-testid="custom-progress"
        aria-label="Loading progress"
        id="progress-1"
      />
    );
    
    const root = screen.getByTestId('custom-progress');
    expect(root).toHaveAttribute('aria-label', 'Loading progress');
    expect(root).toHaveAttribute('id', 'progress-1');
  });

  it('should handle edge case values correctly', () => {
    const { rerender } = render(<Progress value={-10} />);
    let indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-110%)');

    rerender(<Progress value={150} />);
    indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(--50%)');
  });

  it('should support fractional values', () => {
    render(<Progress value={33.333} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-66.667%)');
  });

  it('should have correct display name', () => {
    expect(Progress.displayName).toBe('ProgressRoot');
  });

  it('should work with accessibility attributes', () => {
    render(
      <Progress 
        value={70}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={70}
        role="progressbar"
      />
    );
    
    const root = screen.getByTestId('progress-root');
    expect(root).toHaveAttribute('aria-valuemin', '0');
    expect(root).toHaveAttribute('aria-valuemax', '100');
    expect(root).toHaveAttribute('aria-valuenow', '70');
    expect(root).toHaveAttribute('role', 'progressbar');
  });

  it('should handle very small values', () => {
    render(<Progress value={0.1} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-99.9%)');
  });

  it('should handle very large values', () => {
    render(<Progress value={99.9} />);
    
    const indicator = screen.getByTestId('progress-indicator');
    expect(indicator).toHaveStyle('transform: translateX(-0.09999999999999432%)');
  });
});