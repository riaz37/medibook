import { getAuthContext } from "@/lib/server/auth-utils";
import { redirect } from "next/navigation";
import PaymentSettingsClient from "./PaymentSettingsClient";

async function PaymentSettingsPage() {
  const context = await getAuthContext();

  if (!context || context.role !== "admin") {
    redirect("/");
  }

  return <PaymentSettingsClient />;
}

export default PaymentSettingsPage;

