import { cn } from "../../lib/utils";
import { cva } from "class-variance-authority";
import { FC } from "react";

interface ProgressCircleProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
  labelClassName?: string;
  scoreText?: string;
}

const scoreColorVariants = cva("transition-colors duration-300", {
  variants: {
    scoreLevel: {
      low: "stroke-redText",
      medium: "stroke-yellowText",
      high: "stroke-greenText",
    },
  },
  defaultVariants: {
    scoreLevel: "medium",
  },
});

const textColorVariants = cva("transition-colors duration-300", {
  variants: {
    scoreLevel: {
      low: "text-redText",
      medium: "text-yellowText",
      high: "text-greenText",
    },
  },
  defaultVariants: {
    scoreLevel: "medium",
  },
});

export const ProgressCircle: FC<ProgressCircleProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  className,
  labelClassName,
  scoreText,
}) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Define score level based on percentage
  const scoreLevel = percentage < 50 ? "low" : percentage < 80 ? "medium" : "high";
  
  // SVG parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-background3"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={scoreColorVariants({ scoreLevel })}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", textColorVariants({ scoreLevel }), labelClassName)}>
            {Math.round(percentage)}
          </span>
          {scoreText && (
            <span className="text-xs text-text2 mt-1">{scoreText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressCircle;
