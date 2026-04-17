import { Link, useLocation } from "wouter";
import { Home, Trophy, Gift, Crown, MessageSquare, User } from "lucide-react";
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
    navItems.push({ href: `/family/${family.id}/admin`, icon: Crown, label: "Parent" });
  }

  return (
    <div
      className="absolute bottom-0 w-full z-50"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
    >
      {/* Frosted glass backing */}
      <div className="mx-3 mb-2">
        <div className="max-w-md mx-auto bg-card/95 backdrop-blur-2xl border-2 border-slate-300/80 dark:border-slate-700/80 rounded-[1.75rem] shadow-[0_-4px_24px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.12)] px-2 py-1.5">
          <div className="flex items-center">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex-1 min-w-0 flex flex-col items-center py-1.5 gap-0.5"
                >
                  <div className="relative flex items-center justify-center w-11 h-9 rounded-2xl">
                    {/* Active pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-primary/12 rounded-2xl"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    {/* Icon */}
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={cn(
                        "relative z-10 transition-colors",
                        isActive ? "text-primary" : "text-foreground/50",
                      )}
                    >
                      <Icon
                        size={isActive ? 21 : 20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          item.label === "Parent" && isActive
                            ? "text-amber-500"
                            : item.label === "Parent"
                              ? "text-amber-400"
                              : "",
                        )}
                      />
                    </motion.div>
                  </div>

                  <motion.span
                    animate={isActive ? { opacity: 1 } : { opacity: 0.65 }}
                    className={cn(
                      "text-[9px] font-bold tracking-wide uppercase truncate max-w-full px-0.5 leading-none",
                      isActive ? "text-primary" : "text-muted-foreground",
                      item.label === "Parent" && "text-amber-500",
                    )}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
