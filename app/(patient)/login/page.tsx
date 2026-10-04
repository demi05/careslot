"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BellRinging } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { getPostLoginRedirect } from "@/lib/getPostLoginRedirect";
import { LogoMark } from "@/components/ui/Logo";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { TextField } from "@/components/ui/TextField";
import { PillCTAButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface FieldErrors {
  email?: string;
  password?: string;
}

function CallbackError() {
  const searchParams = useSearchParams();
  if (searchParams.get("error") !== "auth-callback-failed") return null;
  return <Alert variant="error">That sign-in link didn&apos;t work. Please try again.</Alert>;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const fieldErrors: FieldErrors = {};
    if (!form.email.trim()) fieldErrors.email = "Enter your email address.";
    if (!form.password) fieldErrors.password = "Enter your password.";
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        setFormError(
          error.message === "Invalid login credentials"
            ? "That email and password don't match our records."
            : error.message
        );
        return;
      }
      router.push(await getPostLoginRedirect(supabase, data.user.id));
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setFormError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push(await getPostLoginRedirect(supabase, data.user.id));
      router.refresh();
    } catch {
      setFormError("Couldn't sign in with Google. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-[420px] animate-fade-in-up">
      <div className="relative h-[220px]">
        <div className="absolute inset-0 overflow-hidden rounded-bl-[90px] bg-primary-tint">
          <Image
            src="/images/doctor-login-bg.jpg"
            alt="Doctor holding a stethoscope, smiling"
            fill
            className="object-cover object-[50%_20%]"
          />
          <div className="absolute left-6 top-6">
            <LogoMark size={36} />
          </div>
        </div>
        <div className="absolute -bottom-8 right-6 flex -rotate-3 items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_16px_30px_-14px_rgba(20,35,31,0.35)]">
          <BellRinging size={18} weight="fill" className="text-accent" />
          <span className="text-xs font-bold">Reminder: Thu, 10:30 am</span>
        </div>
      </div>

      <div className="px-6 pb-12 pt-10">
        <h1 className="mb-6 text-[32px] font-bold leading-[1.05] tracking-[-0.035em] text-ink">
          Welcome
          <br />
          back
        </h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[14px]">
          <Suspense fallback={null}>
            <CallbackError />
          </Suspense>
          {formError && <Alert variant="error">{formError}</Alert>}

          <TextField
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
            autoComplete="email"
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-ink">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-primary">
                Forgot password?
              </Link>
            </div>
            <TextField
              label="Password"
              hideLabel
              type="password"
              name="password"
              id="password"
              placeholder="Your password"
              value={form.password}
              onChange={updateField("password")}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <div className="mt-1">
            <PillCTAButton type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Log in"}
            </PillCTAButton>
          </div>

          <GoogleButton onCredential={handleGoogleCredential} text="continue_with" />

          <p className="text-center text-[13px] text-muted">
            New to CareSlot?{" "}
            <Link href="/register" className="font-bold text-accent-dark">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
