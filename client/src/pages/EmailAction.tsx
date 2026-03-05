import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/store/useStore";
import { handlePostAuthNavigation } from "@/lib/postAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CircleX, Loader2, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "verifying" | "verified" | "invalid" | "error";

export default function EmailAction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent, setFirebaseUid, setFamily, setCurrentUser } = useStore();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const email = params.get("email") ?? "";

  const continueToApp = async () => {
    setIsContinuing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        const authUrl = email
          ? `/auth?email=${encodeURIComponent(email)}&mode=signin`
          : "/auth";
        setLocation(authUrl);
        return;
      }

      await user.reload();
      const refreshed = auth.currentUser;
      if (!refreshed?.emailVerified) {
        setLocation("/verify-email");
        return;
      }

      await handlePostAuthNavigation({
        uid: refreshed.uid,
        onboardingIntent,
        setFirebaseUid,
        setFamily,
        setCurrentUser,
        setLocation,
      });
    } finally {
      setIsContinuing(false);
    }
  };

  useEffect(() => {
    if (!oobCode || mode !== "verifyEmail") {
      if (auth.currentUser?.emailVerified) {
        setStatus("verified");
      } else {
        setStatus("invalid");
      }
      return;
    }

    const run = async () => {
      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        setStatus("verified");
        toast({ title: "Email verified", description: "Your email is now verified." });
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error?.message || "This verification link is invalid or expired.");
      }
    };

    void run();
  }, [mode, oobCode, toast]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-primary/10 to-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="font-bold text-foreground">Verifying your email...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative bg-gradient-to-b from-primary/10 to-background">
      <button
        data-testid="button-back-email-action"
        onClick={continueToApp}
        className="absolute top-6 left-6 w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      {status === "verified" ? (
        <>
          <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6">
            <MailCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Email verified</h1>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm">
            Your verification is complete on this device.
          </p>
          <Button
            data-testid="button-continue-after-email-action"
            onClick={continueToApp}
            disabled={isContinuing}
            className="w-full max-w-sm h-12 rounded-2xl font-bold text-base"
          >
            {isContinuing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Continuing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6">
            <CircleX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Verification failed</h1>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm">
            {errorMessage || "This verification link is invalid or already used."}
          </p>
          <Button
            data-testid="button-return-verify-email"
            onClick={() => {
              const authUrl = email
                ? `/auth?email=${encodeURIComponent(email)}&mode=signin`
                : "/verify-email";
              setLocation(authUrl);
            }}
            className="w-full max-w-sm h-12 rounded-2xl font-bold text-base"
          >
            Continue
          </Button>
        </>
      )}
    </div>
  );
}
