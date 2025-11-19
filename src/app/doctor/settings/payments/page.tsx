import { getAuthContext } from "@/lib/server/auth-utils";
import { redirect } from "next/navigation";
import PaymentSettingsClient from "./PaymentSettingsClient";

async function DoctorPaymentSettingsPage() {
  const context = await getAuthContext();

  if (!context || context.role !== "doctor" || !context.doctorId) {
    redirect("/");
  }

  return <PaymentSettingsClient doctorId={context.doctorId} />;
}

export default DoctorPaymentSettingsPage;

