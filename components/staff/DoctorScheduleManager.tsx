"use client";

import { useState, useEffect, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { Plus, Trash, X, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { addScheduleWindowAction, removeScheduleWindowAction } from "@/app/staff/doctors/actions";
import { createStaffMemberAction, toggleDoctorActiveAction } from "@/app/staff/settings/actions";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import { formatTime } from "@/lib/format";

export interface DoctorListItem {
  id: string;
  specialty: string;
  photo_url: string | null;
  is_active: boolean;
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

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-6 w-10 items-center rounded-full p-[3px] ${on ? "justify-end bg-primary" : "justify-start bg-[#D5DCDA]"}`}>
      <span className="h-[18px] w-[18px] rounded-full bg-white" />
    </span>
  );
}

export function DoctorScheduleManager({ doctors: initialDoctors }: { doctors: DoctorListItem[] }) {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [selectedId, setSelectedId] = useState<string | null>(initialDoctors[0]?.id ?? null);
  const [search, setSearch] = useState("");
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
  const visibleDoctors = doctors.filter(
    (d) =>
      !search ||
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  async function reloadSchedules() {
    if (!selectedId) return;
    setSchedules(await fetchSchedules(selectedId));
  }

  async function handleToggleActive(id: string, next: boolean) {
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: next } : d)));
    await toggleDoctorActiveAction(id, next);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-ink">All doctors</span>
          <button
            type="button"
            onClick={() => setShowAddDoctor((v) => !v)}
            aria-label="Add doctor"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-accent text-white"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or specialty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full bg-white pl-10 pr-4 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
        </div>

        {showAddDoctor && <AddDoctorForm onClose={() => setShowAddDoctor(false)} />}

        <div className="flex flex-col gap-2">
          {visibleDoctors.map((d) => {
            const active = d.id === selectedId;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 rounded-[24px] p-3 ${
                  active ? "bg-primary-dark text-white" : "bg-surface text-ink shadow-[0_10px_24px_-20px_rgba(20,35,31,0.45)]"
                }`}
              >
                <button type="button" onClick={() => setSelectedId(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  {d.photo_url ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                      <Image src={d.photo_url} alt={d.full_name ?? "Doctor"} fill className="object-cover" />
                    </div>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent-dark">
                      {(d.full_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{d.full_name ?? "Doctor"}</div>
                    <div className={`truncate text-xs ${active ? "text-[#BFD9D3]" : "text-muted"}`}>{d.specialty}</div>
                  </div>
                </button>
                <button type="button" onClick={() => handleToggleActive(d.id, !d.is_active)} aria-label="Toggle active">
                  <Toggle on={d.is_active} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        {selectedDoctor ? (
          <>
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
              {selectedDoctor.photo_url && (
                <div className="absolute right-0 top-0 h-full w-[45%]">
                  <Image
                    src={selectedDoctor.photo_url}
                    alt={selectedDoctor.full_name ?? "Doctor"}
                    fill
                    className="object-cover [mask-image:linear-gradient(90deg,transparent,#000_45%)]"
                  />
                </div>
              )}
              <div className="relative flex flex-col gap-1">
                <span className="text-xs text-[#BFD9D3]">Weekly availability</span>
                <span className="text-2xl font-bold tracking-[-0.03em]">{selectedDoctor.full_name ?? "Doctor"}</span>
                <span className="text-[13px] text-[#BFD9D3]">{selectedDoctor.specialty}</span>
              </div>
              <div className="relative mt-4 flex gap-2.5">
                <span className="flex h-[34px] items-center rounded-full bg-white/15 px-3.5 text-xs font-bold">
                  {schedules.length} window{schedules.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="flex-1 rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
              {loadingSchedules ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <ScheduleEditor doctorId={selectedDoctor.id} schedules={schedules} onChange={reloadSchedules} />
              )}
            </div>
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
      const result = await createStaffMemberAction(fullName, email, "doctor", specialty);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="rounded-[22px] bg-success-tint p-4 text-sm text-success">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[22px] bg-surface p-4 shadow-[0_10px_24px_-20px_rgba(20,35,31,0.45)]">
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
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
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
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 grid grid-cols-[150px_1fr_1fr_1fr_30px] gap-3.5 text-xs font-semibold text-muted">
          <span>Day</span>
          <span>Start</span>
          <span>End</span>
          <span>Slot length</span>
          <span />
        </div>
        {schedules.length === 0 ? (
          <p className="text-sm text-muted">No availability windows set yet. Add one below.</p>
        ) : (
          <div className="flex flex-col">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[150px_1fr_1fr_1fr_30px] items-center gap-3.5 border-t border-[#EEF2F1] py-2.5"
              >
                <span className="text-sm font-semibold text-ink">{dayNames[s.day_of_week]}</span>
                <span className="text-[13px] text-ink">{formatTime(s.start_time)}</span>
                <span className="text-[13px] text-ink">{formatTime(s.end_time)}</span>
                <span className="w-fit rounded-full bg-primary-tint px-3 py-1 text-[13px] font-bold text-primary">
                  {s.slot_duration_minutes} min
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
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-t border-[#EEF2F1] pt-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Day</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="h-11 rounded-full bg-white px-4 text-sm shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          >
            {dayNames.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-11 rounded-full bg-white px-4 text-sm shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-11 rounded-full bg-white px-4 text-sm shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Slot length (min)</label>
          <input
            type="number"
            min={5}
            step={5}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="h-11 w-24 rounded-full bg-white px-4 text-sm shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          <Plus size={15} weight="bold" />
          Add window
        </button>
      </form>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
