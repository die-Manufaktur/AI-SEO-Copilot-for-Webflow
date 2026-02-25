import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  label = 'SEO Score',
  ariaLabel,
  className
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  // Calculate stroke dash array for the progress circle
  const radius = 68; // radius of the circle
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const filterId = useId();
  const finalAriaLabel = ariaLabel || `${label}: ${clampedValue} out of 100`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="relative"
        style={{ width: '160px', height: '160px' }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={finalAriaLabel}
      >
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.5)" />
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#4A4A4A"
            strokeWidth="16"
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#${filterId})`}
            className="text-score-coral transition-all duration-700 ease-in-out"
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-score-coral font-bold text-5xl leading-none">
            {clampedValue}
          </span>
        </div>
      </div>

      {/* Label below */}
      <div className="mt-2 text-sm text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
};

export default CircularProgress;