import { BottomNav } from "./BottomNav";
import { useLocation } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const onboardingPaths = ["/", "/get-started", "/auth", "/verify-email", "/email-action", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location) || location.startsWith("/join/");

  const showNav = !isOnboarding;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24 selection:bg-primary/20">
      <main className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background overflow-hidden">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
