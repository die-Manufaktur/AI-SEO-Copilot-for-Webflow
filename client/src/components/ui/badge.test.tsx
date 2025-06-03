import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Default Badge');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary', 'text-secondary-foreground');
    
    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive', 'text-destructive-foreground');
    
    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('text-foreground');
    expect(screen.getByText('Outline')).not.toHaveClass('border-transparent');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    expect(screen.getByText('Custom Badge')).toHaveClass('custom-class');
  });

  it('forwards all HTML attributes', () => {
    render(<Badge data-custom="value" role="status">Accessible Badge</Badge>);
    const badge = screen.getByText('Accessible Badge');
    expect(badge).toHaveAttribute('data-custom', 'value');
    expect(badge).toHaveAttribute('role', 'status');
  });

  it('renders with complex content', () => {
    render(
      <Badge>
        <span>Icon</span>
        Priority: High
      </Badge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText(/Priority: High/)).toBeInTheDocument();
  });
});