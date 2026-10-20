import { SelectHTMLAttributes, forwardRef } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

/**
 * Drop-in replacement for a bare <select> that matches the rest of the
 * design system (pill shape, inset border, custom chevron) instead of
 * showing raw browser chrome. Still a real native <select> under the
 * hood — the dropdown panel itself is OS-rendered and can't be restyled
 * from CSS, but that's also what gives it working keyboard/mobile
 * behavior for free, so it's kept rather than reimplemented.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", wrapperClassName = "", children, ...props }, ref) => {
    return (
      <div className={`relative inline-block ${wrapperClassName}`}>
        <select
          ref={ref}
          className={`appearance-none rounded-full bg-white pl-4 pr-9 shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none focus:shadow-[inset_0_0_0_2px_#1A5C52] disabled:opacity-60 ${className}`}
          {...props}
        >
          {children}
        </select>
        <CaretDown
          size={12}
          weight="bold"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    );
  }
);
Select.displayName = "Select";
