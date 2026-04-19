import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Home, User, Sparkles, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "../components/ui/input";
import { useStore } from "../store/useStore";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { getFamilyTimeZone } from "../../shared/streak";
import { apiFetch } from "../lib/apiFetch";
import { PenguinMascot } from "../components/PenguinMascot";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function FamilySetup() {
  const [, setLocation] = useLocation();
  const { setFamily, setCurrentUser, firebaseUid } = useStore();
  const { toast } = useToast();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const effectiveFirebaseUid = firebaseUid ?? (isDemoMode ? "demo-local-user" : null);

  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [starterMode, setStarterMode] = useState<"guided" | "blank">("guided");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceedStep0 = familyName.trim().length >= 2;
  const canSubmit = userName.trim().length >= 1 && gender && age && parseInt(age) > 0;

  const handleSubmit = async () => {
    if (!effectiveFirebaseUid) {
      toast({ title: "Sign in required", description: "Please sign in first.", variant: "destructive" });
      setLocation("/auth");
      return;
    }
    setIsSubmitting(true);
    try {
      const timeZone = getFamilyTimeZone(null);
      const famRes = await apiFetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim(), timeZone }),
      });
      if (!famRes.ok) {
        const errBody = await famRes.json().catch(() => ({ message: famRes.statusText }));
        throw new Error(errBody?.message || "Failed to create family");
      }
      const family = await famRes.json();

      const userRes = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: family.id,
          firebaseUid: effectiveFirebaseUid,
          username: userName.trim(),
          role: "admin",
          gender: gender.toLowerCase(),
          age: parseInt(age),
        }),
      });
      if (!userRes.ok) {
        const errBody = await userRes.json().catch(() => ({ message: userRes.statusText }));
        throw new Error(errBody?.message || "Failed to create profile");
      }
      const createdUser = await userRes.json();

      if (starterMode === "guided") {
        const starterChores = [
          { title: "Empty dishwasher", description: "A quick nightly reset.", points: 20, type: "daily" },
          { title: "Tidy bedroom", description: "Five minutes makes a huge difference.", points: 15, type: "daily" },
          { title: "Take out recycling", description: "A good first approval-based chore.", points: 30, type: "weekly", requiresApproval: true },
        ];
        for (const starterChore of starterChores) {
          await apiFetch("/api/chores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ familyId: family.id, assigneeId: null, emoji: "", createdBy: createdUser.id, ...starterChore }),
          });
        }
        await apiFetch("/api/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId: family.id,
            title: "Choose dessert night",
            description: "A fun first reward so the stars mean something right away.",
            costPoints: 120,
            emoji: "",
            requiresApproval: false,
            createdBy: createdUser.id,
          }),
        });
      }

      setFamily(family);
      setCurrentUser(createdUser);
      toast({
        title: "Family created! 🎉",
        description: starterMode === "guided"
          ? `Welcome to ${family.name}. Starter chores are ready!`
          : `Welcome to ${family.name}! Find your invite code in Admin.`,
        duration: 5000,
      });
      setLocation(`/family/${family.id}/dashboard`);
    } catch (err) {
      console.error("Family setup error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast({ title: "Setup failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Your Family", "Your Profile"];

  return (
    <div className="flex-1 bg-onboarding relative flex flex-col">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%] pointer-events-none" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(262_83%_58%/0.07)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <button
          data-testid="button-back-setup"
          onClick={() => step > 0 ? setStep(step - 1) : setLocation("/get-started")}
          className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm border border-white/60"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Step {step + 1} of 2</p>
          <p className="text-sm font-bold text-foreground truncate">{steps[step]}</p>
        </div>
        {/* Step indicator pills */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === step ? "1.5rem" : "0.5rem",
                background: i <= step
                  ? "linear-gradient(90deg, hsl(262 83% 58%), hsl(280 75% 62%))"
                  : "hsl(var(--muted))",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 pb-8">
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Family Name ── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-6 pt-2"
              >
                {/* Mascot */}
                <div className="flex flex-col items-center pt-4 pb-2">
                  <PenguinMascot mood="thinking" size={110} />
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mt-4"
                  >
                    <h2 className="font-display text-2xl font-bold text-foreground">What's your family called?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Every great family deserves a legendary name!</p>
                  </motion.div>
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/75 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.1)" }}>
                      <Home className="w-4 h-4" style={{ color: "hsl(262 83% 58%)" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Family Name</p>
                      <p className="text-xs text-muted-foreground/70">This will appear everywhere in the app</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <Input
                      data-testid="input-family-name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder='e.g. "The Smiths" or "Team Awesome"'
                      className="h-13 rounded-2xl border-2 font-semibold text-base focus-visible:ring-primary bg-white/60"
                      style={{ height: "3rem" }}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && canProceedStep0 && setStep(1)}
                    />
                  </div>
                </motion.div>

                {/* Examples */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-2 flex-wrap justify-center"
                >
                  {["The Johnsons ⚡", "Team Taskling 🏆", "Squad Goals 🎯"].map(name => (
                    <button
                      key={name}
                      onClick={() => setFamilyName(name.split(" ").slice(0, -1).join(" "))}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/70 border border-border/60 hover:bg-white hover:border-primary/40 transition-all active:scale-95 text-foreground/70"
                    >
                      {name}
                    </button>
                  ))}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  data-testid="button-next-step-0"
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 1: Your Profile ── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4 pt-2"
              >
                {/* Mascot */}
                <div className="flex flex-col items-center pt-4 pb-1">
                  <PenguinMascot mood={isSubmitting ? "sleeping" : "waving"} size={100} />
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-center mt-3"
                  >
                    <h2 className="font-display text-2xl font-bold text-foreground">Your Profile</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      You'll be the admin of <span className="font-semibold text-foreground">{familyName || "your family"}</span>
                    </p>
                  </motion.div>
                </div>

                {/* Profile card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/75 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.1)" }}>
                      <User className="w-4 h-4" style={{ color: "hsl(262 83% 58%)" }} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Details</p>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <Input
                      data-testid="input-your-name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your first name"
                      className="h-12 rounded-2xl border-2 font-semibold text-base focus-visible:ring-primary bg-white/60"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        data-testid="select-your-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="h-12 rounded-2xl border-2 border-input font-semibold text-base bg-white/60 px-4 focus:ring-2 focus:ring-primary/50 outline-none w-full text-foreground"
                      >
                        <option value="">Gender</option>
                        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <Input
                        data-testid="input-your-age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className="h-12 rounded-2xl border-2 font-semibold text-base focus-visible:ring-primary bg-white/60"
                        min={1} max={120}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Starter mode */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="bg-white/75 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-border/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Starter Setup</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">How do you want to begin?</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStarterMode("guided")}
                      className={cn(
                        "rounded-2xl p-4 text-left border-2 transition-all",
                        starterMode === "guided"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-white/40 hover:border-primary/40"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{
                        background: starterMode === "guided" ? "hsl(262 83% 58% / 0.15)" : "hsl(var(--muted))"
                      }}>
                        <Sparkles className="w-4 h-4" style={{ color: "hsl(262 83% 58%)" }} />
                      </div>
                      <p className="font-bold text-sm text-foreground">Guided</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Sample chores + 1st reward</p>
                      {starterMode === "guided" && (
                        <div className="mt-2 flex">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "hsl(262 83% 58%)" }}>
                            ✓ Selected
                          </span>
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStarterMode("blank")}
                      className={cn(
                        "rounded-2xl p-4 text-left border-2 transition-all",
                        starterMode === "blank"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-white/40 hover:border-primary/40"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{
                        background: starterMode === "blank" ? "hsl(262 83% 58% / 0.15)" : "hsl(var(--muted))"
                      }}>
                        <Zap className="w-4 h-4" style={{ color: "hsl(262 83% 58%)" }} />
                      </div>
                      <p className="font-bold text-sm text-foreground">Start fresh</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Empty slate — you set up everything</p>
                      {starterMode === "blank" && (
                        <div className="mt-2 flex">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "hsl(262 83% 58%)" }}>
                            ✓ Selected
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  data-testid="button-create-family-submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                  className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your family...</>
                  ) : (
                    <><Check className="w-5 h-5" /> Launch Taskling 🚀</>
                  )}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
