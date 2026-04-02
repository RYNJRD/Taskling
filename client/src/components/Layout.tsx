import { BottomNav } from "./BottomNav";
import { DemoSwitcher } from "./DemoSwitcher";
import { useLocation } from "wouter";
import { useStore } from "@/store/useStore";
import { useFamilyLive } from "@/hooks/use-family-live";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { family } = useStore();
  const onboardingPaths = ["/", "/get-started", "/auth", "/verify-email", "/email-action", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location) || location.startsWith("/join/");
  useFamilyLive(family?.id);

  const showNav = !isOnboarding;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24 selection:bg-primary/20">
      <main className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background overflow-hidden">
        {children}
      </main>
      {showNav && <BottomNav />}
      {showNav && <DemoSwitcher />}
    </div>
  );
}
