import { motion } from "framer-motion";
import { Star, Sparkles, ArrowRight, ChevronLeft } from "lucide-react";
import { useDemoSetup } from "@/hooks/use-families";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const demoMutation = useDemoSetup();
  const [isCreating, setIsCreating] = useState(false);

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
        data-testid="button-back-landing"
        onClick={() => setLocation("/get-started")}
        className="absolute top-6 left-6 w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm z-20"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-32 h-32 bg-white rounded-[2rem] shadow-bouncy flex items-center justify-center mb-8 rotate-3"
      >
        <Star className="w-16 h-16 text-accent fill-accent" />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="font-display text-5xl font-bold text-foreground mb-4"
      >
        Chore<span className="text-primary">Quest</span>
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-muted-foreground mb-12 font-medium max-w-[280px]"
      >
        Turn boring household chores into a fun game for the whole family!
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full space-y-4 max-w-sm relative z-10"
      >
        <button
          onClick={handleDemo}
          disabled={demoMutation.isPending}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-lg 
                     shadow-bouncy-primary hover:translate-y-[2px] active:translate-y-[6px] active:shadow-bouncy-active 
                     transition-all flex items-center justify-center gap-2 group"
        >
          {demoMutation.isPending ? "Setting up..." : "Try Demo Family"}
          {!demoMutation.isPending && <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
        </button>

        <button
          onClick={() => setIsCreating(true)}
          className="w-full py-4 rounded-2xl bg-white text-foreground font-display font-bold text-lg 
                     border-2 border-border shadow-bouncy hover:translate-y-[2px] active:translate-y-[6px] 
                     active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          Create New Family
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-card p-6 rounded-[2rem] border-2 border-border shadow-2xl w-full max-w-sm">
            <h2 className="font-display text-2xl font-bold mb-4">Coming Soon!</h2>
            <p className="text-muted-foreground mb-6">For now, please use the Try Demo Family button to explore the app.</p>
            <button 
              onClick={() => setIsCreating(false)}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
