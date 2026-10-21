import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";
import { LogoMark } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={36} />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Compass size={26} weight="bold" />
      </span>
      <h1 className="text-xl font-bold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved. Check the link, or head back to a
        screen you know.
      </p>
      <Link href="/" className={buttonClasses("primary", "mt-2")}>
        Back to CareSlot
      </Link>
    </div>
  );
}
