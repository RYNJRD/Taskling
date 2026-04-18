import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Mail, ArrowRight, Loader2, KeyRound, Eye, EyeOff, RefreshCw } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, signInWithCustomToken, createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { handlePostAuthNavigation } from "@/lib/postAuth";
import { PenguinMascot } from "@/components/PenguinMascot";
import { apiFetch } from "@/lib/apiFetch";

type ViewState = "welcome" | "verification" | "signin";

export default function AuthWelcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent, setFirebaseUid, setFamily, setCurrentUser } = useStore();
  
  const [view, setView] = useState<ViewState>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePostAuth = async (uid: string) =>
    handlePostAuthNavigation({
      uid, onboardingIntent, setFirebaseUid, setFamily, setCurrentUser, setLocation,
    });

  // Cooldown timer
  const startCooldown = useCallback((secs = 60) => {
    setCooldown(secs);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome!", description: "Signed in successfully 🎉" });
      await handlePostAuth(result.user.uid);
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    toast({ title: "Coming soon", description: "Apple ID login will be available soon!" });
  };

  // Step 1: create Firebase user client-side, then call server just to send the email
  const handleEmailSignupContinue = async () => {
    const emailTrimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Create Firebase user client-side (no Admin SDK needed)
      let uid: string;
      try {
        const cred = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
        uid = cred.user.uid;
      } catch (fbErr: any) {
        if (fbErr.code === "auth/email-already-in-use") {
          toast({ title: "Account exists", description: "An account with this email already exists. Try signing in instead.", variant: "destructive" });
        } else {
          toast({ title: "Account creation failed", description: fbErr.message, variant: "destructive" });
        }
        return;
      }

      // Ask server to generate + email the OTP
      const res = await apiFetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, firebaseUid: uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.waitSecs) startCooldown(data.waitSecs);
        toast({ title: "Couldn't send code", description: data.message, variant: "destructive" });
        return;
      }
      startCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setView("verification");
    } catch (err: any) {
      console.error("[Auth] Signup error:", err);
      toast({ title: "Request failed", description: err.message || "Check your connection and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Resend — user already exists in Firebase, just send a new OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), firebaseUid: uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.waitSecs) startCooldown(data.waitSecs);
        toast({ title: "Couldn't resend code", description: data.message, variant: "destructive" });
        return;
      }
      startCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      toast({ title: "New code sent!", description: "Check your inbox — it expires in 10 minutes." });
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      toast({ title: "Request failed", description: err.message || "Check your connection and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      await handlePostAuth(result.user.uid);
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    setOtpError("");

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(v => v !== "") && index === 5) {
      handleVerifyCode(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    setOtpError("");
    try {
      const res = await apiFetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Incorrect code. Please try again.";
        setOtpError(msg);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        if (data.expired || data.tooManyAttempts) {
          toast({ title: "Code invalid", description: msg, variant: "destructive" });
        }
        return;
      }

      // If Firebase Admin issued a custom token, sign in with it
      // Otherwise the user is already signed in via createUserWithEmailAndPassword
      if (data.customToken) {
        const userCred = await signInWithCustomToken(auth, data.customToken);
        toast({ title: "Email verified! 🎉", description: "Welcome to Taskling." });
        await handlePostAuth(userCred.user.uid);
      } else {
        // Client already has a session — just navigate
        const uid = data.uid || auth.currentUser?.uid;
        if (!uid) {
          toast({ title: "Sign-in error", description: "Please sign in again.", variant: "destructive" });
          setView("signin");
          return;
        }
        toast({ title: "Email verified! 🎉", description: "Welcome to Taskling." });
        await handlePostAuth(uid);
      }
    } catch (error: any) {
      const msg = error.message || "Verification failed. Please try again.";
      setOtpError(msg);
      toast({ title: "Verification error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-onboarding">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%]" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%]" />

      <button
        data-testid="button-back-auth"
        onClick={() => {
          if (view === "welcome") setLocation("/get-started");
          else if (view === "verification") setView("welcome");
          else setView("welcome");
        }}
        className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm z-20 border border-border/50"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">

          {/* ── Welcome / Sign Up ── */}
          {view === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-5 inline-block">
                <PenguinMascot mood="waving" size={80} />
              </div>
              <h2 className="font-display text-3xl font-bold text-zinc-900 mb-1 leading-tight">Create your account</h2>
              <p className="text-sm font-semibold text-zinc-500 mb-7">Get started with your family</p>

              <div className="w-full bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border-2 border-white/80 shadow-xl space-y-4">
                {/* Social */}
                <div className="space-y-2.5">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-4 rounded-2xl bg-white font-bold text-[15px] text-zinc-900 border-2 border-zinc-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <SiGoogle className="w-5 h-5 text-[#4285F4]" />}
                    Continue with Google
                  </button>
                  <button
                    onClick={handleAppleSignIn}
                    className="w-full py-4 rounded-2xl bg-zinc-900 font-bold text-[15px] text-zinc-50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <SiApple className="w-5 h-5" />
                    Continue with Apple
                  </button>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <div className="flex-1 h-px bg-zinc-200/60" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">or</span>
                  <div className="flex-1 h-px bg-zinc-200/60" />
                </div>

                {/* Email + Password */}
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailSignupContinue()}
                      className="h-14 pl-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (6+ chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailSignupContinue()}
                      className="h-14 pl-12 pr-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold text-zinc-900 placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={handleEmailSignupContinue}
                    disabled={!email.trim() || password.length < 6 || loading}
                    className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : (
                      <>Send verification code <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-sm font-bold text-zinc-500">
                  Already have an account?{" "}
                  <button onClick={() => setView("signin")} className="text-primary hover:underline underline-offset-4 decoration-2">
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── OTP Verification ── */}
          {view === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="mb-4"
              >
                <PenguinMascot mood="happy" size={90} />
              </motion.div>

              <h2 className="font-display text-3xl font-bold text-zinc-900 mb-1 leading-tight">Check your email!</h2>
              <p className="text-sm font-semibold text-zinc-500 mb-1">We sent a 6-digit code to</p>
              <p className="text-[15px] font-bold text-primary mb-7">{email.trim()}</p>

              <div className="w-full bg-white/70 backdrop-blur-md rounded-[2.5rem] p-7 border-2 border-white/80 shadow-xl space-y-6">
                {/* OTP inputs */}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      autoFocus={i === 0}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={cn(
                        "w-full aspect-[4/5] text-center text-2xl font-bold rounded-2xl border-2 bg-white/80 focus:ring-4 focus:ring-primary/15 transition-all outline-none text-zinc-900",
                        otpError ? "border-destructive" : digit ? "border-primary" : "border-zinc-100 focus:border-primary"
                      )}
                    />
                  ))}
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {otpError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-semibold text-destructive text-center -mt-2"
                    >
                      {otpError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <button
                    onClick={() => handleVerifyCode(otp.join(""))}
                    disabled={loading || otp.some(v => v === "")}
                    className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : "Verify & Continue"}
                  </button>

                  {/* Resend with cooldown */}
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className={cn(
                      "w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      cooldown > 0 ? "text-zinc-400 cursor-not-allowed" : "text-primary hover:bg-primary/5"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </div>

              <p className="mt-5 text-xs text-zinc-400 font-medium max-w-[260px]">
                The code expires in 10 minutes. Check your spam folder if you don't see it.
              </p>
            </motion.div>
          )}

          {/* ── Sign In ── */}
          {view === "signin" && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-7">
                <div className="w-16 h-16 rounded-xl bg-zinc-900 flex items-center justify-center text-white mb-4 mx-auto rotate-3">
                  <KeyRound size={28} />
                </div>
                <h2 className="font-display text-3xl font-bold text-zinc-900 mb-1 leading-tight">Welcome back</h2>
                <p className="text-sm font-semibold text-zinc-500">Sign in to your family account</p>
              </div>

              <div className="w-full bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border-2 border-white/80 shadow-xl space-y-5">
                <div className="space-y-3.5">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      className="h-14 pl-12 pr-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={loading || !email || !password}
                  className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10 bg-zinc-900 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Sign In"}
                </button>

                <button
                  onClick={() => setView("welcome")}
                  className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
                >
                  Back to sign up
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating penguin decoration */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, type: "spring", bounce: 0.4 }}
        className="absolute -bottom-4 right-10 pointer-events-none"
      >
        <PenguinMascot mood={view === "signin" ? "thinking" : "waving"} size={80} />
      </motion.div>
    </div>
  );
}
