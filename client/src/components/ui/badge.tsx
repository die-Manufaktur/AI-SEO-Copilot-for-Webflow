import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-transparent px-2.5 py-0.5 bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "rounded-full border border-transparent px-2.5 py-0.5 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-[#FF4343] text-black border border-[rgba(255,255,255,0.40)] rounded-[1.6875rem] px-3 py-2 gap-3 [box-shadow:0_2px_6.6px_rgba(255,67,67,0.30)] hover:brightness-105",
        warning:
          "bg-[#FFD064] text-black border border-[rgba(255,255,255,0.40)] rounded-[1.6875rem] px-3 py-2 gap-3 [box-shadow:0_2px_6.6px_rgba(255,208,100,0.30)] hover:brightness-105",
        success:
          "bg-[#A2FFB4] text-black border border-[rgba(255,255,255,0.40)] rounded-[1.6875rem] px-3 py-2 gap-3 [box-shadow:0_2px_6.6px_rgba(72,201,133,0.30)] hover:brightness-105",
        outline: "rounded-full border px-2.5 py-0.5 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
