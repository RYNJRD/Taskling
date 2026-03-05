import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { handlePostAuthNavigation } from "@/lib/postAuth";
import { getEmailVerificationActionSettings } from "@/lib/emailVerification";

function isPasswordAuthUser() {
  const user = auth.currentUser;
  if (!user) return false;
  return user.providerData.some((provider) => provider.providerId === "password");
}

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { onboardingIntent, setFirebaseUid, setFamily, setCurrentUser } = useStore();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleBack = async () => {
    await auth.signOut();
    setFirebaseUid(null);
    setCurrentUser(null);
    setFamily(null);
    setLocation("/auth");
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLocation("/auth");
      return;
    }

    if (!isPasswordAuthUser() || user.emailVerified) {
      void handlePostAuthNavigation({
        uid: user.uid,
        onboardingIntent,
        setFirebaseUid,
        setFamily,
        setCurrentUser,
        setLocation,
      });
    }
  }, [onboardingIntent, setCurrentUser, setFamily, setFirebaseUid, setLocation]);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLocation("/auth");
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(user, getEmailVerificationActionSettings());
      toast({
        title: "Verification email sent",
        description: "Check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Could not resend email",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLocation("/auth");
      return;
    }

    setIsChecking(true);
    try {
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser?.emailVerified) {
        toast({ title: "Email verified", description: "Welcome in." });
        await handlePostAuthNavigation({
          uid: refreshedUser.uid,
          onboardingIntent,
          setFirebaseUid,
          setFamily,
          setCurrentUser,
          setLocation,
        });
        return;
      }

      toast({
        title: "Still not verified",
        description: "Open the verification email and click the link, then try again.",
      });
    } catch (error: any) {
      toast({
        title: "Could not refresh status",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const email = auth.currentUser?.email || "your email";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-primary/10 to-background">
      <button
        data-testid="button-back-verify-email"
        onClick={handleBack}
        className="absolute top-6 left-6 w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6">
        <MailCheck className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Verify your email</h1>
      <p className="text-muted-foreground font-medium mb-2 max-w-sm">
        We sent a verification link to:
      </p>
      <p className="font-bold text-foreground mb-8">{email}</p>

      <div className="w-full max-w-sm space-y-3">
        <Button
          data-testid="button-resend-verification"
          onClick={handleResend}
          disabled={isResending}
          className="w-full h-12 rounded-2xl font-bold text-base"
        >
          {isResending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>

        <Button
          data-testid="button-refresh-verification"
          onClick={handleRefreshStatus}
          disabled={isChecking}
          variant="outline"
          className="w-full h-12 rounded-2xl font-bold text-base"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              I've verified, refresh status
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
