import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StatsSummaryProps {
  passed: number;
  toImprove: number;
  className?: string;
}

export const StatsSummary = React.forwardRef<HTMLParagraphElement, StatsSummaryProps>(
  ({ passed, toImprove, className }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-font-size-sm font-font-weight-medium m-0 flex items-center gap-2",
          className
        )}
        role="status"
        aria-label={`Summary: ${passed} items passed, ${toImprove} items need improvement`}
      >
        <span className="flex items-center gap-1" style={{ color: '#4CAF50' }}>
          <ChevronUp className="h-3 w-3" />
          {passed} passed
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>•</span>
        <span className="flex items-center gap-1" style={{ color: '#FF5252' }}>
          <ChevronDown className="h-3 w-3" />
          {toImprove} to improve
        </span>
      </p>
    );
  }
);

StatsSummary.displayName = "StatsSummary";

export default StatsSummary;