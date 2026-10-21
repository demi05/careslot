"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ScheduleEditor, type ScheduleBlock } from "@/components/staff/DoctorScheduleManager";

interface MyScheduleManagerProps {
  doctorId: string;
  fullName: string;
  specialty: string;
  photoUrl: string | null;
  initialSchedules: ScheduleBlock[];
}

export function MyScheduleManager({ doctorId, fullName, specialty, photoUrl, initialSchedules }: MyScheduleManagerProps) {
  const [schedules, setSchedules] = useState(initialSchedules);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("doctor_schedules")
      .select("id, day_of_week, start_time, end_time, slot_duration_minutes")
      .eq("doctor_id", doctorId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    setSchedules(data ?? []);
  }, [doctorId]);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
        {photoUrl && (
          <div className="absolute right-0 top-0 h-full w-[45%]">
            <Image src={photoUrl} alt={fullName} fill className="object-cover [mask-image:linear-gradient(90deg,transparent,#000_45%)]" />
          </div>
        )}
        <div className="relative flex flex-col gap-1">
          <span className="text-xs text-[#BFD9D3]">Weekly availability</span>
          <span className="text-2xl font-bold tracking-[-0.03em]">{fullName}</span>
          <span className="text-[13px] text-[#BFD9D3]">{specialty}</span>
        </div>
        <div className="relative mt-4 flex gap-2.5">
          <span className="flex h-[34px] items-center rounded-full bg-white/15 px-3.5 text-xs font-bold">
            {schedules.length} window{schedules.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
        <ScheduleEditor doctorId={doctorId} schedules={schedules} onChange={reload} />
      </div>
    </div>
  );
}
