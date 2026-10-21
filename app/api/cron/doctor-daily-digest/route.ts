import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { doctorDailyDigestEmail } from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: appointments, error } = await admin
    .from("appointments")
    .select(
      "doctor_id, appointment_time, patient:profiles!appointments_patient_id_fkey(full_name), doctors(profiles(full_name))"
    )
    .eq("appointment_date", today)
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    doctor_id: string;
    appointment_time: string;
    patient: { full_name: string | null } | null;
    doctors: { profiles: { full_name: string | null } | null } | null;
  };

  const byDoctor = new Map<string, { doctorName: string; appointments: { patientName: string; appointmentTime: string }[] }>();
  for (const row of (appointments ?? []) as unknown as Row[]) {
    const doctorName = row.doctors?.profiles?.full_name ?? "Doctor";
    const entry = byDoctor.get(row.doctor_id) ?? { doctorName, appointments: [] };
    entry.appointments.push({
      patientName: row.patient?.full_name ?? "Patient",
      appointmentTime: row.appointment_time,
    });
    byDoctor.set(row.doctor_id, entry);
  }

  let sent = 0;
  let failed = 0;

  for (const [doctorId, { doctorName, appointments: doctorAppointments }] of byDoctor) {
    const { data: userData } = await admin.auth.admin.getUserById(doctorId);
    const email = userData.user?.email;
    if (!email) {
      failed++;
      continue;
    }

    const { subject, html } = doctorDailyDigestEmail({
      doctorName,
      appointmentDate: today,
      appointments: doctorAppointments,
    });
    const result = await sendEmail(email, subject, html);
    if (result.ok) sent++;
    else failed++;
  }

  return NextResponse.json({ doctorsWithAppointments: byDoctor.size, sent, failed });
}
