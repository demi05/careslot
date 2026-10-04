"use client";

import { useState, FormEvent } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { BackButton } from "@/components/ui/BackButton";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendResetLink() {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendResetLink();
  }

  return (
    <div className="mx-auto max-w-[420px] animate-fade-in-up px-6 pb-16 pt-6">
      <BackButton href="/login" />

      {sent ? (
        <div className="flex flex-col gap-3.5 rounded-[42px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-[0_-20px_50px_-20px_rgba(18,64,57,0.6)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <PaperPlaneTilt size={26} weight="fill" />
          </span>
          <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em]">Link sent. Check your inbox.</h2>
          <p className="text-[13px] leading-relaxed text-[#BFD9D3]">
            It expires in 30 minutes. Look in spam if you can&apos;t find it.
          </p>
          <div className="flex gap-2">
            <a
              href={`mailto:${email}`}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-sm font-bold text-primary-dark"
            >
              Open email app
            </a>
            <button
              type="button"
              onClick={sendResetLink}
              disabled={submitting}
              className="flex h-12 items-center justify-center rounded-full bg-white/15 px-4 text-sm font-bold disabled:opacity-60"
            >
              Resend
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px] pt-4">
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-ink">
            Forgot your
            <br />
            password?
          </h1>
          <p className="-mt-2 text-sm leading-relaxed text-muted">
            Enter your email and we&apos;ll send a link to set a new one.
          </p>

          {error && <Alert variant="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex h-14 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
