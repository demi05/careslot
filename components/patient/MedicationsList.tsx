"use client";

import { useState, useCallback } from "react";
import { Pill, Package } from "@phosphor-icons/react/dist/ssr";
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

  const pendingCount = medications.filter((m) => m.status === "pending").length;

  return (
    <div>
      {pendingCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F3D5BC] bg-accent-tint p-4">
          <Package size={22} weight="fill" className="mt-0.5 shrink-0 text-accent-dark" />
          <div>
            <div className="mb-0.5 text-[15px] font-bold text-[#8A4A16]">
              {pendingCount} medication{pendingCount > 1 ? "s" : ""} ready for pickup
            </div>
            <div className="text-sm text-[#8A4A16]">Visit the Unity Hospital pharmacy desk to collect.</div>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <EmptyState
          icon={<Pill size={22} weight="bold" />}
          title="No medications on record yet"
          description="Anything the pharmacy gives you will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {medications.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-tint text-primary">
                    <Pill size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-ink">{m.medication_name}</div>
                    {m.dosage && <div className="text-[13.5px] text-muted">{m.dosage}</div>}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#F1F2F3] pt-3 text-[13.5px] sm:grid-cols-3">
                <div>
                  <div className="mb-0.5 text-gray-400">Logged</div>
                  <div className="font-semibold text-ink">{formatDate(m.logged_at.slice(0, 10))}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-gray-400">Logged by</div>
                  <div className="font-semibold text-ink">{m.profiles?.full_name ?? "Staff"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
