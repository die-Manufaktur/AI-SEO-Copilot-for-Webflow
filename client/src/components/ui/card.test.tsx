import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveTextContent('Card Content');
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-background2');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="card" />);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Card ref={ref} data-testid="card" />);
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('renders with default props', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveTextContent('Header Content');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders with default props', () => {
      render(<CardTitle data-testid="title">Card Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveTextContent('Card Title');
      expect(title).toHaveClass('text-2xl', 'font-semibold');
    });

    it('renders as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('renders with default props', () => {
      render(<CardDescription data-testid="desc">Card Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveTextContent('Card Description');
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with default props', () => {
      render(<CardContent data-testid="content">Card Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveTextContent('Card Content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with default props', () => {
      render(<CardFooter data-testid="footer">Card Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveTextContent('Card Footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });
  });

  it('composes a complete card with all subcomponents', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">
          Main content goes here
        </CardContent>
        <CardFooter data-testid="footer">
          Footer content
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Card Title');
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Main content goes here');
    expect(screen.getByTestId('footer')).toHaveTextContent('Footer content');
  });
});