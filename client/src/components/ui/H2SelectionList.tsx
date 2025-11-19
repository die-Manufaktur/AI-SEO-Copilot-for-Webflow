/**
 * H2SelectionList Component
 * Displays all H2 elements with individual Apply buttons
 * Once one is applied, marks check as passed and disables all other buttons
 */

import React, { useState } from 'react';
import { ApplyButton } from './ApplyButton';
import { useAppliedRecommendations } from '../../hooks/useAppliedRecommendations';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionRequest, WebflowInsertionResult } from '../../types/webflow-data-api';

export interface H2SelectionListProps {
  h2Elements: H2ElementInfo[];
  recommendation: string;
  onApply: (request: { h2Element: H2ElementInfo; recommendation: string }) => Promise<WebflowInsertionResult>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  pageId?: string;
  checkTitle?: string;
}

interface H2ItemState {
  loading: boolean;
  success: boolean;
  error?: string;
}

export function H2SelectionList({
  h2Elements,
  recommendation,
  onApply,
  onError,
  disabled = false,
  className = '',
  pageId,
  checkTitle = 'Keyphrase in H2 Headings',
}: H2SelectionListProps): React.ReactElement {
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<Record<number, H2ItemState>>({});
  
  // Use applied recommendations hook for persistent state tracking
  const { isApplied, markAsApplied } = useAppliedRecommendations({ pageId });

  // Filter out invalid H2 elements (empty text, missing id, etc.)
  const validH2Elements = h2Elements.filter(h2Element => 
    h2Element && 
    h2Element.id && 
    h2Element.text && 
    h2Element.text.trim().length > 0
  );

  // Handle empty state
  if (validH2Elements.length === 0) {
    return (
      <div className={`text-center py-6 text-muted-foreground ${className}`}>
        <p>No valid H2 elements found on this page.</p>
        <p className="text-sm mt-1">Add H2 headings with text content to your page to use this feature.</p>
      </div>
    );
  }

  const updateItemState = (index: number, updates: Partial<H2ItemState>) => {
    setItemStates(prev => ({
      ...prev,
      [index]: { ...prev[index], ...updates }
    }));
  };

  const handleApply = async (h2Element: H2ElementInfo, index: number) => {
    if (disabled || appliedIndex !== null) return;

    updateItemState(index, { loading: true, error: undefined });

    try {
      const result = await onApply({ h2Element, recommendation });
      
      if (result.success) {
        setAppliedIndex(index);
        updateItemState(index, { loading: false, success: true });
        
        // Save to persistent storage if pageId and checkTitle are available
        if (pageId && checkTitle) {
          markAsApplied(checkTitle, recommendation, {
            elementType: 'h2',
            elementIndex: index,
            elementId: h2Element.id,
          });
        }
      } else {
        throw new Error('Apply operation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateItemState(index, { loading: false, error: errorMessage });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const createInsertionRequest = (h2Element: H2ElementInfo): WebflowInsertionRequest => {
    return {
      type: 'h2_heading',
      value: recommendation,
      elementIndex: h2Element.index,
      selector: `#${h2Element.id}`,
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recommendation Preview */}
      <div className="p-3 bg-muted/50 rounded-lg border">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          AI Recommendation:
        </h4>
        <p className="text-sm">{recommendation}</p>
      </div>

      {/* H2 Elements List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Select an H2 element to apply the recommendation:
        </h4>
        
        {validH2Elements.map((h2Element, index) => {
          const itemState = itemStates[index] || {};
          const isApplied = appliedIndex === index;
          const isOtherApplied = appliedIndex !== null && appliedIndex !== index;
          const isDisabled = disabled || (appliedIndex !== null) || itemState.loading;

          return (
            <div
              key={`${h2Element.id}-${index}`}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                isApplied 
                  ? 'bg-green-50 border-green-200 applied' 
                  : isOtherApplied 
                  ? 'bg-muted/30 border-muted' 
                  : 'bg-background border-input hover:bg-muted/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    H2 #{index + 1}
                  </span>
                  {isApplied && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      Applied
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${isOtherApplied ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {h2Element.text}
                </p>
              </div>
              
              <div className="ml-3 flex-shrink-0">
                <ApplyButton
                  insertionRequest={createInsertionRequest(h2Element)}
                  onApply={async () => {
                    await handleApply(h2Element, index);
                    return { success: true, data: { applied: true } };
                  }}
                  loading={itemState.loading}
                  success={itemState.success}
                  error={itemState.error}
                  disabled={isDisabled}
                  label="Apply"
                  ariaLabel={`Apply to H2 ${index + 1}: ${h2Element.text}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Applied Success Message */}
      {appliedIndex !== null && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Successfully applied recommendation to H2 #{appliedIndex + 1}
          </p>
          <p className="text-xs text-green-600 mt-1">
            The H2 check will now show as passed.
          </p>
        </div>
      )}
    </div>
  );
}