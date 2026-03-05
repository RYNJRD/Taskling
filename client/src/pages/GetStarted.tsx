import { motion } from "framer-motion";
import { ChevronLeft, Star, Users, UserPlus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/store/useStore";
import { useDemoSetup } from "@/hooks/use-families";

export default function GetStarted() {
  const [, setLocation] = useLocation();
  const { setOnboardingIntent } = useStore();
  const demoMutation = useDemoSetup();

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
      const family = await demoMutation.mutateAsync();
      setLocation(`/family/${family.id}/dashboard`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
      <button
        data-testid="button-back-get-started"
        onClick={() => setLocation("/")}
        className="absolute top-6 left-6 w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm z-20"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-24 h-24 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6 rotate-3"
      >
        <Star className="w-12 h-12 text-accent fill-accent" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="font-display text-4xl font-bold text-foreground mb-2"
      >
        Chore<span className="text-primary">Quest</span>
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground font-medium mb-10 max-w-[280px]"
      >
        Turn boring household chores into a fun game for the whole family!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="w-full max-w-sm space-y-4 relative z-10"
      >
        <button
          data-testid="button-create-family"
          onClick={handleCreate}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-lg 
                     shadow-bouncy-primary hover:translate-y-[2px] active:translate-y-[6px] active:shadow-bouncy-active 
                     transition-all flex items-center justify-center gap-3 group"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Create New Family
        </button>

        <button
          data-testid="button-join-family"
          onClick={handleJoin}
          className="w-full py-4 rounded-2xl bg-white text-foreground font-display font-bold text-lg 
                     border-2 border-border shadow-bouncy hover:translate-y-[2px] active:translate-y-[6px] 
                     active:shadow-none transition-all flex items-center justify-center gap-3 group"
        >
          <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Join Existing Family
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          data-testid="button-demo"
          onClick={handleDemo}
          disabled={demoMutation.isPending}
          className="w-full py-3.5 rounded-2xl bg-accent/10 text-accent-foreground font-bold text-base 
                     border-2 border-accent/20 hover:bg-accent/20 active:scale-[0.98]
                     transition-all flex items-center justify-center gap-2"
        >
          {demoMutation.isPending ? "Setting up..." : "Try Demo Family"}
          {!demoMutation.isPending && <Sparkles className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
}
