"use client";

import { useState, useCallback, useTransition, type FormEvent } from "react";
import { Pill, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { logMedicationAction, markMedicationCollectedAction } from "@/app/staff/pharmacy/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
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

interface PharmacyDeskManagerProps {
  initialMedications: PharmacyMedicationRow[];
  patients: PatientOption[];
}

export function PharmacyDeskManager({ initialMedications, patients }: PharmacyDeskManagerProps) {
  const [medications, setMedications] = useState(initialMedications);
  const [showLogForm, setShowLogForm] = useState(false);

  const refetch = useCallback(async () => {
    setMedications(await fetchQueue());
  }, []);

  useRealtimeRefresh("medications", undefined, refetch);

  const pendingCount = medications.filter((m) => m.status === "pending").length;

  async function markCollected(id: string) {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, status: "collected" } : m)));
    await markMedicationCollectedAction(id);
  }

  return (
    <div>
      <div className="mb-6 grid max-w-md grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-2 text-[13px] font-semibold text-muted">To dispense</div>
          <div className="text-2xl font-extrabold text-warning">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-2 text-[13px] font-semibold text-muted">Collected</div>
          <div className="text-2xl font-extrabold text-success">{medications.length - pendingCount}</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">Dispensing queue</h2>
        <button
          type="button"
          onClick={() => setShowLogForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          {showLogForm ? <X size={15} /> : <Plus size={15} weight="bold" />}
          {showLogForm ? "Close" : "Log medication"}
        </button>
      </div>

      {showLogForm && (
        <div className="mb-5">
          <LogMedicationForm
            patients={patients}
            onLogged={() => {
              refetch();
              setShowLogForm(false);
            }}
          />
        </div>
      )}

      {medications.length === 0 ? (
        <EmptyState
          icon={<Pill size={22} weight="bold" />}
          title="No medications logged yet"
          description="Medications you log for patients will show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {medications.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-ink">{m.patient?.full_name ?? "Patient"}</div>
                  <div className="text-sm text-ink">
                    {m.medication_name}
                    {m.dosage ? ` · ${m.dosage}` : ""}
                  </div>
                  <div className="mt-1 text-[13px] text-muted">
                    Logged {formatDate(m.logged_at.slice(0, 10))} by {m.logger?.full_name ?? "Staff"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => markCollected(m.id)}
                      className="rounded-lg bg-primary px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      Mark dispensed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LogMedicationFormProps {
  patients: PatientOption[];
  onLogged: () => void;
}

function LogMedicationForm({ patients, onLogged }: LogMedicationFormProps) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      onLogged();
    });
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
        No patients registered yet — nothing to log medications for.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-3 text-base"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? p.id}
            </option>
          ))}
        </select>
      </div>
      <TextField
        label="Medication name"
        name="medicationName"
        value={medicationName}
        onChange={(e) => setMedicationName(e.target.value)}
        placeholder="Amoxicillin 500mg"
      />
      <TextField
        label="Dosage (optional)"
        name="dosage"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        placeholder="Take twice daily"
      />
      <Button type="submit" loading={pending} className="!w-fit !px-5 !py-2.5 !text-sm">
        Log medication
      </Button>
    </form>
  );
}
