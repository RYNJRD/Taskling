import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";

/* ─── Types ─── */
export type LegalScreenId = "tos" | "privacy" | "disclaimer" | "contact";

/* ─── Shared layout ─── */
function Screen({
  open,
  onClose,
  title,
  emoji,
  color,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  emoji: string;
  color: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={title}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-0 z-[300] bg-background flex flex-col"
        >
          {/* Top bar */}
          <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-base", color)}>
              {emoji}
            </div>
            <h1 className="font-bold text-lg text-foreground tracking-tight flex-1">{title}</h1>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Section / Paragraph helpers ─── */
function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Placeholder({ tag = "REPLACE THIS TEXT" }: { tag?: string }) {
  return (
    <span className="inline-block bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded px-1.5 py-0.5 mr-1">
      [{tag}]
    </span>
  );
}

function PlaceholderBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300 italic">
      {children}
    </p>
  );
}

/* ─── Terms of Service ─── */
export function TermsScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Screen open={open} onClose={onClose} title="Terms of Service" emoji="📋" color="bg-blue-100 dark:bg-blue-950/30">
      <PlaceholderBlock>
        ⚠️ Replace all sections below with your actual legal terms before publishing.
      </PlaceholderBlock>

      <p className="text-xs text-muted-foreground">Last updated: <Placeholder tag="DATE" /></p>

      <DocSection title="1. Acceptance of Terms">
        <p>By accessing or using <Placeholder tag="APP NAME" />, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.</p>
        <PlaceholderBlock>Add your acceptance and eligibility requirements here, including minimum age requirements for users.</PlaceholderBlock>
      </DocSection>

      <DocSection title="2. Description of Service">
        <p><Placeholder tag="APP NAME" /> is a household chore management application designed for families. The app allows parents to create and assign chores, track completion, and reward children with points.</p>
        <PlaceholderBlock>Describe your service in detail, including what is included, any limitations, and the nature of the parent/child account relationship.</PlaceholderBlock>
      </DocSection>

      <DocSection title="3. User Accounts and Roles">
        <p>The app supports two user roles: Parents (administrators) and Children (members). Parent accounts have additional privileges including creating chores, managing rewards, and approving claims.</p>
        <PlaceholderBlock>Add details about account creation, responsibility for account security, and rules around family group management.</PlaceholderBlock>
      </DocSection>

      <DocSection title="4. Children's Privacy">
        <p>We take children's privacy seriously. <Placeholder tag="APP NAME" /> is designed for family use and complies with applicable laws regarding children's data.</p>
        <PlaceholderBlock>Add your COPPA / GDPR-K compliance statements and parental consent requirements here.</PlaceholderBlock>
      </DocSection>

      <DocSection title="5. Acceptable Use">
        <PlaceholderBlock>List prohibited activities: harassment, illegal use, attempting to circumvent security, uploading harmful content, impersonating others, etc.</PlaceholderBlock>
      </DocSection>

      <DocSection title="6. Data and Privacy">
        <p>Your use of the app is also governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
      </DocSection>

      <DocSection title="7. Disclaimers and Limitation of Liability">
        <PlaceholderBlock>Add your warranty disclaimers and limitation of liability language here. Consult a legal professional for this section.</PlaceholderBlock>
      </DocSection>

      <DocSection title="8. Changes to Terms">
        <p>We may update these Terms from time to time. We will notify users of significant changes through the app or by email.</p>
        <PlaceholderBlock>Add your notification policy and what constitutes continued use as acceptance.</PlaceholderBlock>
      </DocSection>

      <DocSection title="9. Contact">
        <p>Questions about these Terms? Contact us at <Placeholder tag="SUPPORT EMAIL" />.</p>
      </DocSection>
    </Screen>
  );
}

/* ─── Privacy Policy ─── */
export function PrivacyScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Screen open={open} onClose={onClose} title="Privacy Policy" emoji="🔒" color="bg-violet-100 dark:bg-violet-950/30">
      <PlaceholderBlock>
        ⚠️ Replace all sections below with your actual privacy policy before publishing. Consult a legal professional.
      </PlaceholderBlock>

      <p className="text-xs text-muted-foreground">Last updated: <Placeholder tag="DATE" /></p>

      <DocSection title="1. Information We Collect">
        <p>We collect information you provide when creating an account, including:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Display name</li>
          <li>Family group association</li>
          <li>Chore completion history</li>
          <li>Points and rewards history</li>
        </ul>
        <PlaceholderBlock>Add any additional data you collect: device info, usage analytics, crash reports, etc.</PlaceholderBlock>
      </DocSection>

      <DocSection title="2. How We Use Your Information">
        <PlaceholderBlock>Describe each purpose for data collection: running the app, improving features, sending notifications, customer support, etc.</PlaceholderBlock>
      </DocSection>

      <DocSection title="3. Data Sharing">
        <p>We do not sell your personal information to third parties.</p>
        <PlaceholderBlock>List any third parties you do share data with (analytics providers, cloud storage, etc.) and the reason for sharing.</PlaceholderBlock>
      </DocSection>

      <DocSection title="4. Children's Data">
        <p>Children's accounts are created and managed by parent users. We do not knowingly collect personal information from children under 13 without verifiable parental consent.</p>
        <PlaceholderBlock>Add your full COPPA / GDPR-K compliance section here, including how parents can review or delete their child's data.</PlaceholderBlock>
      </DocSection>

      <DocSection title="5. Data Retention">
        <PlaceholderBlock>Explain how long you keep data, what triggers deletion, and how users can request deletion.</PlaceholderBlock>
      </DocSection>

      <DocSection title="6. Your Rights">
        <p>Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <Placeholder tag="SUPPORT EMAIL" />.</p>
        <PlaceholderBlock>List all applicable rights (GDPR, CCPA, etc.) and the process for exercising them.</PlaceholderBlock>
      </DocSection>

      <DocSection title="7. Security">
        <PlaceholderBlock>Describe your security measures (encryption, access controls, breach notification procedures).</PlaceholderBlock>
      </DocSection>

      <DocSection title="8. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
      </DocSection>

      <DocSection title="9. Contact">
        <p>Privacy questions? Contact us at <Placeholder tag="PRIVACY EMAIL" />.</p>
      </DocSection>
    </Screen>
  );
}

