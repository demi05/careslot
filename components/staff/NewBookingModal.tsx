"use client";

import { useState, useTransition, type FormEvent } from "react";
import { X, MagnifyingGlass, Check } from "@phosphor-icons/react/dist/ssr";
import { staffCreateAppointmentAction } from "@/app/staff/appointments/actions";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SlotPicker } from "@/components/patient/SlotPicker";
import type { DoctorFilterOption, PatientOption } from "@/components/staff/StaffAppointmentsManager";

interface NewBookingModalProps {
  patients: PatientOption[];
  doctors: DoctorFilterOption[];
  onClose: () => void;
  onBooked: () => void;
}

export function NewBookingModal({ patients, doctors, onClose, onBooked }: NewBookingModalProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const visiblePatients = patients.filter(
    (p) => !patientSearch || p.full_name?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!patientId || !doctorId || !slot) {
      setError("Choose a patient, a doctor, and a time slot.");
      return;
    }
    startTransition(async () => {
      const result = await staffCreateAppointmentAction(patientId, doctorId, slot.date, slot.time, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      onBooked();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[30px] bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EEF2F1] px-6 py-4">
          <span className="text-lg font-bold text-ink">New booking</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background"
          >
            <X size={16} />
          </button>
        </div>

        <form id="new-booking-form" onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {error && <Alert variant="error">{error}</Alert>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Patient</label>
            <div className="relative">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder={selectedPatient?.full_name ?? "Search patients"}
                className="h-[46px] w-full rounded-full bg-white pl-11 pr-4 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none focus:shadow-[inset_0_0_0_2px_#1A5C52]"
              />
            </div>
            {patientSearch && (
              <div className="mt-2 flex max-h-40 flex-col overflow-y-auto rounded-[20px] bg-white shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]">
                {visiblePatients.length === 0 ? (
                  <p className="p-3 text-sm text-muted">No patients match.</p>
                ) : (
                  visiblePatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPatientId(p.id);
                        setPatientSearch("");
                      }}
                      className={`flex items-center justify-between px-4 py-2.5 text-left text-sm ${
                        p.id === patientId ? "bg-primary-tint font-bold text-primary" : "hover:bg-background"
                      }`}
                    >
                      {p.full_name ?? "Patient"}
                      {p.id === patientId && <Check size={15} weight="bold" />}
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedPatient && !patientSearch && (
              <div className="mt-2 flex items-center justify-between rounded-full bg-primary-tint px-4 py-2 text-sm font-bold text-primary">
                {selectedPatient.full_name ?? "Patient"}
                <button type="button" onClick={() => setPatientId("")} aria-label="Clear patient">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Doctor</label>
            <Select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setSlot(null);
              }}
              className="h-[46px] w-full text-sm font-semibold text-ink"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {doctorId && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">Date and time</label>
              <SlotPicker doctorId={doctorId} selected={slot} onSelect={(date, time) => setSlot({ date, time })} />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Follow-up consultation"
              className="w-full rounded-[20px] bg-white px-4 py-3 text-sm text-ink shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
            />
          </div>
        </form>

        <div className="border-t border-[#EEF2F1] px-6 py-4">
          <button
            type="submit"
            form="new-booking-form"
            disabled={pending}
            className="flex h-[48px] w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            {pending ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
