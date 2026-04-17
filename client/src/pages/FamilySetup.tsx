import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Home, User } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getFamilyTimeZone } from "@shared/streak";
import { apiFetch } from "@/lib/apiFetch";
import { ChorlyMascot } from "@/components/ChorlyMascot";

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
      toast({ title: "Error", description: "Please sign in first.", variant: "destructive" });
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
          const choreRes = await apiFetch("/api/chores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ familyId: family.id, assigneeId: null, emoji: "", createdBy: createdUser.id, ...starterChore }),
          });
          if (!choreRes.ok) {
            const errBody = await choreRes.json().catch(() => ({ message: choreRes.statusText }));
            console.error("Chore creation failed:", errBody);
          }
        }
        const rewardRes = await apiFetch("/api/rewards", {
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
        if (!rewardRes.ok) {
          const errBody = await rewardRes.json().catch(() => ({ message: rewardRes.statusText }));
          console.error("Reward creation failed:", errBody);
        }
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
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Family Name", "Your Profile"];
  const inputClass = "h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary";
  const selectClass = "h-12 rounded-2xl border-2 font-medium text-base bg-background px-4 focus:ring-2 focus:ring-primary/50 outline-none w-full";

  return (
    <div className="min-h-screen bg-onboarding p-6 relative overflow-hidden">
      <div className="blob-primary absolute w-72 h-72 top-[-10%] left-[-12%]" />
      <div className="blob-accent absolute w-64 h-64 bottom-[-10%] right-[-10%]" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <button
            data-testid="button-back-setup"
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/get-started")}
            className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm border border-border/40"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {step + 1} of 2</p>
            <p className="text-sm font-bold text-foreground">{steps[step]}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn("flex-1 h-2 rounded-full transition-all duration-500", i <= step ? "btn-glow-primary" : "bg-muted")}
              style={i <= step ? { background: "linear-gradient(90deg, hsl(262 83% 58%), hsl(280 75% 62%))" } : {}}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex justify-center mb-2">
                <ChorlyMascot pose="think" size={120} bounce={true} />
              </div>

              <div className="text-center mb-4">
                <h2 className="font-display text-2xl font-bold text-foreground">What's your family called?</h2>
                <p className="text-sm text-muted-foreground mt-1">Give your crew a legendary name!</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-border/60 card-glow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                    <Home className="w-4 h-4" style={{ color: "hsl(262 83% 58%)" }} />
                  </div>
                  <label className="text-sm font-bold text-muted-foreground">Family Name</label>
                </div>
                <Input
                  data-testid="input-family-name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder='e.g. "The Smiths" or "Team Awesome"'
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && canProceedStep0 && setStep(1)}
                />
              </div>

              <Button
                data-testid="button-next-step-0"
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="w-full h-13 rounded-2xl font-bold text-base btn-glow-primary"
                style={{ height: "3.25rem", background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <ChorlyMascot pose={isSubmitting ? "sleep" : "wave"} size={110} bounce={!isSubmitting} />
              </div>

              <div className="text-center mb-2">
                <h2 className="font-display text-2xl font-bold text-foreground">Your Profile</h2>
                <p className="text-sm text-muted-foreground mt-0.5">You'll be the family admin</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-border/60 card-glow space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                    <User className="w-3.5 h-3.5" style={{ color: "hsl(262 83% 58%)" }} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">You (Admin)</span>
                </div>
                <Input
                  data-testid="input-your-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <select data-testid="select-your-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                    <option value="">Gender</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <Input
                    data-testid="input-your-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    className={inputClass}
                    min={1} max={120}
                  />
                </div>
              </div>

              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border-2 border-border/60">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2.5">Starter Setup</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStarterMode("guided")}
                    className={cn(
                      "rounded-xl px-3 py-3 text-sm font-bold border-2 transition-all",
                      starterMode === "guided"
                        ? "text-primary-foreground border-primary btn-glow-primary"
                        : "bg-background border-border text-foreground"
                    )}
                    style={starterMode === "guided" ? { background: "linear-gradient(135deg, hsl(262 83% 60%), hsl(280 75% 62%))" } : {}}
                  >
                    Guided starter ✨
                  </button>
                  <button
                    type="button"
                    onClick={() => setStarterMode("blank")}
                    className={cn(
                      "rounded-xl px-3 py-3 text-sm font-bold border-2 transition-all",
                      starterMode === "blank"
                        ? "text-primary-foreground border-primary btn-glow-primary"
                        : "bg-background border-border text-foreground"
                    )}
                    style={starterMode === "blank" ? { background: "linear-gradient(135deg, hsl(262 83% 60%), hsl(280 75% 62%))" } : {}}
                  >
                    Start blank
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-snug">
                  Guided adds sample chores and a first reward to get your family going tonight.
                </p>
              </div>

              <Button
                data-testid="button-create-family-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="w-full rounded-2xl font-bold text-base btn-glow-primary shimmer"
                style={{ height: "3.25rem", background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Family...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Create Family 🚀</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
