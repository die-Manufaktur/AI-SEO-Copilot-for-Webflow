import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('should render label text correctly', () => {
    render(<Label>Test Label</Label>);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should apply default styling classes', () => {
    render(<Label>Styled Label</Label>);
    
    const label = screen.getByText('Styled Label');
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none');
  });

  it('should merge custom className with default styles', () => {
    render(<Label className="custom-class">Custom Label</Label>);
    
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none', 'custom-class');
  });

  it('should pass through HTML attributes', () => {
    render(<Label htmlFor="test-input" id="test-label">Form Label</Label>);
    
    const label = screen.getByText('Form Label');
    expect(label).toHaveAttribute('for', 'test-input');
    expect(label).toHaveAttribute('id', 'test-label');
  });

  it('should handle ref forwarding', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref Label</Label>);
    
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current?.textContent).toBe('Ref Label');
  });

  it('should render as label element', () => {
    render(<Label>Label Element</Label>);
    
    const label = screen.getByText('Label Element');
    expect(label.tagName).toBe('LABEL');
  });

  it('should handle empty content', () => {
    render(<Label />);
    
    const label = document.querySelector('label');
    expect(label).toBeInTheDocument();
    expect(label?.textContent).toBe('');
  });

  it('should support data attributes', () => {
    render(<Label data-testid="custom-label" data-value="test">Data Label</Label>);
    
    const label = screen.getByTestId('custom-label');
    expect(label).toHaveAttribute('data-value', 'test');
  });

  it('should handle disabled state styling', () => {
    render(
      <div>
        <Label htmlFor="disabled-input">Disabled Label</Label>
        <input id="disabled-input" disabled />
      </div>
    );
    
    const label = screen.getByText('Disabled Label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('should support aria attributes', () => {
    render(
      <Label aria-label="Accessible Label" aria-describedby="help-text">
        Form Field
      </Label>
    );
    
    const label = screen.getByText('Form Field');
    expect(label).toHaveAttribute('aria-label', 'Accessible Label');
    expect(label).toHaveAttribute('aria-describedby', 'help-text');
  });
});