"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StaffSignupForm } from "@/components/patient/StaffSignupForm";

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(form: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!form.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.phone.trim()) {
    errors.phone = "Phone number is required for SMS reminders.";
  }
  if (!form.password) {
    errors.password = "Create a password.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

type AccountType = "patient" | "staff";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("patient");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: "patient",
          },
        },
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      if (data.session) {
        // Email confirmation is disabled on this project, so signUp already
        // returned an active session.
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setSuccess(true);
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
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Couldn't sign up with Google. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-[480px] animate-fade-in-up px-6 py-16 text-center">
        <div className="mx-auto mb-4 w-fit">
          <LogoMark size={36} />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-primary">Check your email</h1>
        <p className="mb-6 text-muted">
          We&apos;ve sent a confirmation link to <strong className="text-ink">{form.email}</strong>.
          Confirm your address, then log in to book your first appointment.
        </p>
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] animate-fade-in-up px-6 py-12">
      <BackButton href="/" />
      <div className="mb-7 text-center">
        <div className="mx-auto mb-3 w-fit">
          <LogoMark size={36} />
        </div>
        <h1 className="text-2xl font-bold text-primary">Create your account</h1>
      </div>

      <div className="mb-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setAccountType("patient")}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            accountType === "patient"
              ? "border-primary bg-primary text-white"
              : "border-gray-300 bg-white text-ink"
          }`}
        >
          I&apos;m a patient
        </button>
        <button
          type="button"
          onClick={() => setAccountType("staff")}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            accountType === "staff" ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-ink"
          }`}
        >
          I&apos;m hospital staff
        </button>
      </div>

      {accountType === "staff" ? (
        <StaffSignupForm />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7"
        >
          <GoogleButton onCredential={handleGoogleCredential} text="signup_with" />

          <div className="flex items-center gap-3 text-[13px] text-gray-400">
            <div className="h-px flex-1 bg-border" />
            or continue with email
            <div className="h-px flex-1 bg-border" />
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <TextField
            label="Full name"
            name="fullName"
            placeholder="Adaeze Nwosu"
            value={form.fullName}
            onChange={updateField("fullName")}
            error={errors.fullName}
            autoComplete="name"
          />
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
            label="Phone number"
            type="tel"
            name="phone"
            placeholder="+234 803 000 0000"
            requiredBadge
            value={form.phone}
            onChange={updateField("phone")}
            error={errors.phone}
            hint={errors.phone ? undefined : "We use this to send your appointment reminders by SMS."}
            autoComplete="tel"
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={updateField("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm password"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button type="submit" loading={submitting} className="mt-2">
            Create account
          </Button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
