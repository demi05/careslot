import Link from "next/link";
import { SquaresFour, CalendarCheck, Pill, User } from "@phosphor-icons/react/dist/ssr";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill },
  { href: "/profile", label: "Profile", icon: User },
];

export function PatientBottomTabs() {
  return (
    <div className="flex justify-around border-t border-border bg-surface py-2 sm:hidden">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold text-muted"
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </div>
  );
}
