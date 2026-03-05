import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Home, Check, Loader2, User } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getFamilyTimeZone } from "@shared/streak";
import { apiFetch } from "@/lib/apiFetch";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function FamilySetup() {
  const [, setLocation] = useLocation();
  const { setFamily, setCurrentUser, firebaseUid } = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceedStep0 = familyName.trim().length >= 2;
  const canSubmit = userName.trim().length >= 1 && gender && age && parseInt(age) > 0;

  const handleSubmit = async () => {
    if (!firebaseUid) {
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
      if (!famRes.ok) throw new Error("Failed to create family");
      const family = await famRes.json();

      const userRes = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: family.id,
          firebaseUid,
          username: userName.trim(),
          role: "admin",
          gender: gender.toLowerCase(),
          age: parseInt(age),
        }),
      });
      if (!userRes.ok) throw new Error("Failed to create profile");
      const createdUser = await userRes.json();

      setFamily(family);
      setCurrentUser(createdUser);
      toast({
        title: "Family created!",
        description: `Welcome to ${family.name}! Find your invite code in Admin panel.`,
        duration: 5000,
      });
      setLocation(`/family/${family.id}/dashboard`);
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Family Name", "Your Profile"];

  const inputClass = "h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary";
  const selectClass = "h-12 rounded-2xl border-2 font-medium text-base bg-background px-4 focus:ring-2 focus:ring-primary/50 outline-none w-full";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <button
            data-testid="button-back-setup"
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/get-started")}
            className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {step + 1} of 2</p>
            <p className="text-sm font-bold text-foreground">{steps[step]}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all duration-500",
                i <= step ? "bg-primary" : "bg-muted"
              )}
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
              className="space-y-6"
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                  <Home className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground ml-1 mb-2 block">What's your family name?</label>
                <Input
                  data-testid="input-family-name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder='e.g. "The Smiths"'
                  className={inputClass}
                  autoFocus
                />
              </div>
              <Button
                data-testid="button-next-step-0"
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="w-full h-12 rounded-2xl font-bold text-base"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
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
                <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground text-center mb-4">Set up your profile</p>

              <div className="bg-card p-4 rounded-2xl border-2 border-border shadow-sm space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  You (Admin)
                </span>
                <Input
                  data-testid="input-your-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    data-testid="select-your-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={selectClass}
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
                    className={inputClass}
                    min={1}
                    max={120}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Other family members can join using your invite code after you create the family.
              </p>

              <Button
                data-testid="button-create-family-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-bouncy-primary"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Family...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Create Family</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
