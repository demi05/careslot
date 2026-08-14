"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  createStaffMemberAction,
  updateStaffRoleAction,
  toggleDoctorActiveAction,
  addRosterEntryAction,
  removeRosterEntryAction,
} from "@/app/staff/settings/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import type { StaffRole } from "@/lib/auth";

export interface StaffMemberItem {
  id: string;
  full_name: string | null;
  role: "front-desk" | "admin";
}

export interface DoctorSettingsItem {
  id: string;
  full_name: string | null;
  specialty: string;
  is_active: boolean;
}

export interface RosterEntryItem {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  specialty: string | null;
  claimed: boolean;
}

const roleLabels: Record<StaffRole, string> = {
  doctor: "Doctor",
  "front-desk": "Front desk",
  admin: "Administrator",
};

interface StaffSettingsManagerProps {
  staffMembers: StaffMemberItem[];
  doctors: DoctorSettingsItem[];
  roster: RosterEntryItem[];
}

export function StaffSettingsManager({ staffMembers, doctors, roster }: StaffSettingsManagerProps) {
  return (
    <div className="flex flex-col gap-8">
      <AddStaffForm />

      <RosterSection roster={roster} />

      <section>
        <h2 className="mb-3.5 text-[17px] font-bold text-ink">Front desk &amp; admin staff</h2>
        {staffMembers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
            No front-desk or admin staff yet besides you.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {staffMembers.map((s) => (
              <StaffRoleRow key={s.id} member={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3.5 text-[17px] font-bold text-ink">Doctors</h2>
        {doctors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
            No doctors added yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {doctors.map((d) => (
              <DoctorActiveRow key={d.id} doctor={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RosterSection({ roster }: { roster: RosterEntryItem[] }) {
  const [role, setRole] = useState<StaffRole>("doctor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await addRosterEntryAction(fullName, email, role, role === "doctor" ? specialty : undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(`${fullName} can now sign up at /register using ${email}.`);
      setFullName("");
      setEmail("");
      setSpecialty("");
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeRosterEntryAction(id);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-[17px] font-bold text-ink">Approved staff roster</h2>
      <p className="mb-4 text-sm text-muted">
        This hospital has no email domain to gate signups on, so self-service staff signup checks this list
        instead. Add a worker here with the email they&apos;ll actually use — they can then sign up at{" "}
        <span className="font-semibold text-ink">/register</span> and verify it with a one-time code.
      </p>

      <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Role</label>
          <div className="flex flex-wrap gap-2">
            {(["doctor", "front-desk", "admin"] as StaffRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  role === r ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-ink"
                }`}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            name="rosterFullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nkechi Obi"
          />
          <TextField
            label="Email address"
            type="email"
            name="rosterEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nkechi@gmail.com"
          />
        </div>

        {role === "doctor" && (
          <TextField
            label="Specialty"
            name="rosterSpecialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="General Practice"
          />
        )}

        <Button type="submit" loading={pending} className="!w-fit">
          Add to roster
        </Button>
      </form>

      {roster.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background p-5 text-sm text-muted">
          No one is on the roster yet — self-service staff signup will reject everyone until you add entries here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {roster.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F2F3] px-5 py-3.5 last:border-b-0"
            >
              <div>
                <div className="text-sm font-semibold text-ink">{entry.full_name}</div>
                <div className="text-[13px] text-muted">
                  {entry.email} · {roleLabels[entry.role]}
                  {entry.specialty ? ` · ${entry.specialty}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    entry.claimed ? "bg-success-tint text-success" : "bg-background text-muted"
                  }`}
                >
                  {entry.claimed ? "Account claimed" : "Not signed up yet"}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(entry.id)}
                  disabled={pending}
                  className="text-[13px] font-semibold text-danger hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddStaffForm() {
  const [role, setRole] = useState<StaffRole>("doctor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createStaffMemberAction(fullName, email, role, role === "doctor" ? specialty : undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Account created for ${fullName}. Ask them to use "Forgot password" at the login page with ${email} to set their password.`
      );
      setFullName("");
      setEmail("");
      setSpecialty("");
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-[17px] font-bold text-ink">Add a staff member</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Role</label>
          <div className="flex flex-wrap gap-2">
            {(["doctor", "front-desk", "admin"] as StaffRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  role === r ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-ink"
                }`}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nkechi Obi"
          />
          <TextField
            label="Email address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
          />
        </div>

        {role === "doctor" && (
          <TextField
            label="Specialty"
            name="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="General Practice"
          />
        )}

        <Button type="submit" loading={pending} className="!w-fit">
          Create account
        </Button>
      </form>
    </section>
  );
}

function StaffRoleRow({ member }: { member: StaffMemberItem }) {
  const [role, setRole] = useState<"front-desk" | "admin">(member.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleChange(newRole: "front-desk" | "admin") {
    setRole(newRole);
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateStaffRoleAction(member.id, newRole);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F2F3] px-5 py-3.5 last:border-b-0">
      <span className="text-sm font-semibold text-ink">{member.full_name ?? "Staff member"}</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-danger">{error}</span>}
        {saved && !pending && <span className="text-xs text-success">Saved</span>}
        <select
          value={role}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value as "front-desk" | "admin")}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-[13px] font-semibold text-ink disabled:opacity-60"
        >
          <option value="front-desk">Front desk</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
    </div>
  );
}

function DoctorActiveRow({ doctor }: { doctor: DoctorSettingsItem }) {
  const [isActive, setIsActive] = useState(doctor.is_active);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isActive;
    setIsActive(next);
    startTransition(async () => {
      await toggleDoctorActiveAction(doctor.id, next);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F2F3] px-5 py-3.5 last:border-b-0">
      <div>
        <div className="text-sm font-semibold text-ink">{doctor.full_name ?? "Doctor"}</div>
        <div className="text-[13px] text-muted">{doctor.specialty}</div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`rounded-lg border px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-60 ${
          isActive
            ? "border-gray-300 bg-white text-ink hover:bg-background"
            : "border-danger/30 bg-danger-tint text-danger"
        }`}
      >
        {isActive ? "Active — mark unavailable" : "Unavailable — reactivate"}
      </button>
    </div>
  );
}
