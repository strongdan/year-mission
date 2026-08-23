import { AdviceView } from "@/components/advice/advice-view";
import type { AdviceCategory } from "@/domain/advice";

const VALID = new Set<AdviceCategory>([
  "focus",
  "personal_growth",
  "strength",
  "mobility",
  "movement",
  "nutrition",
  "recovery",
  "meditation",
]);

export default async function AdvicePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const initialCategory = category && VALID.has(category as AdviceCategory) ? (category as AdviceCategory) : null;
  return <AdviceView initialCategory={initialCategory} />;
}
