import { InputHTMLAttributes, forwardRef } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  requiredBadge?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, requiredBadge, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
          {requiredBadge && (
            <span className="ml-1 font-semibold text-accent-dark">(required)</span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full rounded-lg border px-3.5 py-3.5 text-base font-sans text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            error ? "border-danger" : "border-gray-300 focus:border-primary"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
TextField.displayName = "TextField";
