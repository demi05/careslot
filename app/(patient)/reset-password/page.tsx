"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyOpen } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Weak. Try a longer password.", color: "text-danger" };
  if (score <= 2) return { score: 2, label: "Okay. Add a number or symbol.", color: "text-warning" };
  if (score === 3) return { score: 3, label: "Strong. Add a symbol to make it stronger.", color: "text-success" };
  return { score: 4, label: "Very strong.", color: "text-success" };
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

  const strength = passwordStrength(form.password);
  const mismatch = form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

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
      fieldErrors.confirmPassword = "Passwords don't match yet.";
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
    <div className="mx-auto max-w-[420px] animate-fade-in-up bg-gradient-to-b from-accent-tint to-background px-6 pb-16 pt-10">
      <span className="mb-5 flex h-[62px] w-[62px] -rotate-6 items-center justify-center rounded-[22px] bg-white text-accent shadow-[0_14px_30px_-16px_rgba(180,97,31,0.5)]">
        <LockKeyOpen size={28} />
      </span>
      <h1 className="mb-5 text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-ink">Set a new password</h1>

      {formError && <Alert variant="error">{formError}</Alert>}

      {success ? (
        <Alert variant="success">Password updated. Taking you to log in…</Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
          <div>
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
            {form.password && (
              <>
                <div className="mt-2 grid grid-cols-4 gap-1 px-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-[5px] rounded-full ${
                        i < strength.score
                          ? strength.score <= 1
                            ? "bg-danger"
                            : strength.score <= 2
                              ? "bg-warning"
                              : "bg-success"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <span className={`mt-1 block pl-1.5 text-[11px] font-medium ${strength.color}`}>
                  {strength.label}
                </span>
              </>
            )}
          </div>
          <div>
            <TextField
              label="Confirm new password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              error={errors.confirmPassword ?? (mismatch ? "Passwords don't match yet." : undefined)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-14 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