/* ─── Disclaimer ─── */
export function DisclaimerScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Screen open={open} onClose={onClose} title="Disclaimer" emoji="⚠️" color="bg-amber-100 dark:bg-amber-950/30">
      <PlaceholderBlock>
        ⚠️ Replace all sections below with your actual disclaimer language before publishing.
      </PlaceholderBlock>

      <p className="text-xs text-muted-foreground">Last updated: <Placeholder tag="DATE" /></p>

      <DocSection title="No Professional Advice">
        <p><Placeholder tag="APP NAME" /> is an entertainment and productivity tool for families. Nothing in the app constitutes professional advice of any kind.</p>
      </DocSection>

      <DocSection title="Points and Rewards">
        <p>The star points and rewards system within the app has no monetary value and cannot be exchanged for real currency. Any real-world rewards associated with in-app points are entirely at the discretion of the family's parent users.</p>
      </DocSection>

      <DocSection title="Accuracy of Information">
        <PlaceholderBlock>Disclaim responsibility for any inaccuracies in app content, and note that features may change without notice.</PlaceholderBlock>
      </DocSection>

      <DocSection title="Third-Party Links">
        <PlaceholderBlock>If you link to any external sites or services, disclaim responsibility for their content and privacy practices here.</PlaceholderBlock>
      </DocSection>

      <DocSection title="Limitation of Liability">
        <PlaceholderBlock>State that your liability is limited to the fullest extent permitted by law. Consult a legal professional for appropriate language in your jurisdiction.</PlaceholderBlock>
      </DocSection>

      <DocSection title="Governing Law">
        <PlaceholderBlock>State the governing law and jurisdiction for any disputes.</PlaceholderBlock>
      </DocSection>
    </Screen>
  );
}

/* ─── Contact Support ─── */
export function ContactScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const SUPPORT_EMAIL = "support@taskling.co"; // REPLACE with your real support email

  return (
    <Screen open={open} onClose={onClose} title="Contact Support" emoji="💬" color="bg-green-100 dark:bg-green-950/30">
      {/* Header card */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl border border-border/60 p-5 text-center">
        <div className="text-4xl mb-3">🐧</div>
        <h2 className="font-display text-xl font-bold mb-1">We're here to help!</h2>
        <p className="text-sm text-muted-foreground">Got a question or spotted something wrong? Reach out and we'll get back to you.</p>
      </div>

      {/* Email option */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-border/40">
          <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Email us</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Taskling Support`}
            className="flex items-center gap-3 bg-primary/8 rounded-2xl px-4 py-3.5 hover:bg-primary/14 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-none">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{SUPPORT_EMAIL}</p>
              <p className="text-xs text-muted-foreground mt-0.5">We typically respond within 2 business days</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-none" />
          </a>
        </div>

        {/* Response times */}
        <div className="px-4 py-4">
          <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Response times</p>
          <div className="space-y-2">
            {[
              { type: "General questions", time: "2–3 business days", dot: "bg-green-400" },
              { type: "Bug reports", time: "1–2 business days", dot: "bg-amber-400" },
              { type: "Account issues", time: "1 business day", dot: "bg-primary" },
            ].map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", item.dot)} />
                  <span className="text-sm text-muted-foreground">{item.type}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ hint */}
      <div className="bg-muted/40 rounded-2xl border border-border/40 px-4 py-4">
        <p className="font-bold text-sm mb-1">Common topics</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {[
            "How do I reset a family member's points?",
            "Can I change a child's role to parent?",
            "How do chore streaks work?",
            "How do I delete my family group?",
          ].map((q) => (
            <li key={q} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">·</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2">
        <Placeholder tag="REPLACE SUPPORT EMAIL ABOVE" /> before publishing
      </p>
    </Screen>
  );
}
