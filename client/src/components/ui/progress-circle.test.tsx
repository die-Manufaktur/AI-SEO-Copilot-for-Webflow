import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressCircle } from './progress-circle';

describe('ProgressCircle', () => {
  it('renders with default props', () => {
    // Use container from the render result
    const { container } = render(<ProgressCircle value={75} size={120} strokeWidth={10} />);
    
    // Check that the component renders using container.querySelector
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check that the SVG has correct dimensions
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
    
    // Check that the circles are present
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // Background circle and progress circle
    
    // Check that the text elements are present
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    const { container } = render(<ProgressCircle value={80} size={200} strokeWidth={15} scoreText="Performance" />);
    
    // Check SVG dimensions
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
    
    // Check stroke width
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke-width', '15');
    expect(circles[1]).toHaveAttribute('stroke-width', '15');
    
    // Check custom score text
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
    
    // Check radius attribute
    expect(progressCircle).toHaveAttribute('r', String(radius));
    
    // Check stroke-dasharray (should equal circumference)
    expect(progressCircle).toHaveAttribute('stroke-dasharray', String(circumference));
    
    // Check stroke-dashoffset (should be circumference - (value / 100) * circumference)
    const expectedOffset = circumference - (50 / 100) * circumference;
    const actualOffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0');
    expect(actualOffset).toBeCloseTo(expectedOffset, 2);
  });

  it('applies red color for scores below 50', () => {
    const { container } = render(<ProgressCircle value={40} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('40');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--redText)');
    expect(valueText).toHaveStyle('color: var(--redText)');
  });

  it('applies yellow color for scores between 50 and 69', () => {
    const { container } = render(<ProgressCircle value={55} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('55');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--yellowText)');
    expect(valueText).toHaveStyle('color: var(--yellowText)');
  });

  it('applies blue color for scores between 70 and 89', () => {
    const { container } = render(<ProgressCircle value={75} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('75');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--blueText)');
    expect(valueText).toHaveStyle('color: var(--blueText)');
  });

  it('applies green color for scores 90 and above', () => {
    const { container } = render(<ProgressCircle value={95} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const valueText = screen.getByText('95');
    
    expect(progressCircle).toHaveAttribute('stroke', 'var(--greenText)');
    expect(valueText).toHaveStyle('color: var(--greenText)');
  });

  it('handles edge cases for color thresholds', () => {
    // Test the exact threshold values
    
    // 50 should be yellow
    const { container, rerender } = render(
      <ProgressCircle value={50} size={120} strokeWidth={10} />
    );
    let circles = container.querySelectorAll('circle');
    let progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--yellowText)');
    
    // 70 should be blue
    rerender(<ProgressCircle value={70} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--blueText)');
    
    // 90 should be green
    rerender(<ProgressCircle value={90} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--greenText)');
    
    // 100 should be green
    rerender(<ProgressCircle value={100} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--greenText)');
    
    // 0 should be red
    rerender(<ProgressCircle value={0} size={120} strokeWidth={10} />);
    circles = container.querySelectorAll('circle');
    progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--redText)');
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
    
    // With 0%, dashoffset should equal the full circumference
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', String(circumference));
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with 100 value correctly', () => {
    const { container } = render(<ProgressCircle value={100} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    
    // With 100%, dashoffset should be 0
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('uses reduced opacity for background circle', () => {
    const { container } = render(<ProgressCircle value={50} size={120} strokeWidth={10} />);
    
    const circles = container.querySelectorAll('circle');
    const backgroundCircle = circles[0];
    expect(backgroundCircle).toHaveAttribute('stroke-opacity', '0.1');
  });
});