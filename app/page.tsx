import Link from "next/link";
import {
  CalendarCheck,
  BellRinging,
  DeviceMobile,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";

const features = [
  {
    icon: CalendarCheck,
    iconBg: "bg-primary-tint",
    iconColor: "text-primary",
    title: "Real-time slot availability",
    description:
      "See exactly which doctors are free, today or next week, before you book.",
  },
  {
    icon: BellRinging,
    iconBg: "bg-accent-tint",
    iconColor: "text-accent-dark",
    title: "Email and SMS reminders",
    description:
      "Automatic reminders before every visit, sent the way that works for you.",
  },
  {
    icon: DeviceMobile,
    iconBg: "bg-primary-tint",
    iconColor: "text-primary",
    title: "Manage your bookings anytime",
    description:
      "Reschedule or cancel from your phone, no phone calls or front-desk queues.",
  },
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-12 px-6 py-14 sm:px-8 sm:py-16">
          <div className="min-w-[280px] flex-1">
            <h1 className="mb-4 text-[32px] font-extrabold leading-tight text-primary sm:text-[46px]">
              Healthcare access, simplified.
            </h1>
            <p className="mb-8 max-w-md text-lg text-muted">
              Book hospital appointments in minutes, get reminders that
              actually reach you, and manage your visits from any device.
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
          <div className="flex aspect-[4/3] min-w-[260px] max-w-md flex-1 items-center justify-center overflow-hidden rounded-2xl bg-primary-tint shadow-[0_24px_48px_rgba(26,92,82,0.16)]">
            <div className="flex flex-col items-center gap-3 text-primary">
              <CalendarCheck size={64} weight="duotone" />
              <span className="px-8 text-center text-sm font-medium text-primary/70">
                Booking an appointment, right from your phone
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-16 pt-2 sm:px-8 md:grid-cols-3">
        {features.map(({ icon: Icon, iconBg, iconColor, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-surface p-7 transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,92,82,0.1)]"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}>
              <Icon size={22} weight="bold" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-ink">{title}</h3>
            <p className="text-[15px] text-muted">{description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted sm:px-8">
        <div className="mb-1.5 font-semibold text-ink">Unity Hospital, Eleyele</div>
        <div className="mb-1.5">Eleyele, Ibadan, Oyo State · +234 803 412 7788</div>
        <div>© 2026 CareSlot. All rights reserved.</div>
      </footer>
    </div>
  );
}
