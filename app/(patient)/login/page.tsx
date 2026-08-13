"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({
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
      setLoggedIn(true);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setFormError(error.message);
    } catch {
      setFormError("Couldn't reach Google sign-in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoggedIn(false);
    setForm({ email: "", password: "" });
  }

  if (loggedIn) {
    return (
      <div className="mx-auto max-w-[420px] animate-fade-in-up px-6 py-16 text-center">
        <div className="mx-auto mb-4 w-fit">
          <LogoMark size={36} />
        </div>
        <Alert variant="success">You&apos;re signed in.</Alert>
        <p className="my-6 text-muted">
          Your patient dashboard is coming in the next build. Check back soon
          to book and manage appointments.
        </p>
        <button
          onClick={handleSignOut}
          className="font-semibold text-primary underline underline-offset-2"
        >
          Log out
        </button>
      </div>
    );
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
        <GoogleButton label="Continue with Google" onClick={handleGoogleLogin} disabled={googleLoading} />

        <div className="flex items-center gap-3 text-[13px] text-gray-400">
          <div className="h-px flex-1 bg-border" />
          or continue with email
          <div className="h-px flex-1 bg-border" />
        </div>

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
