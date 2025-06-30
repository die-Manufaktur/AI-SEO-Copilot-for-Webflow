import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageSizeDisplay } from './ImageSizeDisplay';

// Mock the cn utility
vi.mock('../lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('ImageSizeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockImages = [
    {
      url: 'https://example.com/image1.jpg',
      name: 'image1.jpg',
      shortName: 'image1.jpg',
      size: 150,
      mimeType: 'image/jpeg',
      alt: 'Test image 1',
      source: 'page' as const,
      isOptimized: true,
    },
    {
      url: 'https://example.com/image2.png',
      name: 'image2.png',
      shortName: 'image2.png',
      size: 2500,
      mimeType: 'image/png',
      alt: '',
      source: 'collection' as const,
      isOptimized: false,
    },
  ];

  it('renders without crashing with valid images', () => {
    render(<ImageSizeDisplay images={mockImages} />);
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByText('image2.png')).toBeInTheDocument();
  });

  it('returns null when images array is empty', () => {
    const { container } = render(<ImageSizeDisplay images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when images is null or undefined', () => {
    const { container } = render(<ImageSizeDisplay images={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className correctly', () => {
    const { container } = render(<ImageSizeDisplay images={mockImages} className="custom-class" />);
    // Get the root div element
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('mt-2', 'space-y-2', 'custom-class');
  });

  it('displays collection badge for collection images', () => {
    render(<ImageSizeDisplay images={mockImages} />);
    expect(screen.getByText('Collection')).toBeInTheDocument();
  });

  it('applies collection border styling for collection images', () => {
    render(<ImageSizeDisplay images={mockImages} />);
    // Find the collection image item by finding the element that contains both the image name and collection badge
    const collectionBadge = screen.getByText('Collection');
    const collectionItem = collectionBadge.closest('div.flex.items-center.gap-2');
    expect(collectionItem).toHaveClass('border-l-2', 'border-yellowText');
  });

  it('does not show collection badge for page images', () => {
    const pageImages = [mockImages[0]]; // Only the page image
    render(<ImageSizeDisplay images={pageImages} />);
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();
  });

  describe('formatFileSize functionality', () => {
    it('displays file size in KB for small files', () => {
      const smallImage = [{
        ...mockImages[0],
        size: 150,
      }];
      render(<ImageSizeDisplay images={smallImage} showFileSize={true} showMimeType={false} />);
      expect(screen.getByText('150.0 KB')).toBeInTheDocument();
    });

    it('displays file size in MB for large files', () => {
      const largeImage = [{
        ...mockImages[0],
        size: 2500,
      }];
      render(<ImageSizeDisplay images={largeImage} showFileSize={true} showMimeType={false} />);
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });

    it('displays "Unknown" for files without size', () => {
      const noSizeImage = [{
        ...mockImages[0],
        size: undefined,
      }];
      render(<ImageSizeDisplay images={noSizeImage} showFileSize={true} showMimeType={false} />);
      // formatFileSize(0) returns "Unknown" when size is undefined/0
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('displays "Unknown" for zero size files', () => {
      const zeroSizeImage = [{
        ...mockImages[0],
        size: 0,
      }];
      render(<ImageSizeDisplay images={zeroSizeImage} showFileSize={true} showMimeType={false} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('optimization status styling', () => {
    it('applies green text for optimized images', () => {
      const optimizedImage = [{
        ...mockImages[0],
        size: 150,
        isOptimized: true,
      }];
      render(<ImageSizeDisplay images={optimizedImage} showFileSize={true} showMimeType={false} />);
      const sizeText = screen.getByText('150.0 KB');
      expect(sizeText).toHaveClass('text-greenText');
    });

    it('applies red text for unoptimized images', () => {
      const unoptimizedImage = [{
        ...mockImages[0],
        size: 150,
        isOptimized: false,
      }];
      render(<ImageSizeDisplay images={unoptimizedImage} showFileSize={true} showMimeType={false} />);
      const sizeText = screen.getByText('150.0 KB');
      expect(sizeText).toHaveClass('text-redText');
    });
  });

  describe('prop-based display options', () => {
    it('shows mime type when showMimeType is true (default)', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      expect(screen.getByText('image/jpeg')).toBeInTheDocument();
      expect(screen.getByText('image/png')).toBeInTheDocument();
    });

    it('hides mime type when showMimeType is false', () => {
      render(<ImageSizeDisplay images={mockImages} showMimeType={false} />);
      expect(screen.queryByText('image/jpeg')).not.toBeInTheDocument();
      expect(screen.queryByText('image/png')).not.toBeInTheDocument();
    });

    it('shows file size when showFileSize is true and showMimeType is false', () => {
      render(<ImageSizeDisplay images={mockImages} showFileSize={true} showMimeType={false} />);
      expect(screen.getByText('150.0 KB')).toBeInTheDocument();
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });

    it('hides file size when showFileSize is false', () => {
      render(<ImageSizeDisplay images={mockImages} showFileSize={false} showMimeType={false} />);
      expect(screen.queryByText('150.0 KB')).not.toBeInTheDocument();
      expect(screen.queryByText('2.5 MB')).not.toBeInTheDocument();
    });

    it('shows alt text when showAltText is true', () => {
      render(<ImageSizeDisplay images={mockImages} showAltText={true} />);
      expect(screen.getByText('"Test image 1"')).toBeInTheDocument();
      expect(screen.getByText('No alt text')).toBeInTheDocument();
    });

    it('hides alt text when showAltText is false (default)', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      expect(screen.queryByText('"Test image 1"')).not.toBeInTheDocument();
      expect(screen.queryByText('No alt text')).not.toBeInTheDocument();
    });
  });

  describe('image handling', () => {
    it('sets correct image attributes', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      // Use querySelector since images with empty alt are treated as presentation role
      const images = document.querySelectorAll('img');
      
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', '');
      expect(images[0]).toHaveAttribute('loading', 'lazy');
      expect(images[0]).toHaveClass('w-full', 'h-full', 'object-cover');
    });

    it('handles image load errors with fallback', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      // Use querySelector since images with empty alt are treated as presentation role
      const image = document.querySelector('img');
      
      // Simulate image load error
      fireEvent.error(image!);
      
      // Check that fallback image is set
      expect(image).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml;base64,'));
    });

    it('displays image title attribute with filename', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      const titleElement = screen.getByText('image1.jpg');
      expect(titleElement).toHaveAttribute('title', 'image1.jpg');
    });

    it('applies truncate class to image names', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      const nameElement = screen.getByText('image1.jpg');
      expect(nameElement).toHaveClass('text-sm', 'font-medium', 'truncate');
    });
  });

  describe('layout and styling', () => {
    it('applies correct grid layout classes', () => {
      const { container } = render(<ImageSizeDisplay images={mockImages} />);
      // Get the grid container specifically
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-2', 'sm:grid-cols-2');
    });

    it('applies correct item styling', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      // Get the parent div that contains the image item (not the inner flex div)
      const imageNameElement = screen.getByText('image1.jpg');
      const itemContainer = imageNameElement.closest('.flex.items-center.gap-2');
      expect(itemContainer).toHaveClass('flex', 'items-center', 'gap-2', 'bg-background3', 'rounded-md', 'p-2', 'overflow-hidden');
    });

    it('applies correct image container styling', () => {
      render(<ImageSizeDisplay images={mockImages} />);
      // Use querySelector since images with empty alt are treated as presentation role
      const imageContainer = document.querySelector('img')?.parentElement;
      expect(imageContainer).toHaveClass('flex-shrink-0', 'w-10', 'h-10', 'overflow-hidden', 'rounded-md', 'bg-background2');
    });
  });

  describe('edge cases', () => {
    it('handles images without optional properties', () => {
      const minimalImage = [{
        url: 'https://example.com/minimal.jpg',
        name: 'minimal.jpg',
        shortName: 'minimal.jpg',
      }];
      
      render(<ImageSizeDisplay images={minimalImage} showAltText={true} />);
      
      expect(screen.getByText('minimal.jpg')).toBeInTheDocument();
      expect(screen.getByText('No alt text')).toBeInTheDocument();
      expect(screen.queryByText('Collection')).not.toBeInTheDocument();
    });

    it('handles empty mime type', () => {
      const noMimeImage = [{
        ...mockImages[0],
        mimeType: '',
      }];
      
      render(<ImageSizeDisplay images={noMimeImage} showMimeType={true} />);
      
      // Should render but with empty mime type text
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    });

    it('handles undefined mime type', () => {
      const undefinedMimeImage = [{
        ...mockImages[0],
        mimeType: undefined,
      }];
      
      render(<ImageSizeDisplay images={undefinedMimeImage} showMimeType={true} />);
      
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    });
  });
});