"use client";

import { useState, useCallback, useTransition, type FormEvent } from "react";
import { Pill, MagnifyingGlass, CheckCircle, ChatText } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { logMedicationAction, markMedicationCollectedAction } from "@/app/staff/pharmacy/actions";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/format";

export interface PharmacyMedicationRow {
  id: string;
  medication_name: string;
  dosage: string | null;
  status: "pending" | "collected";
  logged_at: string;
  patient: { full_name: string | null } | null;
  logger: { full_name: string | null } | null;
}

export interface PatientOption {
  id: string;
  full_name: string | null;
}

async function fetchQueue(): Promise<PharmacyMedicationRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("medications")
    .select(
      "id, medication_name, dosage, status, logged_at, patient:profiles!medications_patient_id_fkey(full_name), logger:profiles!medications_logged_by_fkey(full_name)"
    )
    .order("logged_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as PharmacyMedicationRow[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-[#FDF1E1] text-[#B45309]",
  collected: "bg-[#E3F5EA] text-[#137A3A]",
};

interface PharmacyDeskManagerProps {
  initialMedications: PharmacyMedicationRow[];
  patients: PatientOption[];
}

export function PharmacyDeskManager({ initialMedications, patients }: PharmacyDeskManagerProps) {
  const [medications, setMedications] = useState(initialMedications);

  const refetch = useCallback(async () => {
    setMedications(await fetchQueue());
  }, []);

  useRealtimeRefresh("medications", undefined, refetch);

  const pendingCount = medications.filter((m) => m.status === "pending").length;
  const collectedToday = medications.filter(
    (m) => m.status === "collected" && m.logged_at.slice(0, 10) === new Date().toISOString().slice(0, 10)
  ).length;

  async function markCollected(id: string) {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, status: "collected" } : m)));
    await markMedicationCollectedAction(id);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
      <LogMedicationForm patients={patients} onLogged={refetch} />

      <div className="flex min-h-0 flex-col gap-1 rounded-[30px] bg-surface p-5 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[17px] font-bold text-ink">Pickups</span>
          <div className="flex gap-2">
            <span className="flex h-[34px] items-center rounded-full bg-[#FDF1E1] px-3.5 text-xs font-bold text-[#B45309]">
              {pendingCount} pending
            </span>
            <span className="flex h-[34px] items-center rounded-full bg-[#E3F5EA] px-3.5 text-xs font-bold text-[#137A3A]">
              {collectedToday} collected today
            </span>
          </div>
        </div>

        {medications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Medications you log for patients will show up here.</p>
        ) : (
          medications.map((m, i) => {
            const initials = (m.patient?.full_name ?? "P").charAt(0).toUpperCase();
            return (
              <div
                key={m.id}
                className={`grid grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_150px] items-center gap-3 py-2.5 ${
                  i > 0 ? "border-t border-[#EEF2F1]" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">
                    {initials}
                  </span>
                  <span className="truncate text-sm font-bold text-ink">{m.patient?.full_name ?? "Patient"}</span>
                </div>
                <span className="truncate text-[13px] text-ink">
                  <strong className="font-semibold">{m.medication_name}</strong>
                  {m.dosage ? ` ${m.dosage}` : ""}
                </span>
                <span className="text-xs text-muted">{formatDate(m.logged_at.slice(0, 10))}</span>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[m.status]}`}>
                  {m.status}
                </span>
                <div className="justify-self-end">
                  {m.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => markCollected(m.id)}
                      className="flex h-[34px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-white"
                    >
                      <CheckCircle size={14} />
                      Mark collected
                    </button>
                  ) : (
                    <span className="text-xs text-muted">Done</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface LogMedicationFormProps {
  patients: PatientOption[];
  onLogged: () => void;
}

function LogMedicationForm({ patients, onLogged }: LogMedicationFormProps) {
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const visiblePatients = patients.filter((p) => !search || p.full_name?.toLowerCase().includes(search.toLowerCase()));
  const selectedPatient = patients.find((p) => p.id === patientId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!patientId || !medicationName.trim()) {
      setError("Choose a patient and enter a medication name.");
      return;
    }
    startTransition(async () => {
      const result = await logMedicationAction(patientId, medicationName.trim(), dosage.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setMedicationName("");
      setDosage("");
      setSuccess(`${selectedPatient?.full_name ?? "Patient"} will be emailed and texted.`);
      onLogged();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <span className="text-[28px] font-bold tracking-[-0.03em] text-ink">Pharmacy desk</span>

      <div className="flex flex-col gap-3.5 rounded-[32px] bg-gradient-to-br from-accent to-accent-dark p-5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Pill size={19} />
          </span>
          <span className="text-lg font-bold tracking-[-0.02em]">Log a pickup</span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Patient</label>
          <div className="flex h-12 items-center gap-2.5 rounded-full bg-white px-4 text-ink">
            <MagnifyingGlass size={16} className="text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={selectedPatient?.full_name ?? "Search patients"}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          {search && (
            <div className="mt-1.5 flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-[22px] bg-white p-1.5 text-ink">
              {visiblePatients.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted">No matches.</div>
              ) : (
                visiblePatients.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatientId(p.id);
                      setSearch("");
                    }}
                    className={`flex items-center gap-2.5 rounded-2xl p-2 text-left ${
                      p.id === patientId ? "bg-primary-tint" : "hover:bg-background"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2F1] text-xs font-bold">
                      {(p.full_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[13px] font-semibold">{p.full_name ?? "Patient"}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-2.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Medication</label>
            <input
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Amoxicillin"
              className="h-12 w-full rounded-full bg-white px-4 text-sm text-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Dosage</label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="500mg"
              className="h-12 w-full rounded-full bg-white px-4 text-sm text-ink focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || patients.length === 0}
          className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-primary-dark text-sm font-bold text-white disabled:opacity-60"
        >
          <Pill size={16} />
          {pending ? "Logging…" : "Log for pickup"}
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-white/85">
          <ChatText size={14} />
          Patient gets an email and SMS when logged.
        </span>
      </div>
    </form>
  );
}
