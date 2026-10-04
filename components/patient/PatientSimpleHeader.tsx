import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

interface PatientSimpleHeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PatientSimpleHeader({ title, backHref = "/dashboard", action }: PatientSimpleHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 pt-6 sm:px-8">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Go back"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-12px_rgba(20,35,31,0.5)]"
        >
          <CaretLeft size={18} />
        </Link>
        <span className="text-2xl font-bold tracking-[-0.03em] text-ink">{title}</span>
      </div>
      {action}
    </div>
  );
}
