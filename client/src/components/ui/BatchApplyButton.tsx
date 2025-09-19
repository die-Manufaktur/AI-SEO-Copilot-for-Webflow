/**
 * Batch Apply Button Component
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { 
  WebflowBatchInsertionRequest,
  WebflowBatchInsertionResult,
  WebflowInsertionRequest,
  WebflowPage,
  WebflowCMSItem
} from '../../types/webflow-data-api';
import { analyzeImpact, type ImpactAnalysis } from '../../services/impactAnalysis';

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  currentOperation: WebflowInsertionRequest;
}

export interface BatchApplyButtonProps {
  batchRequest: WebflowBatchInsertionRequest;
  onBatchApply: (request: WebflowBatchInsertionRequest) => Promise<WebflowBatchInsertionResult> | void;
  onProgress?: (progress: BatchProgress) => void;
  onError?: (error: Error) => void;
  onRollback?: (rollbackId: string) => Promise<void> | void;
  loading?: boolean;
  success?: boolean;
  error?: string;
  disabled?: boolean;
  showAffectedCount?: boolean;
  showEstimatedTime?: boolean;
  progress?: BatchProgress;
  batchResult?: WebflowBatchInsertionResult;
  rollbackLoading?: boolean;
  requireRollbackConfirmation?: boolean;
  // Impact analysis props
  pages?: WebflowPage[];
  cmsItems?: WebflowCMSItem[];
  enableImpactAnalysis?: boolean;
}

interface OperationGroup {
  type: string;
  count: number;
  label: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  operations: OperationGroup[];
  affectedPages: number;
  affectedCmsItems: number;
  estimatedTime: string;
  onProceed: () => void;
  onCancel: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  operationDetails?: WebflowInsertionRequest[];
  impactAnalysis?: ImpactAnalysis;
  showImpactAnalysis?: boolean;
  onToggleImpactAnalysis?: () => void;
}

interface RollbackDialogProps {
  isOpen: boolean;
  operationCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
}

function groupOperationsByType(operations: WebflowInsertionRequest[]): OperationGroup[] {
  const groups = operations.reduce((acc, op) => {
    const key = op.type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(groups).map(([type, count]) => ({
    type,
    count,
    label: getOperationLabel(type, count),
  }));
}

function getOperationLabel(type: string, count: number): string {
  const labels = {
    page_title: count === 1 ? 'page title' : 'page titles',
    meta_description: count === 1 ? 'meta description' : 'meta descriptions',
    page_seo: count === 1 ? 'page SEO update' : 'page SEO updates',
    cms_field: count === 1 ? 'CMS field' : 'CMS fields',
  };
  
  return labels[type as keyof typeof labels] || `${type} operation${count === 1 ? '' : 's'}`;
}

function getAffectedCounts(operations: WebflowInsertionRequest[]) {
  const pages = new Set<string>();
  const cmsItems = new Set<string>();

  operations.forEach(op => {
    if (op.pageId) pages.add(op.pageId);
    if (op.cmsItemId) cmsItems.add(op.cmsItemId);
  });

  return {
    pages: pages.size,
    cmsItems: cmsItems.size,
  };
}

function ConfirmationDialog({
  isOpen,
  operations,
  affectedPages,
  affectedCmsItems,
  estimatedTime,
  onProceed,
  onCancel,
  showDetails,
  onToggleDetails,
  operationDetails = [],
  impactAnalysis,
  showImpactAnalysis = false,
  onToggleImpactAnalysis,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div data-testid="batch-confirmation-dialog" className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Apply {operations.reduce((sum, group) => sum + group.count, 0)} Changes?
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {affectedPages} pages will be affected
            {affectedCmsItems > 0 && `, ${affectedCmsItems} CMS items will be affected`}
          </p>
          
          <div className="space-y-1">
            {operations.map((group) => (
              <div key={group.type} className="text-sm text-gray-700">
                {group.count} {group.label}
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Estimated time: {estimatedTime}
          </p>
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={onToggleDetails}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {impactAnalysis && onToggleImpactAnalysis && (
            <button
              onClick={onToggleImpactAnalysis}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {showImpactAnalysis ? 'Hide Impact Analysis' : 'Show Impact Analysis'}
            </button>
          )}
        </div>

        {showDetails && (
          <div data-testid="batch-operation-details" className="mb-4 p-3 bg-gray-50 rounded-md max-h-40 overflow-auto">
            {operationDetails.map((op, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1">
                <span className="font-medium">{getOperationLabel(op.type, 1)}:</span> {String(op.value)}
              </div>
            ))}
          </div>
        )}

        {showImpactAnalysis && impactAnalysis && (
          <div data-testid="batch-impact-analysis" className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Impact Analysis</h4>
            
            {/* SEO Impact */}
            <div className="mb-3">
              <div className="text-sm text-blue-800 mb-1">SEO Impact:</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Expected score improvement: +{impactAnalysis.seoImpact.expectedScoreImprovement} points</div>
                <div>Potential traffic increase: +{impactAnalysis.seoImpact.potentialTrafficIncrease.toFixed(1)}%</div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <span className="text-sm text-blue-800">Risk Level:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  impactAnalysis.riskAssessment.level === 'high' ? 'bg-red-100 text-red-800' :
                  impactAnalysis.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {impactAnalysis.riskAssessment.level.toUpperCase()}
                </span>
              </div>
              {impactAnalysis.riskAssessment.factors.length > 0 && (
                <div className="text-xs text-blue-700 space-y-1">
                  {impactAnalysis.riskAssessment.factors.map((factor, index) => (
                    <div key={index}>• {factor.description}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {impactAnalysis.riskAssessment.recommendations.length > 0 && (
              <div>
                <div className="text-sm text-blue-800 mb-1">Recommendations:</div>
                <div className="text-xs text-blue-700 space-y-1">
                  {impactAnalysis.riskAssessment.recommendations.map((rec, index) => (
                    <div key={index}>• {rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

function RollbackDialog({ isOpen, operationCount, onConfirm, onCancel }: RollbackDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div data-testid="rollback-confirmation-dialog" className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rollback Changes?</h3>
        <p className="text-sm text-gray-600 mb-4">
          This will undo all {operationCount} changes that were applied. This action cannot be undone.
        </p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Rollback
          </button>
        </div>
      </div>
    </div>
  );
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

export function BatchApplyButton({
  batchRequest,
  onBatchApply,
  onProgress,
  onError,
  onRollback,
  loading = false,
  success = false,
  error,
  disabled = false,
  showAffectedCount = false,
  showEstimatedTime = false,
  progress,
  batchResult,
  rollbackLoading = false,
  requireRollbackConfirmation = false,
  pages = [],
  cmsItems = [],
  enableImpactAnalysis = false,
}: BatchApplyButtonProps): React.ReactElement {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRollbackConfirmation, setShowRollbackConfirmation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | undefined>(undefined);
  const [impactAnalysisLoading, setImpactAnalysisLoading] = useState(false);

  const operationGroups = useMemo(() => 
    groupOperationsByType(batchRequest.operations), 
    [batchRequest.operations]
  );

  const { pages: affectedPages, cmsItems: affectedCmsItems } = useMemo(() => 
    getAffectedCounts(batchRequest.operations), 
    [batchRequest.operations]
  );

  const estimatedSeconds = batchRequest.operations.length * 2; // 2 seconds per operation
  const estimatedTime = formatEstimatedTime(estimatedSeconds);

  const hasOperations = batchRequest.operations.length > 0;
  const isDisabled = disabled || !hasOperations || loading || isProcessing;
  const hasError = Boolean(error);
  const canRollback = success && batchResult?.rollbackId && onRollback;

  const handleApplyClick = async () => {
    if (batchRequest.confirmationRequired) {
      setShowConfirmation(true);
      
      // Perform impact analysis if enabled
      if (enableImpactAnalysis && !impactAnalysis) {
        setImpactAnalysisLoading(true);
        try {
          const analysis = await analyzeImpact(batchRequest.operations, { pages, cmsItems });
          setImpactAnalysis(analysis);
        } catch (error) {
          console.warn('Impact analysis failed:', error);
          // Continue without impact analysis
        } finally {
          setImpactAnalysisLoading(false);
        }
      }
      return;
    }
    
    await handleBatchApply();
  };

  const handleBatchApply = async () => {
    setIsProcessing(true);
    try {
      await onBatchApply(batchRequest);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmation = async () => {
    setShowConfirmation(false);
    await handleBatchApply();
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleRollbackClick = () => {
    if (requireRollbackConfirmation) {
      setShowRollbackConfirmation(true);
    } else {
      handleRollback();
    }
  };

  const handleRollback = async () => {
    if (!batchResult?.rollbackId || !onRollback) return;
    
    try {
      await onRollback(batchResult.rollbackId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  };

  const handleRollbackConfirm = () => {
    setShowRollbackConfirmation(false);
    handleRollback();
  };

  const handleRollbackCancel = () => {
    setShowRollbackConfirmation(false);
  };

  const getButtonClass = () => {
    let baseClass = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
    
    if (isDisabled) {
      baseClass += " opacity-50 cursor-not-allowed";
    }
    
    if (hasError) {
      return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
    }
    
    if (success) {
      return `${baseClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
    }
    
    return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  };

  const getButtonContent = () => {
    if (loading || isProcessing) {
      return (
        <>
          <LoadingSpinner testId="batch-loading-spinner" />
          <span className="ml-2">
            {progress ? `Applying ${progress.current} of ${progress.total}` : 'Processing...'}
          </span>
        </>
      );
    }
    
    if (hasError) {
      return (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="ml-2">Retry Batch</span>
        </>
      );
    }
    
    if (success) {
      return (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="ml-2">
            {batchResult ? `${batchResult.succeeded} changes applied successfully` : 'Batch Complete'}
          </span>
        </>
      );
    }
    
    return (
      <>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="ml-2">Apply {batchRequest.operations.length} Changes</span>
      </>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleApplyClick}
          disabled={isDisabled}
          className={getButtonClass()}
          aria-describedby="batch-info"
        >
          {getButtonContent()}
        </button>

        {canRollback && (
          <button
            onClick={handleRollbackClick}
            disabled={rollbackLoading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {rollbackLoading ? (
              <>
                <LoadingSpinner testId="rollback-loading-spinner" />
                <span className="ml-2">Rolling Back...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="ml-2">Rollback Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      <div id="batch-info" className="text-sm text-gray-600">
        <span>
          {batchRequest.operations.length} operations: {affectedPages} pages, {affectedCmsItems} CMS items
        </span>
        {showEstimatedTime && (
          <span className="ml-2">• Estimated time: {estimatedTime}</span>
        )}
      </div>

      {(loading || isProcessing) && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span role="status" aria-live="polite">
              Applying {progress.current} of {progress.total}
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <div data-testid="batch-progress-bar" className="w-full bg-gray-200 rounded-full h-2">
            <div
              data-testid="batch-progress-fill"
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Applying {getOperationLabel(progress.currentOperation.type, 1)}
          </p>
        </div>
      )}

      {success && batchResult && (
        <div data-testid="batch-success-state" className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            {batchResult.succeeded} changes applied successfully
            {batchResult.failed > 0 && `, ${batchResult.failed} failed`}
          </p>
        </div>
      )}

      {batchResult && batchResult.failed > 0 && (
        <div data-testid="batch-partial-failure-state" className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            {batchResult.succeeded} succeeded, {batchResult.failed} failed
          </p>
        </div>
      )}

      {hasError && (
        <div data-testid="batch-error-state" className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {batchResult?.results && batchResult.results.some(r => !r.success) && (
        <div data-testid="batch-operation-errors" className="space-y-2">
          {batchResult.results.map((result, index) => {
            if (result.success) return null;
            
            return (
              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                <span className="font-medium">Operation {index + 1}: </span>
                <span className="text-red-700">{result.error?.msg || 'Unknown error'}</span>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmation}
        operations={operationGroups}
        affectedPages={affectedPages}
        affectedCmsItems={affectedCmsItems}
        estimatedTime={estimatedTime}
        onProceed={handleConfirmation}
        onCancel={handleCancelConfirmation}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
        operationDetails={batchRequest.operations}
        impactAnalysis={impactAnalysis}
        showImpactAnalysis={showImpactAnalysis}
        onToggleImpactAnalysis={() => setShowImpactAnalysis(!showImpactAnalysis)}
      />

      <RollbackDialog
        isOpen={showRollbackConfirmation}
        operationCount={batchRequest.operations.length}
        onConfirm={handleRollbackConfirm}
        onCancel={handleRollbackCancel}
      />
    </div>
  );
}