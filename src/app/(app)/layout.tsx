import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineBanner } from "@/components/nav/offline-banner";
import { AppUtilityBar } from "@/components/nav/app-utility-bar";
import { SeasonAmbience } from "@/components/season/season-ambience";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeasonAmbience />
      <OfflineBanner />
      <AppUtilityBar />
      <div className="mx-auto w-full max-w-md flex-1 pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
