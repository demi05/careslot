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
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const active = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDate(iso)}
              className={`shrink-0 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-ink hover:bg-background"
              }`}
            >
              {formatDayLabel(d)}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && loading && <p className="text-sm text-muted">Loading available times…</p>}
      {!error && !loading && slots.length === 0 && (
        <p className="text-sm text-muted">No available times on this day. Try another date.</p>
      )}
      {!error && !loading && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((time) => {
            const active = selected?.date === selectedDate && selected?.time === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => onSelect(selectedDate, time)}
                className={`rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-[#BEE0D3] bg-[#E6F4EC] text-[#1E7A46] hover:bg-[#CFEBDB]"
                }`}
              >
                {formatTime(time)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
