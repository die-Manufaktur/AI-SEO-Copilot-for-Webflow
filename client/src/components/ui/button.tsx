import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-button rounded-radius-xl ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-primary-blue text-text-primary hover:bg-primary-blue-hover active:bg-primary-active",
        destructive:
          "bg-error text-text-primary hover:opacity-90",
        outline:
          "border border-color bg-transparent text-text-primary hover:bg-input-bg",
        secondary:
          "bg-input-bg text-text-primary hover:bg-card-bg",
        ghost: "hover:bg-input-bg text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        optimize:
          "bg-primary-blue text-text-primary rounded-[27px] border border-[rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-[var(--spacing-compact-sm)] font-normal text-[var(--font-size-compact-base)] leading-[1.25rem] box-border",
      },
      size: {
        default: "h-button-height-lg px-6 py-3",
        sm: "h-button-height-sm px-4 py-2",
        lg: "h-button-height-lg px-8 py-4",
        icon: "h-button-height-sm w-8",
        optimize: "h-[var(--button-height-compact)] px-[var(--padding-compact-button-x)] py-[var(--padding-compact-button-y)]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
