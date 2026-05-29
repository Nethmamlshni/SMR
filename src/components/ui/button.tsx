import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-coconut-leaf text-white shadow-soft hover:bg-coconut-moss",
  secondary: "bg-coconut-shell text-white shadow-premium hover:bg-coconut-bark",
  outline: "border border-coconut-brown/25 bg-white/70 text-coconut-bark hover:bg-coconut-cream",
  ghost: "text-coconut-bark hover:bg-coconut-cream/70",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
