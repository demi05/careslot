"use client";

import { useRef, useState, FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, EnvelopeSimple, EnvelopeOpen } from "@phosphor-icons/react/dist/ssr";
import { requestStaffSignupAction, verifyStaffSignupCodeAction } from "@/app/(patient)/register/actions";
import { PillCTAButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Step = "request" | "verify" | "done";

export function StaffSignupForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    const result = await requestStaffSignupAction(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("verify");
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await verifyStaffSignupCodeAction(email, code);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[32px] border border-border bg-surface p-7 text-center">
        <h2 className="text-lg font-bold text-ink">Account created</h2>
        <p className="text-sm text-muted">
          Use &quot;Forgot password&quot; on the login page with <strong className="text-ink">{email}</strong> to
          set your password and sign in.
        </p>
        <Link href="/login" className="font-bold text-accent-dark">
          Go to log in
        </Link>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} noValidate className="flex flex-col gap-[18px] pt-2">
        <div className="relative mt-2 h-[110px] w-[110px]">
          <div className="absolute inset-0 rotate-[-8deg] rounded-[32px] bg-primary" />
          <div className="absolute inset-0 flex items-center justify-center rounded-[32px] bg-white text-primary shadow-[0_20px_40px_-20px_rgba(20,35,31,0.4)]">
            <EnvelopeOpen size={40} />
          </div>
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-accent text-sm font-bold text-white">
            6
          </span>
        </div>

        <h2 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-ink">Check your email</h2>
        <p className="-mt-2 text-sm leading-relaxed text-muted">
          Enter the 6-digit code we sent to <strong className="font-bold text-ink">{email}</strong>
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-6 gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-[58px] rounded-[18px] bg-white text-center text-2xl font-bold text-ink shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none focus:shadow-[inset_0_0_0_2px_#1A5C52]"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setStep("request");
            setDigits(["", "", "", "", "", ""]);
            setError(null);
          }}
          className="flex items-center gap-1.5 self-start text-[13px] font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={14} />
          Use a different email
        </button>

        <PillCTAButton type="submit" disabled={submitting || code.length < 6} className="mt-1">
          {submitting ? "Verifying…" : "Verify and continue"}
        </PillCTAButton>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} noValidate className="pt-2">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-primary to-primary-dark">
        <div className="relative h-[150px] w-full">
          <Image
            src="/images/staff-signup-bg.jpg"
            alt="Hospital staff member in scrubs with a stethoscope"
            fill
            className="object-cover object-[50%_20%] opacity-55 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/20 to-primary-dark" />
        </div>

        <div className="relative -mt-7 flex flex-col gap-4 rounded-t-[32px] bg-white p-6">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1.5 text-[11px] font-bold text-accent-dark">
            <ShieldCheck size={14} weight="fill" />
            Pre-approved staff only
          </span>
          <h2 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-ink">
            Use the email on the hospital roster
          </h2>
          <p className="-mt-1 text-sm leading-relaxed text-muted">
            Your role and details are already set by your administrator. We just need to confirm it&apos;s you.
          </p>

          {error && <Alert variant="error">{error}</Alert>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Work email</label>
            <div className="flex h-[52px] items-center gap-2.5 rounded-full bg-white px-[18px] shadow-[inset_0_0_0_2px_#1A5C52]">
              <EnvelopeSimple size={18} className="shrink-0 text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
                className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          <PillCTAButton type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send code"}
          </PillCTAButton>

          <span className="text-center text-xs text-muted">Not on the roster? Ask your administrator.</span>
        </div>
      </div>
    </form>
  );
}
