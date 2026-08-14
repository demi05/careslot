"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

  return (
    <div className="mx-auto max-w-[420px] animate-fade-in-up px-6 py-16">
      <BackButton href="/login" />
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-3">
          <LogoMark size={36} />
        </div>
        <span className="text-xl font-bold text-primary">CareSlot</span>
      </div>

      <div className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7">
        <div>
          <h1 className="mb-1.5 text-[19px] font-bold text-ink">Reset your password</h1>
          <p className="text-sm text-muted">
            Enter the email on your account and we&apos;ll send a link to reset your password.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {sent ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success-tint px-4 py-3.5 text-sm text-success">
            <CheckCircle size={20} weight="fill" className="shrink-0" />
            <span>
              If an account exists for that email, we&apos;ve sent reset instructions. Check your inbox.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <TextField
              label="Email address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" loading={submitting}>
              Send reset link
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-primary"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
}
