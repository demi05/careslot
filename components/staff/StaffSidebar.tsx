"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SquaresFour,
  CalendarCheck,
  Stethoscope,
  Pill,
  ChartDonut,
  BellRinging,
  GearSix,
  SignOut,
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
  { href: "/staff/notifications", label: "Notifications", icon: BellRinging, roles: ["front-desk", "admin"] },
  { href: "/staff/analytics", label: "Analytics", icon: ChartDonut, roles: ["admin"] },
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
  const displayName = fullName ?? "You";

  return (
    <div className="relative flex w-[248px] shrink-0 flex-col gap-7 overflow-hidden bg-primary-dark px-4 py-[26px] text-white">
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(224,123,57,0.22),transparent_70%)]" />

      <div className="relative flex items-center gap-2.5 px-2">
        <LogoMark size={28} />
        <span className="text-lg font-bold tracking-[-0.02em]">CareSlot</span>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className="px-3 pb-1.5 text-[11px] text-[#8FB5AD]">Menu</span>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const lockedToAdmin = item.roles.length === 1;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[46px] items-center gap-3 rounded-full px-3.5 text-sm transition-colors ${
                active ? "bg-background font-semibold text-primary-dark" : "font-medium text-[#D3E5E1] hover:bg-white/10"
              }`}
            >
              <Icon size={19} weight={active ? "fill" : "regular"} />
              <span className="flex-1">{item.label}</span>
              {lockedToAdmin && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-[#F2A472]">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="relative mt-auto flex flex-col gap-3 rounded-[24px] border border-white/[0.08] bg-white/[0.07] p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold">{displayName}</span>
            <span className="text-[11px] font-semibold text-[#F2A472]">{roleLabels[role]}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-[38px] items-center justify-center gap-2 rounded-full bg-white/10 text-[13px] font-medium transition-colors hover:bg-white/15"
        >
          <SignOut size={15} />
          Log out
        </button>
      </div>
    </div>
  );
}
