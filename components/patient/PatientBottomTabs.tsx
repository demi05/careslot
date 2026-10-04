"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarBlank, Bell, User } from "@phosphor-icons/react/dist/ssr";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/appointments", label: "Appointments", icon: CalendarBlank },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function PatientBottomTabs() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center sm:hidden">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/90 p-1.5 shadow-[0_16px_36px_-14px_rgba(20,35,31,0.35)] backdrop-blur-md">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex items-center justify-center rounded-full transition-colors ${
                active ? "h-[54px] w-[54px] bg-primary text-white" : "h-[50px] w-[50px] text-muted"
              }`}
            >
              <Icon size={active ? 22 : 21} weight={active ? "fill" : "regular"} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
