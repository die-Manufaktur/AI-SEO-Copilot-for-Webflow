import React from 'react';
import { cn } from '@/lib/utils';

interface DevBadgeProps {
  className?: string;
}

export const DevBadge = React.forwardRef<HTMLSpanElement, DevBadgeProps>(
  ({ className }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "bg-primary-blue text-font-size-xs font-font-weight-medium rounded-radius-sm px-spacing-xs py-spacing-xs uppercase",
          className
        )}
        style={{ color: 'var(--text-primary)' }}
        role="status"
        aria-label="Development environment indicator"
        tabIndex={0}
      >
        DEV
      </span>
    );
  }
);

DevBadge.displayName = "DevBadge";

export default DevBadge;