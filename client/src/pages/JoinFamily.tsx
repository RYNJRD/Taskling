import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, ChevronLeft, Loader2, Users, Link as LinkIcon, Check, User } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Family } from "@shared/schema";
import { apiFetch } from "@/lib/apiFetch";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function JoinFamily() {
  const [, setLocation] = useLocation();
  const { code: urlCode } = useParams();
  const { setFamily, setCurrentUser, firebaseUid } = useStore();
  const { toast } = useToast();
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
    if (!firebaseUid) {
      setLocation("/auth");
      return;
    }
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      handleJoinWithCode(urlCode.toUpperCase());
    }
  }, [urlCode]);

  const handleJoinWithCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/families/code/${inviteCode.trim().toUpperCase()}`);
      if (!res.ok) {
        setError("No family found with that code. Check and try again!");
        return;
      }
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
    if (!foundFamily || !firebaseUid) return;
    setIsCreating(true);
    try {
      const userRes = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: foundFamily.id,
          firebaseUid,
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
      toast({
        title: "Welcome!",
        description: `You've joined ${foundFamily.name}`,
        duration: 3000,
      });
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.div
            key="code-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex flex-col items-center w-full"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6"
            >
              {isViaLink ? (
                <LinkIcon className="w-10 h-10 text-primary" />
              ) : (
                <Users className="w-10 h-10 text-primary" />
              )}
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl font-bold text-foreground mb-2"
            >
              {isViaLink ? "Joining via Link..." : "Join a Family"}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-muted-foreground font-medium mb-8 max-w-[260px]"
            >
              {isViaLink
                ? "Please wait while we connect you to your family"
                : "Enter the invite code your family shared with you"
              }
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm space-y-4 relative z-10"
            >
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
                    code.trim()
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                </button>
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
                className="flex items-center gap-1 mx-auto text-sm font-bold text-muted-foreground hover:text-primary transition-colors mt-4"
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
            className="w-full max-w-sm space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                data-testid="button-back-profile"
                onClick={() => { setStep("code"); setFoundFamily(null); }}
                className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Joining {foundFamily?.name}
                </p>
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground text-center mb-4">Set up your profile</p>

            <div className="bg-card p-4 rounded-2xl border-2 border-border shadow-sm space-y-3">
              <Input
                data-testid="input-join-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  data-testid="select-join-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Gender</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <Input
                  data-testid="input-join-age"
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

            <Button
              data-testid="button-join-create-profile"
              onClick={handleCreateProfile}
              disabled={isCreating || !canSubmitProfile}
              className="w-full h-12 rounded-2xl font-bold text-base shadow-bouncy-primary"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Join Family</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
