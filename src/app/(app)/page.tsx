import { MissionChargeCard } from "@/components/today/mission-charge-card";
import { TodayViewV2 } from "@/components/today/today-view-v2";

export default function TodayPage() {
  return (
    <>
      <div className="px-4 pt-4">
        <MissionChargeCard />
      </div>
      <TodayViewV2 />
    </>
  );
}
