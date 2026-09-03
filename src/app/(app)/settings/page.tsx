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

  const environment = process.env.CF_PAGES_BRANCH
    ? "cloudflare"
    : process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const buildSha = (process.env.CF_PAGES_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA)?.slice(0, 7) ?? "local";

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
