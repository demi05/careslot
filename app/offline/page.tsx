import { WifiSlash } from "@phosphor-icons/react/dist/ssr";
import { LogoMark } from "@/components/ui/Logo";

/**
 * Fully static by design — no data fetching, no auth check. The service
 * worker (public/sw.js) precaches this page so it can render with zero
 * network, as the fallback when a public-page navigation fails offline.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={36} />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        <WifiSlash size={26} weight="bold" />
      </span>
      <h1 className="text-xl font-bold text-ink">You&apos;re offline</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        CareSlot needs a connection to load this. Check your signal and try again — the landing, login and register
        pages stay available even offline once you&apos;ve opened them once.
      </p>
    </div>
  );
}
