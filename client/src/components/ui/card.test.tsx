import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

// Mock the cn utility function
vi.mock('../../lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default classes', () => {
      render(<Card data-testid="card">Card content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-[var(--radius-card)]', 'border', 'border-color', 'bg-card-bg', 'text-text-primary', 'shadow-xs');
    });

    it('should accept additional className', () => {
      render(<Card data-testid="card" className="custom-class">Card content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('should forward props to div element', () => {
      render(<Card data-testid="card" id="test-id" role="region">Card content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-id');
      expect(card).toHaveAttribute('role', 'region');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render children correctly', () => {
      render(<Card>Test card content</Card>);
      
      expect(screen.getByText('Test card content')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render with default classes', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);
      
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'px-5', 'pt-8');
    });

    it('should accept additional className', () => {
      render(<CardHeader data-testid="card-header" className="custom-header">Header content</CardHeader>);
      
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('custom-header');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header content</CardHeader>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 element with default classes', () => {
      render(<CardTitle>Test Title</CardTitle>);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-h2', 'text-text-primary');
    });

    it('should accept additional className', () => {
      render(<CardTitle className="custom-title">Test Title</CardTitle>);
      
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardTitle ref={ref}>Test Title</CardTitle>);
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it('should render text content correctly', () => {
      render(<CardTitle>My Card Title</CardTitle>);
      
      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('should render as p element with default classes', () => {
      render(<CardDescription>Test description</CardDescription>);

      const description = screen.getByText('Test description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-body-16', 'text-text-secondary');
    });

    it('should accept additional className', () => {
      render(<CardDescription className="custom-desc">Test description</CardDescription>);
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('custom-desc');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Test description</CardDescription>);
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('should render with default classes', () => {
      render(<CardContent data-testid="card-content">Content here</CardContent>);
      
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('px-5', 'pb-5');
    });

    it('should accept additional className', () => {
      render(<CardContent data-testid="card-content" className="custom-content">Content here</CardContent>);
      
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('custom-content');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content here</CardContent>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render children correctly', () => {
      render(<CardContent>Card main content</CardContent>);
      
      expect(screen.getByText('Card main content')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('should render with default classes', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>);
      
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should accept additional className', () => {
      render(<CardFooter data-testid="card-footer" className="custom-footer">Footer content</CardFooter>);
      
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer content</CardFooter>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render children correctly', () => {
      render(<CardFooter>Footer actions</CardFooter>);
      
      expect(screen.getByText('Footer actions')).toBeInTheDocument();
    });
  });

  describe('Full Card Composition', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            Main card content goes here
          </CardContent>
          <CardFooter>
            Footer actions
          </CardFooter>
        </Card>
      );
      
      // Check that all parts are rendered
      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main card content goes here')).toBeInTheDocument();
      expect(screen.getByText('Footer actions')).toBeInTheDocument();
    });

    it('should maintain proper hierarchy and structure', () => {
      render(
        <Card data-testid="structured-card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('structured-card');
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');
      
      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card 
          data-testid="accessible-card" 
          role="region" 
          aria-labelledby="card-title"
        >
          <CardTitle id="card-title">Accessible Title</CardTitle>
        </Card>
      );
      
      const card = screen.getByTestId('accessible-card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      
      const title = screen.getByRole('heading');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('should maintain semantic heading structure', () => {
      render(<CardTitle>Test Heading</CardTitle>);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });
});