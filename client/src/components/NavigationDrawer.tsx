import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  X, Settings, Home, Trophy, Star, MessageCircle, 
  LogOut, Shield, Moon, Sun, User, LayoutDashboard, Crown
} from "lucide-react";
import { useStore } from "../store/useStore";
import { auth } from "../lib/firebase";
import { useSettings } from "../hooks/use-settings";
import { cn } from "../lib/utils";
import { UserAvatar } from "./UserAvatar";
import { api, buildUrl } from "../../../shared/routes";
import type { Message } from "../../../shared/schema";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const [, setLocation] = useLocation();
  const { currentUser, family, logout, lastChatVisit } = useStore();
  const { settings, updateSetting } = useSettings();
  const firebaseUser = auth.currentUser;
  const isDark = settings.darkMode;

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { id: family?.id || 0 })],
    enabled: !!family && isOpen,
  });

  const hasUnread = messages.some(msg => 
    msg.userId !== currentUser?.id && 
    new Date(msg.createdAt).getTime() > lastChatVisit
  );

  const navItems = [
    { label: "Settings", icon: Settings, path: `/family/${family?.id}/settings` },
    { label: "Dashboard", icon: LayoutDashboard, path: `/family/${family?.id}/dashboard` },
    { label: "Subscription", icon: Crown, path: `/family/${family?.id}/subscription` },
    { label: "Leaderboard", icon: Trophy, path: `/family/${family?.id}/leaderboard` },
    { label: "Rewards", icon: Star, path: `/family/${family?.id}/rewards` },
    { 
      label: "Chat", 
      icon: MessageCircle, 
      path: `/family/${family?.id}/chat`,
      hasBadge: hasUnread 
    },
    ...(currentUser?.role === "admin" ? [
      { label: "Admin Panel", icon: Shield, path: `/family/${family?.id}/admin` }
    ] : []),
  ];

  const handleNavigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Firebase sign out failed:", error);
    }
    logout();
    setLocation("/auth");
    onClose();
  };

  const tasklingLetters = "Taskling".split("");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[100]"
            style={{
              background: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[280px] z-[101] flex flex-col overflow-hidden"
            style={{
              background: isDark 
                ? 'rgba(18, 18, 32, 0.85)' 
                : 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderLeft: isDark 
                ? '1px solid rgba(255, 255, 255, 0.08)' 
                : '1px solid rgba(200, 200, 220, 0.3)',
              boxShadow: isDark 
                ? '-8px 0 40px rgba(0, 0, 0, 0.5)' 
                : '-8px 0 40px rgba(100, 100, 150, 0.15)',
            }}
          >
            {/* Light Mode Gradient Fog Overlay */}
            {!isDark && (
              <div className="absolute inset-0 pointer-events-none z-0" style={{
                background: `
                  radial-gradient(ellipse at 20% 15%, rgba(200, 180, 240, 0.12) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 70%, rgba(180, 220, 240, 0.1) 0%, transparent 55%),
                  radial-gradient(ellipse at 50% 100%, rgba(220, 210, 240, 0.08) 0%, transparent 50%),
                  linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(245,242,255,0.1) 100%)
                `,
              }} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 relative z-10">
              <h2 className="font-display text-xl font-bold">
                {tasklingLetters.map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 400, damping: 18 }}
                    className="inline-block text-gradient-brand"
                  >
                    {letter}
                  </motion.span>
                ))}
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl btn-glass active:scale-95"
              >
                <X className={cn("w-5 h-5", isDark ? "text-white/60" : "text-slate-400")} />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 relative z-10">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-left active:scale-[0.97]",
                    isDark ? "hover:bg-white/5" : "hover:bg-slate-100/60"
                  )}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 relative"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(120, 100, 180, 0.06)',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(120, 100, 180, 0.1)',
                    }}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 group-hover:text-primary transition-colors duration-300",
                      isDark ? "text-white/50" : "text-slate-400"
                    )} />
                    {item.hasBadge && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#121220] animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}
                  </div>
                  <span className={cn(
                    "font-bold text-sm transition-colors duration-300",
                    isDark ? "text-white/70 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}

              {/* Dark Mode Toggle */}
              <div className={cn("mt-4 px-4 py-4 rounded-[1.5rem]", isDark ? "glass" : "bg-slate-50/60 border border-slate-200/50")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white/50" : "text-slate-400")}>Appearance</span>
                  </div>
                  <button
                    onClick={() => updateSetting("darkMode", !settings.darkMode)}
                    className="relative w-11 h-6 rounded-full transition-colors duration-300"
                    style={{ background: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 0, 0, 0.08)' }}
                  >
                    <motion.div
                      animate={{ x: isDark ? 22 : 2 }}
                      className={cn(
                        "absolute top-1 left-0 w-4 h-4 rounded-full shadow-sm transition-colors",
                        isDark ? "bg-primary" : "bg-white"
                      )}
                      style={isDark ? { boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                    />
                  </button>
                </div>
                <p className={cn("text-[10px] font-medium", isDark ? "text-white/30" : "text-slate-400")}>
                  {isDark ? "Dark mode active" : "Bright mode active"}
                </p>
              </div>
            </div>

            {/* Footer / User Info */}
            <div className="p-6 relative z-10" style={{ borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-3 mb-6">
                <UserAvatar user={currentUser} size="md" className={isDark ? "border border-white/10" : "border border-slate-200"} />
                <div className="min-w-0">
                  <p className={cn("font-bold text-sm truncate", isDark ? "text-white/90" : "text-slate-800")}>{currentUser?.username || "Guest"}</p>
                  <p className={cn("text-[11px] truncate", isDark ? "text-white/35" : "text-slate-400")}>{firebaseUser?.email || "No email linked"}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.96]"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  color: 'rgb(251, 113, 133)',
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
