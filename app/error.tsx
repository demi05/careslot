"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { LogoMark } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={36} />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger">
        <WarningCircle size={26} weight="bold" />
      </span>
      <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        That wasn&apos;t supposed to happen. Try again, and if it keeps failing, head back and try a different
        screen.
      </p>
      <div className="mt-2 flex items-center gap-2.5">
        <button type="button" onClick={reset} className={buttonClasses("primary")}>
          <ArrowClockwise size={16} weight="bold" />
          Try again
        </button>
        <Link href="/" className={buttonClasses("ghost")}>
          Back to CareSlot
        </Link>
      </div>
    </div>
  );
}
