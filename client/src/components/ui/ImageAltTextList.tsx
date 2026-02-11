/**
 * ImageAltTextList Component
 * Displays images missing alt text with individual editable text areas,
 * Apply and Regenerate icon buttons per item.
 * Follows the same pattern as H2SelectionList.
 */

import React, { useState } from 'react';
import { Button } from './button';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const ApplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <line x1="8" y1="0.5" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="13" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0.5" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RegenerateIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
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
  onRegenerate?: (image: ImageAltTextItem, index: number) => void;
  pageId?: string;
  checkTitle?: string;
  disabled?: boolean;
  className?: string;
}

interface ItemState {
  loading: boolean;
  success: boolean;
  error?: string;
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

  const handleApply = async (image: ImageAltTextItem, index: number) => {
    if (disabled) return;

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

  return (
    <div className={`space-y-3 ${className}`}>
      {images.map((image, index) => {
        const itemState = itemStates[index] || {};
        const isApplied = itemState.success;
        const isDisabled = disabled || itemState.loading;

        return (
          <div
            key={`${image.id}-${index}`}
            className={`flex items-center gap-3 p-4 rounded-[7px] transition-colors ${
              isApplied
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-background3'
            }`}
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
            <div className="flex-1 min-w-0">
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
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApply(image, index)}
                        disabled={isDisabled}
                        className="h-8 w-8 p-0 rounded-full bg-background2 hover:bg-background2/80"
                        aria-label={`Apply alt text for ${image.name}`}
                      >
                        <ApplyIcon className="h-4 w-4" />
                      </Button>
                    </motion.div>
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
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRegenerate(image, index)}
                          disabled={isDisabled}
                          className="h-8 w-8 p-0 rounded-full bg-background2 hover:bg-background2/80"
                          aria-label="Generate new suggestion"
                        >
                          <RegenerateIcon className="h-4 w-4" />
                        </Button>
                      </motion.div>
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
