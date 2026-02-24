/**
 * H2SelectionList Component
 * Displays H2 elements with per-H2 AI suggestions and individual/batch regenerate buttons.
 * Once one is applied, marks check as passed and disables all other buttons.
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
import { generateRecommendation } from '../../lib/api';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionResult } from '../../types/webflow-data-api';
import type { AdvancedOptions } from '../../../../shared/types';

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

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="25 13" strokeLinecap="round"/>
  </svg>
);

export interface H2Recommendation {
  h2Index: number;
  h2Text: string;
  suggestion: string;
}

export interface H2SelectionListProps {
  h2Elements: H2ElementInfo[];
  h2Recommendations?: H2Recommendation[];
  keyphrase: string;
  advancedOptions?: AdvancedOptions;
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
  h2Recommendations,
  keyphrase,
  advancedOptions,
  onApply,
  onError,
  disabled = false,
  className = '',
  pageId,
  checkTitle = 'Keyphrase in H2 Headings',
}: H2SelectionListProps): React.ReactElement {
  const [suggestions, setSuggestions] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    h2Recommendations?.forEach(rec => { init[rec.h2Index] = rec.suggestion; });
    return init;
  });
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<Record<number, H2ItemState>>({});
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  const { markAsApplied } = useAppliedRecommendations({ pageId });

  const validH2Elements = h2Elements.filter(h2 =>
    h2 && h2.id && h2.text && h2.text.trim().length > 0
  );

  if (validH2Elements.length === 0) {
    return (
      <div className={`text-center py-6 text-muted-foreground ${className}`}>
        <p>No valid H2 elements found on this page.</p>
        <p className="text-sm mt-1">Add H2 headings with text content to your page to use this feature.</p>
      </div>
    );
  }

  const updateItemState = (index: number, updates: Partial<H2ItemState>) => {
    setItemStates(prev => ({ ...prev, [index]: { ...prev[index], ...updates } }));
  };

  const handleApply = async (h2Element: H2ElementInfo, index: number) => {
    if (disabled || appliedIndex !== null) return;

    updateItemState(index, { loading: true, error: undefined });

    const recommendation = suggestions[h2Element.index] ?? '';

    try {
      const result = await onApply({ h2Element, recommendation });

      if (result.success) {
        setAppliedIndex(index);
        updateItemState(index, { loading: false, success: true });

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

  const handleRegenerate = async (h2Element: H2ElementInfo) => {
    if (disabled || regeneratingAll || regeneratingIndex !== null) return;

    setRegeneratingIndex(h2Element.index);
    try {
      const newSuggestion = await generateRecommendation({
        checkType: 'Keyphrase in H2 Headings',
        keyphrase,
        context: h2Element.text,
        advancedOptions,
      });
      setSuggestions(prev => ({ ...prev, [h2Element.index]: newSuggestion }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to regenerate suggestion'));
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (disabled) return;

    setRegeneratingAll(true);
    try {
      const results = await Promise.all(
        validH2Elements.map(async h2El => {
          try {
            const newSuggestion = await generateRecommendation({
              checkType: 'Keyphrase in H2 Headings',
              keyphrase,
              context: h2El.text,
              advancedOptions,
            });
            return { index: h2El.index, suggestion: newSuggestion };
          } catch {
            return { index: h2El.index, suggestion: suggestions[h2El.index] ?? '' };
          }
        })
      );
      const updated: Record<number, string> = {};
      results.forEach(r => { updated[r.index] = r.suggestion; });
      setSuggestions(prev => ({ ...prev, ...updated }));
    } finally {
      setRegeneratingAll(false);
    }
  };

  const isAnyLoading = regeneratingIndex !== null || regeneratingAll;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Generate All header button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerateAll}
          disabled={disabled || isAnyLoading || appliedIndex !== null}
          className="flex items-center gap-1.5 text-xs text-text2 hover:text-text1"
          aria-label="Generate All new suggestions"
        >
          {regeneratingAll ? (
            <SpinnerIcon className="h-3 w-3" />
          ) : (
            <RegenerateIcon className="h-3 w-3" />
          )}
          Generate All
        </Button>
      </div>

      {validH2Elements.map((h2Element, index) => {
        const itemState = itemStates[index] || {};
        const isItemApplied = appliedIndex === index;
        const isOtherApplied = appliedIndex !== null && appliedIndex !== index;
        const isRegeneratingThis = regeneratingIndex === h2Element.index;
        const isDisabled = disabled || appliedIndex !== null || itemState.loading || isAnyLoading;
        const suggestion = suggestions[h2Element.index] ?? '';

        return (
          <div
            key={`${h2Element.id}-${index}`}
            className={`flex items-start gap-3 p-4 rounded-[7px] transition-colors ${
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
                <span className="text-xs font-medium text-text2">H2 #{index + 1}</span>
                {isItemApplied && (
                  <span className="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-0.5 rounded">
                    Applied
                  </span>
                )}
              </div>
              {/* Current H2 text — secondary reference */}
              <p className="text-xs text-text3 mb-1 text-break">{h2Element.text}</p>
              {/* AI suggestion — prominent, actionable */}
              {suggestion && (
                <p className={`text-sm font-medium text-break ${isOtherApplied ? 'text-text3' : 'text-text1'}`}>
                  {suggestion}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApply(h2Element, index)}
                      disabled={isDisabled || !suggestion}
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
                  <TooltipContent side="left"><p>Apply to page</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerate(h2Element)}
                      disabled={isDisabled || isRegeneratingThis}
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
                      aria-label={`Generate new suggestion for H2 ${index + 1}: ${h2Element.text}`}
                    >
                      {isRegeneratingThis ? (
                        <SpinnerIcon className="h-4 w-4" />
                      ) : (
                        <RegenerateIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>Generate new suggestion</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      })}

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
