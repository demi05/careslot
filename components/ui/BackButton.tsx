import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Go back"
      className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:bg-background"
    >
      <ArrowLeft size={16} />
    </Link>
  );
}
