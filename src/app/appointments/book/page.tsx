import { redirect } from "next/navigation";

/**
 * Legacy Route Redirect
 * Redirects /appointments/book to /patient/appointments/book
 */
export default function BookAppointmentRedirect() {
  redirect("/patient/appointments/book");
}
