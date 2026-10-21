"use client";

import { useState, useCallback } from "react";
import { Pill } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/supabase/useRealtimeRefresh";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";

export interface MedicationRow {
  id: string;
  medication_name: string;
  dosage: string | null;
  status: "pending" | "collected";
  logged_at: string;
  collected_at: string | null;
  profiles: { full_name: string | null } | null;
}

async function fetchMedications(patientId: string): Promise<MedicationRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("medications")
    .select(
      "id, medication_name, dosage, status, logged_at, collected_at, profiles!medications_logged_by_fkey(full_name)"
    )
    .eq("patient_id", patientId)
    .order("logged_at", { ascending: false });
  return (data ?? []) as unknown as MedicationRow[];
}

interface MedicationsListProps {
  initialMedications: MedicationRow[];
  patientId: string;
}

export function MedicationsList({ initialMedications, patientId }: MedicationsListProps) {
  const [medications, setMedications] = useState(initialMedications);

  const refetch = useCallback(async () => {
    setMedications(await fetchMedications(patientId));
  }, [patientId]);

  useRealtimeRefresh("medications", `patient_id=eq.${patientId}`, refetch);

  const pending = medications.filter((m) => m.status === "pending");
  const readyNow = pending[0];

  if (medications.length === 0) {
    return (
      <EmptyState
        icon={<Pill size={22} weight="bold" />}
        title="No medications on record yet"
        description="Anything the pharmacy gives you will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {readyNow && (
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-accent to-accent-dark p-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full bg-white/10" />
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-bold text-accent-dark">
            Ready now
          </span>
          <div className="relative mt-3.5 text-2xl font-bold leading-tight tracking-[-0.03em]">
            {readyNow.medication_name}
            {readyNow.dosage ? ` ${readyNow.dosage}` : ""}
          </div>
          <div className="relative mt-1 text-[13px] text-white/80">Visit the pharmacy desk to collect.</div>
          {pending.length > 1 && (
            <div className="relative mt-3 text-xs font-semibold text-white/90">
              +{pending.length - 1} more medication{pending.length - 1 > 1 ? "s" : ""} pending pickup
            </div>
          )}
        </div>
      )}

      <div>
        <span className="mb-2.5 block text-base font-bold text-ink">All logged</span>
        <div className="rounded-[28px] bg-surface px-3.5 shadow-[0_12px_28px_-22px_rgba(20,35,31,0.45)]">
          {medications.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-[#EEF2F1]" : ""}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  m.status === "pending" ? "bg-accent-tint text-accent-dark" : "bg-primary-tint text-primary"
                }`}
              >
                <Pill size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-ink">
                  {m.medication_name}
                  {m.dosage ? ` ${m.dosage}` : ""}
                </div>
                <div className="text-[11px] text-muted">
                  {m.status === "collected" ? "Logged" : "Logged"} {formatDate(m.logged_at.slice(0, 10))}
                  {m.profiles?.full_name ? ` by ${m.profiles.full_name}` : ""}
                </div>
              </div>
              <StatusBadge status={m.status === "pending" ? "pending" : "collected"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
