import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listIdeas } from "@/repositories/supabase-repository";
import { IdeaDump } from "@/components/ideas/idea-dump";

export default async function IdeasPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login");

  const ideas = await listIdeas(user.id);
  return <IdeaDump initialIdeas={ideas.slice(0, 30)} />;
}
