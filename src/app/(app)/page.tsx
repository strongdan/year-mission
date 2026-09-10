import { MissionChargeCard } from "@/components/today/mission-charge-card";
import { JournalCard } from "@/components/today/journal-card";
import { TodayViewV2 } from "@/components/today/today-view-v2";
import { LifeBalanceCard } from "@/components/today/life-balance-card";

export default function TodayPage() {
  return (
    <>
      <div className="px-4 pt-4">
        <MissionChargeCard />
      </div>
      <TodayViewV2 />
      <div className="px-4 pb-4">
        <LifeBalanceCard />
      </div>
      <JournalCard />
    </>
  );
}
