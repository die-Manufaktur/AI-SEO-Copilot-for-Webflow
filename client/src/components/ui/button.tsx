import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-[#1a72f5] text-white hover:bg-[#1560d4] active:bg-[#1050b8] rounded-[27px]",
        destructive:
          "bg-[#ff4343] text-white hover:bg-[#ff4343]/90 rounded-[27px]",
        outline:
          "border border-[#444444] bg-transparent hover:bg-[#323232] text-white rounded-[27px]",
        secondary:
          "bg-[#323232] text-white hover:bg-[#444444] rounded-[27px]",
        ghost: "hover:bg-[#323232] text-white rounded-[10px]",
        link: "text-[#1a72f5] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 py-1.5",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
