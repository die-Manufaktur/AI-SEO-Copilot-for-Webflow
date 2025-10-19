import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Copy, Edit3, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { ApplyButton } from "./ApplyButton";
import { useInsertion } from "../../contexts/InsertionContext";
import { createInsertionRequest, canApplyRecommendation, getApplyDescription, type RecommendationContext } from "../../utils/insertionHelpers";

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
  onApplySuccess
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
    <div className={`group relative ${className}`}>
      <div 
        className={`${canApply ? "pr-32" : "pr-20"} cursor-pointer hover:bg-background2/50 -m-1 p-1 rounded transition-colors`} 
        onClick={handleEdit}
      >
        {editedText}
      </div>
      <div className="absolute top-0 right-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canApply && (
          <div className="flex items-center">
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
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  disabled={disabled}
                  className="h-8 w-8 p-0 hover:bg-background2"
                  aria-label="Edit recommendation"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit recommendation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={disabled}
                  className="h-8 w-8 p-0 hover:bg-background2"
                  aria-label="Copy recommendation to clipboard"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy recommendation to clipboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}