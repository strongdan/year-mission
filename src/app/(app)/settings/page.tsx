import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";
import { AppearanceSettingsCard } from "@/components/settings/appearance-settings-card";
import { ExecutionSettingsCard } from "@/components/settings/execution-settings-card";
import { FinanceSettingsCard } from "@/components/settings/finance-settings-card";
import { NotificationSettingsCard } from "@/components/settings/notification-settings-card";
import { PlaidSettingsSection } from "@/components/settings/plaid-settings-section";
import { TimelineSettingsCard } from "@/components/settings/timeline-settings-card";

export default async function SettingsPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const environment =
    process.env.YEAR_MISSION_DEPLOYMENT_ENV ??
    process.env.VERCEL_ENV ??
    (process.env.NODE_ENV === "production" ? "production" : "development");
  const buildSha =
    process.env.YEAR_MISSION_BUILD_SHA?.slice(0, 7) ??
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    "local";

  return (
    <>
      <SettingsView environment={environment} buildSha={buildSha} />
      <AppearanceSettingsCard />
      <div className="px-4 pb-4"><PlaidSettingsSection /></div>
      <FinanceSettingsCard />
      <ExecutionSettingsCard />
      <NotificationSettingsCard />
      <TimelineSettingsCard />
    </>
  );
}
