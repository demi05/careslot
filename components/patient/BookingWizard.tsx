"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { SlotPicker } from "@/components/patient/SlotPicker";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatTime } from "@/lib/format";

export interface DoctorOption {
  id: string;
  specialty: string;
  profiles: { full_name: string | null } | null;
}

const steps = [
  { key: 1, label: "Select doctor" },
  { key: 2, label: "Choose slot" },
  { key: 3, label: "Confirm" },
] as const;

interface BookingWizardProps {
  doctors: DoctorOption[];
  patientId: string;
}

export function BookingWizard({ doctors, patientId }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const supabase = createClient();
    const { error } = await supabase.from("appointments").insert({
      patient_id: patientId,
      doctor_id: selectedDoctor.id,
      appointment_date: selectedSlot.date,
      appointment_time: selectedSlot.time,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "That slot was just booked by someone else. Please pick another time."
          : error.message
      );
      return;
    }
    setStep(4);
  }

  const doctorName = selectedDoctor?.profiles?.full_name ?? "your doctor";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Book an appointment</h1>

      {step < 4 && (
        <div className="mb-9 flex items-center">
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    step >= s.key ? "bg-primary text-white" : "bg-border text-muted"
                  }`}
                >
                  {s.key}
                </div>
                <span className="mt-1.5 text-[13px] font-semibold text-ink">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="mb-5 h-0.5 flex-1 bg-border" />}
            </div>
          ))}
        </div>
      )}

      {step === 1 &&
        (doctors.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={22} weight="bold" />}
            title="No doctors available yet"
            description="Once the clinic adds doctors, they'll show up here to book with."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {doctors.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-[0_10px_22px_rgba(26,92,82,0.08)]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-base font-bold text-primary">
                    {(d.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-bold text-ink">{d.profiles?.full_name ?? "Doctor"}</div>
                    <div className="text-sm text-muted">{d.specialty}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectDoctor(d)}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        ))}

      {step === 2 && selectedDoctor && (
        <div>
          <p className="mb-4 text-[15px] text-muted">
            Choosing a slot with <strong className="text-ink">{doctorName}</strong>.
          </p>
          <SlotPicker doctorId={selectedDoctor.id} onSelect={selectSlot} selected={selectedSlot} />
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-4 text-sm font-semibold text-muted hover:text-ink"
          >
            ← Back to doctors
          </button>
        </div>
      )}

      {step === 3 && selectedDoctor && selectedSlot && (
        <div className="rounded-2xl border border-border bg-surface p-7">
          <h2 className="mb-4 text-lg font-bold text-ink">Confirm your booking</h2>
          <div className="mb-6 flex flex-col gap-3 text-[15px]">
            <div className="flex justify-between">
              <span className="text-muted">Doctor</span>
              <strong>{doctorName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Specialisation</span>
              <strong>{selectedDoctor.specialty}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Day</span>
              <strong>{formatDate(selectedSlot.date)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Time</span>
              <strong>{formatTime(selectedSlot.time)}</strong>
            </div>
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-ink">Reason for visit (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe what this visit is for"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-3 text-base text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={confirmBooking} loading={submitting}>
              Confirm booking
            </Button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-[15px] font-bold text-ink transition-colors hover:bg-background"
            >
              Edit selection
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-2xl border border-border bg-surface p-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-tint text-success">
            <CheckCircle size={32} weight="fill" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-ink">Your appointment is booked</h2>
          <p className="mx-auto mb-6 max-w-sm text-[15px] text-muted">
            We&apos;ll send a reminder before your visit with {doctorName}.
          </p>
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            className="rounded-lg bg-primary px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-primary-dark"
          >
            View my appointments
          </button>
        </div>
      )}
    </div>
  );
}
