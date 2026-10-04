"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Stethoscope,
  CaretLeft,
  ArrowRight,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import { bookAppointmentAction } from "@/app/(patient)/book/actions";
import { SlotPicker } from "@/components/patient/SlotPicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { formatDate, formatTime } from "@/lib/format";

export interface DoctorOption {
  id: string;
  specialty: string;
  photo_url: string | null;
  profiles: { full_name: string | null } | null;
}

const reasonTags = ["Follow-up", "New symptoms", "Test results", "Prescription refill"];

function StepDots({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-[5px] w-[26px] rounded-full ${i <= step ? (i === 3 && step === 3 ? "bg-accent" : "bg-primary") : "bg-[#D3E2DE]"}`}
        />
      ))}
    </div>
  );
}

function BackCircle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-12px_rgba(20,35,31,0.5)]"
    >
      <CaretLeft size={18} />
    </button>
  );
}

function DoctorAvatar({ name, photoUrl, size }: { name: string | null; photoUrl: string | null; size: number }) {
  if (photoUrl) {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src={photoUrl} alt={name ?? "Doctor"} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary"
      style={{ width: size, height: size }}
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  );
}

interface BookingWizardProps {
  doctors: DoctorOption[];
}

export function BookingWizard({ doctors }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [reasonTag, setReasonTag] = useState<string | null>(null);
  const [reasonNote, setReasonNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specialties = useMemo(() => Array.from(new Set(doctors.map((d) => d.specialty))).sort(), [doctors]);
  const visibleDoctors = specialtyFilter ? doctors.filter((d) => d.specialty === specialtyFilter) : doctors;

  function selectDoctor(doctor: DoctorOption) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setStep(2);
  }

  function selectSlot(date: string, time: string) {
    setSelectedSlot({ date, time });
    setStep(3);
  }

  async function confirmBooking() {
    if (!selectedDoctor || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    const reason = [reasonTag, reasonNote.trim()].filter(Boolean).join(reasonTag && reasonNote.trim() ? ". " : "");
    const result = await bookAppointmentAction(selectedDoctor.id, selectedSlot.date, selectedSlot.time, reason);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(5);
  }

  const doctorName = selectedDoctor?.profiles?.full_name ?? "your doctor";

  if (step === 5) {
    return (
      <div className="rounded-[32px] bg-surface p-9 text-center shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-tint text-success">
          <CheckCircle size={32} weight="fill" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-ink">Your appointment is booked</h2>
        <p className="mx-auto mb-6 max-w-sm text-[15px] text-muted">
          We&apos;ll send a reminder by email and SMS before your visit with {doctorName}.
        </p>
        <button
          type="button"
          onClick={() => router.push("/appointments")}
          className="rounded-full bg-primary px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-primary-dark"
        >
          View my appointments
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <BackCircle onClick={() => router.push("/dashboard")} />
          <StepDots step={1} />
          <span className="w-[46px]" />
        </div>
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-ink">
          Who would you
          <br />
          like to see?
        </h1>

        {specialties.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSpecialtyFilter(null)}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold ${
                specialtyFilter === null ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
              }`}
            >
              All
            </button>
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialtyFilter(s)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold ${
                  specialtyFilter === s ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {visibleDoctors.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={22} weight="bold" />}
            title="No doctors available yet"
            description="Once the clinic adds doctors, they'll show up here to book with."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {visibleDoctors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDoctor(d)}
                className="flex items-center gap-3 rounded-[26px] bg-surface p-2.5 text-left shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)] transition-all hover:-translate-y-0.5"
              >
                <DoctorAvatar name={d.profiles?.full_name ?? null} photoUrl={d.photo_url} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">{d.profiles?.full_name ?? "Doctor"}</div>
                  <div className="truncate text-xs text-muted">{d.specialty}</div>
                </div>
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <ArrowRight size={16} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 2 && selectedDoctor) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BackCircle onClick={() => setStep(1)} />
          <StepDots step={2} />
        </div>
        <div className="flex items-center gap-3">
          <DoctorAvatar name={doctorName} photoUrl={selectedDoctor.photo_url} size={54} />
          <div>
            <div className="text-lg font-bold tracking-[-0.01em] text-ink">{doctorName}</div>
            <div className="text-[13px] text-muted">{selectedDoctor.specialty}</div>
          </div>
        </div>
        <SlotPicker doctorId={selectedDoctor.id} onSelect={selectSlot} selected={selectedSlot} />
      </div>
    );
  }

  if (step === 3 && selectedDoctor && selectedSlot) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BackCircle onClick={() => setStep(2)} />
          <StepDots step={3} />
        </div>

        <div className="flex items-center gap-3.5 rounded-[28px] bg-gradient-to-br from-primary to-primary-dark p-4 text-white">
          <DoctorAvatar name={doctorName} photoUrl={selectedDoctor.photo_url} size={54} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{doctorName}</div>
            <div className="truncate text-xs text-[#BFD9D3]">
              {formatDate(selectedSlot.date)}, {formatTime(selectedSlot.time)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="shrink-0 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold"
          >
            Edit
          </button>
        </div>

        <h2 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-ink">What&apos;s the visit for?</h2>

        <div className="flex flex-wrap gap-2">
          {reasonTags.map((tag) => {
            const active = reasonTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setReasonTag(active ? null : tag)}
                className={`flex h-[38px] items-center gap-1.5 rounded-full px-[15px] text-[13px] font-semibold ${
                  active ? "bg-primary text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2EAE8]"
                }`}
              >
                {active && <Check size={14} weight="bold" />}
                {tag}
              </button>
            );
          })}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">Tell the doctor a little more</label>
          <textarea
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value.slice(0, 300))}
            rows={4}
            placeholder="Briefly describe what this visit is for"
            className="w-full rounded-[26px] bg-white px-[18px] py-4 text-sm leading-relaxed text-ink shadow-[inset_0_0_0_2px_#1A5C52] placeholder:text-muted focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-between pl-1.5">
            <span className="text-xs text-muted">Only your doctor sees this.</span>
            <span className="text-[11px] text-muted">{reasonNote.length} / 300</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStep(4)}
          className="flex items-center justify-between rounded-full bg-accent py-1.5 pl-6 pr-1.5 text-white shadow-[0_18px_30px_-16px_rgba(224,123,57,0.8)]"
        >
          <span className="text-[15px] font-bold">Review and confirm</span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-accent">
            <ArrowRight size={18} weight="bold" />
          </span>
        </button>
      </div>
    );
  }

  if (step === 4 && selectedDoctor && selectedSlot) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BackCircle onClick={() => setStep(3)} />
          <StepDots step={3} />
        </div>

        <h2 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-ink">
          Almost done. Check the details.
        </h2>

        <div className="rounded-[32px] bg-surface shadow-[0_20px_40px_-26px_rgba(20,35,31,0.4)]">
          <div className="flex items-center gap-3.5 p-5">
            <DoctorAvatar name={doctorName} photoUrl={selectedDoctor.photo_url} size={56} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-bold tracking-[-0.01em] text-ink">{doctorName}</div>
              <div className="truncate text-xs text-muted">{selectedDoctor.specialty}</div>
            </div>
          </div>
          <div className="mx-5 border-t-2 border-dashed border-[#E3EAE8]" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">Date</span>
              <span className="text-[15px] font-bold text-ink">{formatDate(selectedSlot.date)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">Time</span>
              <span className="text-[15px] font-bold text-ink">{formatTime(selectedSlot.time)}</span>
            </div>
            {(reasonTag || reasonNote) && (
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-[11px] text-muted">Reason for visit</span>
                <span className="text-sm text-ink">{[reasonTag, reasonNote].filter(Boolean).join(". ")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[24px] bg-accent-tint px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent">
            <CheckCircle size={19} weight="fill" />
          </span>
          <span className="text-[13px] font-semibold text-ink">
            You&apos;ll get a reminder by email and SMS the day before.
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={confirmBooking}
            disabled={submitting}
            className="flex h-[58px] items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-bold text-white shadow-[0_18px_30px_-16px_rgba(224,123,57,0.8)] disabled:opacity-60"
          >
            <Check size={18} weight="bold" />
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex h-12 items-center justify-center text-sm font-bold text-primary"
          >
            Change time
          </button>
        </div>
      </div>
    );
  }

  return null;
}
