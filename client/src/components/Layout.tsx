import { useFamilyLive } from "../hooks/use-family-live";
import { NavigationDrawer } from "./NavigationDrawer";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { BottomNav } from "./BottomNav";
import { DemoSwitcher } from "./DemoSwitcher";
import { cn } from "../lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { family, isDrawerOpen, setIsDrawerOpen } = useStore();
  const onboardingPaths = ["/", "/get-started", "/auth", "/verify-email", "/email-action", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location) || location.startsWith("/join/");
  useFamilyLive(family?.id);

  const showNav = !isOnboarding;

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 font-sans text-foreground selection:bg-primary/20">
      <div 
        className="w-full h-[100dvh] sm:w-[390px] sm:h-[844px] overflow-hidden relative bg-animated sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl shadow-purple-900/30 flex flex-col isolate transform-gpu"
        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }} // Forces hardware-accelerated clipping on rounded borders
      >
        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        <div className="flex-1 min-h-0 relative flex flex-col rounded-[inherit]">
          <main className={cn(
            "flex-1 relative no-scrollbar rounded-[inherit]",
            (location.includes("/profile") || location.includes("/me") || location.includes("/chat")) ? "overflow-hidden touch-none" : "overflow-y-auto pb-28 mask-bottom-fade",
            isOnboarding && "flex flex-col overflow-hidden touch-none h-full !pb-0"
          )}>
            {children}
          </main>
        </div>
        {showNav && <BottomNav />}
        {showNav && <DemoSwitcher />}
      </div>
    </div>
  );
}
