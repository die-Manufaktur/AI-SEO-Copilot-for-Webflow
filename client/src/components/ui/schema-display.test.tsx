import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaDisplay } from './schema-display';
import { SchemaRecommendation } from '../../../../shared/types';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock clipboard API as a spy - more comprehensive to prevent Selection Range errors
const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockReadText = vi.fn().mockResolvedValue('');
const mockWrite = vi.fn().mockResolvedValue(undefined);
const mockRead = vi.fn().mockResolvedValue([]);

Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
    readText: mockReadText,
    write: mockWrite,
    read: mockRead,
  },
});

// Mock the toast hook with a spy
const mockToast = vi.fn();
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

const mockRequiredSchema: SchemaRecommendation = {
  name: 'WebSite',
  description: 'Helps Google understand your site structure',
  documentationUrl: 'https://developers.google.com/search/docs/appearance/site-names',
  googleSupport: 'yes',
  jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{Your Website Name}",
  "url": "{Your Website URL}"
}`,
  isRequired: true
};

const mockOptionalSchema: SchemaRecommendation = {
  name: 'FAQPage',
  description: 'Add frequently asked questions',
  documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
  googleSupport: 'yes',
  jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{Question}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{Answer}"
    }
  }]
}`,
  isRequired: false
};

const mockPartialSupportSchema: SchemaRecommendation = {
  name: 'ItemList',
  description: 'Helps structure category listings',
  documentationUrl: 'https://schema.org/ItemList',
  googleSupport: 'partial',
  googleSupportNote: 'Used in carousel with rich-result items',
  jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "{Category Name}"
}`,
  isRequired: true
};

// Test wrapper with context providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

describe('SchemaDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    mockToast.mockClear();
  });

  it('should render nothing when no schemas provided', () => {
    const { container } = render(
      <TestWrapper>
        <SchemaDisplay pageType="Homepage" schemas={[]} />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render collapsed by default', () => {
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    expect(screen.getByText('Schema Recommendations')).toBeInTheDocument();
    expect(screen.getByText('(1 available)')).toBeInTheDocument();
    
    // Schema content should not be visible initially
    expect(screen.queryByText('WebSite')).not.toBeInTheDocument();
  });

  it('should expand when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('WebSite')).toBeInTheDocument();
    expect(screen.getByText('Helps Google understand your site structure')).toBeInTheDocument();
  });

  it('should display Google support badges correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Category page" 
        schemas={[mockPartialSupportSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Partial Google Support')).toBeInTheDocument();
  });

  it('should show required schemas section', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Required Schemas')).toBeInTheDocument();
    expect(screen.getByText('WebSite')).toBeInTheDocument();
  });

  it('should show optional schemas section with checkboxes', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockRequiredSchema, mockOptionalSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Optional Schemas')).toBeInTheDocument();
    expect(screen.getByText('FAQPage')).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should toggle optional schema visibility when checkbox is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockOptionalSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    // Initially, code should not be visible
    expect(screen.queryByText('JSON-LD Code:')).not.toBeInTheDocument();
    
    // Check the checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // Now code should be visible
    expect(screen.getByText('JSON-LD Code:')).toBeInTheDocument();
  });



  it('should display documentation links', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    const docLink = screen.getByRole('link', { name: /view documentation/i });
    expect(docLink).toHaveAttribute('href', mockRequiredSchema.documentationUrl);
    expect(docLink).toHaveAttribute('target', '_blank');
    expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should display Google support notes when present', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Category page" 
        schemas={[mockPartialSupportSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Note: Used in carousel with rich-result items')).toBeInTheDocument();
  });

  it('should display page type context', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    // Use a function matcher to handle text broken across elements
    expect(screen.getByText((content, node) => {
      const hasText = (node: Element | null) => node?.textContent === 'Based on your selected page type (Homepage), here are the recommended schema markups:';
      const nodeHasText = hasText(node);
      const childrenDontHaveText = Array.from(node?.children || []).every(
        (child) => !hasText(child)
      );
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();
  });

  it('should display helpful tip', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText(/Copy the JSON-LD code and paste it/)).toBeInTheDocument();
    expect(screen.getByText(/Replace placeholder values/)).toBeInTheDocument();
  });

  it('should handle multiple schemas correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockRequiredSchema, mockOptionalSchema]} 
      />
      </TestWrapper>
    );

    expect(screen.getByText('(2 available)')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Schema Recommendations').closest('[data-state]') || screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Required Schemas')).toBeInTheDocument();
    expect(screen.getByText('Optional Schemas')).toBeInTheDocument();
    expect(screen.getByText('WebSite')).toBeInTheDocument();
    expect(screen.getByText('FAQPage')).toBeInTheDocument();
  });
});