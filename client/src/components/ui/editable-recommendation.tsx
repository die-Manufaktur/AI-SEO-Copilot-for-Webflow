import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { ApplyButton } from "./ApplyButton";
import { useInsertion } from "../../contexts/InsertionContext";
import { createInsertionRequest, canApplyRecommendation, getApplyDescription, type RecommendationContext } from "../../utils/insertionHelpers";

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

interface EditableRecommendationProps {
  recommendation: string;
  onCopy: (text: string) => Promise<boolean>;
  className?: string;
  disabled?: boolean;
  // Props for apply functionality
  checkTitle?: string;
  pageId?: string;
  cmsItemId?: string;
  fieldId?: string;
  showApplyButton?: boolean;
  showOnlyApplyButton?: boolean; // When true, only show the apply button without text content
  onApplySuccess?: (checkTitle: string) => void; // Callback for successful application
  onRegenerate?: () => Promise<void>; // Callback to regenerate AI suggestion
}

export function EditableRecommendation({
  recommendation,
  onCopy,
  className = "",
  disabled = false,
  checkTitle,
  pageId,
  cmsItemId,
  fieldId,
  showApplyButton = true,
  showOnlyApplyButton = false,
  onApplySuccess,
  onRegenerate
}: EditableRecommendationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(recommendation);
  const [tempText, setTempText] = useState(recommendation);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Insertion context for apply functionality
  const { applyInsertion, isLoading, error } = useInsertion();
  
  // Determine if apply button should be shown
  const canApply = showApplyButton && checkTitle && canApplyRecommendation(checkTitle);
  
  // Create insertion request context
  const insertionContext: RecommendationContext = {
    checkTitle: checkTitle || '',
    recommendation: editedText,
    pageId,
    cmsItemId,
    fieldId,
  };

  // Update local state when recommendation changes
  useEffect(() => {
    setEditedText(recommendation);
    setTempText(recommendation);
  }, [recommendation]);

  // Auto-resize textarea and focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
      
      // Auto-resize function that prevents bouncing by avoiding height reset
      const resizeTextarea = () => {
        // Get current computed height to avoid unnecessary changes
        const currentHeight = parseInt(window.getComputedStyle(textarea).height);
        
        // Temporarily set height to auto to measure content
        const originalHeight = textarea.style.height;
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        
        // Calculate the new height needed (minimum 100px)
        const newHeight = Math.max(100, scrollHeight);
        
        // Only update height if there's a meaningful difference (avoid micro-adjustments)
        if (Math.abs(newHeight - currentHeight) > 2) {
          textarea.style.height = newHeight + 'px';
        } else {
          // Restore original height if no significant change needed
          textarea.style.height = originalHeight;
        }
      };
      
      // Initial resize
      resizeTextarea();
      
      // Use requestAnimationFrame for smoother resizing on input
      const handleInput = () => {
        requestAnimationFrame(resizeTextarea);
      };
      
      textarea.addEventListener('input', handleInput);
      
      return () => {
        textarea.removeEventListener('input', handleInput);
      };
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setTempText(editedText);
    setIsEditing(true);
  };

  const handleSave = () => {
    setEditedText(tempText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(editedText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleCopy = async () => {
    try {
      await onCopy(editedText);
    } catch (error) {
      // Error handling is done in the parent component's copyToClipboard function
      // Silently fail as the parent handles user notification
    }
  };

  const handleApply = async (request: any) => {
    const insertionRequest = createInsertionRequest({
      ...insertionContext,
      recommendation: editedText,
    });
    
    if (!insertionRequest) {
      throw new Error('Unable to create insertion request');
    }
    
    const result = await applyInsertion(insertionRequest);
    
    // Call onApplySuccess callback when application succeeds
    if (result.success && checkTitle && onApplySuccess) {
      onApplySuccess(checkTitle);
    }
    
    return result;
  };

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleApplyClick = async () => {
    if (!canApply) return;
    try {
      await handleApply(null);
    } catch {
      // Error handled by handleApply
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[100px] p-3 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-none"
            style={{ transition: 'none' }}
            placeholder="Edit the AI recommendation..."
            disabled={disabled}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Ctrl+Enter to save, Esc to cancel
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canApply && (
              <ApplyButton
                insertionRequest={createInsertionRequest({
                  ...insertionContext,
                  recommendation: tempText,
                }) || { type: 'page_title', value: tempText }}
                onApply={handleApply}
                loading={isLoading}
                error={error || undefined}
                disabled={disabled || !tempText.trim()}
                label={getApplyDescription(checkTitle || '')}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={disabled || !tempText.trim()}
              className="flex items-center gap-2"
            >
              <Check className="h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If showOnlyApplyButton is true, only render the Apply button
  if (showOnlyApplyButton && canApply) {
    return (
      <div className={className}>
        <ApplyButton
          insertionRequest={createInsertionRequest(insertionContext) || { type: 'page_title', value: editedText }}
          onApply={handleApply}
          loading={isLoading}
          error={error || undefined}
          disabled={disabled}
          label="Apply"
          ariaLabel={getApplyDescription(checkTitle || '')}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 text-break">
        {editedText}
      </div>
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleApplyClick}
                disabled={disabled || !canApply}
                className="h-8 w-8 p-0 rounded-full bg-background2 hover:bg-background2/80 hover:scale-110 active:scale-95 transition-transform"
                aria-label="Apply to page"
              >
                <ApplyIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Apply to page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={disabled || isRegenerating}
                className="h-8 w-8 p-0 rounded-full bg-background2 hover:bg-background2/80 hover:scale-110 active:scale-95 transition-transform"
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
      </div>
    </div>
  );
}