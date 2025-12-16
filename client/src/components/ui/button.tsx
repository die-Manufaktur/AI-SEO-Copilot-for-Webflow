import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-primary text-text1 hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-error text-text1 hover:bg-error-dark",
        outline:
          "border border-divider bg-transparent text-text1 hover:bg-background5",
        secondary:
          "bg-button text-text1 hover:bg-button-hover",
        ghost: "hover:bg-background5 text-text1",
        link: "text-primary underline-offset-4 hover:underline",
        optimize:
          "bg-primary text-white border border-[#717171] rounded-[27px] shadow-[0px_2px_6.6px_0px_rgba(72,201,175,0.3)] hover:bg-primary-hover active:bg-primary-active tracking-[-0.096px]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        optimize: "px-4 py-[17px]",
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
