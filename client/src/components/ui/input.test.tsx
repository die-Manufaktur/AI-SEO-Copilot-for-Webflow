import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders correctly with default props', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('w-full', 'rounded-[0.625rem]');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('accepts different input types', () => {
    render(<Input type="search" />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
  });

  it('handles user input correctly', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    await userEvent.type(input, 'test input');
    expect(input).toHaveValue('test input');
  });

  it('passes additional props to the input element', () => {
    render(<Input placeholder="Enter text" maxLength={10} required />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('maxlength', '10');
    expect(input).toHaveAttribute('required');
  });

  it('forwards the ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveClass('disabled:opacity-50');
  });

  it('handles onChange events', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});