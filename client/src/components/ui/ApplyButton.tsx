/**
 * Apply Button Component
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { useState, useEffect } from 'react';
import type { 
  WebflowInsertionRequest, 
  WebflowInsertionResult 
} from '../../types/webflow-data-api';

export interface ApplyButtonProps {
  insertionRequest: WebflowInsertionRequest;
  onApply: (request: WebflowInsertionRequest) => Promise<WebflowInsertionResult> | void;
  onPreview?: (request: WebflowInsertionRequest) => Promise<WebflowInsertionResult> | void;
  onError?: (error: Error) => void;
  label?: string;
  ariaLabel?: string;
  loading?: boolean;
  success?: boolean;
  error?: string;
  disabled?: boolean;
  showPreview?: boolean;
  previewLoading?: boolean;
  previewResult?: WebflowInsertionResult;
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

function PreviewResult({ result }: { result: WebflowInsertionResult }) {
  if (!result.success || !result.data) return null;

  const { current, preview } = result.data as any;

  return (
    <div data-testid="preview-result" className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
      <div className="mb-2">
        <span className="font-medium text-gray-700">Current: </span>
        <span className="text-gray-600">{current?.title || current?.description || 'Current value'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Preview: </span>
        <span className="text-gray-900">{preview?.title || preview?.description || 'Preview value'}</span>
      </div>
    </div>
  );
}

function getInsertionIcon(type: string) {
  const iconClass = "w-4 h-4";
  
  switch (type) {
    case 'page_title':
      return (
        <svg data-testid="apply-page-title-icon" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'meta_description':
      return (
        <svg data-testid="apply-meta-description-icon" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'cms_field':
      return (
        <svg data-testid="apply-cms-field-icon" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

function LoadingSpinner({ testId }: { testId: string }) {
  return (
    <div
      data-testid={testId}
      className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
      aria-hidden="true"
    />
  );
}

function SuccessIcon() {
  return (
    <svg data-testid="apply-success-icon" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg data-testid="apply-error-icon" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ApplyButton({
  insertionRequest,
  onApply,
  onPreview,
  onError,
  label = 'Apply',
  ariaLabel,
  loading = false,
  success = false,
  error,
  disabled = false,
  showPreview = false,
  previewLoading = false,
  previewResult,
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
    } else if (successTimeout === 0) {
      // Only reset immediately if no timeout is configured
      setInternalSuccess(false);
      setShowSuccessAnimation(false);
    }
  }, [success, successTimeout]);

  // Handle auto-reset timeout
  useEffect(() => {
    if (internalSuccess && successTimeout > 0) {
      const timer = setTimeout(() => {
        setInternalSuccess(false);
        setShowSuccessAnimation(false);
      }, successTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [internalSuccess, successTimeout]);

  const isDisabled = disabled || loading || previewLoading;
  const hasError = Boolean(error);
  // If successTimeout is provided, use internal state; otherwise use external success prop
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
          <LoadingSpinner testId="apply-loading-spinner" />
          <span className="ml-2">Applying...</span>
        </>
      );
    }
    
    if (hasError) {
      return (
        <>
          <ErrorIcon />
          <span className="ml-2">Error</span>
        </>
      );
    }
    
    if (isSuccess) {
      return (
        <>
          <SuccessIcon />
          <span className="ml-2">Applied</span>
        </>
      );
    }
    
    return (
      <>
        {getInsertionIcon(insertionRequest.type)}
        <span className="ml-2">{label}</span>
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

  const handlePreview = async () => {
    if (!onPreview) return;
    
    const previewRequest = {
      ...insertionRequest,
      preview: true,
    };
    
    try {
      await onPreview(previewRequest);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        {showPreview && (
          <button
            onClick={handlePreview}
            disabled={previewLoading || loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewLoading ? (
              <>
                <LoadingSpinner testId="preview-loading-spinner" />
                <span className="ml-2">Previewing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="ml-2">Preview</span>
              </>
            )}
          </button>
        )}
        
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
      </div>

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

      {previewResult && (
        <PreviewResult result={previewResult} />
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