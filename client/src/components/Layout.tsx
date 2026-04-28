import { useFamilyLive } from "../hooks/use-family-live";
import { NavigationDrawer } from "./NavigationDrawer";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { BottomNav } from "./BottomNav";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { family, isDrawerOpen, setIsDrawerOpen, isNavHidden, currentUser } = useStore();
  const onboardingPaths = ["/", "/get-started", "/auth", "/verify-email", "/email-action", "/join-family", "/setup-family", "/home"];
  const isOnboarding = onboardingPaths.includes(location) || location.startsWith("/join/");
  
  useFamilyLive(family?.id);

  // Subscription Gate Logic
  const isPremium = family?.subscriptionStatus === "active" || family?.subscriptionStatus === "trialing";
  const isSubscriptionPage = location.includes("/subscription");
  const isInactive = family && !isPremium;

  useEffect(() => {
    // Redirect if inactive and not on allowed paths
    if (isInactive && !isSubscriptionPage && !isOnboarding) {
      setLocation(`/family/${family.id}/subscription`);
    }
  }, [isInactive, isSubscriptionPage, isOnboarding, family?.id, setLocation]);

  const showNav = !isOnboarding && !isNavHidden && isPremium;

  // Dynamic Backgrounds based on route
  const getBackgroundClass = () => {
    if (isOnboarding) return "bg-animated";
    if (location.includes("/dashboard")) return "bg-tab-home";
    if (location.includes("/leaderboard")) return "bg-tab-leaderboard";
    if (location.includes("/rewards")) return "bg-tab-rewards";
    if (location.includes("/subscription")) return "bg-tab-home"; // Use home V2 background for sub too
    return "bg-zinc-950";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 font-sans text-foreground selection:bg-primary/20">
      <div 
        className={cn(
          "w-full h-[100dvh] sm:w-[390px] sm:h-[844px] overflow-hidden relative sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl shadow-purple-900/30 flex flex-col isolate transform-gpu transition-colors duration-700",
          getBackgroundClass()
        )}
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
      </div>
    </div>
  );
}
