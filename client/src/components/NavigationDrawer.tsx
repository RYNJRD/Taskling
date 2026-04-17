import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  X, Settings, Home, Trophy, Star, MessageCircle, 
  LogOut, Shield, Moon, Sun, User, LayoutDashboard
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { auth } from "@/lib/firebase";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const [, setLocation] = useLocation();
  const { currentUser, family, logout } = useStore();
  const { settings, updateSetting } = useSettings();
  const firebaseUser = auth.currentUser;

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: `/family/${family?.id}/dashboard` },
    { label: "Leaderboard", icon: Trophy, path: `/family/${family?.id}/leaderboard` },
    { label: "Rewards", icon: Star, path: `/family/${family?.id}/rewards` },
    { label: "Chat", icon: MessageCircle, path: `/family/${family?.id}/chat` },
    ...(currentUser?.role === "admin" ? [
      { label: "Admin Panel", icon: Shield, path: `/family/${family?.id}/admin` }
    ] : []),
    { label: "Settings", icon: Settings, path: `/family/${family?.id}/settings` },
  ];

  const handleNavigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    setLocation("/auth");
    onClose();
  };

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
            className="absolute inset-0 z-[100] bg-background/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[280px] z-[101] bg-card border-l-2 border-slate-300/50 dark:border-slate-700/50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="font-display text-xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                Menu
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-primary/5 transition-colors group text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground">
                    {item.label}
                  </span>
                </button>
              ))}

              {/* Dark Mode Toggle */}
              <div className="mt-4 px-4 py-4 rounded-[1.5rem] bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {settings.darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance</span>
                  </div>
                  <button
                    onClick={() => updateSetting("darkMode", !settings.darkMode)}
                    className="relative w-11 h-6 rounded-full bg-muted-foreground/20 transition-colors"
                  >
                    <motion.div
                      animate={{ x: settings.darkMode ? 22 : 2 }}
                      className={cn(
                        "absolute top-1 left-0 w-4 h-4 rounded-full shadow-sm",
                        settings.darkMode ? "bg-primary" : "bg-white"
                      )}
                    />
                  </button>
                </div>
                <p className="text-[10px] font-medium text-muted-foreground/70">
                  {settings.darkMode ? "Dark mode active" : "Bright mode active"}
                </p>
              </div>
            </div>

            {/* Footer / User Info */}
            <div className="p-6 border-t border-border/50 bg-muted/20">
              <div className="flex items-center gap-3 mb-6">
                <UserAvatar user={currentUser} size="md" className="border-2 border-slate-300 dark:border-slate-600" />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{currentUser?.username || "Guest"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{firebaseUser?.email || "No email linked"}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/30 text-rose-500 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-[0.98]"
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
