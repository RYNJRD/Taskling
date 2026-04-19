import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Crown, Star, ChevronRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { UserAvatar } from "./UserAvatar";
import type { User } from "../../shared/schema";
import { cn } from "../lib/utils";

function getRoleBadge(user: User) {
  if (user.role === "admin") return { label: "Parent", icon: Crown, color: "bg-amber-100 text-amber-700 border-amber-200" };
  if ((user.age ?? 0) >= 12) return { label: `Kid · ${user.age}`, icon: Star, color: "bg-violet-100 text-violet-700 border-violet-200" };
  return { label: `Kid · ${user.age}`, icon: Star, color: "bg-sky-100 text-sky-700 border-sky-200" };
}

export function DemoSwitcher() {
  const { currentUser, demoUsers, setCurrentUser } = useStore();
  const [open, setOpen] = useState(false);

  const isDemo = !!currentUser && !currentUser.firebaseUid && demoUsers.length > 0;
  if (!isDemo) return null;

  const otherUsers = demoUsers.filter((u) => u.id !== currentUser.id);

  return (
    <>
      {/* Floating demo pill */}
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
        data-testid="button-demo-switcher"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gray-900/90 backdrop-blur-xl text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl border border-white/10"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="opacity-60 uppercase tracking-widest text-[10px]">Demo</span>
        <span className="font-bold">{currentUser.username}</span>
        <Users className="w-3.5 h-3.5 opacity-60" />
      </motion.button>

      {/* Character switcher sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[120] max-w-md mx-auto bg-card rounded-t-[2rem] shadow-2xl border-t border-border/60 p-6 pb-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Switch Character</h3>
                  <p className="text-xs text-muted-foreground font-medium">Demo mode — dev only</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current user */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Playing as</p>
              <div className="flex items-center gap-3 bg-primary/8 rounded-2xl p-3 mb-4 border-2 border-primary/20">
                <UserAvatar user={currentUser} size="md" />
                <div>
                  <p className="font-bold text-foreground">{currentUser.username}</p>
                  {(() => {
                    const b = getRoleBadge(currentUser);
                    const Icon = b.icon;
                    return (
                      <div className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border", b.color)}>
                        <Icon className="w-3 h-3" />
                        {b.label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Other characters */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Switch to</p>
              <div className="space-y-2">
                {otherUsers.map((user) => {
                  const badge = getRoleBadge(user);
                  const BadgeIcon = badge.icon;
                  return (
                    <button
                      key={user.id}
                      data-testid={`switch-character-${user.id}`}
                      onClick={() => { setCurrentUser(user); setOpen(false); }}
                      className="w-full flex items-center gap-3 bg-muted/40 hover:bg-muted/80 rounded-2xl p-3 border-2 border-transparent hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                    >
                      <UserAvatar user={user} size="md" />
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{user.username}</p>
                        <div className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border", badge.color)}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
