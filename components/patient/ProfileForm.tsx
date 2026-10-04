"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SignOut, EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
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

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-7 w-[46px] items-center rounded-full p-[3px] ${on ? "justify-end bg-primary" : "justify-start bg-[#D5DCDA]"}`}>
      <span className="h-[22px] w-[22px] rounded-full bg-white" />
    </span>
  );
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
      <div className="relative overflow-hidden rounded-[44px] bg-gradient-to-br from-primary to-primary-dark px-6 pb-9 pt-7 text-white">
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(224,123,57,0.35),transparent_70%)]" />
        <div className="relative flex items-end gap-3.5">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-white/20 bg-white/15 text-3xl font-bold">
            {(fullName || email).charAt(0).toUpperCase()}
          </div>
          <div className="pb-1.5">
            <div className="text-2xl font-bold tracking-[-0.02em]">{fullName || "Your name"}</div>
            <div className="text-xs text-[#BFD9D3]">Patient since {memberSince}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="-mt-5 flex flex-col gap-4 px-1">
        <div className="rounded-[30px] bg-surface p-5 shadow-[0_18px_40px_-26px_rgba(20,35,31,0.45)]">
          <div className="flex items-center gap-3 border-b border-[#EEF2F1] py-3">
            <EnvelopeSimple size={19} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Email</span>
              <span className="text-sm font-medium text-ink">{email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Phone size={19} className="text-primary" />
            <div className="flex-1">
              <span className="mb-1 block text-[11px] text-muted">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="803 412 7759"
                className="w-full bg-transparent text-sm font-medium text-ink focus:outline-none"
              />
            </div>
          </div>
          <div className="border-t border-[#EEF2F1] pt-3">
            <TextField label="Full name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        </div>

        <span className="text-base font-bold text-ink">Reminders</span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setEmailReminders((v) => !v)}
            className="flex flex-col gap-4 rounded-[26px] bg-primary-tint p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-primary">
                <EnvelopeSimple size={18} />
              </span>
              <Toggle on={emailReminders} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-ink">Email</span>
              <span className="text-[11px] text-[#4F5F5B]">Bookings and changes</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSmsReminders((v) => !v)}
            className="flex flex-col gap-4 rounded-[26px] bg-accent-tint p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-accent-dark">
                <Phone size={18} />
              </span>
              <Toggle on={smsReminders} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-ink">SMS</span>
              <span className="text-[11px] text-[#6B5444]">Day-before reminder</span>
            </div>
          </button>
        </div>

        {success && <Alert variant="success">Profile updated.</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <button
          type="submit"
          disabled={saving}
          className="flex h-[52px] items-center justify-center rounded-full bg-primary text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-[50px] items-center justify-center gap-2 rounded-full text-sm font-bold text-danger shadow-[inset_0_0_0_1px_#F3C4C4]"
        >
          <SignOut size={16} />
          Log out
        </button>
      </form>
    </div>
  );
}
