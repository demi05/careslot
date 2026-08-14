"use client";

import { useState, useEffect, useTransition, type FormEvent } from "react";
import { Plus, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createDoctorAction, addScheduleWindowAction, removeScheduleWindowAction } from "@/app/staff/doctors/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import { formatTime } from "@/lib/format";

export interface DoctorListItem {
  id: string;
  specialty: string;
  full_name: string | null;
}

interface ScheduleBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function fetchSchedules(doctorId: string): Promise<ScheduleBlock[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("doctor_schedules")
    .select("id, day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("doctor_id", doctorId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  return data ?? [];
}

export function DoctorScheduleManager({ doctors }: { doctors: DoctorListItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(doctors[0]?.id ?? null);
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingSchedules(true);
    fetchSchedules(selectedId).then((data) => {
      setSchedules(data);
      setLoadingSchedules(false);
    });
  }, [selectedId]);

  const selectedDoctor = doctors.find((d) => d.id === selectedId) ?? null;

  async function reloadSchedules() {
    if (!selectedId) return;
    setSchedules(await fetchSchedules(selectedId));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-2.5">
        {doctors.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedId(d.id)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
              d.id === selectedId ? "border-primary bg-primary-tint" : "border-border bg-surface hover:bg-background"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
              {(d.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold text-ink">{d.full_name ?? "Doctor"}</div>
              <div className="truncate text-[13px] text-muted">{d.specialty}</div>
            </div>
          </button>
        ))}

        {showAddDoctor ? (
          <AddDoctorForm onClose={() => setShowAddDoctor(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddDoctor(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-tint"
          >
            <Plus size={16} />
            Add doctor
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {selectedDoctor ? (
          <>
            <h2 className="mb-4 text-base font-bold text-ink">{selectedDoctor.full_name} · weekly schedule</h2>
            {loadingSchedules ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              <ScheduleEditor doctorId={selectedDoctor.id} schedules={schedules} onChange={reloadSchedules} />
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Add a doctor to get started.</p>
        )}
      </div>
    </div>
  );
}

function AddDoctorForm({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createDoctorAction(fullName, email, specialty);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success/30 bg-success-tint p-4 text-sm text-success">
        <p className="mb-2 font-semibold">Doctor account created.</p>
        <p className="mb-3">
          Ask {fullName} to use &quot;Forgot password&quot; on the login page with {email} to set their password.
        </p>
        <button type="button" onClick={onClose} className="font-semibold underline">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">Add a doctor</span>
        <button type="button" onClick={onClose} className="text-muted">
          <X size={16} />
        </button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <TextField
        label="Full name"
        name="fullName"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Dr. Amara Okafor"
      />
      <TextField
        label="Email address"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="doctor@example.com"
      />
      <TextField
        label="Specialty"
        name="specialty"
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        placeholder="General Practice"
      />
      <Button type="submit" loading={pending} className="!px-4 !py-2.5 !text-sm">
        Create account
      </Button>
    </form>
  );
}

interface ScheduleEditorProps {
  doctorId: string;
  schedules: ScheduleBlock[];
  onChange: () => void;
}

function ScheduleEditor({ doctorId, schedules, onChange }: ScheduleEditorProps) {
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addScheduleWindowAction(doctorId, dayOfWeek, `${startTime}:00`, `${endTime}:00`, slotDuration);
      if (result.error) {
        setError(result.error);
        return;
      }
      onChange();
    });
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await removeScheduleWindowAction(id);
    setRemovingId(null);
    onChange();
  }

  return (
    <div>
      {schedules.length === 0 ? (
        <p className="mb-5 text-sm text-muted">No availability windows set yet. Add one below.</p>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 text-sm"
            >
              <span className="font-semibold text-ink">{dayNames[s.day_of_week]}</span>
              <span className="text-muted">
                {formatTime(s.start_time)} – {formatTime(s.end_time)} · {s.slot_duration_minutes} min slots
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                disabled={removingId === s.id}
                className="text-danger disabled:opacity-50"
                aria-label="Remove availability window"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Day</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {dayNames.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Slot length (min)</label>
          <input
            type="number"
            min={5}
            step={5}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" loading={pending} className="!px-4 !py-2.5 !text-sm">
          <Plus size={15} weight="bold" />
          Add window
        </Button>
      </form>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
