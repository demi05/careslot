"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialFullName: string;
  initialPhone: string;
  initialSmsReminders: boolean;
  initialEmailReminders: boolean;
  memberSince: string;
}

export function ProfileForm({
  userId,
  email,
  initialFullName,
  initialPhone,
  initialSmsReminders,
  initialEmailReminders,
  memberSince,
}: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [smsReminders, setSmsReminders] = useState(initialSmsReminders);
  const [emailReminders, setEmailReminders] = useState(initialEmailReminders);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        sms_reminders: smsReminders,
        email_reminders: emailReminders,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-tint text-3xl font-bold text-primary">
          {(fullName || email).charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-bold text-ink">{fullName || "Your name"}</div>
          <div className="text-sm text-muted">Patient since {memberSince}</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-muted">Email address</label>
            <div className="text-[15px] font-semibold text-ink">{email}</div>
          </div>
          <div className="mb-4">
            <TextField label="Full name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <TextField
            label="Phone number"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Used to send your appointment reminders by SMS."
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-3 text-sm font-bold text-ink">Reminder preferences</div>
          <label className="mb-3 flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={smsReminders}
              onChange={(e) => setSmsReminders(e.target.checked)}
              className="h-[18px] w-[18px] accent-primary"
            />
            SMS reminders
          </label>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={emailReminders}
              onChange={(e) => setEmailReminders(e.target.checked)}
              className="h-[18px] w-[18px] accent-primary"
            />
            Email reminders
          </label>
        </div>

        {success && <Alert variant="success">Profile updated.</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white py-3.5 text-[15px] font-bold text-[#9A4A40] transition-colors hover:bg-danger-tint"
      >
        <SignOut size={18} />
        Log out
      </button>
    </div>
  );
}
