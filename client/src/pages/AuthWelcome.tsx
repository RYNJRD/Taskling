import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { handlePostAuthNavigation } from "@/lib/postAuth";
import { getEmailVerificationActionSettings } from "@/lib/emailVerification";
import { ChorlyMascot } from "@/components/ChorlyMascot";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthWelcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent, setFirebaseUid, setFamily, setCurrentUser } = useStore();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const emailValid = isValidEmail(email);

  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canCreateAccount = passwordLongEnough && passwordsMatch;

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const complexityCount = [passwordChecks.uppercase, passwordChecks.number].filter(Boolean).length;
  const passwordStrength = password.length === 0 ? 0
    : !passwordChecks.length ? 1
    : complexityCount === 0 ? 2
    : complexityCount === 1 ? 3
    : 4;
  const strengthColors = ["bg-muted", "bg-red-500", "bg-orange-400", "bg-amber-400", "bg-green-500"] as const;
  const strengthLabels = ["", "Too short", "Weak", "Almost there", "Strong"] as const;
  const activeColor = strengthColors[passwordStrength];

  useEffect(() => {
    const emailFromLink = searchParams.get("email");
    const modeFromLink = searchParams.get("mode");
    if (!emailFromLink) return;
    setEmail(emailFromLink);
    if (modeFromLink === "signin") setStep("password");
  }, [searchParams]);

  const handlePostAuth = async (uid: string) =>
    handlePostAuthNavigation({
      uid, onboardingIntent, setFirebaseUid, setFamily, setCurrentUser, setLocation,
    });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome!", description: "Signed in with Google successfully" });
      await handlePostAuth(result.user.uid);
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign-in failed", description: error.message || "Something went wrong", variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (!emailValid) { setEmailError("Please enter a valid email address"); return; }
    setEmailError("");
    setStep("password");
  };

  const handleCreateAccount = async () => {
    if (!passwordLongEnough) { setPasswordError("Password must be at least 8 characters"); return; }
    if (!passwordsMatch) { setPasswordError("Passwords do not match"); return; }
    setPasswordError("");
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(result.user, getEmailVerificationActionSettings(result.user.email ?? email.trim()));
      setFirebaseUid(result.user.uid);
      toast({ title: "Verify your email", description: "We sent a verification link. Verify your email to continue." });
      setLocation("/verify-email");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        try {
          const result = await signInWithEmailAndPassword(auth, email.trim(), password);
          if (!result.user.emailVerified) {
            setFirebaseUid(result.user.uid);
            toast({ title: "Email not verified", description: "Please verify your email before continuing." });
            setLocation("/verify-email");
            return;
          }
          toast({ title: "Welcome back!", description: "Signed in successfully" });
          await handlePostAuth(result.user.uid);
        } catch {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-onboarding">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%]" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%]" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mb-3"
        >
          <h1 className="font-display text-4xl font-bold">
            <span style={{ color: "hsl(262 83% 58%)" }} className="logo-glow">Chore</span>
            <span style={{ color: "hsl(43 96% 50%)" }} className="logo-accent-glow">Quest</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="text-muted-foreground font-semibold mb-6 text-sm"
        >
          {step === "email" ? "Sign in or create your account" : "Set a strong password"}
        </motion.p>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-3"
            >
              <button
                data-testid="button-google"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3.5 rounded-2xl bg-white font-bold text-base text-foreground border-2 border-border/60 flex items-center justify-center gap-3 disabled:opacity-60 btn-glow-white transition-all"
              >
                {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <SiGoogle className="w-5 h-5" />}
                {isGoogleLoading ? "Signing in..." : "Continue with Google"}
              </button>

              <button
                data-testid="button-apple"
                onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon!" })}
                className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 border-2 btn-glow-white transition-all"
                style={{ background: "hsl(222 47% 15%)", color: "white", borderColor: "hsl(222 47% 15%)" }}
              >
                <SiApple className="w-5 h-5" />
                Continue with Apple
              </button>

              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="relative">
                <Input
                  data-testid="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
                  placeholder="Enter your email"
                  className={cn(
                    "h-12 rounded-2xl border-2 pr-12 font-medium text-base",
                    emailError ? "border-destructive" : "focus-visible:ring-primary"
                  )}
                />
                <button
                  data-testid="button-email-continue"
                  onClick={handleEmailContinue}
                  disabled={!email.trim()}
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
                    emailValid ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
                  )}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {emailError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs font-bold text-left px-2" data-testid="text-email-error"
                >
                  {emailError}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="password-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  data-testid="button-back"
                  onClick={() => { setStep("email"); setPassword(""); setConfirmPassword(""); setPasswordError(""); }}
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

              <div className="space-y-1.5">
                <Input
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  placeholder="Create a password"
                  className="h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary"
                />
                {password.length > 0 && (
                  <div className="space-y-1.5 px-0.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={cn("flex-1 h-1.5 rounded-full transition-all duration-300", bar <= passwordStrength ? activeColor : "bg-muted")}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs font-bold transition-colors duration-200",
                        passwordStrength === 1 ? "text-red-500" :
                        passwordStrength === 2 ? "text-orange-400" :
                        passwordStrength === 3 ? "text-amber-500" : "text-green-600"
                      )}>
                        {strengthLabels[passwordStrength]}
                      </p>
                      {passwordStrength < 4 && (
                        <p className="text-xs text-muted-foreground">
                          {!passwordChecks.length ? "8+ characters" :
                           !passwordChecks.uppercase ? "+ uppercase letter" :
                           "+ a number"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Input
                data-testid="input-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                onKeyDown={(e) => e.key === "Enter" && canCreateAccount && handleCreateAccount()}
                placeholder="Confirm password"
                className={cn(
                  "h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary",
                  confirmPassword.length > 0 && !passwordsMatch ? "border-red-300" : ""
                )}
              />
              {confirmPassword.length > 0 && (
                <p className={cn("text-xs font-bold px-1 -mt-1 transition-colors", passwordsMatch ? "text-green-600" : "text-red-500")}>
                  {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                </p>
              )}

              {passwordError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs font-bold text-left px-2" data-testid="text-password-error"
                >
                  {passwordError}
                </motion.p>
              )}

              <Button
                data-testid="button-create-account"
                onClick={handleCreateAccount}
                disabled={!canCreateAccount}
                className="w-full h-12 rounded-2xl font-bold text-base btn-glow-primary"
              >
                Create Account
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
        className="absolute bottom-0 right-4 z-10 pointer-events-none"
      >
        <ChorlyMascot pose="peek" size={110} bounce={false} />
      </motion.div>
    </div>
  );
}
