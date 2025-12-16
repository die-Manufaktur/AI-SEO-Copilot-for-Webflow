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
          "flex h-11 w-full rounded-[10px] border-0 bg-[#444444] px-4 py-3 text-[16px] text-white placeholder:text-[#c7c7c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a72f5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50",
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
