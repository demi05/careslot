"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const fieldErrors: FieldErrors = {};
    if (!form.password) {
      fieldErrors.password = "Create a new password.";
    } else if (form.password.length < 8) {
      fieldErrors.password = "Password must be at least 8 characters.";
    }
    if (form.confirmPassword !== form.password) {
      fieldErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) {
        setFormError(error.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] animate-fade-in-up px-6 py-16">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-3">
          <LogoMark size={36} />
        </div>
        <span className="text-xl font-bold text-primary">CareSlot</span>
      </div>

      <div className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7">
        <div>
          <h1 className="mb-1.5 text-[19px] font-bold text-ink">Set a new password</h1>
          <p className="text-sm text-muted">
            Choose a new password for your account.
          </p>
        </div>

        {formError && <Alert variant="error">{formError}</Alert>}

        {success ? (
          <Alert variant="success">Password updated. Taking you to log in…</Alert>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <TextField
              label="New password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={updateField("password")}
              error={errors.password}
              autoComplete="new-password"
            />
            <TextField
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
            <Button type="submit" loading={submitting}>
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
