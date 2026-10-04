"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { TextField } from "@/components/ui/TextField";
import { PillCTAButton } from "@/components/ui/Button";
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
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
          <PaperPlaneTilt size={26} weight="fill" />
        </span>
        <h1 className="mb-3 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mb-6 text-muted">
          We&apos;ve sent a confirmation link to <strong className="text-ink">{form.email}</strong>. Confirm your
          address, then log in to book your first appointment.
        </p>
        <Link href="/login" className="font-semibold text-accent-dark">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] animate-fade-in-up px-6 pb-12 pt-6">
      <BackButton href="/" />
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <LogoMark size={30} />
        <span className="text-lg font-bold text-primary">CareSlot</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-white p-[5px] shadow-[0_10px_24px_-18px_rgba(20,35,31,0.4)]">
        <button
          type="button"
          onClick={() => setAccountType("patient")}
          className={`flex h-10 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
            accountType === "patient" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          I&apos;m a patient
        </button>
        <button
          type="button"
          onClick={() => setAccountType("staff")}
          className={`flex h-10 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
            accountType === "staff" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          I&apos;m hospital staff
        </button>
      </div>

      {accountType === "staff" ? (
        <StaffSignupForm />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[14px]">
          <h1 className="mt-1 text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-ink">
            Create your account
          </h1>

          {formError && <Alert variant="error">{formError}</Alert>}

          <TextField
            label="Full name"
            name="fullName"
            placeholder="Chiamaka Nnadi"
            value={form.fullName}
            onChange={updateField("fullName")}
            error={errors.fullName}
            autoComplete="name"
          />
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
          <TextField
            label="Phone number"
            type="tel"
            name="phone"
            placeholder="803 412 7759"
            requiredBadge
            value={form.phone}
            onChange={updateField("phone")}
            error={errors.phone}
            hint={errors.phone ? undefined : "Required. We send SMS reminders here."}
            autoComplete="tel"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              label="Password"
              type="password"
              name="password"
              placeholder="8+ characters"
              value={form.password}
              onChange={updateField("password")}
              error={errors.password}
              autoComplete="new-password"
            />
            <TextField
              label="Confirm"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter"
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <div className="mt-1">
            <PillCTAButton type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Create account"}
            </PillCTAButton>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton onCredential={handleGoogleCredential} text="signup_with" />

          <p className="text-center text-[13px] text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent-dark">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
