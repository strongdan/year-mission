import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineBanner } from "@/components/nav/offline-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <div className="mx-auto w-full max-w-md flex-1 pb-24">{children}</div>
      <BottomNav />
    </>
  );
}