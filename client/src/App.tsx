import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Splash from "@/pages/Splash";
import GetStarted from "@/pages/GetStarted";
import AuthWelcome from "@/pages/AuthWelcome";
import JoinFamily from "@/pages/JoinFamily";
import FamilySetup from "@/pages/FamilySetup";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Leaderboard from "@/pages/Leaderboard";
import Rewards from "@/pages/Rewards";
import Admin from "@/pages/Admin";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import VerifyEmail from "@/pages/VerifyEmail";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function EmailVerificationGate() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const enforceVerification = () => {
      const user = auth.currentUser;
      if (!user) {
        if (location === "/verify-email") setLocation("/auth");
        return;
      }

      const passwordProvider = user.providerData.some(
        (provider) => provider.providerId === "password",
      );

      if (passwordProvider && !user.emailVerified && location !== "/verify-email") {
        setLocation("/verify-email");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, enforceVerification);
    enforceVerification();
    return unsubscribe;
  }, [location, setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/auth" component={AuthWelcome} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/join-family" component={JoinFamily} />
      <Route path="/join/:code" component={JoinFamily} />
      <Route path="/setup-family" component={FamilySetup} />
      <Route path="/home" component={Landing} />
      <Route path="/family/:familyId/dashboard" component={Dashboard} />
      <Route path="/family/:familyId/leaderboard" component={Leaderboard} />
      <Route path="/family/:familyId/rewards" component={Rewards} />
      <Route path="/family/:familyId/chat" component={Chat} />
      <Route path="/family/:familyId/profile" component={Profile} />
      <Route path="/family/:familyId/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
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
