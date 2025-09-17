import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('should render skeleton component', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should apply default styling classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('should merge custom className with default styles', () => {
    render(<Skeleton className="custom-skeleton h-4 w-32" data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted', 'custom-skeleton', 'h-4', 'w-32');
  });

  it('should pass through HTML attributes', () => {
    render(
      <Skeleton 
        id="loading-skeleton"
        role="presentation"
        aria-label="Loading content"
        data-testid="skeleton"
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'loading-skeleton');
    expect(skeleton).toHaveAttribute('role', 'presentation');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('should render as div element', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.tagName).toBe('DIV');
  });

  it('should support different sizes through className', () => {
    const { rerender } = render(<Skeleton className="h-4 w-full" data-testid="skeleton" />);
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4', 'w-full');

    rerender(<Skeleton className="h-8 w-24" data-testid="skeleton" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-8', 'w-24');
  });

  it('should support different shapes through className', () => {
    const { rerender } = render(<Skeleton className="rounded-full" data-testid="skeleton" />);
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');

    rerender(<Skeleton className="rounded-none" data-testid="skeleton" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-none');
  });

  it('should work with style prop', () => {
    render(
      <Skeleton 
        style={{ width: '200px', height: '16px' }}
        data-testid="skeleton"
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '16px' });
  });

  it('should support onClick handlers', () => {
    const handleClick = vi.fn();
    render(<Skeleton onClick={handleClick} data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    skeleton.click();
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should work as loading placeholder for text', () => {
    render(
      <div>
        <Skeleton className="h-4 w-[250px] mb-2" data-testid="text-skeleton-1" />
        <Skeleton className="h-4 w-[200px]" data-testid="text-skeleton-2" />
      </div>
    );
    
    expect(screen.getByTestId('text-skeleton-1')).toBeInTheDocument();
    expect(screen.getByTestId('text-skeleton-2')).toBeInTheDocument();
  });

  it('should work as loading placeholder for images', () => {
    render(
      <Skeleton className="h-[125px] w-[250px] rounded-xl" data-testid="image-skeleton" />
    );
    
    const skeleton = screen.getByTestId('image-skeleton');
    expect(skeleton).toHaveClass('h-[125px]', 'w-[250px]', 'rounded-xl');
  });

  it('should work as loading placeholder for cards', () => {
    render(
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" data-testid="avatar-skeleton" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" data-testid="title-skeleton" />
          <Skeleton className="h-4 w-[200px]" data-testid="subtitle-skeleton" />
        </div>
      </div>
    );
    
    expect(screen.getByTestId('avatar-skeleton')).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(screen.getByTestId('title-skeleton')).toHaveClass('h-4', 'w-[250px]');
    expect(screen.getByTestId('subtitle-skeleton')).toHaveClass('h-4', 'w-[200px]');
  });

  it('should maintain animation classes regardless of custom styles', () => {
    render(<Skeleton className="bg-red-500 rounded-none" data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse'); // Should maintain animation
    expect(skeleton).toHaveClass('bg-red-500', 'rounded-none'); // Should apply custom styles
  });

  it('should support accessibility attributes', () => {
    render(
      <Skeleton 
        aria-hidden="true"
        aria-label="Loading skeleton"
        data-testid="skeleton"
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading skeleton');
  });

  it('should work with children content (though typically empty)', () => {
    render(
      <Skeleton data-testid="skeleton">
        <span>Hidden content</span>
      </Skeleton>
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toContainElement(screen.getByText('Hidden content'));
  });
});