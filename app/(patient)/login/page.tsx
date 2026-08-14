"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPostLoginRedirect } from "@/lib/getPostLoginRedirect";
import { LogoMark } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
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
    <div className="mx-auto max-w-[420px] animate-fade-in-up px-6 py-16">
      <BackButton href="/" />
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-3">
          <LogoMark size={36} />
        </div>
        <span className="text-xl font-bold text-primary">CareSlot</span>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7"
      >
        <GoogleButton onCredential={handleGoogleCredential} text="continue_with" />

        <div className="flex items-center gap-3 text-[13px] text-gray-400">
          <div className="h-px flex-1 bg-border" />
          or continue with email
          <div className="h-px flex-1 bg-border" />
        </div>

        <Suspense fallback={null}>
          <CallbackError />
        </Suspense>
        {formError && <Alert variant="error">{formError}</Alert>}

        <TextField
          label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField("email")}
          error={errors.email}
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          placeholder="Your password"
          value={form.password}
          onChange={updateField("password")}
          error={errors.password}
          autoComplete="current-password"
        />

        <Link
          href="/forgot-password"
          className="-mt-2 text-right text-sm font-semibold text-primary"
        >
          Forgot password?
        </Link>

        <Button type="submit" loading={submitting}>
          Log in
        </Button>

        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
