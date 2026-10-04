import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck,
  Stethoscope,
  EnvelopeSimple,
  ChatText,
  DeviceMobile,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses, PillCTAButton } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="animate-fade-in-up">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <Logo />
        <Link href="/login" className={buttonClasses("outline", "!px-5 !py-2.5 text-[15px]")}>
          Log in
        </Link>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#CFE4DF] to-[#E7F1EE]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:py-20">
          <div className="order-2 lg:order-1">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full bg-white/80 py-2 pl-2 pr-4 text-sm font-semibold shadow-[0_8px_20px_-12px_rgba(20,35,31,0.4)] backdrop-blur-md">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                <CalendarCheck size={14} weight="fill" />
              </span>
              Live, updated just now
            </div>
            <h1 className="mb-4 text-[34px] font-bold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[46px]">
              Book your hospital visit in <span className="font-medium italic text-primary">minutes</span>, not
              mornings.
            </h1>
            <p className="mb-8 max-w-md text-lg text-muted">
              Pick a doctor, choose a free time, skip the queue at the records desk.
            </p>
            <div className="max-w-xs">
              <Link href="/register">
                <PillCTAButton>Book an appointment</PillCTAButton>
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Hospital staff?{" "}
              <Link href="/login" className="font-semibold text-accent-dark">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="relative order-1 mx-auto aspect-[4/3] w-full max-w-lg lg:order-2">
            <div className="absolute inset-0 overflow-hidden rounded-[32px]">
              <Image
                src="/images/doctor-hero-onboarding.jpg"
                alt="Smiling Nigerian doctor in a white coat with a stethoscope"
                fill
                priority
                className="object-cover object-[50%_12%]"
              />
            </div>
            <div className="absolute right-4 top-6 flex w-40 -rotate-3 flex-col gap-1.5 rounded-2xl bg-white/85 p-3.5 shadow-[0_18px_40px_-16px_rgba(20,35,31,0.3)] backdrop-blur-md">
              <span className="text-[11px] text-muted">Next free slot</span>
              <span className="text-xl font-bold tracking-[-0.02em] text-ink">10:30 am</span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <CalendarCheck size={13} weight="fill" />
                Today, Outpatients
              </span>
            </div>
            <div className="absolute bottom-10 left-2 flex -rotate-2 items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 shadow-[0_14px_30px_-12px_rgba(20,35,31,0.3)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
                <Stethoscope size={17} weight="fill" />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-bold">42 doctors</span>
                <span className="text-[11px] text-muted">on duty this week</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-[-0.025em] text-ink sm:text-[30px]">
            Less waiting room. More time for you.
          </h2>

          <div className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white sm:p-8">
            <span className="text-[13px] text-[#BFD9D3]">Real-time slots</span>
            <p className="mt-1.5 max-w-xs text-xl font-bold leading-snug tracking-[-0.02em] sm:text-2xl">
              See every free time the moment it opens.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="flex h-8 items-center rounded-full bg-white/10 px-3.5 text-xs text-[#8FB5AD] line-through">
                9:15 am
              </span>
              <span className="flex h-8 items-center rounded-full bg-white px-3.5 text-xs font-bold text-primary">
                10:30 am
              </span>
              <span className="flex h-8 items-center rounded-full bg-white/15 px-3.5 text-xs">11:15 am</span>
              <span className="flex h-8 items-center rounded-full bg-white/15 px-3.5 text-xs">1:15 pm</span>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="flex flex-col gap-2.5 rounded-[28px] bg-accent-tint p-5 sm:col-span-2">
              <div className="flex gap-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-accent">
                  <EnvelopeSimple size={16} />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                  <ChatText size={16} weight="fill" />
                </span>
              </div>
              <span className="text-[15px] font-bold leading-tight text-ink">Email + SMS reminders</span>
              <span className="text-xs leading-relaxed text-[#6B5444]">SMS works even on a basic phone.</span>
            </div>
            <div className="relative min-h-[170px] overflow-hidden rounded-[28px] sm:col-span-3">
              <Image
                src="/images/patient-smiling-appointment.jpg"
                alt="Patient smiling while managing her appointment"
                fill
                className="object-cover object-[50%_32%]"
              />
              <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/90 px-3.5 py-2.5 backdrop-blur-sm">
                <div className="text-sm font-bold">Manage from your phone</div>
                <div className="text-xs text-muted">Reschedule or cancel anytime</div>
              </div>
            </div>
          </div>

          <h3 className="mb-3.5 text-lg font-bold text-ink">How it works</h3>
          <div className="flex flex-col divide-y divide-dashed divide-[#E3EAE8] rounded-[28px] bg-surface px-5 shadow-[0_12px_28px_-22px_rgba(20,35,31,0.45)]">
            {[
              { n: 1, label: "Pick a doctor", bg: "bg-primary" },
              { n: 2, label: "Choose a free slot", bg: "bg-primary" },
              { n: 3, label: "Get reminded the day before", bg: "bg-accent" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3.5 py-3">
                <span
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${step.bg}`}
                >
                  {step.n}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <DeviceMobile size={20} weight="bold" />
            </span>
            <span className="text-sm font-semibold text-ink">Works great on any phone browser</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Stethoscope size={20} weight="bold" />
            </span>
            <span className="text-sm font-semibold text-ink">Front desk, doctors and admin, one system</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <ChatText size={20} weight="bold" />
            </span>
            <span className="text-sm font-semibold text-ink">Reminders that reach you, even with no data</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted sm:px-8">
        <div>© 2026 CareSlot. All rights reserved.</div>
      </footer>
    </div>
  );
}
