import { AdventureStrip } from "@/components/today/adventure-strip";
import { MissionChargeCard } from "@/components/today/mission-charge-card";
import { ActionableReminderCard } from "@/components/today/actionable-reminder-card";
import { JournalCard } from "@/components/today/journal-card";
import { MovementVarietyCard } from "@/components/today/movement-variety-card";
import { TodayViewV2 } from "@/components/today/today-view-v2";
import { LifeBalanceCard } from "@/components/today/life-balance-card";
import { ConversationConfidenceCard } from "@/components/today/conversation-confidence-card";

export default function TodayPage() {
  return (
    <>
      <TodayViewV2 />
      <ActionableReminderCard />
      <ConversationConfidenceCard />
      <MovementVarietyCard />
      <div className="px-4 pb-4">
        <LifeBalanceCard />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <AdventureStrip />
        <MissionChargeCard />
      </div>
      <JournalCard />
    </>
  );
}
