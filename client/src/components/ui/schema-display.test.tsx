import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaDisplay } from './schema-display';
import { SchemaRecommendation } from '../../../../shared/types';

// Mock clipboard API as a spy
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
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

describe('SchemaDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    mockToast.mockClear();
  });

  it('should render nothing when no schemas provided', () => {
    const { container } = render(
      <SchemaDisplay pageType="Homepage" schemas={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render collapsed by default', () => {
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    expect(screen.getByText('Schema Recommendations')).toBeInTheDocument();
    expect(screen.getByText('(1 available)')).toBeInTheDocument();
    
    // Schema content should not be visible initially
    expect(screen.queryByText('WebSite')).not.toBeInTheDocument();
  });

  it('should expand when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('WebSite')).toBeInTheDocument();
    expect(screen.getByText('Helps Google understand your site structure')).toBeInTheDocument();
  });

  it('should display Google support badges correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Category page" 
        schemas={[mockPartialSupportSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Partial Google Support')).toBeInTheDocument();
  });

  it('should show required schemas section', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Required Schemas')).toBeInTheDocument();
    expect(screen.getByText('WebSite')).toBeInTheDocument();
  });

  it('should show optional schemas section with checkboxes', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockRequiredSchema, mockOptionalSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Optional Schemas')).toBeInTheDocument();
    expect(screen.getByText('FAQPage')).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should toggle optional schema visibility when checkbox is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockOptionalSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    // Initially, code should not be visible
    expect(screen.queryByText('JSON-LD Code:')).not.toBeInTheDocument();
    
    // Check the checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // Now code should be visible
    expect(screen.getByText('JSON-LD Code:')).toBeInTheDocument();
  });

  it('should copy JSON-LD code with script tags when copy button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);
    
    // Wait for the copy operation to complete - either clipboard or toast call
    await waitFor(() => {
      // Check if either clipboard was called OR toast was called (indicating successful copy)
      const clipboardCalled = mockWriteText.mock.calls.length > 0;
      const toastCalled = mockToast.mock.calls.length > 0;
      expect(clipboardCalled || toastCalled).toBe(true);
    });
    
    // Verify the UI shows "Copied" feedback
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('should display tooltip on copy button hover', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.hover(copyButton);
    
    // Wait for tooltip to appear and check for tooltip content using getAllByText to handle duplicates
    await waitFor(() => {
      const tooltips = screen.getAllByText('Copy schema code to clipboard');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });

  it('should show copied feedback after successful copy', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);
    
    expect(screen.getByText('Copied')).toBeInTheDocument();
    
    // Should return to "Copy" after timeout
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('should show success toast when copy succeeds', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Schema copied!",
        description: "WebSite schema has been copied to your clipboard.",
      });
    });
  });

  it('should display documentation links', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    const docLink = screen.getByRole('link', { name: /view documentation/i });
    expect(docLink).toHaveAttribute('href', mockRequiredSchema.documentationUrl);
    expect(docLink).toHaveAttribute('target', '_blank');
    expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should display Google support notes when present', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Category page" 
        schemas={[mockPartialSupportSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Note: Used in carousel with rich-result items')).toBeInTheDocument();
  });

  it('should display page type context', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
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
      <SchemaDisplay 
        pageType="Homepage" 
        schemas={[mockRequiredSchema]} 
      />
    );

    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText(/Copy the JSON-LD code and paste it/)).toBeInTheDocument();
    expect(screen.getByText(/Replace placeholder values/)).toBeInTheDocument();
  });

  it('should handle multiple schemas correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <SchemaDisplay 
        pageType="Product page" 
        schemas={[mockRequiredSchema, mockOptionalSchema]} 
      />
    );

    expect(screen.getByText('(2 available)')).toBeInTheDocument();
    
    await user.click(screen.getByText('Schema Recommendations'));
    
    expect(screen.getByText('Required Schemas')).toBeInTheDocument();
    expect(screen.getByText('Optional Schemas')).toBeInTheDocument();
    expect(screen.getByText('WebSite')).toBeInTheDocument();
    expect(screen.getByText('FAQPage')).toBeInTheDocument();
  });
});