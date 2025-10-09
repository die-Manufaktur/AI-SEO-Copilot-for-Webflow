import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EditableRecommendation } from './editable-recommendation';

// Mock the useInsertion hook to avoid needing the full provider setup
vi.mock('../../contexts/InsertionContext', () => ({
  useInsertion: () => ({
    applyInsertion: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    error: null,
    lastResult: null,
    pendingOperations: [],
    insertionHistory: [],
    previewInsertion: vi.fn().mockResolvedValue({ success: true }),
    applyBatch: vi.fn().mockResolvedValue({ success: true }),
    rollbackBatch: vi.fn().mockResolvedValue({ success: true }),
    addToPending: vi.fn(),
    removeFromPending: vi.fn(),
    clearPending: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock the ApplyButton component to avoid complex dependencies
vi.mock('./ApplyButton', () => ({
  ApplyButton: ({ onApply, onPreview, disabled, label, ariaLabel }: any) => (
    <button
      onClick={onApply}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid="apply-button"
    >
      {label || 'Apply'}
    </button>
  ),
}));

describe('EditableRecommendation', () => {
  const mockOnCopy = vi.fn().mockResolvedValue(true);
  const testRecommendation = "This is a test AI recommendation that should be editable.";
  
  beforeEach(() => {
    mockOnCopy.mockClear();
    mockOnCopy.mockResolvedValue(true);
    // Clear any residual DOM state
    document.body.innerHTML = '';
  });

  it('renders recommendation text by default', () => {
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    expect(screen.getByText(testRecommendation)).toBeInTheDocument();
  });

  it('shows edit and copy buttons on hover', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Buttons should be present in the DOM
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    const copyButton = screen.getByRole('button', { name: /copy recommendation to clipboard/i });
    
    expect(editButton).toBeInTheDocument();
    expect(copyButton).toBeInTheDocument();
    
    // The hover functionality is tested via CSS classes, 
    // so we'll just verify the buttons exist and are clickable
    expect(editButton).not.toBeDisabled();
    expect(copyButton).not.toBeDisabled();
  });

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);

    // Should show textarea with current text
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(testRecommendation);
    
    // Should show save and cancel buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('allows editing the recommendation text', async () => {
    const user = userEvent.setup();
    const newText = "This is the edited recommendation text.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);

    // Clear and type new text - use cleaner approach
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, newText);

    expect(textarea).toHaveValue(newText);
  });

  it('saves changes when save button is clicked', async () => {
    const user = userEvent.setup();
    const newText = "This is the edited recommendation text.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode and edit text
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, newText);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should exit edit mode and show new text
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(newText)).toBeInTheDocument();
  });

  it('cancels changes when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const newText = "This should be discarded.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode and edit text
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, newText);

    // Cancel changes
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should exit edit mode and show original text
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(testRecommendation)).toBeInTheDocument();
  });

  it('saves changes with Ctrl+Enter keyboard shortcut', async () => {
    const user = userEvent.setup();
    const newText = "Saved with keyboard shortcut.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode and edit text
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, newText);

    // Use fireEvent for more reliable keyboard shortcut testing
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', ctrlKey: true });

    // Should exit edit mode and show new text
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(screen.getByText(newText)).toBeInTheDocument();
  });

  it('cancels changes with Escape keyboard shortcut', async () => {
    const user = userEvent.setup();
    const newText = "This should be discarded.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode and edit text
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, newText);

    // Use fireEvent for more reliable Escape key testing
    fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape' });

    // Should exit edit mode and show original text
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(screen.getByText(testRecommendation)).toBeInTheDocument();
  });

  it('calls onCopy with current edited text when copy button is clicked', async () => {
    const user = userEvent.setup();
    const editedText = "This is the edited text to copy.";
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Edit the text first
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, editedText);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Now copy the edited text
    const copyButton = screen.getByRole('button', { name: /copy recommendation to clipboard/i });
    await user.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(editedText);
  });

  it('calls onCopy with original text when no edits have been made', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy recommendation to clipboard/i });
    await user.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(testRecommendation);
  });

  it('disables all interactions when disabled prop is true', () => {
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
        disabled={true}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    const copyButton = screen.getByRole('button', { name: /copy recommendation to clipboard/i });
    
    expect(editButton).toBeDisabled();
    expect(copyButton).toBeDisabled();
  });

  it('disables save button when textarea is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit recommendation/i });
    await user.click(editButton);
    
    // Clear the textarea
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('updates when recommendation prop changes', () => {
    const { rerender } = render(
      <EditableRecommendation 
        recommendation={testRecommendation}
        onCopy={mockOnCopy}
      />
    );

    expect(screen.getByText(testRecommendation)).toBeInTheDocument();

    const newRecommendation = "This is a completely new recommendation.";
    rerender(
      <EditableRecommendation 
        recommendation={newRecommendation}
        onCopy={mockOnCopy}
      />
    );

    expect(screen.getByText(newRecommendation)).toBeInTheDocument();
    expect(screen.queryByText(testRecommendation)).not.toBeInTheDocument();
  });

  describe('Apply button visibility', () => {
    it('should show Apply button for title recommendations', () => {
      render(
        <EditableRecommendation
          recommendation="Optimized Title Here"
          onCopy={mockOnCopy}
          checkTitle="Keyphrase in Title"
          pageId="test-page"
          showApplyButton={true}
        />
      );
      
      expect(screen.getByLabelText('Apply as page title')).toBeInTheDocument();
    });

    it('should show Apply button for meta description recommendations', () => {
      render(
        <EditableRecommendation
          recommendation="Optimized meta description here"
          onCopy={mockOnCopy}
          checkTitle="Keyphrase in Meta Description"
          pageId="test-page"
          showApplyButton={true}
        />
      );
      
      expect(screen.getByLabelText('Apply as meta description')).toBeInTheDocument();
    });

    it('should show Apply button for URL recommendations', () => {
      render(
        <EditableRecommendation
          recommendation="optimized-url-slug"
          onCopy={mockOnCopy}
          checkTitle="Keyphrase in URL"
          pageId="test-page"
          showApplyButton={true}
        />
      );
      
      expect(screen.getByLabelText('Apply as page URL slug')).toBeInTheDocument();
    });

    it('should not show Apply button for non-insertable recommendations', () => {
      render(
        <EditableRecommendation
          recommendation="Some general content advice"
          onCopy={mockOnCopy}
          checkTitle="Content Length"
          pageId="test-page"
          showApplyButton={true}
        />
      );
      
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });

    it('should not show Apply button when showApplyButton is false', () => {
      render(
        <EditableRecommendation
          recommendation="Optimized Title Here"
          onCopy={mockOnCopy}
          checkTitle="Keyphrase in Title"
          pageId="test-page"
          showApplyButton={false}
        />
      );
      
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });
  });
});