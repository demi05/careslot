import { InputHTMLAttributes, forwardRef } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  requiredBadge?: boolean;
  hideLabel?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, requiredBadge, hideLabel, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div>
        {!hideLabel && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ink">
            {label}
            {requiredBadge && <span className="ml-1 font-semibold text-accent-dark">(required)</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`h-[50px] w-full rounded-full bg-white px-[18px] text-sm font-sans text-ink shadow-[inset_0_0_0_1px_#DCE5E2] placeholder:text-muted focus:outline-none focus:shadow-[inset_0_0_0_2px_#1A5C52] ${
            error ? "shadow-[inset_0_0_0_1px_#F3B4B4]" : ""
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 pl-1.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 pl-1.5 text-xs text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
TextField.displayName = "TextField";
