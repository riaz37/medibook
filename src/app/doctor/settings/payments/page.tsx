import { getAuthContext } from "@/lib/server/rbac";
import { redirect } from "next/navigation";
import PaymentSettingsClient from "./PaymentSettingsClient";

// Mark page as dynamic (uses auth which requires headers)
export const dynamic = "force-dynamic";

async function DoctorPaymentSettingsPage() {
  const context = await getAuthContext();

  if (!context || context.role !== "doctor" || !context.doctorId) {
    redirect("/");
  }

  return <PaymentSettingsClient doctorId={context.doctorId} />;
}

export default DoctorPaymentSettingsPage;

