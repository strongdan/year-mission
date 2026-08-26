import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MoneyOverview } from "@/components/money/money-overview";
import { getFinanceDashboard } from "@/services/finance/finance-service";

export default async function MoneyPage() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) redirect("/login");

  const dashboard = await getFinanceDashboard(user.id, supabase);
  return <MoneyOverview dashboard={dashboard} />;
}
