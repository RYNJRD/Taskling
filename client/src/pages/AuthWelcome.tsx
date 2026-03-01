import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthWelcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent } = useStore();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailValid = isValidEmail(email);

  const getPostAuthRoute = () => {
    if (onboardingIntent === "create") return "/setup-family";
    if (onboardingIntent === "join") return "/join-family";
    return "/home";
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome!", description: "Signed in with Google successfully" });
      setLocation(getPostAuthRoute());
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign-in failed", description: error.message || "Something went wrong", variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (!emailValid) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setStep("password");
  };

  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canCreateAccount = passwordLongEnough && passwordsMatch;

  const handleCreateAccount = async () => {
    if (!passwordLongEnough) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (!passwordsMatch) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: "Account created!", description: "Welcome to ChoreQuest" });
      setLocation(getPostAuthRoute());
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
          toast({ title: "Welcome back!", description: "Signed in successfully" });
          setLocation(getPostAuthRoute());
        } catch (signInError: any) {
          setPasswordError("Email already in use. Check your password or use a different email.");
        }
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak. Try a stronger one.");
      } else {
        setPasswordError(error.message || "Something went wrong");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
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
        className="text-muted-foreground font-medium mb-8 max-w-[260px]"
      >
        Sign in to start your family's adventure!
      </motion.p>

      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm space-y-3 relative z-10"
          >
            <button
              data-testid="button-google"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3.5 rounded-2xl bg-white text-foreground font-bold text-base
                         border-2 border-border shadow-sm hover:shadow-md active:scale-[0.98]
                         transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <SiGoogle className="w-5 h-5" />
              )}
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </button>

            <button
              data-testid="button-apple"
              onClick={() => {
                toast({ title: "Coming soon", description: "Apple sign-in will be available soon!" });
              }}
              className="w-full py-3.5 rounded-2xl bg-foreground text-background font-bold text-base
                         border-2 border-foreground shadow-sm hover:shadow-md active:scale-[0.98]
                         transition-all flex items-center justify-center gap-3"
            >
              <SiApple className="w-5 h-5" />
              Continue with Apple
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="relative">
              <Input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
                placeholder="Enter your email"
                className={cn(
                  "h-12 rounded-2xl border-2 pr-12 font-medium text-base",
                  emailError ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"
                )}
              />
              <button
                data-testid="button-email-continue"
                onClick={handleEmailContinue}
                disabled={!email.trim()}
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
                  emailValid
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {emailError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs font-bold text-left px-2"
                data-testid="text-email-error"
              >
                {emailError}
              </motion.p>
            )}

            <div className="pt-4">
              <button
                data-testid="button-skip"
                onClick={() => setLocation(getPostAuthRoute())}
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="password-step"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm space-y-4 relative z-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                data-testid="button-back"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-90 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Create account</p>
              </div>
            </div>

            <div className="bg-muted/60 px-4 py-2.5 rounded-2xl border border-border text-left">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</span>
              <p className="text-sm font-bold text-foreground truncate" data-testid="text-email-display">{email}</p>
            </div>

            <Input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="Create a password"
              className="h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary"
            />
            <Input
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && canCreateAccount && handleCreateAccount()}
              placeholder="Confirm password"
              className="h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary"
            />

            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full transition-colors", passwordLongEnough ? "bg-green-500" : "bg-muted-foreground/30")} />
                <span className={cn("text-xs font-bold transition-colors", passwordLongEnough ? "text-green-600" : "text-muted-foreground")}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full transition-colors", passwordsMatch ? "bg-green-500" : "bg-muted-foreground/30")} />
                <span className={cn("text-xs font-bold transition-colors", passwordsMatch ? "text-green-600" : "text-muted-foreground")}>
                  Passwords match
                </span>
              </div>
            </div>

            {passwordError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs font-bold text-left px-2"
                data-testid="text-password-error"
              >
                {passwordError}
              </motion.p>
            )}

            <Button
              data-testid="button-create-account"
              onClick={handleCreateAccount}
              disabled={!canCreateAccount}
              className="w-full h-12 rounded-2xl font-bold text-base shadow-bouncy-primary active:scale-[0.98] transition-all"
            >
              Create Account
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
