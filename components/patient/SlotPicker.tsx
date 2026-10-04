"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDayLabel, formatTime, toISODate } from "@/lib/format";

function nextDays(count: number): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

interface SlotPickerProps {
  doctorId: string;
  onSelect: (date: string, time: string) => void;
  selected?: { date: string; time: string } | null;
}

export function SlotPicker({ doctorId, onSelect, selected }: SlotPickerProps) {
  const [days] = useState(() => nextDays(14));
  const [selectedDate, setSelectedDate] = useState(() => toISODate(days[0]));
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(
    async (date: string) => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_doctor_id: doctorId,
        p_date: date,
      });
      if (error) {
        setError("Couldn't load available times. Please try again.");
        setSlots([]);
      } else {
        setSlots((data ?? []).map((row) => row.slot_time));
      }
      setLoading(false);
    },
    [doctorId]
  );

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-1 overflow-x-auto pb-1">
        {days.slice(0, 6).map((d) => {
          const iso = toISODate(d);
          const active = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDate(iso)}
              className={`flex shrink-0 flex-col items-center gap-2 rounded-full px-1 pb-1.5 pt-2.5 ${
                active ? "bg-primary text-white" : "text-muted"
              }`}
              style={{ width: 48 }}
            >
              <span className="text-xs font-medium">{formatDayLabel(d).slice(0, 3)}</span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold ${
                  active ? "bg-white text-primary" : "text-ink"
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-[28px] bg-surface p-4 shadow-[0_12px_30px_-22px_rgba(20,35,31,0.45)]">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-sm font-bold text-ink">Choose a time</span>
          {!loading && !error && <span className="text-xs text-muted">{slots.length} free</span>}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && loading && <p className="text-sm text-muted">Loading available times…</p>}
        {!error && !loading && slots.length === 0 && (
          <p className="text-sm text-muted">No available times on this day. Try another date.</p>
        )}
        {!error && !loading && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((time) => {
              const active = selected?.date === selectedDate && selected?.time === time;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onSelect(selectedDate, time)}
                  className={`flex h-[38px] items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
                    active ? "bg-primary text-white" : "bg-background text-ink hover:bg-primary-tint"
                  }`}
                >
                  {formatTime(time)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
