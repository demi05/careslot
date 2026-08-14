import { requireStaff } from "@/lib/auth";
import { StaffSidebar } from "@/components/staff/StaffSidebar";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { role, fullName } = await requireStaff();

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar role={role} fullName={fullName} />
      <div className="min-w-0 flex-1 animate-fade-in-up">{children}</div>
    </div>
  );
}
