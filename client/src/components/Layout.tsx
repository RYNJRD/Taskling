import { BottomNav } from "./BottomNav";
import { useLocation } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const onboardingPaths = ["/", "/get-started", "/auth", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location);
  const isUserSelection = location.includes("/users");

  const showNav = !isOnboarding && !isUserSelection;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24 selection:bg-primary/20">
      <main className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background overflow-hidden">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
