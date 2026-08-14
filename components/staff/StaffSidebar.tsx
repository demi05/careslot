"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SquaresFour,
  CalendarCheck,
  Stethoscope,
  Pill,
  ChartBar,
  Bell,
  UserCircle,
  GearSix,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";
import type { StaffRole } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: typeof SquaresFour;
  roles: StaffRole[];
}

const navItems: NavItem[] = [
  { href: "/staff/dashboard", label: "Dashboard", icon: SquaresFour, roles: ["doctor", "front-desk", "admin"] },
  { href: "/staff/appointments", label: "Appointments", icon: CalendarCheck, roles: ["front-desk", "admin"] },
  { href: "/staff/doctors", label: "Doctors & Schedules", icon: Stethoscope, roles: ["front-desk", "admin"] },
  { href: "/staff/pharmacy", label: "Pharmacy", icon: Pill, roles: ["doctor", "front-desk", "admin"] },
  { href: "/staff/analytics", label: "Analytics", icon: ChartBar, roles: ["admin"] },
  { href: "/staff/notifications", label: "Notifications", icon: Bell, roles: ["front-desk", "admin"] },
  { href: "/staff/settings", label: "Settings", icon: GearSix, roles: ["admin"] },
];

const roleLabels: Record<StaffRole, string> = {
  doctor: "Doctor",
  "front-desk": "Front desk",
  admin: "Administrator",
};

export function StaffSidebar({ role, fullName }: { role: StaffRole; fullName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex w-56 shrink-0 flex-col gap-1 bg-primary-dark p-4 text-white">
      <div className="flex items-center gap-2 px-2 pb-6">
        <LogoMark size={24} />
        <span className="text-base font-bold">CareSlot</span>
      </div>

      {visibleItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              active ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <div className="flex items-center gap-2 px-2 text-[13px] text-white/70">
          <UserCircle size={18} />
          {roleLabels[role]} · {fullName ?? "You"}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
