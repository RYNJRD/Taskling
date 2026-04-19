import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Layout } from "./components/Layout";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Splash = lazy(() => import("./pages/Splash"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const AuthWelcome = lazy(() => import("./pages/AuthWelcome"));
const JoinFamily = lazy(() => import("./pages/JoinFamily"));
const FamilySetup = lazy(() => import("./pages/FamilySetup"));
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Admin = lazy(() => import("./pages/Admin"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const NotFound = lazy(() => import("./pages/not-found"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-primary">Taskling</p>
        <p className="mt-2 text-sm text-muted-foreground">Loading your family dashboard...</p>
      </div>
    </div>
  );
}

import { Router as WouterRouter } from "wouter";

function Router() {
  // Use Vite's BASE_URL (which we set to /Taskling/)
  const base = import.meta.env.BASE_URL || "/";
  
  return (
    <WouterRouter base={base === '/' ? undefined : base}>
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Splash} />
        <Route path="/get-started" component={GetStarted} />
        <Route path="/auth" component={AuthWelcome} />
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
        <Route path="/family/:familyId/activity" component={ActivityLog} />
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
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
