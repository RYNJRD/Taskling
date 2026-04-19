import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, Loader2, Users, Link as LinkIcon, Check, User } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useStore } from "../store/useStore";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import type { Family } from "../../shared/schema";
import { apiFetch } from "../lib/apiFetch";
import { PenguinMascot } from "../components/PenguinMascot";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function JoinFamily() {
  const [, setLocation] = useLocation();
  const { code: urlCode } = useParams();
  const { setFamily, setCurrentUser, firebaseUid } = useStore();
  const { toast } = useToast();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
  const effectiveFirebaseUid = firebaseUid ?? (isDemoMode ? "demo-local-user" : null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isViaLink = !!urlCode;

  const [step, setStep] = useState<"code" | "profile">("code");
  const [foundFamily, setFoundFamily] = useState<Family | null>(null);
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const canSubmitProfile = userName.trim().length >= 1 && gender && age && parseInt(age) > 0;

  useEffect(() => {
    if (!effectiveFirebaseUid) { setLocation("/auth"); return; }
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      handleJoinWithCode(urlCode.toUpperCase());
    }
  }, [urlCode, effectiveFirebaseUid, setLocation]);

  const handleJoinWithCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/families/code/${inviteCode.trim().toUpperCase()}`);
      if (!res.ok) { setError("No family found with that code. Check and try again!"); return; }
      const family = await res.json();
      setFoundFamily(family);
      setStep("profile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => handleJoinWithCode(code);

  const handleCreateProfile = async () => {
    if (!foundFamily || !effectiveFirebaseUid) return;
    setIsCreating(true);
    try {
      const userRes = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: foundFamily.id,
          firebaseUid: effectiveFirebaseUid,
          username: userName.trim(),
          role: "member",
          gender: gender.toLowerCase(),
          age: parseInt(age),
        }),
      });
      if (!userRes.ok) throw new Error("Failed to create profile");
      const createdUser = await userRes.json();
      setFamily(foundFamily);
      setCurrentUser(createdUser);
      toast({ title: "Welcome! 🎉", description: `You've joined ${foundFamily.name}`, duration: 3000 });
      setLocation(`/family/${foundFamily.id}/dashboard`);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass = "h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary";
  const selectClass = "h-12 rounded-2xl border-2 font-medium text-base bg-background px-4 focus:ring-2 focus:ring-primary/50 outline-none w-full";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-onboarding">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%]" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%]" />

      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.div
            key="code-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex flex-col items-center w-full max-w-sm relative z-10"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mb-4"
            >
              <PenguinMascot mood="thinking" size={120} />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl font-bold text-foreground mb-1"
            >
              {isViaLink ? "Joining via Link..." : "Join a Family"}
            </motion.h1>

            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-muted-foreground font-medium mb-7 text-sm max-w-[260px]"
            >
              {isViaLink
                ? "Please wait while Taskling connects you to your family"
                : "Enter the invite code your family shared with you"}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-border/60 card-glow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                    {isViaLink ? <LinkIcon className="w-3.5 h-3.5" style={{ color: "hsl(262 83% 58%)" }} /> : <Users className="w-3.5 h-3.5" style={{ color: "hsl(262 83% 58%)" }} />}
                  </div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Invite Code</label>
                </div>
                <div className="relative">
                  <Input
                    data-testid="input-invite-code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="Enter invite code"
                    className={cn(
                      "h-14 rounded-2xl border-2 pr-14 font-bold text-lg text-center uppercase tracking-widest",
                      error ? "border-destructive" : "focus-visible:ring-primary"
                    )}
                    maxLength={20}
                  />
                  <button
                    data-testid="button-join-submit"
                    onClick={handleJoin}
                    disabled={!code.trim() || isLoading}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                      code.trim() ? "text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
                    )}
                    style={code.trim() ? { background: "linear-gradient(135deg, hsl(262 83% 60%), hsl(280 75% 62%))" } : {}}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs font-bold px-2"
                  data-testid="text-join-error"
                >
                  {error}
                </motion.p>
              )}

              <button
                data-testid="button-back-join"
                onClick={() => setLocation("/get-started")}
                className="flex items-center gap-1 mx-auto text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="profile-step"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="w-full max-w-sm space-y-4 relative z-10"
          >
            <div className="flex items-center gap-2 mb-1">
              <button
                data-testid="button-back-profile"
                onClick={() => { setStep("code"); setFoundFamily(null); }}
                className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm border border-border/40"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Joining {foundFamily?.name}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <PenguinMascot mood="celebrating" size={110} />
            </div>

            <div className="text-center">
              <h2 className="font-display text-xl font-bold text-foreground">Create your profile!</h2>
              <p className="text-xs text-muted-foreground mt-0.5">You're about to join <strong>{foundFamily?.name}</strong></p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-border/60 card-glow space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                  <User className="w-3.5 h-3.5" style={{ color: "hsl(262 83% 58%)" }} />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Profile</span>
              </div>
              <Input data-testid="input-join-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name" className={inputClass} autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <select data-testid="select-join-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                  <option value="">Gender</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <Input data-testid="input-join-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className={inputClass} min={1} max={120} />
              </div>
            </div>

            <Button
              data-testid="button-join-create-profile"
              onClick={handleCreateProfile}
              disabled={isCreating || !canSubmitProfile}
              className="w-full h-13 rounded-2xl font-bold text-base btn-glow-primary shimmer"
              style={{ height: "3.25rem", background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Join Family! 🎉</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
