/**
 * ImageAltTextList Component
 * Displays images missing alt text with individual editable text areas,
 * Apply and Regenerate icon buttons per item.
 * Follows the same pattern as H2SelectionList.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

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

const IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItaW1hZ2UiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';

export interface ImageAltTextItem {
  id: string;
  url: string;
  name: string;
  alt: string | null;
}

export interface ImageAltTextListProps {
  images: ImageAltTextItem[];
  onApply: (params: { image: ImageAltTextItem; newAltText: string }) => Promise<{ success: boolean }>;
  onRegenerate?: (image: ImageAltTextItem, index: number) => Promise<void>;
  pageId?: string;
  checkTitle?: string;
  disabled?: boolean;
  className?: string;
}

interface ItemState {
  loading: boolean;
  success: boolean;
  error?: string;
  regenerating: boolean;
}

export function ImageAltTextList({
  images,
  onApply,
  onRegenerate,
  disabled = false,
  className = '',
}: ImageAltTextListProps): React.ReactElement {
  const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
  const [editedTexts, setEditedTexts] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    images.forEach((img, idx) => {
      initial[idx] = img.alt || '';
    });
    return initial;
  });

  // Track the last alt value seen from the images prop so we can distinguish
  // external updates (e.g. Generate All completing) from manual user edits.
  const prevAltRef = useRef<Record<number, string>>({});

  useEffect(() => {
    // Collect entries where the external alt value changed since last render.
    const changedEntries: Array<{ idx: number; prevAlt: string; newAlt: string }> = [];
    images.forEach((img, idx) => {
      const prevAlt = prevAltRef.current[idx] ?? '';
      const newAlt = img.alt ?? '';
      if (newAlt !== prevAlt) {
        changedEntries.push({ idx, prevAlt, newAlt });
        prevAltRef.current[idx] = newAlt;
      }
    });

    if (changedEntries.length === 0) return;

    // Only sync entries where the user hasn't manually typed something different.
    // A user edit is detected when editedTexts[idx] no longer matches the previous
    // external value — in that case we leave their text alone.
    setEditedTexts(prev => {
      const next = { ...prev };
      for (const { idx, prevAlt, newAlt } of changedEntries) {
        if ((prev[idx] ?? '') === prevAlt) {
          next[idx] = newAlt;
        }
      }
      return next;
    });
  }, [images]);

  if (images.length === 0) {
    return (
      <div className={`text-center py-6 text-muted-foreground ${className}`}>
        <p>No images found on this page.</p>
      </div>
    );
  }

  const updateItemState = (index: number, updates: Partial<ItemState>) => {
    setItemStates(prev => ({
      ...prev,
      [index]: { ...prev[index], ...updates },
    }));
  };

  const isAnyLoading = disabled || Object.values(itemStates).some(s => s.loading || s.regenerating);

  const handleApply = async (image: ImageAltTextItem, index: number) => {
    if (isAnyLoading) return;

    const newAltText = editedTexts[index] ?? '';
    if (!newAltText.trim()) return;

    updateItemState(index, { loading: true, error: undefined });

    try {
      const result = await onApply({ image, newAltText });
      if (result.success) {
        updateItemState(index, { loading: false, success: true });
      } else {
        throw new Error('Apply operation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateItemState(index, { loading: false, error: errorMessage });
    }
  };

  const handleRegenerate = async (image: ImageAltTextItem, index: number) => {
    if (!onRegenerate || isAnyLoading) return;
    updateItemState(index, { regenerating: true });
    try {
      await onRegenerate(image, index);
    } catch (err) {
      console.error('[ImageAltTextList] Regeneration failed:', err);
    } finally {
      updateItemState(index, { regenerating: false });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {images.map((image, index) => {
        const itemState = itemStates[index] || {};
        const isApplied = itemState.success;
        const isDisabled = isAnyLoading || itemState.loading || itemState.regenerating;

        return (
          <div
            key={`${image.id}-${index}`}
            className={`flex items-center gap-3 p-4 rounded-[7px] transition-colors ${
              isApplied ? 'bg-green-900/30 border border-green-700' : ''
            }`}
            style={!isApplied ? {
              background: 'linear-gradient(var(--background3), var(--background3)) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
              border: '1px solid transparent',
            } : undefined}
          >
            {/* Image thumbnail */}
            <div className="flex-shrink-0 w-[87px] h-[87px] rounded-[6px] overflow-hidden bg-background2">
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = IMAGE_PLACEHOLDER;
                }}
              />
            </div>

            {/* Editable text area */}
            <div className="flex-1 min-w-0 border border-[var(--color-bg-500)] bg-[var(--color-bg-500)] rounded-[6px] p-3">
              {itemState.regenerating ? (
                <span className="text-muted-foreground italic animate-pulse text-sm">AI text is generating...</span>
              ) : (
                <textarea
                  className="w-full bg-transparent text-sm text-text1 resize-none border-none focus:outline-none focus:ring-0 placeholder:text-text3"
                  value={editedTexts[index] ?? ''}
                  onChange={(e) =>
                    setEditedTexts(prev => ({ ...prev, [index]: e.target.value }))
                  }
                  placeholder="No alt text"
                  rows={3}
                  disabled={isDisabled}
                />
              )}
              {isApplied && (
                <span className="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-0.5 rounded">
                  Applied
                </span>
              )}
            </div>

            {/* Buttons column */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApply(image, index)}
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
                      aria-label={`Apply alt text for ${image.name}`}
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
                        onClick={() => handleRegenerate(image, index)}
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
                        <RegenerateIcon className={`h-4 w-4 ${itemState.regenerating ? 'animate-spin' : ''}`} />
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
    </div>
  );
}
