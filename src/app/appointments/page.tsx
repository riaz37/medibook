import { redirect } from "next/navigation";

/**
 * Legacy Route Redirect
 * Redirects /appointments to /patient/appointments for better route organization
 * Preserves query parameters
 */
export default async function AppointmentsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = Array.isArray(value) ? value[0] : value;
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  const url = `/patient/appointments${queryString ? `?${queryString}` : ""}`;
  redirect(url);
}
