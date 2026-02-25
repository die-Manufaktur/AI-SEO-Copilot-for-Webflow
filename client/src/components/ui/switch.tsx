import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[34px] w-[62px] shrink-0 cursor-pointer items-center rounded-[1.25rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 p-[3px]",
      "[border:1px_solid_var(--Stroke-BG-300,rgba(255,255,255,0.40))] [background:var(--BG-300,#787878)] [box-shadow:0_2px_6.6px_0_rgba(72,201,175,0.30)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[26px] w-[26px] rounded-full bg-[var(--color-green)] ring-0 transition-transform data-[state=checked]:translate-x-[28px] data-[state=unchecked]:translate-x-0",
        "[box-shadow:0_2px_8px_0_rgba(72,201,175,0.5)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
