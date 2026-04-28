import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useLocation } from "wouter";
import {
  Crown, ArrowLeft, CreditCard, Clock, Shield, Star,
  CheckCircle2, ChevronRight, HelpCircle, MessageCircle,
  AlertTriangle, X, Zap, Gift, Users, Sparkles, Lock
} from "lucide-react";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────
   TASKLING PREMIUM V2.0
   Royal luxury, high-tech subscription experience
   ──────────────────────────────────────────── */

type CancelStep = "reasons" | "offer" | "confirm" | null;

const CANCEL_REASONS = [
  { id: "too-expensive", label: "It's too expensive for me" },
  { id: "not-using", label: "I'm not using it enough" },
  { id: "missing-features", label: "Missing features I need" },
  { id: "found-alternative", label: "Found an alternative app" },
  { id: "kids-lost-interest", label: "Kids lost interest" },
  { id: "temporary-break", label: "Just need a temporary break" },
  { id: "other", label: "Other" },
];

const PREMIUM_FEATURES = [
  { icon: Users, label: "Unlimited family members", description: "Add your whole family" },
  { icon: Gift, label: "Custom rewards", description: "Create personalized prizes" },
  { icon: Star, label: "Advanced leaderboards", description: "Weekly, monthly & all-time" },
  { icon: Zap, label: "Smart scheduling", description: "Auto-assign recurring chores" },
  { icon: Shield, label: "Priority support", description: "Fast help when you need it" },
  { icon: Sparkles, label: "Premium themes", description: "Exclusive app appearances" },
];

