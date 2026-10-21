import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarPlus, ListChecks, Pill, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PatientTopNav } from "@/components/patient/PatientTopNav";
import { PatientBottomTabs } from "@/components/patient/PatientBottomTabs";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { PillCTAButton } from "@/components/ui/Button";
import type { Status } from "@/components/ui/StatusBadge";

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: Status;
  doctors: { specialty: string; photo_url: string | null; profiles: { full_name: string | null } | null } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  )?.trim();
  const firstName = fullName?.split(" ")[0] || "there";

  const today = new Date().toISOString().slice(0, 10);
  const [{ data, error }, { data: medsData }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, doctors(specialty, photo_url, profiles(full_name))")
      .eq("patient_id", user.id)
      .neq("status", "cancelled")
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .limit(4),
    supabase
      .from("medications")
      .select("medication_name")
      .eq("patient_id", user.id)
      .eq("status", "pending")
      .limit(1),
  ]);

  const appointments = (!error && data ? data : []) as unknown as UpcomingAppointment[];
  const readyMedication = medsData?.[0]?.medication_name ?? null;
  const [next, ...rest] = appointments;

  return (
    <div className="flex min-h-screen flex-col animate-fade-in-up pb-28 sm:pb-0">
      <PatientTopNav userName={fullName || user.email || "there"} />

      {appointments.length === 0 ? (
        <div className="relative overflow-hidden rounded-b-[44px] bg-gradient-to-br from-primary to-primary-dark px-5 pb-8 pt-7 text-white sm:px-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white/25 bg-accent text-base font-bold">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-[#BFD9D3]">Welcome to CareSlot,</span>
                <span className="text-xl font-bold tracking-[-0.02em]">{fullName || "there"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/book"
                className="flex h-12 flex-[1.3] items-center justify-center gap-1.5 rounded-full bg-accent text-[13px] font-bold"
              >
                <CalendarPlus size={16} />
                Book new
              </Link>
              <Link
                href="/appointments"
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-[13px] font-bold"
              >
                <ListChecks size={16} />
                All
              </Link>
              <Link
                href="/pharmacy"
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-[13px] font-bold"
              >
                <Pill size={16} />
                Meds
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#D6E8E3] to-background px-5 pb-2 pt-5 sm:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">Good day,</span>
              <span className="text-lg font-bold tracking-[-0.02em] text-ink">{firstName}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto -mt-2 w-full max-w-4xl flex-1 px-5 py-6 sm:px-8">
        {appointments.length === 0 ? (
          <div className="relative -mt-10 overflow-hidden rounded-[36px] bg-surface p-6 shadow-[0_20px_44px_-28px_rgba(20,35,31,0.45)]">
            <div className="relative mb-4 h-[160px] w-full overflow-hidden rounded-[26px]">
              <Image
                src="/images/doctor-patient-desk.jpg"
                alt="Doctor talking with a young patient at her desk"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="mb-1.5 text-xl font-bold leading-tight tracking-[-0.03em] text-ink">
              No upcoming appointments
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              When you book, your next visit shows up here with a reminder by email and SMS.
            </p>
            <Link href="/book">
              <PillCTAButton>Book an appointment</PillCTAButton>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-lg font-bold tracking-[-0.01em] text-ink">Your next appointment</span>
              <Link href="/appointments" className="text-xs font-semibold text-primary">
                See all
              </Link>
            </div>
            <AppointmentCard
              id={next.id}
              doctorName={next.doctors?.profiles?.full_name ?? null}
              specialty={next.doctors?.specialty ?? null}
              date={next.appointment_date}
              time={next.appointment_time}
              status={next.status}
              doctorPhotoUrl={next.doctors?.photo_url}
              featured
            />

            <span className="mb-3.5 mt-7 block text-lg font-bold tracking-[-0.01em] text-ink">Quick actions</span>
            <div className="mb-7 grid grid-cols-2 gap-2.5">
              <Link
                href="/book"
                className="row-span-2 flex flex-col justify-between rounded-[28px] bg-accent p-4 text-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <CalendarPlus size={20} weight="bold" />
                </span>
                <span className="text-lg font-bold leading-tight tracking-[-0.02em]">
                  Book new
                  <br />
                  appointment
                </span>
              </Link>
              <Link
                href="/appointments"
                className="flex items-center gap-3 rounded-[24px] bg-surface px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]"
              >
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <ListChecks size={17} />
                </span>
                <span className="text-[13px] font-bold leading-tight">All appointments</span>
              </Link>
              <Link
                href="/pharmacy"
                className="flex items-center gap-3 rounded-[24px] bg-surface px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]"
              >
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <Pill size={17} />
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-bold">My medications</span>
                </span>
              </Link>
            </div>

            {rest.length > 0 && (
              <>
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="text-lg font-bold tracking-[-0.01em] text-ink">Also coming up</span>
                  <span className="text-xs font-semibold text-primary">{rest.length} more</span>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-3">
                  {rest.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      id={a.id}
                      doctorName={a.doctors?.profiles?.full_name ?? null}
                      specialty={a.doctors?.specialty ?? null}
                      date={a.appointment_date}
                      time={a.appointment_time}
                      status={a.status}
                      doctorPhotoUrl={a.doctors?.photo_url}
                    />
                  ))}
                  <Link
                    href="/book"
                    className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[26px] border-2 border-dashed border-[#C6D9D4] text-primary"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint">
                      <CalendarPlus size={18} />
                    </span>
                    <span className="text-[13px] font-bold">Book another</span>
                  </Link>
                </div>
              </>
            )}

            {readyMedication && (
              <Link
                href="/pharmacy"
                className="flex items-center gap-3 rounded-2xl bg-accent-tint px-4 py-3.5 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <Pill size={19} weight="fill" />
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-bold text-ink">{readyMedication} is ready</span>
                  <span className="block text-xs text-[#6B5444]">Collect at the pharmacy</span>
                </span>
                <CaretRight size={16} className="text-accent-dark" />
              </Link>
            )}
          </>
        )}
      </div>

      <PatientBottomTabs />
    </div>
  );
}
