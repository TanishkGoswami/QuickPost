import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn("flex min-h-[80px] w-full rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-sm shadow-black/[0.02] placeholder:text-[var(--slate)]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arc)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:opacity-60", className)}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
