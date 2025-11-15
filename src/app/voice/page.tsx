import { redirect } from "next/navigation";

/**
 * Legacy Route Redirect
 * Redirects /voice to /patient/voice
 */
export default function VoiceRedirect() {
  redirect("/patient/voice");
}
