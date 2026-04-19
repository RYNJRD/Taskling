import { useFamilyLive } from "../hooks/use-family-live";
import { NavigationDrawer } from "./NavigationDrawer";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { BottomNav } from "./BottomNav";
import { DemoSwitcher } from "./DemoSwitcher";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { family } = useStore();
  const onboardingPaths = ["/", "/get-started", "/auth", "/verify-email", "/email-action", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location) || location.startsWith("/join/");
  useFamilyLive(family?.id);

  const showNav = !isOnboarding;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950 font-sans text-foreground selection:bg-primary/20">
      <div 
        className="w-full h-[100dvh] sm:w-[390px] sm:h-[844px] overflow-hidden relative bg-background sm:rounded-[2.5rem] sm:border-[8px] sm:border-zinc-900 shadow-2xl flex flex-col isolate transform-gpu"
        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }} // Forces hardware-accelerated clipping on rounded borders
      >
        {/* Global Hamburger Menu */}
        {showNav && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-[90] w-10 h-10 flex items-center justify-center rounded-xl bg-background/20 backdrop-blur-md border border-white/20 shadow-lg text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar rounded-[inherit]">
          {children}
        </main>
        {showNav && <BottomNav />}
        {showNav && <DemoSwitcher />}
      </div>
    </div>
  );
}
