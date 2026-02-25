import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { Badge } from './badge';

interface CategoryCardProps {
  title: string;
  score: number;
  total: number;
  issueCount: number;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const CategoryCard = React.forwardRef<HTMLElement, CategoryCardProps>(
  ({
    title,
    score,
    total,
    issueCount,
    children,
    className,
    defaultExpanded = true,
    onToggle
  }, ref) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const getScoreColor = (score: number, total: number): string => {
      const percentage = (score / total) * 100;
      if (percentage >= 67) return 'var(--color-green)';
      if (percentage >= 33) return 'var(--color-yellow)';
      return 'var(--color-red)';
    };

    const handleToggle = () => {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onToggle?.(newExpanded);
    };

    const issueText = issueCount === 1 ? 'issue' : 'issues';

    return (
      <article
        ref={ref}
        className={cn(
          "gradient-border-section rounded-[0.875rem] p-5",
          className
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between p-0 bg-transparent border-none cursor-pointer text-left"
          aria-expanded={isExpanded}
          aria-label={`Toggle ${title} category, score ${score} out of ${total}, ${issueCount} ${issueText}`}
        >
          <div className="flex items-center gap-spacing-md">
            <h3
              className="text-font-size-md font-font-weight-medium m-0"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <Badge
              variant={score === 0 ? "destructive" : score === total ? "success" : "warning"}
              className="flex items-center gap-1"
            >
              {score > 0 && <ChevronUp className="h-3 w-3" />}
              {score === 0 && <ChevronDown className="h-3 w-3" />}
              {score}/{total} {score > 0 ? 'passed' : 'to improve'}
              <ExternalLink className="h-3 w-3" />
            </Badge>
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "transition-transform duration-200 ease-in-out",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
            style={{ color: 'var(--text-muted)' }}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isExpanded && (
          <div
            className="transition-all duration-200 ease-in-out mt-spacing-md"
            data-state="open"
          >
            {children}
          </div>
        )}
        {!isExpanded && (
          <div
            className="transition-all duration-200 ease-in-out overflow-hidden max-h-0 opacity-0"
            data-state="closed"
            style={{ display: 'none' }}
            aria-hidden="true"
          >
            {/* Hidden content for screen readers */}
          </div>
        )}
      </article>
    );
  }
);

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;