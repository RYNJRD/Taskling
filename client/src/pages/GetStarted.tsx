import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Sparkles, ChevronLeft, Crown, Star, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { useDemoSetup } from "../hooks/use-families";
import { PenguinMascot } from "../components/PenguinMascot";
import { UserAvatar } from "../components/UserAvatar";
import type { User, Family } from "../../../shared/schema";
import { cn } from "../lib/utils";

type DemoData = { family: Family; users: User[] };

export default function GetStarted() {
  const [, setLocation] = useLocation();
  const { setOnboardingIntent, setFamily, setCurrentUser, setDemoUsers } = useStore();
  const demoMutation = useDemoSetup();

  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [selectingChar, setSelectingChar] = useState(false);

  const handleCreate = () => {
    setOnboardingIntent("create");
    setLocation("/auth");
  };

  const handleJoin = () => {
    setOnboardingIntent("join");
    setLocation("/auth");
  };

  const handleDemo = async () => {
    try {
      const data = await demoMutation.mutateAsync();
      setFamily(data.family);
      setDemoUsers(data.users);
      setDemoData(data);
      setSelectingChar(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePickCharacter = (user: User) => {
    setCurrentUser(user);
    setLocation(`/family/${user.familyId}/dashboard`);
  };

  function getRoleBadge(user: User) {
    if (user.role === "admin") return { label: "Parent", icon: Crown, color: "bg-amber-100 text-amber-700 border-amber-200" };
    if ((user.age ?? 0) >= 12) return { label: `Kid Â· ${user.age}`, icon: Star, color: "bg-violet-100 text-violet-700 border-violet-200" };
    return { label: `Kid Â· ${user.age}`, icon: Star, color: "bg-sky-100 text-sky-700 border-sky-200" };
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-onboarding">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%] pointer-events-none" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%] pointer-events-none" />

      <button
        data-testid="button-back-get-started"
        onClick={() => {
          if (selectingChar) { setSelectingChar(false); setDemoData(null); }
          else setLocation("/");
        }}
        className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm z-20 border border-border/50"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!selectingChar ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className="mb-4 relative"
              >
                <PenguinMascot mood="waving" size={130} />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
                  className="absolute -top-2 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-md"
                >
                  Pick one! ðŸ‘‡
                </motion.div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="mb-1">
                <h1 className="font-display text-4xl font-bold" style={{ color: "hsl(262 83% 58%)" }}>
                  Taskling
                </h1>
              </motion.div>

              <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground font-semibold mb-8 text-sm max-w-[260px]">
                Make chores fun â€” reward your whole family! â­
              </motion.p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }} className="w-full space-y-3">
                <button
                  data-testid="button-create-family"
                  onClick={handleCreate}
                  className="w-full py-4 rounded-2xl font-display font-bold text-lg text-primary-foreground flex items-center justify-center gap-3 group btn-glow-primary shimmer"
                  style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                >
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Create New Family
                </button>

                <button
                  data-testid="button-join-family"
                  onClick={handleJoin}
                  className="w-full py-4 rounded-2xl bg-white font-display font-bold text-lg text-foreground flex items-center justify-center gap-3 group btn-glow-white border-2 border-border/60"
                >
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                  Join Existing Family
                </button>

                <div className="flex items-center gap-4 py-1.5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  data-testid="button-demo"
                  onClick={handleDemo}
                  disabled={demoMutation.isPending}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 border-accent/30"
                  style={{ background: "hsl(43 96% 56% / 0.12)", color: "hsl(43 70% 30%)" }}
                >
                  {demoMutation.isPending ? "Setting up..." : (
                    <><Sparkles className="w-4 h-4" /> Try Demo Family</>
                  )}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="character-select"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="mb-2 text-5xl"
              >
                ðŸ§
              </motion.div>

              <h2 className="font-display text-3xl font-bold text-foreground mb-1">Pick a character</h2>
              <p className="text-sm text-muted-foreground font-semibold mb-6 max-w-[240px]">
                Choose who you want to explore the demo as
              </p>

              <div className="w-full space-y-3">
                {(demoData?.users ?? []).map((user, i) => {
                  const badge = getRoleBadge(user);
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      data-testid={`demo-character-${user.id}`}
                      onClick={() => handlePickCharacter(user)}
                      className="w-full flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-border/60 hover:border-primary/50 hover:bg-white active:scale-[0.98] transition-all text-left shadow-sm"
                    >
                      <UserAvatar user={user} size="lg" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-foreground">{user.username}</p>
                        <div className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border mt-0.5", badge.color)}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </div>
                      </div>
                      <div className="text-primary/40">
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={() => { setSelectingChar(false); setDemoData(null); }}
                className="mt-5 flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to options
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
