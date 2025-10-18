import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabletInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const TabletInput = React.forwardRef<HTMLInputElement, TabletInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass",
          // Optimizado para touch en tablet
          "min-h-[48px] touch-manipulation",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
TabletInput.displayName = "TabletInput"

export { TabletInput }