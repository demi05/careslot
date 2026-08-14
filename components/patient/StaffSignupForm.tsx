"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requestStaffSignupAction, verifyStaffSignupCodeAction } from "@/app/(patient)/register/actions";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type StaffRole = "doctor" | "front-desk";
type Step = "request" | "verify" | "done";

export function StaffSignupForm() {
  const [step, setStep] = useState<Step>("request");
  const [role, setRole] = useState<StaffRole>("front-desk");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    if (role === "doctor" && !specialty.trim()) {
      setError("Specialty is required for a doctor account.");
      return;
    }
    setSubmitting(true);
    const result = await requestStaffSignupAction(fullName, email, role, specialty);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("verify");
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-7 text-center">
        <h2 className="text-lg font-bold text-primary">Account created</h2>
        <p className="text-sm text-muted">
          Use &quot;Forgot password&quot; on the login page with <strong className="text-ink">{email}</strong> to
          set your password and sign in.
        </p>
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Go to log in
        </Link>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form
        onSubmit={handleVerify}
        noValidate
        className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7"
      >
        <div>
          <h2 className="mb-1.5 text-lg font-bold text-ink">Check your email</h2>
          <p className="text-sm text-muted">
            We sent a 6-digit code to <strong className="text-ink">{email}</strong>. Enter it below to finish
            creating your account.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <TextField
          label="Verification code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
        />

        <Button type="submit" loading={submitting}>
          Verify and create account
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("request");
            setCode("");
            setError(null);
          }}
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={14} />
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleRequest}
      noValidate
      className="flex flex-col gap-[18px] rounded-2xl border border-border bg-surface p-7"
    >
      <div>
        <h2 className="mb-1.5 text-lg font-bold text-ink">Create a staff account</h2>
        <p className="text-sm text-muted">
          You&apos;ll need your hospital email address. We&apos;ll send a verification code to confirm it&apos;s
          really you.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Role</label>
        <div className="flex gap-2">
          {(["front-desk", "doctor"] as StaffRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                role === r ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-ink"
              }`}
            >
              {r === "doctor" ? "Doctor" : "Front desk"}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Full name"
        name="fullName"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Nkechi Obi"
        autoComplete="name"
      />
      <TextField
        label="Hospital email address"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@hospital.org"
        autoComplete="email"
        hint="Must be your official hospital email address."
      />
      {role === "doctor" && (
        <TextField
          label="Specialty"
          name="specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="General Practice"
        />
      )}

      <Button type="submit" loading={submitting}>
        Send verification code
      </Button>
    </form>
  );
}
