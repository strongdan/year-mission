import { requireUser } from "@/lib/auth";
import { RoadmapReviewDashboard } from "@/components/review/roadmap-review-dashboard";

export default async function ReviewPage() {
  await requireUser();
  return <RoadmapReviewDashboard />;
}
