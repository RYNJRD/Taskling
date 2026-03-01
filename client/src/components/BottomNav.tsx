import { Link, useLocation } from "wouter";
import { Home, Trophy, Gift, Settings, MessageSquare, User } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { family, currentUser } = useStore();

  if (!family || !currentUser) return null;

  const navItems = [
    { href: `/family/${family.id}/dashboard`, icon: Home, label: "Home" },
    { href: `/family/${family.id}/leaderboard`, icon: Trophy, label: "Rank" },
    { href: `/family/${family.id}/chat`, icon: MessageSquare, label: "Chat" },
    { href: `/family/${family.id}/rewards`, icon: Gift, label: "Rewards" },
    { href: `/family/${family.id}/profile`, icon: User, label: "Me" },
  ];

  if (currentUser.role === "admin") {
    navItems.push({ href: `/family/${family.id}/admin`, icon: Settings, label: "Admin" });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pt-2 px-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
      <div className="max-w-md mx-auto flex items-center pb-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="relative group flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1">
              <div className={cn(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-wide uppercase transition-colors truncate max-w-full px-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
