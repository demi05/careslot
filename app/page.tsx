import Link from "next/link";
import {
  CalendarCheck,
  BellRinging,
  DeviceMobile,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";

const steps = [
  { label: "Pick a doctor", detail: "Browse by specialty and see who's actually free this week." },
  { label: "Choose a slot", detail: "Real-time availability, no calling ahead to check." },
  { label: "Get reminded", detail: "Email and SMS before your visit, so you never miss it." },
];

export default function LandingPage() {
  return (
    <div className="animate-fade-in-up">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <Logo />
        <Link href="/login" className={buttonClasses("outline", "!px-5 !py-2.5 text-[15px]")}>
          Log in
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-tint blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-48 h-56 w-56 rounded-full bg-accent-tint blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="mb-4 text-[34px] font-extrabold leading-[1.1] text-primary sm:text-[48px]">
              Hospital appointments, booked in minutes.
            </h1>
            <p className="mb-8 max-w-md text-lg text-muted">
              See which doctors are free, book a slot, and get reminders that
              actually reach you, by email and SMS.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link href="/register" className={buttonClasses("primary", "px-[26px] py-4 text-[17px]")}>
                Book an appointment
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link href="/login" className={buttonClasses("outline", "px-[26px] py-3.5 text-[17px]")}>
                Log in
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[340px]">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2.5rem] bg-primary/10" />
            <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-primary-dark bg-gradient-to-b from-primary to-primary-dark p-5 shadow-[0_32px_64px_rgba(18,64,57,0.28)]">
              <div className="mb-5 flex items-center justify-between text-white/90">
                <span className="text-sm font-semibold">Good afternoon, Ada</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                  A
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
                    Upcoming
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                    <CheckCircle size={14} weight="fill" />
                    Confirmed
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent-dark">
                    OE
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-ink">Dr. Opeyemi Eze</div>
                    <div className="text-[13px] text-muted">General Practice</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-border pt-3 text-[13px] font-semibold text-ink">
                  <span>Wed, 28 Oct</span>
                  <span className="text-muted">·</span>
                  <span>10:30 AM</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-white">
                <span className="text-[13px] font-semibold">Next available slot</span>
                <span className="text-[13px] font-bold">Today, 2:15 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-7 transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,92,82,0.1)] lg:col-span-2">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint text-primary">
              <CalendarCheck size={22} weight="bold" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-ink">Real-time slot availability</h3>
            <p className="mb-5 max-w-md text-[15px] text-muted">
              See exactly which doctors are free, today or next week, before you book. No calling the front desk to check.
            </p>
            <div className="flex flex-wrap gap-2">
              {["9:00", "9:30", "10:15", "11:00", "1:00", "2:15"].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-bold ${
                    i === 2
                      ? "bg-primary text-white"
                      : i === 4
                        ? "cursor-not-allowed bg-background text-muted/50 line-through"
                        : "border border-border bg-white text-ink"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex-1 rounded-2xl border border-border bg-surface p-7 transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,92,82,0.1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-accent-dark">
                <BellRinging size={22} weight="bold" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-ink">Reminders that reach you</h3>
              <p className="text-[15px] text-muted">Sent by email and SMS before every visit.</p>
            </div>
            <div className="flex-1 rounded-2xl border border-border bg-surface p-7 transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,92,82,0.1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                <DeviceMobile size={22} weight="bold" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-ink">Manage from your phone</h3>
              <p className="text-[15px] text-muted">Reschedule or cancel anytime, no queues.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-ink sm:text-[28px]">How it works</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map(({ label, detail }, i) => (
              <div key={label} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-[22px] top-[22px] hidden h-px w-full bg-border sm:block" />
                )}
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-1.5 text-[17px] font-bold text-ink">{label}</h3>
                <p className="text-[15px] text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted sm:px-8">
        <div>© 2026 CareSlot. All rights reserved.</div>
      </footer>
    </div>
  );
}
