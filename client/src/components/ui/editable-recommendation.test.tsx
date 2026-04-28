import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  ApplyButton: ({ onApply, disabled, label, ariaLabel }: any) => (
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

  describe('Apply button functionality', () => {
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
