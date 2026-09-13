import { createClient } from "../../lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const greetingName = user?.email ? user.email.split("@")[0] : "there";
  return <DashboardClient greetingName={greetingName} />;
}
