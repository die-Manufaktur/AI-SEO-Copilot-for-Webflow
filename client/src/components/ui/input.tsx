import * as React from "react"

import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full p-[0.875rem] rounded-[0.625rem] border border-[var(--color-bg-500)] bg-[var(--color-bg-500)] text-[16px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] shadow-[0_1px_2px_0_rgba(18,13,37,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-900)] disabled:cursor-not-allowed disabled:opacity-50 box-border overflow-hidden text-ellipsis",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
