import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-button ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-primary-blue text-text-primary hover:bg-primary-blue-hover active:bg-primary-active rounded-radius-xl",
        destructive:
          "bg-error text-text-primary hover:opacity-90 rounded-radius-xl",
        outline:
          "border border-color bg-transparent text-text-primary hover:bg-input-bg rounded-radius-xl",
        secondary:
          "bg-input-bg text-text-primary hover:bg-card-bg rounded-radius-xl",
        ghost: "hover:bg-input-bg text-text-primary rounded-radius-xl",
        link: "text-primary underline-offset-4 hover:underline",
        optimize:
          "bg-[#1A72F5] text-text-primary !rounded-[9999px] hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center font-medium box-border [box-shadow:0_2px_6.6px_0_rgba(26,114,245,0.30)]",
      },
      size: {
        default: "h-button-height-lg px-6 py-3",
        sm: "h-button-height-sm px-4 py-2",
        lg: "h-button-height-lg px-8 py-4",
        icon: "h-button-height-sm w-8",
        optimize: "h-14 px-8 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default"
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
