import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { PenguinMascot } from "../components/PenguinMascot";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState(0);
  const { family, currentUser } = useStore();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => {
      if (family && currentUser) {
        setLocation(`/family/${family.id}/dashboard`);
      } else {
        setLocation("/get-started");
      }
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [setLocation, family, currentUser]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-onboarding relative overflow-hidden touch-none">
      <div className="blob-primary absolute w-72 h-72 top-[-8%] left-[-12%]" />
      <div className="blob-accent absolute w-64 h-64 bottom-[-8%] right-[-10%]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(262_83%_58%_/_0.06)_0%,_transparent_70%)]" />

      <div className="flex flex-col items-center relative z-10">
        <AnimatePresence>
          {phase >= 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.55, duration: 0.9 }}
              className="mb-4"
            >
              <PenguinMascot mood="idle" size={140} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="text-center mb-2"
            >
              <h1 className="font-display text-5xl font-bold mb-1 text-primary logo-glow">
                Taskling
              </h1>
              <div className="h-1 w-24 mx-auto rounded-full opacity-60 mt-1" style={{ background: 'linear-gradient(90deg, hsl(262, 83%, 58%), hsl(43, 96%, 56%))', boxShadow: '0 0 12px rgba(var(--glow-primary), 0.4)' }} />
            </motion.div>
          )}
        </AnimatePresence>



      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary"
            style={{ boxShadow: '0 0 8px rgba(var(--glow-primary), 0.5)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.22 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
