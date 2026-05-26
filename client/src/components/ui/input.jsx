import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-sm shadow-black/[0.02] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--ink)] placeholder:text-[var(--slate)]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arc)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
