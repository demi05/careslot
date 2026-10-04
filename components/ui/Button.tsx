import { ButtonHTMLAttributes, forwardRef } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(224,123,57,0.3)] disabled:hover:translate-y-0 disabled:hover:shadow-none",
  outline: "bg-white text-primary border-2 border-primary hover:bg-primary-tint",
  ghost: "bg-white text-ink border border-border hover:bg-background",
};

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-all duration-150 ease-out ${variantClasses[variant]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Please wait…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

/**
 * The split pill CTA used throughout the design: label on a teal/orange
 * pill with a circular icon bubble docked at the trailing edge.
 */
export const PillCTAButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = "", children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-white transition-all duration-150 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      <span className="text-[15px] font-bold">{children}</span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
        <ArrowRight size={18} weight="bold" />
      </span>
    </button>
  )
);
PillCTAButton.displayName = "PillCTAButton";