export default function Subscription() {
  const { familyId } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser, family, setFamily } = useStore();
  const [cancelStep, setCancelStep] = useState<CancelStep>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");

  // Derive subscription state from store
  const isPremium = family?.subscriptionStatus === "active" || family?.subscriptionStatus === "trialing";
  const isTrialing = family?.subscriptionStatus === "trialing";
  
  const endDate = isTrialing 
    ? (family?.trialEndsAt ? new Date(family.trialEndsAt) : new Date())
    : (family?.currentPeriodEndsAt ? new Date(family.currentPeriodEndsAt) : new Date());

  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  const planName = "Premium Monthly";
  const planPrice = "£4.99/mo";

  const toggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleCancelConfirm = async () => {
    if (!family) return;
    
    // TODO: Real API call to Stripe/Server
    // For now, mock update local store
    const updatedFamily = {
      ...family,
      subscriptionStatus: "canceled" as const,
    };
    
    setFamily(updatedFamily);
    setCancelStep(null);
    setSelectedReasons([]);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-tab-home">
      <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-5 pb-32">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => setLocation(`/family/${familyId}/dashboard`)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-500/80 dark:text-purple-400/70">Membership</p>
            <h1 className="font-display text-xl font-bold text-slate-800 dark:text-white">Taskling Premium</h1>
          </div>
        </motion.div>

        {/* ── Status Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, hsl(270 30% 18%) 0%, hsl(280 25% 14%) 50%, hsl(260 20% 12%) 100%)',
            border: '1px solid rgba(168, 130, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(120, 80, 200, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Subtle ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(168, 130, 255, 0.3) 0%, transparent 70%)' }}
          />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src="/assets/premium-penguin-icon.png"
                    alt="Taskling Premium"
                    className="w-16 h-16 relative z-10 drop-shadow-lg"
                  />
                  <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full translate-y-2" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight tracking-tight">{planName}</h2>
                  <p className="text-sm font-bold text-purple-300/80 mt-0.5">{planPrice}</p>
                </div>
              </div>
              <div className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider",
                isTrialing 
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                  : isPremium
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
              )}>
                {isTrialing ? "Trial" : isPremium ? "Active" : family?.subscriptionStatus === "canceled" ? "Inactive" : "Expired"}
              </div>
            </div>

            {/* Time remaining bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400/70" />
                  <span className="text-[11px] font-bold text-purple-300/60 uppercase tracking-wider">
                    {isTrialing ? "Trial ends" : "Renews"} in
                  </span>
                </div>
                <span className="text-sm font-black text-white tabular-nums">{daysRemaining} days</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (daysRemaining / (isTrialing ? 14 : 30)) * 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, hsl(270 60% 60%), hsl(280 50% 65%))' }}
                />
              </div>
              <p className="text-[11px] text-purple-300/40 mt-1.5 font-medium">
                {isTrialing
                  ? `Free trial ends ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `Next billing date: ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button className="py-3 rounded-2xl font-bold text-[13px] bg-white/8 hover:bg-white/12 text-white/80 active:scale-95 transition-all border border-white/8 flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" /> Manage Payment
              </button>
              <button className="py-3 rounded-2xl font-bold text-[13px] bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> {isTrialing ? "Upgrade Now" : "Renew Plan"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Premium Features ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 px-1">What's Included</p>
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm overflow-hidden">
            {PREMIUM_FEATURES.map(({ icon: Icon, label, description }, i) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3.5",
                  i < PREMIUM_FEATURES.length - 1 && "border-b border-white/30 dark:border-white/5"
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-100/50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/10 flex items-center justify-center flex-none">
                  <Icon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 dark:text-white leading-tight">{label}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                </div>
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-none" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Account & Billing ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 px-1">Account & Billing</p>
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm overflow-hidden">
            {[
              { label: "Payment method", desc: "Visa •••• 4242", icon: CreditCard },
              { label: "Billing history", desc: "View past invoices", icon: Clock },
              { label: "Change plan", desc: "Monthly / Annual", icon: Zap },
              { label: "Redeem promo code", desc: "Enter a gift code", icon: Gift },
            ].map(({ label, desc, icon: Icon }, i) => (
              <button
                key={label}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-white/10 transition-colors",
                  i < 3 && "border-b border-white/30 dark:border-white/5"
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center flex-none">
                  <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 dark:text-white leading-tight">{label}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-none" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Support ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 px-1">Support</p>
          <div className="rounded-3xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm overflow-hidden">
            {[
              { label: "Help Centre", desc: "FAQs and troubleshooting", icon: HelpCircle },
              { label: "Contact Support", desc: "Get help from our team", icon: MessageCircle },
              { label: "Report a Problem", desc: "Something not working?", icon: AlertTriangle },
            ].map(({ label, desc, icon: Icon }, i) => (
              <button
                key={label}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-white/10 transition-colors",
                  i < 2 && "border-b border-white/30 dark:border-white/5"
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center flex-none">
                  <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 dark:text-white leading-tight">{label}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-none" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Cancel Membership ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <button
            onClick={() => setCancelStep("reasons")}
            className="w-full py-4 rounded-3xl font-bold text-[14px] text-rose-500/70 dark:text-rose-400/60 bg-white/40 dark:bg-white/3 border border-rose-200/30 dark:border-rose-500/10 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            Cancel Membership
          </button>
        </motion.div>

      </div>

      {/* ── Cancel Flow Modal ── */}
      <AnimatePresence>
        {cancelStep && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setCancelStep(null); setSelectedReasons([]); }}
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[201] max-h-[85vh] overflow-y-auto rounded-t-[2rem]"
              style={{
                background: 'var(--background)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
              }}
            >
              <div className="p-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
                {/* Drag handle */}
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                {/* Step: Reasons */}
                <AnimatePresence mode="wait">
                  {cancelStep === "reasons" && (
                    <motion.div
                      key="reasons"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="font-display text-xl font-bold text-slate-800 dark:text-white mb-1">We're sorry to see you go</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Help us improve — why are you cancelling?</p>

                      <div className="space-y-2.5 mb-6">
                        {CANCEL_REASONS.map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => toggleReason(id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left font-medium text-[14px] transition-all border",
                              selectedReasons.includes(id)
                                ? "bg-purple-100/50 dark:bg-purple-500/10 border-purple-300/50 dark:border-purple-500/20 text-purple-700 dark:text-purple-300"
                                : "bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                              selectedReasons.includes(id)
                                ? "border-purple-500 bg-purple-500"
                                : "border-slate-300 dark:border-slate-600"
                            )}>
                              {selectedReasons.includes(id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            {label}
                          </button>
                        ))}
                      </div>

                      {selectedReasons.includes("other") && (
                        <textarea
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          placeholder="Tell us more..."
                          className="w-full p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none h-24 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                      )}

                      <button
                        onClick={() => setCancelStep("offer")}
                        disabled={selectedReasons.length === 0}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-rose-500 text-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:scale-100"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => { setCancelStep(null); setSelectedReasons([]); }}
                        className="w-full py-3 mt-2 font-bold text-[14px] text-slate-500 dark:text-slate-400"
                      >
                        Never mind, keep my plan
                      </button>
                    </motion.div>
                  )}

                  {/* Step: Retention Offer */}
                  {cancelStep === "offer" && (
                    <motion.div
                      key="offer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(168, 130, 255, 0.15), rgba(120, 80, 200, 0.1))',
                          border: '1px solid rgba(168, 130, 255, 0.2)',
                        }}
                      >
                        <Gift className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-800 dark:text-white mb-2">Wait — we have an offer!</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                        Stay with Taskling Premium and get <span className="font-black text-purple-500 dark:text-purple-400">50% off</span> for the next 3 months.
                      </p>

                      <div className="rounded-2xl p-5 mb-6 text-left"
                        style={{
                          background: 'linear-gradient(135deg, rgba(168, 130, 255, 0.08), rgba(120, 80, 200, 0.05))',
                          border: '1px solid rgba(168, 130, 255, 0.15)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Premium Monthly</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 line-through">£4.99</span>
                            <span className="text-lg font-black text-purple-500 dark:text-purple-400">£2.49</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">50% off for 3 months, then £4.99/mo</p>
                      </div>

                      <button
                        onClick={() => { setCancelStep(null); setSelectedReasons([]); }}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20 active:scale-[0.97] transition-all mb-3"
                      >
                        <Crown className="w-4.5 h-4.5 inline mr-2" />
                        Accept 50% Off
                      </button>
                      <button
                        onClick={() => setCancelStep("confirm")}
                        className="w-full py-3 font-bold text-[14px] text-rose-500/70 dark:text-rose-400/60"
                      >
                        No thanks, continue cancelling
                      </button>
                    </motion.div>
                  )}

                  {/* Step: Final Confirmation */}
                  {cancelStep === "confirm" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-rose-500/10 border border-rose-500/15">
                        <AlertTriangle className="w-10 h-10 text-rose-400" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-800 dark:text-white mb-2">Are you sure?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 max-w-xs mx-auto">
                        Your premium features will end immediately. You'll lose access to:
                      </p>
                      <div className="rounded-2xl p-4 mb-6 text-left bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200/30 dark:border-rose-500/10">
                        {["Unlimited family members", "Custom rewards", "Smart scheduling", "Premium themes"].map((item) => (
                          <div key={item} className="flex items-center gap-2 py-1.5">
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleCancelConfirm}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] bg-rose-500 text-white active:scale-[0.97] transition-all mb-3"
                      >
                        Cancel Membership
                      </button>
                      <button
                        onClick={() => { setCancelStep(null); setSelectedReasons([]); }}
                        className="w-full py-3 font-bold text-[14px] text-purple-500 dark:text-purple-400"
                      >
                        Keep My Premium
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
