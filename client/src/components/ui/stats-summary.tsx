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
          "flex items-center gap-4 bg-input-bg border border-input-bg rounded-full px-6 py-3 w-fit mx-auto my-6 text-font-size-sm font-font-weight-medium",
          className
        )}
        role="status"
        aria-label={`Summary: ${passed} items passed, ${toImprove} items need improvement`}
      >
        <span className="flex items-center gap-2" style={{ color: 'var(--color-green)' }}>
          ▲ {passed} passed
        </span>
        <span className="flex items-center gap-2" style={{ color: 'var(--color-red)' }}>
          ▼ {toImprove} to improve
        </span>
      </div>
    );
  }
);

StatsSummary.displayName = "StatsSummary";

export default StatsSummary;