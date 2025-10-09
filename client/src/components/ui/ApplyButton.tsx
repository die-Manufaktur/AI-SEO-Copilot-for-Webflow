/**
 * Apply Button Component
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { useState, useEffect } from 'react';
import type { 
  WebflowInsertionRequest, 
  WebflowInsertionResult 
} from '../../types/webflow-data-api';
// Removed authentication imports since app runs within Designer context

export interface ApplyButtonProps {
  insertionRequest: WebflowInsertionRequest;
  onApply: (request: WebflowInsertionRequest) => Promise<WebflowInsertionResult> | void;
  onError?: (error: Error) => void;
  label?: string;
  ariaLabel?: string;
  loading?: boolean;
  success?: boolean;
  error?: string;
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  successTimeout?: number;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({ isOpen, message, onConfirm, onCancel }: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <p className="text-gray-900 mb-4">{message}</p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}



export function ApplyButton({
  insertionRequest,
  onApply,
  onError,
  label = 'Apply',
  ariaLabel,
  loading = false,
  success = false,
  error,
  disabled = false,
  requiresConfirmation = false,
  confirmationMessage = 'Are you sure you want to apply this change?',
  successTimeout = 3000,
}: ApplyButtonProps): React.ReactElement {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [internalSuccess, setInternalSuccess] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Handle success state changes
  useEffect(() => {
    if (success) {
      setInternalSuccess(true);
      setShowSuccessAnimation(true);
    } else {
      // Reset internal state when success prop becomes false
      setInternalSuccess(false);
      setShowSuccessAnimation(false);
    }
  }, [success]);

  // Handle auto-reset timeout
  useEffect(() => {
    if (success && successTimeout > 0) {
      const timer = setTimeout(() => {
        setInternalSuccess(false);
        setShowSuccessAnimation(false);
      }, successTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [success, successTimeout]);

  const isDisabled = disabled || loading;
  const hasError = Boolean(error);
  // Use internal state for display when timeout is configured
  const isSuccess = successTimeout > 0 ? internalSuccess : success;

  const getButtonClass = () => {
    let baseClass = "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
    
    if (isDisabled) {
      baseClass += " opacity-50 cursor-not-allowed";
    }
    
    if (hasError) {
      return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
    }
    
    if (isSuccess) {
      return `${baseClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
    }
    
    return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <span>Applying...</span>
        </>
      );
    }
    
    if (hasError) {
      return (
        <>
          <span>Error</span>
        </>
      );
    }
    
    if (isSuccess) {
      return (
        <>
          <span>Applied</span>
        </>
      );
    }
    
    return (
      <>
        <span>{label}</span>
      </>
    );
  };

  const handleApplyClick = async () => {
    if (requiresConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    await handleApply();
  };

  const handleApply = async () => {
    try {
      await onApply(insertionRequest);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);
    await handleApply();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };


  return (
    <div className="relative">
      <button
        onClick={handleApplyClick}
        disabled={isDisabled}
        className={getButtonClass()}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
      >
        {getButtonContent()}
      </button>

      {showSuccessAnimation && (
        <div data-testid="success-animation" className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="animate-pulse bg-green-200 opacity-50 rounded-md w-full h-full" />
        </div>
      )}

      {hasError && (
        <div role="alert" className="mt-2">
          <div 
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
            title={error}
          >
            {error}
          </div>
        </div>
      )}


      <ConfirmationDialog
        isOpen={showConfirmation}
        message={confirmationMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}