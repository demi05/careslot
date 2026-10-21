"use client";

import { useEffect } from "react";
import { WarningOctagon, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import "./globals.css";

/**
 * Catches errors thrown by the root layout itself, which error.tsx can't
 * reach (it only covers errors inside the layout's children). Replaces
 * the entire document, so it renders its own html/body rather than
 * relying on app/layout.tsx.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-ink">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="relative h-9 w-9 shrink-0 rounded-[7px] bg-primary">
            <div className="absolute inset-x-[17%] top-[17%] h-[3px] rounded-sm bg-accent" />
            <div className="absolute bottom-[20%] left-[20%] h-[6px] w-[6px] rounded-[1px] bg-white" />
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger">
            <WarningOctagon size={26} weight="bold" />
          </span>
          <h1 className="text-xl font-bold text-ink">CareSlot hit a problem</h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Something failed while loading the app itself. Try reloading the page — if it keeps happening, let us
            know what you were doing right before it broke.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[15px] font-bold text-white transition-all duration-150 ease-out hover:-translate-y-0.5"
          >
            <ArrowClockwise size={16} weight="bold" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
