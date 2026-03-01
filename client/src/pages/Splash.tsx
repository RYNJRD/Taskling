import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setLocation("/get-started"), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/20 via-background to-accent/10 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-15%] w-80 h-80 bg-primary/30 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-80 h-80 bg-accent/30 rounded-full blur-[80px] animate-pulse" />

      <AnimatePresence>
        {phase >= 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 3 }}
            transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
            className="w-28 h-28 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 relative"
          >
            <Star className="w-14 h-14 text-accent fill-accent" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
              className="absolute -bottom-1 -left-2"
            >
              <Sparkles className="w-5 h-5 text-accent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 1 && (
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="font-display text-5xl font-bold text-foreground mb-3"
          >
            Chore<span className="text-primary">Quest</span>
          </motion.h1>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 2 && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="text-muted-foreground font-bold text-base"
          >
            Making chores fun for the whole family
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
