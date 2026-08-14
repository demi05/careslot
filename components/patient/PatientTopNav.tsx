"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SquaresFour, CalendarCheck, Pill, Bell } from "@phosphor-icons/react/dist/ssr";
import { LogoMark } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export function PatientTopNav({ userName }: { userName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-lg font-bold text-primary">CareSlot</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] font-semibold text-primary sm:flex">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <SquaresFour size={18} />
            Dashboard
          </Link>
          <Link href="/appointments" className="flex items-center gap-1.5">
            <CalendarCheck size={18} />
            My appointments
          </Link>
          <Link href="/pharmacy" className="flex items-center gap-1.5">
            <Pill size={18} />
            Pharmacy
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/notifications" aria-label="Notifications" className="text-ink">
            <Bell size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold sm:inline">{userName}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-semibold text-muted transition-colors hover:text-danger"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
