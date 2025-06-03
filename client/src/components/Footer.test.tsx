import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Footer from './Footer';

// Mock the SVG imports
vi.mock('../assets/icons/IconoirBookmarkBook.svg', () => ({
  default: 'mocked-book-icon.svg'
}));
vi.mock('../assets/icons/IconoirChatBubbleCheck.svg', () => ({
  default: 'mocked-chat-icon.svg'
}));
vi.mock('../assets/icons/IconoirGithub.svg', () => ({
  default: 'mocked-github-icon.svg'
}));
vi.mock('../assets/icons/IconoirMail.svg', () => ({
  default: 'mocked-mail-icon.svg'
}));

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all footer links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'View documentation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submit feature requests' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report a bug on GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact us via email' })).toBeInTheDocument();
  });

  it('has correct href attributes for all links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'View documentation' }))
      .toHaveAttribute('href', 'https://ai-seo-copilot.gitbook.io/ai-seo-copilot/');
    expect(screen.getByRole('link', { name: 'Submit feature requests' }))
      .toHaveAttribute('href', 'https://aiseocopilot.featurebase.app/');
    expect(screen.getByRole('link', { name: 'Report a bug on GitHub' }))
      .toHaveAttribute('href', 'https://github.com/PMDevSolutions/seo-copilot/issues');
    expect(screen.getByRole('link', { name: 'Contact us via email' }))
      .toHaveAttribute('href', 'mailto:sofianbettayeb@gmail.com');
  });

  it('opens links in new tab with security attributes', () => {
    render(<Footer />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('displays correct text for each link', () => {
    render(<Footer />);
    
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Feature requests')).toBeInTheDocument();
    expect(screen.getByText('Report a bug')).toBeInTheDocument();
    expect(screen.getByText('Contact us')).toBeInTheDocument();
  });

  it('renders icons with proper accessibility attributes', () => {
    const { container } = render(<Footer />);
    
    // Since icons have aria-hidden="true", they're not accessible via role
    // Use querySelector to find all img elements directly
    const icons = container.querySelectorAll('img');
    expect(icons).toHaveLength(4);
    
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('alt', '');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });
  });

  it('renders correct icon sources', () => {
    const { container } = render(<Footer />);
    
    const icons = container.querySelectorAll('img');
    
    expect(icons[0]).toHaveAttribute('src', 'mocked-book-icon.svg');
    expect(icons[1]).toHaveAttribute('src', 'mocked-chat-icon.svg');
    expect(icons[2]).toHaveAttribute('src', 'mocked-github-icon.svg');
    expect(icons[3]).toHaveAttribute('src', 'mocked-mail-icon.svg');
  });

  it('has proper footer semantic structure', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
  });

  it('applies correct CSS classes', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('border', 'rounded-lg');
  });
});