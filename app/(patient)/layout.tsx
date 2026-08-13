// Patient portal route group. Screens here (register, login, dashboard,
// booking, appointments, pharmacy, profile) share the patient-facing,
// mobile-responsive layout. No chrome yet — added once the patient
// dashboard is built.
export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
