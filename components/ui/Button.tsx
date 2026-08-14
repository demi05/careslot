import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(224,123,57,0.3)] disabled:hover:translate-y-0 disabled:hover:shadow-none",
  outline:
    "bg-white text-primary border-2 border-primary hover:bg-primary-tint",
  ghost:
    "bg-white text-ink border border-border hover:bg-background",
};

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[15px] font-bold transition-all duration-150 ease-out ${variantClasses[variant]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[15px] font-bold transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
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
