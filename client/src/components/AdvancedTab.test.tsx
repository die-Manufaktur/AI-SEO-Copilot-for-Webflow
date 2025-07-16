import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the advanced options storage
vi.mock('../utils/advancedOptionsStorage', () => ({
  saveAdvancedOptionsForPage: vi.fn(),
  loadAdvancedOptionsForPage: vi.fn(() => ({ pageType: '', secondaryKeywords: '' })),
  clearAllAdvancedOptions: vi.fn(),
  getAllStoredAdvancedOptions: vi.fn(() => ({}))
}));

// Mock the keyword storage
vi.mock('../utils/keywordStorage', () => ({
  generatePageId: vi.fn(() => 'test-page-id'),
  saveKeywordsForPage: vi.fn(),
  loadKeywordsForPage: vi.fn(() => '')
}));

// Mock the API
vi.mock('../lib/api', () => ({
  analyzeSEO: vi.fn(() => Promise.resolve({
    keyphrase: 'test',
    url: 'https://example.com',
    isHomePage: false,
    score: 85,
    totalChecks: 10,
    passedChecks: 8,
    failedChecks: 2,
    checks: [
      {
        title: 'Keyphrase in Title',
        description: 'Test description',
        passed: false,
        priority: 'high',
        recommendation: 'Test recommendation'
      }
    ]
  }))
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock react-hook-form
const mockForm = {
  control: {},
  handleSubmit: vi.fn((fn) => (e: any) => {
    e.preventDefault();
    fn({ keyphrase: 'test keyphrase' });
  }),
  setValue: vi.fn(),
  watch: vi.fn(() => 'test keyphrase')
};

vi.mock('react-hook-form', () => ({
  useForm: () => mockForm,
  FormProvider: ({ children }: any) => children,
  useFormContext: () => mockForm
}));

// Mock other dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

// Create a test component that includes the Advanced Tab
const TestAdvancedTab = () => {
  const [advancedOptionsEnabled, setAdvancedOptionsEnabled] = React.useState(false);
  const [pageType, setPageType] = React.useState('');
  const [secondaryKeywords, setSecondaryKeywords] = React.useState('');
  const [advancedOptionsSaveStatus, setAdvancedOptionsSaveStatus] = React.useState<'saved' | 'saving' | 'none'>('none');

  const PAGE_TYPES = [
    'Homepage',
    'Category page',
    'Product page',
    'Blog post',
    'Landing page',
    'Contact page',
    'About page',
    'FAQ page',
    'Service page',
    'Portfolio/project page',
    'Testimonial page',
    'Location page',
    'Legal page',
    'Event page',
    'Press/News page',
    'Job/career page',
    'Thank you page',
    'Pillar page',
    'Cluster page'
  ];

  return (
    <div>
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Advanced Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Add secondary keywords and specify page type for more targeted SEO analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              data-testid="advanced-toggle"
              onClick={() => {
                setAdvancedOptionsEnabled(!advancedOptionsEnabled);
                if (advancedOptionsEnabled) {
                  setPageType('');
                  setSecondaryKeywords('');
                  setAdvancedOptionsSaveStatus('none');
                }
              }}
            >
              {advancedOptionsEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {advancedOptionsEnabled && (
          <div className="space-y-4" data-testid="advanced-options-container">
            {/* Page Type Dropdown */}
            <div className="space-y-2">
              <label htmlFor="page-type-select" className="text-sm font-medium">Page Type</label>
              <select
                id="page-type-select"
                data-testid="page-type-select"
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
              >
                <option value="">Select a page type</option>
                {PAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Keywords Textarea */}
            <div className="space-y-2">
              <label htmlFor="secondary-keywords-textarea" className="text-sm font-medium">Secondary Keywords</label>
              <textarea
                id="secondary-keywords-textarea"
                data-testid="secondary-keywords-textarea"
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                placeholder="Enter comma-separated secondary keywords (e.g., affordable, budget-friendly, cost-effective)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These keywords will be checked if the primary keyword is not found
              </p>
            </div>

            {/* Advanced Options Save Status */}
            {(pageType || secondaryKeywords || advancedOptionsSaveStatus === 'saving') && (
              <div className="flex justify-end">
                <span 
                  data-testid="save-status"
                  className="text-xs font-medium"
                >
                  {advancedOptionsSaveStatus === 'saved' ? 'Advanced options saved for this page' :
                   advancedOptionsSaveStatus === 'saving' ? 'Saving...' :
                   'Advanced options not saved'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';

describe('Advanced Tab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render with advanced options disabled by default', () => {
      render(<TestAdvancedTab />);
      
      expect(screen.getByText('Advanced Analysis')).toBeInTheDocument();
      expect(screen.getByText('Add secondary keywords and specify page type for more targeted SEO analysis')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-toggle')).toHaveTextContent('Off');
      expect(screen.queryByTestId('advanced-options-container')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should show advanced options when toggled on', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      const toggle = screen.getByTestId('advanced-toggle');
      await user.click(toggle);
      
      expect(toggle).toHaveTextContent('On');
      expect(screen.getByTestId('advanced-options-container')).toBeInTheDocument();
      expect(screen.getByTestId('page-type-select')).toBeInTheDocument();
      expect(screen.getByTestId('additional-context-textarea')).toBeInTheDocument();
    });

    it('should hide advanced options when toggled off', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      const toggle = screen.getByTestId('advanced-toggle');
      
      // Toggle on
      await user.click(toggle);
      expect(screen.getByTestId('advanced-options-container')).toBeInTheDocument();
      
      // Toggle off
      await user.click(toggle);
      expect(toggle).toHaveTextContent('Off');
      expect(screen.queryByTestId('advanced-options-container')).not.toBeInTheDocument();
    });

    it('should clear options when toggled off', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      const toggle = screen.getByTestId('advanced-toggle');
      
      // Toggle on and set values
      await user.click(toggle);
      const pageTypeSelect = screen.getByTestId('page-type-select');
      const contextTextarea = screen.getByTestId('additional-context-textarea');
      
      await user.selectOptions(pageTypeSelect, 'Homepage');
      await user.type(contextTextarea, 'Test context');
      
      // Toggle off
      await user.click(toggle);
      
      // Toggle back on to check values are cleared
      await user.click(toggle);
      
      expect(screen.getByTestId('page-type-select')).toHaveValue('');
      expect(screen.getByTestId('additional-context-textarea')).toHaveValue('');
    });
  });

  describe('Page Type Selection', () => {
    it('should render all page type options', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const select = screen.getByTestId('page-type-select');
      const options = select.querySelectorAll('option');
      
      // Check that all page types are present (including placeholder)
      expect(options).toHaveLength(20); // 19 page types + 1 placeholder
      
      const expectedPageTypes = [
        'Homepage', 'Category page', 'Product page', 'Blog post', 'Landing page',
        'Contact page', 'About page', 'FAQ page', 'Service page', 'Portfolio/project page',
        'Testimonial page', 'Location page', 'Legal page', 'Event page', 'Press/News page',
        'Job/career page', 'Thank you page', 'Pillar page', 'Cluster page'
      ];
      
      expectedPageTypes.forEach(pageType => {
        expect(screen.getByRole('option', { name: pageType })).toBeInTheDocument();
      });
    });

    it('should allow selecting a page type', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const select = screen.getByTestId('page-type-select');
      await user.selectOptions(select, 'Service page');
      
      expect(select).toHaveValue('Service page');
    });
  });

  describe('Additional Context', () => {
    it('should allow entering additional context', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const textarea = screen.getByTestId('secondary-keywords-textarea');
      const testContext = 'This is a test context for the page';
      
      await user.type(textarea, testContext);
      
      expect(textarea).toHaveValue(testContext);
    });

    it('should show correct placeholder text', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const textarea = screen.getByTestId('secondary-keywords-textarea');
      
      expect(textarea).toHaveAttribute(
        'placeholder',
        'Enter secondary keywords separated by commas (e.g., webflow expert, webflow specialist, cms developer)'
      );
    });

    it('should show helper text', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      expect(screen.getByText('Secondary keywords help your content rank for related terms. SEO checks will pass if either your main keyword or any secondary keyword is found.')).toBeInTheDocument();
    });
  });

  describe('Save Status Indicator', () => {
    it('should not show save status when no values are entered', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      expect(screen.queryByTestId('save-status')).not.toBeInTheDocument();
    });

    it('should show save status when page type is selected', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const select = screen.getByTestId('page-type-select');
      await user.selectOptions(select, 'Homepage');
      
      expect(screen.getByTestId('save-status')).toHaveTextContent('Advanced options not saved');
    });

    it('should show save status when additional context is entered', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      const textarea = screen.getByTestId('secondary-keywords-textarea');
      await user.type(textarea, 'Test context');
      
      expect(screen.getByTestId('save-status')).toHaveTextContent('Advanced options not saved');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      
      expect(screen.getByLabelText('Page Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Secondary Keywords')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<TestAdvancedTab />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Advanced Analysis');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow', async () => {
      const user = userEvent.setup();
      render(<TestAdvancedTab />);
      
      // 1. Initial state - toggle off
      expect(screen.getByTestId('advanced-toggle')).toHaveTextContent('Off');
      
      // 2. Toggle on
      await user.click(screen.getByTestId('advanced-toggle'));
      expect(screen.getByTestId('advanced-toggle')).toHaveTextContent('On');
      
      // 3. Select page type
      await user.selectOptions(screen.getByTestId('page-type-select'), 'Service page');
      
      // 4. Enter additional context
      await user.type(
        screen.getByTestId('secondary-keywords-textarea'),
        'Web development services for small businesses'
      );
      
      // 5. Verify values are set
      expect(screen.getByTestId('page-type-select')).toHaveValue('Service page');
      expect(screen.getByTestId('additional-context-textarea')).toHaveValue('Web development services for small businesses');
      expect(screen.getByTestId('save-status')).toHaveTextContent('Advanced options not saved');
      
      // 6. Toggle off (should clear values)
      await user.click(screen.getByTestId('advanced-toggle'));
      expect(screen.getByTestId('advanced-toggle')).toHaveTextContent('Off');
      
      // 7. Toggle back on (values should be cleared)
      await user.click(screen.getByTestId('advanced-toggle'));
      expect(screen.getByTestId('page-type-select')).toHaveValue('');
      expect(screen.getByTestId('additional-context-textarea')).toHaveValue('');
    });
  });
});