import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const environment = process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  return <SettingsView environment={environment} buildSha={buildSha} />;
}
