/**
 * Impact Analysis Service
 * GREEN Phase: Minimal implementation to make tests pass
 */

import type {
  WebflowInsertionRequest,
  WebflowPage,
  WebflowCMSItem,
} from '../types/webflow-data-api';

export interface ImpactAnalysisRequest {
  pages?: WebflowPage[];
  cmsItems?: WebflowCMSItem[];
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedResources?: string[];
}

export interface TrafficImpactFactor {
  type: string;
  impact: number; // Percentage increase
  description: string;
}

export interface TrafficImpact {
  estimatedIncrease: number; // Percentage
  confidence: number; // 0-100
  timeframe: string;
  factors: TrafficImpactFactor[];
}

export interface TimeEstimate {
  seconds: number;
  formattedTime: string;
  breakdown?: {
    operationTime: number;
    rateLimitBuffer: number;
    retryBuffer: number;
  };
}

export interface PreviewChange {
  resourceId: string;
  field: string;
  before: any;
  after: any;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ImpactPreview {
  before: Record<string, any>;
  after: Record<string, any>;
  changes: PreviewChange[];
}

export interface ImpactAnalysis {
  affectedResources: {
    pages: number;
    cmsItems: number;
    totalOperations: number;
  };
  seoImpact: {
    titleChanges: number;
    descriptionChanges: number;
    expectedScoreImprovement: number;
    potentialTrafficIncrease: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: RiskFactor[];
    recommendations: string[];
  };
  estimatedTime: TimeEstimate;
  preview: ImpactPreview;
}

const OPERATION_BASE_TIME = 2; // seconds per operation
const RATE_LIMIT_THRESHOLD = 60; // operations per minute
const RETRY_BUFFER_MULTIPLIER = 1.2;

/**
 * Analyze impact of batch operations
 */
export async function analyzeImpact(
  operations: WebflowInsertionRequest[],
  resources: ImpactAnalysisRequest
): Promise<ImpactAnalysis> {
  const { pages = [], cmsItems = [] } = resources;

  // Count affected resources
  const affectedPageIds = new Set<string>();
  const affectedCmsItemIds = new Set<string>();

  operations.forEach(op => {
    if (op.pageId) affectedPageIds.add(op.pageId);
    if (op.cmsItemId) affectedCmsItemIds.add(op.cmsItemId);
  });

  const affectedResources = {
    pages: affectedPageIds.size,
    cmsItems: affectedCmsItemIds.size,
    totalOperations: operations.length,
  };

  // Analyze SEO impact
  const seoImpact = calculateSEOImpact(operations, pages);

  // Assess risks
  const riskAssessment = assessRisk(operations, pages, cmsItems);

  // Estimate completion time
  const estimatedTime = estimateTimeToComplete(operations);

  // Generate preview
  const preview = generatePreview(operations, pages, cmsItems);

  return {
    affectedResources,
    seoImpact,
    riskAssessment,
    estimatedTime,
    preview,
  };
}

/**
 * Calculate traffic impact estimation
 */
export function calculateTrafficImpact(
  operations: WebflowInsertionRequest[],
  pages: WebflowPage[]
): TrafficImpact {
  const factors: TrafficImpactFactor[] = [];
  let totalImpact = 0;
  let baseConfidence = 30;

  // Analyze each operation type
  const titleChanges = operations.filter(op => op.type === 'page_title').length;
  const descriptionChanges = operations.filter(op => op.type === 'meta_description').length;
  const seoChanges = operations.filter(op => op.type === 'page_seo').length;

  if (titleChanges > 0) {
    const titleImpact = titleChanges * 3; // 3% per title improvement
    factors.push({
      type: 'title_optimization',
      impact: titleImpact,
      description: `${titleChanges} title improvements can increase click-through rates`,
    });
    totalImpact += titleImpact;
    baseConfidence += 15;
  }

  if (descriptionChanges > 0) {
    const descImpact = descriptionChanges * 5; // 5% per description improvement
    factors.push({
      type: 'description_optimization',
      impact: descImpact,
      description: `${descriptionChanges} meta description improvements enhance search snippets`,
    });
    totalImpact += descImpact;
    baseConfidence += 20;
  }

  if (seoChanges > 0) {
    const seoImpact = seoChanges * 8; // 8% per comprehensive SEO change
    factors.push({
      type: 'comprehensive_seo',
      impact: seoImpact,
      description: `${seoChanges} comprehensive SEO improvements`,
    });
    totalImpact += seoImpact;
    baseConfidence += 25;
  }

  // Check for homepage modifications (higher impact)
  const homepageOperations = operations.filter(op => {
    const page = pages.find(p => p._id === op.pageId);
    return page?.isHomePage;
  });

  if (homepageOperations.length > 0) {
    const homepageBonus = homepageOperations.length * 3;
    factors.push({
      type: 'homepage_optimization',
      impact: homepageBonus,
      description: 'Homepage optimizations have higher visibility impact',
    });
    totalImpact += homepageBonus;
    baseConfidence += 10;
  }

  // Cap total impact and confidence
  const estimatedIncrease = Math.min(totalImpact, 50); // Max 50% increase
  const confidence = Math.min(baseConfidence, 95); // Max 95% confidence

  // Determine timeframe based on impact level
  const timeframe = estimatedIncrease > 20 ? '2-3 months' : 
                   estimatedIncrease > 10 ? '4-6 weeks' : 
                   '6-8 weeks';

  return {
    estimatedIncrease,
    confidence,
    timeframe,
    factors,
  };
}

/**
 * Estimate time to complete operations
 */
export function estimateTimeToComplete(operations: WebflowInsertionRequest[]): TimeEstimate {
  const operationCount = operations.length;
  
  // Base time calculation
  let operationTime = operationCount * OPERATION_BASE_TIME;

  // Complex operations take longer
  const complexOperations = operations.filter(op => 
    op.type === 'page_seo' || op.type === 'cms_field'
  ).length;
  operationTime += complexOperations * 1; // Extra second for complex ops

  // Rate limiting buffer
  const rateLimitBuffer = operationCount > RATE_LIMIT_THRESHOLD ? 
    Math.ceil(operationCount / RATE_LIMIT_THRESHOLD) * 60 : 0;

  // Retry buffer (20% extra time)
  const retryBuffer = Math.ceil(operationTime * (RETRY_BUFFER_MULTIPLIER - 1));

  const totalSeconds = operationTime + rateLimitBuffer + retryBuffer;

  return {
    seconds: totalSeconds,
    formattedTime: formatTime(totalSeconds),
    breakdown: {
      operationTime,
      rateLimitBuffer,
      retryBuffer,
    },
  };
}

/**
 * Calculate SEO impact metrics
 */
function calculateSEOImpact(
  operations: WebflowInsertionRequest[],
  pages: WebflowPage[]
): ImpactAnalysis['seoImpact'] {
  const titleChanges = operations.filter(op => 
    op.type === 'page_title' || (op.type === 'page_seo' && op.value?.title)
  ).length;

  const descriptionChanges = operations.filter(op => 
    op.type === 'meta_description' || (op.type === 'page_seo' && op.value?.description)
  ).length;

  // Estimate score improvement (simplified)
  const baseImprovement = (titleChanges * 5) + (descriptionChanges * 8);
  const expectedScoreImprovement = Math.min(baseImprovement, 40); // Cap at 40 points

  // Calculate traffic impact
  const trafficImpact = calculateTrafficImpact(operations, pages);

  return {
    titleChanges,
    descriptionChanges,
    expectedScoreImprovement,
    potentialTrafficIncrease: trafficImpact.estimatedIncrease,
  };
}

/**
 * Assess risk factors
 */
function assessRisk(
  operations: WebflowInsertionRequest[],
  pages: WebflowPage[],
  cmsItems: WebflowCMSItem[]
): ImpactAnalysis['riskAssessment'] {
  const factors: RiskFactor[] = [];
  const recommendations: string[] = [];

  // Check for homepage modifications
  const homepageOps = operations.filter(op => {
    const page = pages.find(p => p._id === op.pageId);
    return page?.isHomePage;
  });

  if (homepageOps.length > 0) {
    factors.push({
      type: 'homepage_modification',
      severity: 'medium',
      description: 'Homepage modifications have high visibility impact',
      affectedResources: homepageOps.map(op => op.pageId!),
    });
    recommendations.push('Consider testing homepage changes on staging first');
  }

  // Check for bulk operations
  if (operations.length > 20) {
    factors.push({
      type: 'bulk_operations',
      severity: 'high',
      description: `Large number of operations (${operations.length}) increases failure risk`,
    });
    recommendations.push('Consider breaking into smaller batches');
  }

  // Check for duplicate titles
  const titleOps = operations.filter(op => op.type === 'page_title');
  const titleValues = titleOps.map(op => op.value);
  const duplicateTitles = titleValues.filter((value, index) => 
    titleValues.indexOf(value) !== index
  );

  if (duplicateTitles.length > 0) {
    const affectedPageIds = titleOps
      .filter(op => duplicateTitles.includes(op.value))
      .map(op => op.pageId!);

    factors.push({
      type: 'duplicate_titles',
      severity: 'high',
      description: 'Duplicate page titles can harm SEO rankings',
      affectedResources: affectedPageIds,
    });
    recommendations.push('Ensure all page titles are unique to avoid SEO conflicts');
  }

  // Check for title length issues
  const longTitles = titleOps.filter(op => 
    typeof op.value === 'string' && op.value.length > 60
  );

  if (longTitles.length > 0) {
    factors.push({
      type: 'title_length_issues',
      severity: 'medium',
      description: `${longTitles.length} titles exceed recommended length`,
      affectedResources: longTitles.map(op => op.pageId!),
    });
    recommendations.push('Consider shortening titles that exceed 60 characters for better SEO');
  }

  // Determine overall risk level
  const highRiskFactors = factors.filter(f => f.severity === 'high').length;
  const mediumRiskFactors = factors.filter(f => f.severity === 'medium').length;

  let level: 'low' | 'medium' | 'high' = 'low';
  if (highRiskFactors > 0) {
    level = 'high';
  } else if (mediumRiskFactors > 1) {
    level = 'high';
  } else if (mediumRiskFactors > 0) {
    level = 'medium';
  }

  return {
    level,
    factors,
    recommendations,
  };
}

/**
 * Generate before/after preview
 */
function generatePreview(
  operations: WebflowInsertionRequest[],
  pages: WebflowPage[],
  cmsItems: WebflowCMSItem[]
): ImpactPreview {
  const before: Record<string, any> = {};
  const after: Record<string, any> = {};
  const changes: PreviewChange[] = [];

  // Process page operations
  operations.forEach(operation => {
    if (operation.pageId) {
      const page = pages.find(p => p._id === operation.pageId);
      if (!page) return;

      // Initialize before/after states for this page
      if (!before[operation.pageId]) {
        before[operation.pageId] = {
          title: page.title,
          seo: page.seo || {},
        };
      }

      if (!after[operation.pageId]) {
        after[operation.pageId] = {
          title: page.title,
          seo: page.seo || {},
        };
      }

      // Apply operation to after state and track change
      let beforeValue: any;
      let afterValue: any;
      let field: string;

      switch (operation.type) {
        case 'page_title':
          beforeValue = page.title;
          afterValue = operation.value;
          after[operation.pageId].title = operation.value;
          field = 'title';
          break;

        case 'meta_description':
          beforeValue = page.seo?.description;
          afterValue = operation.value;
          after[operation.pageId].seo.description = operation.value;
          field = 'seo.description';
          break;

        case 'page_seo':
          if (operation.value?.title) {
            beforeValue = page.seo?.title;
            afterValue = operation.value.title;
            after[operation.pageId].seo.title = operation.value.title;
            field = 'seo.title';
          } else if (operation.value?.description) {
            beforeValue = page.seo?.description;
            afterValue = operation.value.description;
            after[operation.pageId].seo.description = operation.value.description;
            field = 'seo.description';
          } else {
            field = 'seo';
            beforeValue = page.seo;
            afterValue = operation.value;
          }
          break;

        default:
          return;
      }

      // Determine impact
      const impact = determineImpact(beforeValue, afterValue, operation.type);

      changes.push({
        resourceId: operation.pageId,
        field,
        before: beforeValue,
        after: afterValue,
        impact,
      });
    }

    // Process CMS operations
    if (operation.cmsItemId) {
      const item = cmsItems.find(i => i._id === operation.cmsItemId);
      if (!item) return;

      if (!before[operation.cmsItemId]) {
        before[operation.cmsItemId] = { ...item.fieldData };
      }

      if (!after[operation.cmsItemId]) {
        after[operation.cmsItemId] = { ...item.fieldData };
      }

      const fieldName = operation.fieldId || 'unknown';
      const beforeValue = item.fieldData?.[fieldName];
      const afterValue = operation.value;

      after[operation.cmsItemId][fieldName] = operation.value;

      changes.push({
        resourceId: operation.cmsItemId,
        field: fieldName,
        before: beforeValue,
        after: afterValue,
        impact: 'positive', // Assume CMS changes are positive
      });
    }
  });

  return {
    before,
    after,
    changes,
  };
}

/**
 * Determine impact of a change
 */
function determineImpact(beforeValue: any, afterValue: any, operationType: string): 'positive' | 'negative' | 'neutral' {
  if (!beforeValue && afterValue) {
    return 'positive'; // Adding content is positive
  }

  if (beforeValue && !afterValue) {
    return 'negative'; // Removing content is negative
  }

  // For title and description changes, longer is generally better (up to limits)
  if (operationType === 'page_title' || operationType === 'meta_description') {
    if (typeof beforeValue === 'string' && typeof afterValue === 'string') {
      const beforeLength = beforeValue.length;
      const afterLength = afterValue.length;
      
      // Title optimal range: 30-60 characters
      // Description optimal range: 120-160 characters
      const optimalRange = operationType === 'page_title' ? [30, 60] : [120, 160];
      
      const beforeOptimal = beforeLength >= optimalRange[0] && beforeLength <= optimalRange[1];
      const afterOptimal = afterLength >= optimalRange[0] && afterLength <= optimalRange[1];
      
      if (!beforeOptimal && afterOptimal) return 'positive';
      if (beforeOptimal && !afterOptimal) return 'negative';
      
      // If both are in/out of optimal range, longer is better (up to the upper limit)
      if (afterLength > beforeLength && afterLength <= optimalRange[1]) return 'positive';
      if (afterLength < beforeLength && beforeLength > optimalRange[1]) return 'positive';
    }
  }

  return 'neutral';
}

/**
 * Format time duration
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}