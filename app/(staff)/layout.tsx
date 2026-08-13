// Staff portal route group. Screens here (dashboard, appointment
// management, doctor & schedule management, analytics, notification log,
// pharmacy desk) are desktop-oriented and gated by server-side role
// checks (admin, front-desk, doctor). Not built yet.
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
