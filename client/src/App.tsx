import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Splash = lazy(() => import("@/pages/Splash"));
const GetStarted = lazy(() => import("@/pages/GetStarted"));
const AuthWelcome = lazy(() => import("@/pages/AuthWelcome"));
const JoinFamily = lazy(() => import("@/pages/JoinFamily"));
const FamilySetup = lazy(() => import("@/pages/FamilySetup"));
const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Rewards = lazy(() => import("@/pages/Rewards"));
const Admin = lazy(() => import("@/pages/Admin"));
const Chat = lazy(() => import("@/pages/Chat"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const EmailAction = lazy(() => import("@/pages/EmailAction"));
const NotFound = lazy(() => import("@/pages/not-found"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-primary">Chorely</p>
        <p className="mt-2 text-sm text-muted-foreground">Loading your family dashboard...</p>
      </div>
    </div>
  );
}

function EmailVerificationGate() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const enforceVerification = () => {
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      const mode = params.get("mode");
      const oobCode = params.get("oobCode");
      if (mode === "verifyEmail" && oobCode && location !== "/email-action") {
        setLocation(`/email-action${search}`);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        if (location === "/verify-email") setLocation("/auth");
        return;
      }

      const passwordProvider = user.providerData.some(
        (provider) => provider.providerId === "password",
      );

      if (
        passwordProvider &&
        !user.emailVerified &&
        location !== "/verify-email" &&
        location !== "/email-action"
      ) {
        setLocation("/verify-email");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, enforceVerification);
    enforceVerification();
    return unsubscribe;
  }, [location, setLocation]);

  return null;
}

import { Router as WouterRouter } from "wouter";

function Router() {
  // Use Vite's BASE_URL (which we set to /Chorely-2.0/)
  const base = import.meta.env.BASE_URL || "/";
  
  return (
    <WouterRouter base={base === '/' ? undefined : base}>
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Splash} />
        <Route path="/get-started" component={GetStarted} />
        <Route path="/auth" component={AuthWelcome} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/email-action" component={EmailAction} />
        <Route path="/join-family" component={JoinFamily} />
        <Route path="/join/:code" component={JoinFamily} />
        <Route path="/setup-family" component={FamilySetup} />
        <Route path="/home" component={Landing} />
        <Route path="/family/:familyId/dashboard" component={Dashboard} />
        <Route path="/family/:familyId/leaderboard" component={Leaderboard} />
        <Route path="/family/:familyId/rewards" component={Rewards} />
        <Route path="/family/:familyId/chat" component={Chat} />
        <Route path="/family/:familyId/profile" component={Profile} />
        <Route path="/family/:familyId/settings" component={Settings} />
        <Route path="/family/:familyId/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EmailVerificationGate />
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
