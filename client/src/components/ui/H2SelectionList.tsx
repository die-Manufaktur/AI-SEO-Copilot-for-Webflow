/**
 * H2SelectionList Component
 * Displays all H2 elements with individual Apply and Regenerate icon buttons
 * Once one is applied, marks check as passed and disables all other buttons
 */

import React, { useState } from 'react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { useAppliedRecommendations } from '../../hooks/useAppliedRecommendations';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionResult } from '../../types/webflow-data-api';

const ApplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 5V8M8 11V8M8 8H11M8 8H5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RegenerateIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5L8.63857 3.22572C9.34757 5.14175 10.8582 6.65243 12.7743 7.36143L14.5 8L12.7743 8.63857C10.8582 9.34757 9.34757 10.8582 8.63857 12.7743L8 14.5L7.36143 12.7743C6.65243 10.8582 5.14175 9.34757 3.22572 8.63857L1.5 8L3.22572 7.36143C5.14175 6.65243 6.65243 5.14175 7.36143 3.22572L8 1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface H2SelectionListProps {
  h2Elements: H2ElementInfo[];
  recommendation: string;
  onApply: (request: { h2Element: H2ElementInfo; recommendation: string }) => Promise<WebflowInsertionResult>;
  onRegenerate?: (h2Element: H2ElementInfo, index: number) => void;
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
  onRegenerate,
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

  return (
    <div className={`space-y-3 ${className}`}>
      {validH2Elements.map((h2Element, index) => {
        const itemState = itemStates[index] || {};
        const isItemApplied = appliedIndex === index;
        const isOtherApplied = appliedIndex !== null && appliedIndex !== index;
        const isDisabled = disabled || (appliedIndex !== null) || itemState.loading;

        return (
          <div
            key={`${h2Element.id}-${index}`}
            className={`flex items-center gap-3 p-4 rounded-[7px] transition-colors ${
              isItemApplied
                ? 'bg-green-900/30 border border-green-700'
                : isOtherApplied
                ? 'opacity-50'
                : ''
            }`}
            style={!isItemApplied ? {
              background: 'linear-gradient(var(--background3), var(--background3)) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
              border: '1px solid transparent',
            } : undefined}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-text2">
                  H2 #{index + 1}
                </span>
                {isItemApplied && (
                  <span className="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-0.5 rounded">
                    Applied
                  </span>
                )}
              </div>
              <p className={`text-sm text-break ${isOtherApplied ? 'text-text3' : 'text-text1'}`}>
                {h2Element.text}
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApply(h2Element, index)}
                      disabled={isDisabled}
                      className="hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                      style={{
                        width: '2rem',
                        height: '2rem',
                        minWidth: '2rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(#787878, #787878) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
                        border: '1px solid transparent',
                        borderRadius: '1.6875rem',
                      }}
                      aria-label={`Apply to H2 ${index + 1}: ${h2Element.text}`}
                    >
                      <ApplyIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Apply to page</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {onRegenerate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRegenerate(h2Element, index)}
                        disabled={isDisabled}
                        className="hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                      style={{
                        width: '2rem',
                        height: '2rem',
                        minWidth: '2rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(#787878, #787878) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
                        border: '1px solid transparent',
                        borderRadius: '1.6875rem',
                      }}
                        aria-label="Generate new suggestion"
                      >
                        <RegenerateIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Generate new suggestion</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}

      {/* Applied Success Message */}
      {appliedIndex !== null && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-sm text-green-400">
            Successfully applied recommendation to H2 #{appliedIndex + 1}
          </p>
          <p className="text-xs text-green-500 mt-1">
            The H2 check will now show as passed.
          </p>
        </div>
      )}
    </div>
  );
}
