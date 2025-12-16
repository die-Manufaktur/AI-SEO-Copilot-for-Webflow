import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressCircle } from './progress-circle';

describe('ProgressCircle', () => {
  it('renders with default props', () => {
    const { container } = render(<ProgressCircle value={75} size={120} strokeWidth={10} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
    
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
    
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    const { container } = render(<ProgressCircle value={80} size={200} strokeWidth={15} scoreText="Performance" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
    
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke-width', '15');
    expect(circles[1]).toHaveAttribute('stroke-width', '15');
    
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.queryByText('Score')).not.toBeInTheDocument();
  });

  it('uses correct radius and circumference calculations', () => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    
    const { container } = render(<ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    
    expect(progressCircle).toHaveAttribute('r', String(radius));
    
    expect(progressCircle).toHaveAttribute('stroke-dasharray', String(circumference));
    
    const expectedOffset = circumference - (50 / 100) * circumference;
    const actualOffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0');
    expect(actualOffset).toBeCloseTo(expectedOffset, 2);
  });

  it('applies low (red) color for scores below 60', () => {
    const { container } = render(<ProgressCircle value={40} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('40');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-low)');
    expect(valueText).toHaveStyle('color: var(--score-low)');
  });

  it('applies fair (yellow) color for scores between 60 and 74', () => {
    const { container } = render(<ProgressCircle value={65} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('65');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-fair)');
    expect(valueText).toHaveStyle('color: var(--score-fair)');
  });

  it('applies good (blue) color for scores between 75 and 89', () => {
    const { container } = render(<ProgressCircle value={80} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('80');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-good)');
    expect(valueText).toHaveStyle('color: var(--score-good)');
  });

  it('applies high (green) color for scores 90 and above', () => {
    const { container } = render(<ProgressCircle value={95} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('95');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-high)');
    expect(valueText).toHaveStyle('color: var(--score-high)');
  });

  it('handles edge cases for color thresholds', () => {
    const { container, rerender } = render(
      <ProgressCircle value={60} size={120} strokeWidth={10} />
    );
    let circles = container.querySelectorAll('circle');
    let progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-fair)');
    
    rerender(<ProgressCircle value={75} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-good)');
    
    rerender(<ProgressCircle value={90} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-high)');
    
    rerender(<ProgressCircle value={100} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-high)');
    
    rerender(<ProgressCircle value={0} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--score-low)');
  });

  it('has a proper rotation transform on SVG', () => {
    const { container } = render(<ProgressCircle value={50} size={120} strokeWidth={10} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle('transform: rotate(-90deg)');
  });

  it('applies stroke-linecap round to progress circle', () => {
    const { container } = render(<ProgressCircle value={50} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-linecap', 'round');
  });

  it('applies transition style to progress circle', () => {
    const { container } = render(<ProgressCircle value={50} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveStyle('transition: stroke-dashoffset 1s ease-in-out');
  });

  it('renders with 0 value correctly', () => {
    const { container } = render(<ProgressCircle value={0} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const circumference = ((120 - 10) / 2) * 2 * Math.PI;
    
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', String(circumference));
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with 100 value correctly', () => {
    const { container } = render(<ProgressCircle value={100} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('uses rgba color for background circle track', () => {
    const { container } = render(<ProgressCircle value={50} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const backgroundCircle = circles[0];
    expect(backgroundCircle).toHaveAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
  });
});
