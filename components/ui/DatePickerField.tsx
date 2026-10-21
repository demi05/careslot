"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISO(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Custom calendar popover, matching the rest of the design system — a native <input type="date"> can't be restyled past its box, so this replaces it entirely rather than just theming the trigger. */
export function DatePickerField({ value, onChange, placeholder = "Any date", className = "" }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleOpen() {
    setOpen((v) => {
      if (!v) setViewMonth(selected ?? new Date());
      return !v;
    });
  }

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayISO = toISO(new Date());

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex h-[46px] items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-ink shadow-[inset_0_0_0_1px_#E2EAE8] focus:outline-none"
      >
        <CalendarBlank size={16} className="text-muted" />
        {selected ? selected.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : placeholder}
      </button>

      {open && (
        <div className="absolute left-0 top-[52px] z-30 w-[280px] rounded-[24px] bg-white p-4 shadow-[0_20px_44px_-18px_rgba(20,35,31,0.35)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background"
              aria-label="Previous month"
            >
              <CaretLeft size={14} />
            </button>
            <span className="text-sm font-bold text-ink">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background"
              aria-label="Next month"
            >
              <CaretRight size={14} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <span key={i} />;
              const iso = toISO(date);
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${
                    isSelected
                      ? "bg-primary text-white"
                      : isToday
                        ? "bg-primary-tint text-primary"
                        : "text-ink hover:bg-background"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-3 w-full rounded-full py-2 text-center text-xs font-bold text-danger hover:bg-danger-tint"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
