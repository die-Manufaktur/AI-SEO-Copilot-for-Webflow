import React from 'react';
import { cn } from '@/lib/utils';

interface StatsSummaryProps {
  passed: number;
  toImprove: number;
  className?: string;
}

export const StatsSummary = React.forwardRef<HTMLDivElement, StatsSummaryProps>(
  ({ passed, toImprove, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-4 bg-background3 rounded-full px-5 py-2 w-fit mx-auto my-6 text-sm font-medium",
          className
        )}
        style={{ borderRadius: '41px' }}
        role="status"
        aria-label={`Summary: ${passed} items passed, ${toImprove} items need improvement`}
      >
        <span className="flex items-center gap-1.5" style={{ color: 'var(--greenText)' }}>
          <span style={{ fontSize: '10px' }}>▲</span> {passed} passed
        </span>
        <span className="flex items-center gap-1.5" style={{ color: 'var(--redText)' }}>
          <span style={{ fontSize: '10px' }}>▼</span> {toImprove} to improve
        </span>
      </div>
    );
  }
);

StatsSummary.displayName = "StatsSummary";

export default StatsSummary;