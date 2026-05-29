import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-2xl border border-coconut-brown/15 bg-white/85 px-4 text-sm text-coconut-bark outline-none transition placeholder:text-coconut-bark/35 focus:border-coconut-leaf focus:ring-4 focus:ring-coconut-leaf/10",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
