"use client";

import { useRef, useState, FormEvent } from "react";
import { Camera, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import type { StaffRole } from "@/lib/auth";

interface StaffProfileFormProps {
  userId: string;
  email: string;
  role: StaffRole;
  initialFullName: string;
  initialPhone: string;
  initialSpecialty: string | null;
  initialBio: string;
  initialPhotoUrl: string | null;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function StaffProfileForm({
  userId,
  email,
  role,
  initialFullName,
  initialPhone,
  initialSpecialty,
  initialBio,
  initialPhotoUrl,
}: StaffProfileFormProps) {
  const isDoctor = role === "doctor";
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [bio, setBio] = useState(initialBio);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be under 5MB.");
      return;
    }

    setError(null);
    setUploadingPhoto(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("doctor-photos").upload(path, file, { upsert: true });
    if (uploadError) {
      setUploadingPhoto(false);
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("doctor-photos").getPublicUrl(path);

    const { error: updateError } = await supabase.from("doctors").update({ photo_url: publicUrl }).eq("id", userId);
    setUploadingPhoto(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPhotoUrl(publicUrl);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    if (isDoctor) {
      const { error: doctorError } = await supabase.from("doctors").update({ bio: bio.trim() || null }).eq("id", userId);
      if (doctorError) {
        setSaving(false);
        setError(doctorError.message);
        return;
      }
    }

    setSaving(false);
    setSuccess(true);
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex max-w-xl flex-col gap-4 rounded-[30px] bg-surface p-6 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]"
    >
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profile updated.</Alert>}

      {isDoctor && (
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-primary-tint">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={fullName || "Doctor photo"} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                {(fullName || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex h-10 items-center gap-2 rounded-full bg-primary-tint px-4 text-[13px] font-bold text-primary disabled:opacity-60"
            >
              <Camera size={16} />
              {uploadingPhoto ? "Uploading…" : "Change photo"}
            </button>
            <p className="mt-1.5 text-[11px] text-muted">Shown to patients when they&apos;re picking a doctor to book with.</p>
          </div>
        </div>
      )}

      <TextField label="Full name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <TextField label="Email" name="email" value={email} onChange={() => {}} disabled hint="Contact an admin to change your email." />
      <TextField label="Phone number" type="tel" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

      {isDoctor && (
        <>
          <TextField
            label="Specialty"
            name="specialty"
            value={initialSpecialty ?? ""}
            onChange={() => {}}
            disabled
            hint="Contact an admin to change your specialty."
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="A short note patients see when choosing a doctor."
              className="w-full rounded-[20px] bg-white px-4 py-3 text-sm text-ink shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-1 flex h-[50px] items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white disabled:opacity-60"
      >
        <FloppyDisk size={17} />
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
