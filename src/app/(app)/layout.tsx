import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineBanner } from "@/components/nav/offline-banner";
import { AppUtilityBar } from "@/components/nav/app-utility-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <AppUtilityBar />
      <div className="mx-auto w-full max-w-md flex-1 pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
