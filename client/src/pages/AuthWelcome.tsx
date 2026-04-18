import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Mail, ArrowRight, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { handlePostAuthNavigation } from "@/lib/postAuth";
import { PenguinMascot } from "@/components/PenguinMascot";

type ViewState = "welcome" | "verification" | "signin";

export default function AuthWelcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent, setFirebaseUid, setFamily, setCurrentUser } = useStore();
  
  const [view, setView] = useState<ViewState>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePostAuth = async (uid: string) =>
    handlePostAuthNavigation({
      uid, onboardingIntent, setFirebaseUid, setFamily, setCurrentUser, setLocation,
    });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome!", description: "Account created successfully 🎉" });
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

  const handleEmailSignupContinue = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulate sending code
    setTimeout(() => {
      setLoading(false);
      setView("verification");
    }, 800);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter both email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: "Welcome back!", description: "Signed in successfully" });
      await handlePostAuth(result.user.uid);
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

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

  const handleVerifyCode = (code: string) => {
    setLoading(true);
    // Simulate code verification
    setTimeout(() => {
      if (code === "123456") {
        toast({ title: "Success", description: "Email verified correctly!" });
        handlePostAuth("demo-user-" + Date.now());
      } else {
        toast({ title: "Invalid code", description: "The code you entered is incorrect. Try 123456.", variant: "destructive" });
        setLoading(false);
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-onboarding">
      <div className="blob-primary absolute w-80 h-80 top-[-12%] left-[-14%]" />
      <div className="blob-accent absolute w-72 h-72 bottom-[-10%] right-[-12%]" />

      <button
        data-testid="button-back-auth"
        onClick={() => {
          if (view === "welcome") setLocation("/get-started");
          else setView("welcome");
        }}
        className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm z-20 border border-border/50"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          {view === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-6 inline-block">
                 <PenguinMascot mood="waving" size={80} />
              </div>
              <h2 className="font-display text-3xl font-bold text-zinc-900 mb-1 leading-tight">Create your account</h2>
              <p className="text-sm font-semibold text-zinc-500 mb-8">Get started with your family</p>

              <div className="w-full bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border-2 border-white/80 shadow-xl space-y-4">
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

                <div className="space-y-3">
                  <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                       <Mail size={18} />
                     </div>
                     <Input 
                       type="email"
                       placeholder="Enter your email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && handleEmailSignupContinue()}
                       className="h-14 pl-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold text-zinc-900 placeholder:text-zinc-400"
                     />
                  </div>
                  <button
                    onClick={handleEmailSignupContinue}
                    disabled={!email.trim() || loading}
                    className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg shadow-primary/30"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold text-zinc-500">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setView("signin")}
                    className="text-primary hover:underline underline-offset-4 decoration-2"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {view === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-8">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto">
                    <ShieldCheck size={32} />
                 </div>
                 <h2 className="font-display text-3xl font-bold text-zinc-900 mb-1 leading-tight">Verify your email</h2>
                 <p className="text-sm font-semibold text-zinc-500">We've sent a 6-digit code to</p>
                 <p className="text-[15px] font-bold text-primary mt-1">{email}</p>
              </div>

              <div className="w-full bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border-2 border-white/80 shadow-xl space-y-8">
                <div className="flex justify-between gap-2.5">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      autoFocus={i === 0}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full aspect-[4/5] text-center text-2xl font-bold rounded-xl border-2 border-zinc-100 bg-white/80 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-zinc-900"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => handleVerifyCode(otp.join(""))}
                    disabled={loading || otp.some(v => v === "")}
                    className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg shadow-primary/30"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 60%) 0%, hsl(280 75% 62%) 100%)" }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : "Verify & Continue"}
                  </button>
                  <button 
                    onClick={() => { setOtp(["","","","","",""]); setView("welcome"); }}
                    className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === "signin" && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-8">
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
                       type="password"
                       placeholder="Enter password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                       className="h-14 pl-12 rounded-2xl border-2 border-zinc-100 bg-white/80 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-semibold"
                     />
                  </div>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={loading || !email || !password}
                  className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10 bg-zinc-900"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Sign In"}
                </button>

                <button 
                  onClick={() => setView("welcome")}
                  className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
                >
                  Back to signup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
