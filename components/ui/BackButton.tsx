import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Go back"
      className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-12px_rgba(20,35,31,0.5)] transition-colors hover:bg-background"
    >
      <ArrowLeft size={18} />
    </Link>
  );
}
