import { redirect } from "next/navigation";

/**
 * Legacy Route Redirect
 * Redirects /appointments/[id] to /patient/appointments/[id]
 */
export default function AppointmentDetailsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/patient/appointments/${id}`);
}
