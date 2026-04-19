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
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950 font-sans text-foreground selection:bg-primary/20">
      <div 
        className="w-full h-[100dvh] sm:w-[390px] sm:h-[844px] overflow-hidden relative bg-background sm:rounded-[2.5rem] sm:border-[8px] sm:border-zinc-900 shadow-2xl flex flex-col isolate transform-gpu"
        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }} // Forces hardware-accelerated clipping on rounded borders
      >
        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        <main className={cn(
          "flex-1 overflow-x-hidden relative no-scrollbar rounded-[inherit]",
          location.includes("/profile") || location.includes("/me") ? "overflow-hidden touch-none" : "overflow-y-auto"
        )}>
          {children}
        </main>
        {showNav && <BottomNav />}
        {showNav && <DemoSwitcher />}
      </div>
    </div>
  );
}
