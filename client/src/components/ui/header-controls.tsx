import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderControlsProps {
  className?: string;
  onRefresh?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const HeaderControls = React.forwardRef<HTMLDivElement, HeaderControlsProps>(
  ({ className, onRefresh, onMinimize, onClose }, ref) => {
    const handleRefresh = () => {
      onRefresh?.();
    };

    const handleMinimize = () => {
      onMinimize?.();
    };

    const handleClose = () => {
      onClose?.();
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-spacing-sm",
          className
        )}
        role="group"
        aria-label="Header controls"
      >
        <button
          type="button"
          className="w-6 h-6 rounded-radius-sm transition-colors hover:text-text-primary hover:bg-input-bg"
          style={{ color: 'var(--text-muted)' }}
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className="w-6 h-6 rounded-radius-sm transition-colors hover:text-text-primary hover:bg-input-bg"
          style={{ color: 'var(--text-muted)' }}
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 12h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className="w-6 h-6 rounded-radius-sm transition-colors hover:text-text-primary hover:bg-input-bg"
          style={{ color: 'var(--text-muted)' }}
          onClick={handleClose}
          aria-label="Close"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  }
);

HeaderControls.displayName = "HeaderControls";

export default HeaderControls;