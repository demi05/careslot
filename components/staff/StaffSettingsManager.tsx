"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, Trash, UserPlus } from "@phosphor-icons/react/dist/ssr";
import {
  createStaffMemberAction,
  updateStaffRoleAction,
  toggleDoctorActiveAction,
  addRosterEntryAction,
  removeRosterEntryAction,
} from "@/app/staff/settings/actions";
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

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-6 w-10 items-center rounded-full p-[3px] ${on ? "justify-end bg-primary" : "justify-start bg-[#D5DCDA]"}`}>
      <span className="h-[18px] w-[18px] rounded-full bg-white" />
    </span>
  );
}

interface StaffSettingsManagerProps {
  staffMembers: StaffMemberItem[];
  doctors: DoctorSettingsItem[];
  roster: RosterEntryItem[];
}

export function StaffSettingsManager({ staffMembers, doctors, roster }: StaffSettingsManagerProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <div className="lg:row-span-2">
        <AddStaffForm />
      </div>
      <RosterSection roster={roster} />
      <StaffAccountsSection staffMembers={staffMembers} doctors={doctors} />
    </div>
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
      setSuccess(`Account created. Ask them to use "Forgot password" at login with ${email}.`);
      setFullName("");
      setEmail("");
      setSpecialty("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex h-full flex-col gap-3.5 overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-primary-dark p-6 text-white"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-[170px] w-[170px] rounded-full bg-accent/25" />
      <span className="relative text-lg font-bold tracking-[-0.02em]">Add a staff member</span>
      <span className="relative -mt-2 text-xs text-[#BFD9D3]">
        Creates the account directly. They get a welcome email.
      </span>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div>
        <label className="mb-1.5 block text-xs font-semibold">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Dr. Olu Ige"
          className="h-[46px] w-full rounded-full bg-white px-4 text-sm text-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold">Work email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="o.ige@example.com"
          className="h-[46px] w-full rounded-full bg-white px-4 text-sm text-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold">Role</label>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-white/10 p-1">
          {(["doctor", "front-desk", "admin"] as StaffRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex h-[38px] items-center justify-center rounded-full text-xs font-bold ${
                role === r ? "bg-white text-primary-dark" : "text-white/80"
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {role === "doctor" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold">Specialty</label>
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="General Practice"
            className="h-[46px] w-full rounded-full bg-white px-4 text-sm text-ink focus:outline-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-auto flex h-[50px] items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold text-white disabled:opacity-60"
      >
        <UserPlus size={17} />
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
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
      setSuccess(`${fullName} can now sign up at /register.`);
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
    <div className="flex flex-col gap-3.5 rounded-[30px] bg-surface p-5 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Approved staff roster</h2>
          <p className="text-xs text-muted">Only these emails can self-sign up as staff</p>
        </div>
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="h-10 rounded-full bg-white px-3 text-xs font-semibold text-ink shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          >
            {(["doctor", "front-desk", "admin"] as StaffRole[]).map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="h-10 w-32 rounded-full bg-white px-3.5 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="h-10 w-[200px] rounded-full bg-white px-3.5 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
          />
          {role === "doctor" && (
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Specialty"
              className="h-10 w-32 rounded-full bg-white px-3.5 text-[13px] shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none"
            />
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-bold text-white disabled:opacity-60"
          >
            <Plus size={14} />
            Add
          </button>
        </form>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {roster.length === 0 ? (
        <p className="rounded-[20px] bg-background p-5 text-sm text-muted">
          No one is on the roster yet, self-service staff signup will reject everyone until you add entries here.
        </p>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-[1.2fr_1.6fr_0.8fr_0.9fr_36px] gap-3 pb-2 text-xs font-semibold text-muted">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span />
          </div>
          {roster.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1.2fr_1.6fr_0.8fr_0.9fr_36px] items-center gap-3 border-t border-[#EEF2F1] py-2.5"
            >
              <span className="truncate text-[13px] font-bold text-ink">{entry.full_name}</span>
              <span className="truncate text-[13px] text-[#4F5F5B]">{entry.email}</span>
              <span className="text-xs text-ink">{roleLabels[entry.role]}</span>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  entry.claimed ? "bg-[#E3F5EA] text-[#137A3A]" : "bg-background text-muted"
                }`}
              >
                {entry.claimed ? "Claimed" : "Not signed up"}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                disabled={pending}
                aria-label="Remove"
                className="flex h-8 w-8 items-center justify-center rounded-full text-danger shadow-[inset_0_0_0_1px_#F3C4C4] disabled:opacity-60"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffAccountsSection({
  staffMembers,
  doctors,
}: {
  staffMembers: StaffMemberItem[];
  doctors: DoctorSettingsItem[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[30px] bg-surface p-5 shadow-[0_12px_30px_-24px_rgba(20,35,31,0.5)]">
      <h2 className="text-base font-bold text-ink">Staff accounts</h2>

      {doctors.length === 0 && staffMembers.length === 0 ? (
        <p className="rounded-[20px] bg-background p-5 text-sm text-muted">No staff accounts yet besides you.</p>
      ) : (
        <div className="flex flex-col">
          {doctors.map((d) => (
            <DoctorAccountRow key={d.id} doctor={d} />
          ))}
          {staffMembers.map((s) => (
            <StaffRoleRow key={s.id} member={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorAccountRow({ doctor }: { doctor: DoctorSettingsItem }) {
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
    <div className="grid grid-cols-[36px_1.4fr_1fr_140px_50px] items-center gap-3 border-t border-[#EEF2F1] py-2.5 first:border-t-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">
        {(doctor.full_name ?? "?").charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-ink">{doctor.full_name ?? "Doctor"}</div>
      </div>
      <span className="text-xs text-[#4F5F5B]">{doctor.specialty}</span>
      <span className="w-fit rounded-full px-3 py-1.5 text-xs font-bold text-ink shadow-[inset_0_0_0_1px_#DCE5E2]">
        Doctor
      </span>
      <button type="button" onClick={handleToggle} disabled={pending} aria-label="Toggle active">
        <Toggle on={isActive} />
      </button>
    </div>
  );
}

function StaffRoleRow({ member }: { member: StaffMemberItem }) {
  const [role, setRole] = useState<"front-desk" | "admin">(member.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(newRole: "front-desk" | "admin") {
    setRole(newRole);
    setError(null);
    startTransition(async () => {
      const result = await updateStaffRoleAction(member.id, newRole);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="grid grid-cols-[36px_1.4fr_1fr_140px_50px] items-center gap-3 border-t border-[#EEF2F1] py-2.5 first:border-t-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent-dark">
        {(member.full_name ?? "?").charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-ink">{member.full_name ?? "Staff member"}</div>
        {error && <div className="text-[11px] text-danger">{error}</div>}
      </div>
      <span />
      <select
        value={role}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as "front-desk" | "admin")}
        className="h-9 rounded-full px-3 text-xs font-bold text-ink shadow-[inset_0_0_0_1px_#DCE5E2] focus:outline-none disabled:opacity-60"
      >
        <option value="front-desk">Front desk</option>
        <option value="admin">Administrator</option>
      </select>
      <span />
    </div>
  );
}
