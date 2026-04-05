import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, Users, CheckSquare, Bell, Gift, Smartphone,
  ChevronRight, Link2, LogOut, Trash2, Moon, Sun, Flame, RefreshCw,
  Pencil, Check, X, AlertTriangle, Crown, Download, ShieldCheck,
  FileText, Info, MessageCircle, UserX,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSettings, type PointsResetCycle } from "@/hooks/use-settings";
import { isParent } from "@/lib/permissions";
import type { UserRole } from "@shared/constants";
import { apiFetch } from "@/lib/apiFetch";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { cn } from "@/lib/utils";
import {
  TermsScreen, PrivacyScreen, DisclaimerScreen, ContactScreen,
  type LegalScreenId,
} from "@/components/LegalScreen";

const APP_VERSION = "1.0.1";

/* ─────────────────────────────────────────────
   Role-based filtering helper
   ──────────────────────────────────────────── */
type RoleRequirement = "any" | "admin";

function visibleForRole(requirement: RoleRequirement, role: UserRole): boolean {
  if (requirement === "admin") return role === "admin";
  return true;
}

/** Filter an array of items by role; items without a `role` field default to "any". */
function filterSettingsByRole<T extends { role?: RoleRequirement }>(
  items: T[],
  role: UserRole,
): T[] {
  return items.filter((item) => visibleForRole(item.role ?? "any", role));
}

/* ─────────────────────────────────────────────
   Primitives
   ──────────────────────────────────────────── */
function SectionHeader({
  icon: Icon, label, color,
}: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-1">
      <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h2 className="font-black text-xs uppercase tracking-widest text-foreground/60">{label}</h2>
    </div>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-5">
      {children}
    </div>
  );
}

function Row({
  label, sublabel, icon: Icon, iconColor, children, onClick, last,
}: {
  label: string; sublabel?: string; icon?: React.ElementType; iconColor?: string;
  children?: React.ReactNode; onClick?: () => void; last?: boolean;
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.985 } : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        !last && "border-b border-border/40",
        onClick && "cursor-pointer active:bg-muted/50 transition-colors",
      )}
    >
      {Icon && (
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-none", iconColor ?? "bg-muted")}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {children
        ? children
        : onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-none" />}
    </motion.div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      data-testid="toggle"
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-200 flex-none",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        style={{ left: on ? "calc(100% - 1.375rem)" : "0.125rem" }}
      />
    </button>
  );
}

function ConfirmDialog({
  title, body, confirmLabel, onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border"
      >
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="font-display text-xl font-bold text-center mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-muted font-bold text-sm text-muted-foreground">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-destructive font-bold text-sm text-destructive-foreground">
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────── */
export default function Settings() {
  const [, setLocation] = useLocation();
  const { currentUser, family, setCurrentUser, logout } = useStore();
  const { settings, updateSetting, resetAllSettings } = useSettings();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(currentUser?.username ?? "");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<LegalScreenId | null>(null);

  const familyId = family?.id ?? 0;
  const role = currentUser?.role ?? "member";
  const parent = isParent(role);

  const { data: inviteData } = useQuery({
    queryKey: [api.families.getInviteInfo.path, familyId],
    queryFn: () => apiFetch(buildUrl(api.families.getInviteInfo.path, { id: familyId })).then((r) => r.json()),
    enabled: !!familyId && parent,
  });

  const nameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiFetch(buildUrl(api.users.updateProfile.path, { id: currentUser?.id ?? 0 }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      return res.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: [api.families.getUsers.path, user.familyId] });
      setEditingName(false);
      toast({ title: "Name updated!" });
    },
    onError: () => toast({ title: "Couldn't save name", variant: "destructive" }),
  });

  function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === currentUser?.username) { setEditingName(false); return; }
    nameMutation.mutate(trimmed);
  }

  async function handleCopyInvite() {
    const link = inviteData?.inviteUrl ?? `${window.location.origin}/join/${family?.inviteCode}`;
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopiedInvite(true);
    toast({ title: "Invite link copied!", description: "Share it with your family." });
    setTimeout(() => setCopiedInvite(false), 2500);
  }

  function handleResetAll() {
    resetAllSettings();
    logout();
    setLocation("/get-started");
  }

  function handleLeaveFamily() {
    logout();
    setShowLeaveConfirm(false);
    setLocation("/get-started");
  }

  function handleDownloadData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      note: "Mock data export — replace with real server-side export in production.",
      user: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            points: currentUser.points,
            streak: currentUser.streak,
            familyId: currentUser.familyId,
            avatarConfig: currentUser.avatarConfig,
            createdAt: currentUser.createdAt,
          }
        : null,
      family: family ? { id: family.id, name: family.name } : null,
      settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chorequest-data-${currentUser?.username ?? "user"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data downloaded!", description: "Your export is saved." });
  }

  function handleDeleteAccount() {
    resetAllSettings();
    logout();
    setShowDeleteConfirm(false);
    setLocation("/get-started");
  }

  const cycleLabels: Record<PointsResetCycle, string> = {
    monthly: "Monthly",
    "3months": "Every 3 months",
    "6months": "Every 6 months",
    "12months": "Every 12 months",
  };

  if (!currentUser) return null;

  /* ─── Declarative section definitions ─── */

  /* Family items — filtered by role */
  const familyItems = filterSettingsByRole([
    { key: "name", role: "any" as const },
    { key: "invite", role: "admin" as const },
    { key: "leave", role: "any" as const },
  ], role);

  /* Chores items — all admin-only */
  const choreItems = filterSettingsByRole([
    { key: "streaks", role: "admin" as const },
    { key: "cycle", role: "admin" as const },
  ], role);

  /* Rewards items */
  const rewardItems = filterSettingsByRole([
    { key: "browse", role: "any" as const },
    { key: "manage", role: "admin" as const },
  ], role);

  /* App items */
  const appItems = filterSettingsByRole([
    { key: "darkmode", role: "any" as const },
    { key: "reset", role: "admin" as const },
  ], role);

  return (
    <>
      <div className="flex flex-col h-dvh overflow-hidden bg-background">

        {/* ── Top bar ── */}
        <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/60">
          <button
            data-testid="button-back-settings"
            onClick={() => setLocation(`/family/${familyId}/profile`)}
            className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-black text-lg text-primary tracking-tight flex-1">Settings</h1>
          {/* Minimal role pill — only shown for children */}
          {!parent && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              Child
            </span>
          )}
          {parent && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Parent
            </span>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-0">

          {/* ── Profile ── */}
          <SectionHeader icon={User} label="Profile" color="bg-violet-500" />
          <SettingCard>
            {/* Edit name — inline inline editor */}
            <div className="px-4 py-3.5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center flex-none">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Display name</p>
                  <AnimatePresence mode="wait">
                    {editingName ? (
                      <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mt-1.5">
                        <input
                          data-testid="input-username"
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                          className="flex-1 text-sm font-medium bg-muted/60 rounded-xl px-3 py-1.5 border border-primary/30 outline-none focus:border-primary"
                          maxLength={40}
                        />
                        <button onClick={handleSaveName} disabled={nameMutation.isPending} className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-none">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </button>
                        <button onClick={() => { setEditingName(false); setNameValue(currentUser.username); }} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-none">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.p key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground mt-0.5">
                        {currentUser.username}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {!editingName && (
                  <button data-testid="button-edit-name" onClick={() => { setNameValue(currentUser.username); setEditingName(true); }} className="text-xs font-bold text-primary hover:underline flex-none">
                    Edit
                  </button>
                )}
              </div>
            </div>
            <Row label="Edit character" sublabel="Change your penguin outfit" icon={User} iconColor="bg-indigo-400" onClick={() => setLocation(`/family/${familyId}/profile`)} last />
          </SettingCard>

          {/* ── Family ── */}
          <SectionHeader icon={Users} label="Family" color="bg-sky-500" />
          <SettingCard>
            {familyItems.map((item, i) => {
              const last = i === familyItems.length - 1;
              if (item.key === "name") {
                return (
                  <Row key="name" label="Family name" sublabel={family?.name ?? "—"} icon={Users} iconColor="bg-sky-500" last={last} />
                );
              }
              if (item.key === "invite") {
                return (
                  <Row
                    key="invite"
                    label={copiedInvite ? "Link copied! ✓" : "Invite via link"}
                    sublabel="Send a link so others can join"
                    icon={Link2}
                    iconColor={copiedInvite ? "bg-green-500" : "bg-sky-400"}
                    onClick={handleCopyInvite}
                    last={last}
                  />
                );
              }
              if (item.key === "leave") {
                return (
                  <Row key="leave" label="Leave family" sublabel="You'll be signed out of this group" icon={LogOut} iconColor="bg-rose-500" onClick={() => setShowLeaveConfirm(true)} last={last} />
                );
              }
              return null;
            })}
          </SettingCard>

          {/* ── Chores (parent-only section — hidden for children) ── */}
          {choreItems.length > 0 && (
            <>
              <SectionHeader icon={CheckSquare} label="Chores" color="bg-green-500" />
              <SettingCard>
                {/* Streaks toggle */}
                <Row label="Daily chore streaks" sublabel="Bonus points for keeping your streak alive" icon={Flame} iconColor="bg-orange-400">
                  <Toggle on={settings.enableStreaks} onChange={(v) => updateSetting("enableStreaks", v)} />
                </Row>

                {/* Points reset cycle — custom control */}
                <div className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center flex-none">
                      <RefreshCw className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">Points reset cycle</p>
                      <p className="text-xs text-muted-foreground mt-0.5">How often star totals reset</p>
                    </div>
                    <button
                      data-testid="button-cycle-picker"
                      onClick={() => setCycleOpen(!cycleOpen)}
                      className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-3 py-1.5 border border-border/60 hover:bg-muted transition-colors"
                    >
                      <span className="text-xs font-bold">{cycleLabels[settings.pointsResetCycle]}</span>
                      <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", cycleOpen && "rotate-90")} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {cycleOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.entries(cycleLabels) as [PointsResetCycle, string][]).map(([val, label]) => (
                            <button
                              key={val}
                              data-testid={`cycle-${val}`}
                              onClick={() => { updateSetting("pointsResetCycle", val); setCycleOpen(false); }}
                              className={cn("py-2.5 px-3 rounded-xl text-xs font-bold border transition-all", settings.pointsResetCycle === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border/60 hover:bg-muted text-foreground")}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SettingCard>
            </>
          )}

          {/* ── Notifications ── */}
          <SectionHeader icon={Bell} label="Notifications" color="bg-amber-500" />
          <SettingCard>
            <Row label="Task completed" sublabel="When a chore is finished" icon={Bell} iconColor="bg-amber-500">
              <Toggle on={settings.notifyTaskComplete} onChange={(v) => updateSetting("notifyTaskComplete", v)} />
            </Row>
            <Row label="Leaderboard updates" sublabel="When rankings change" icon={Bell} iconColor="bg-amber-400">
              <Toggle on={settings.notifyLeaderboard} onChange={(v) => updateSetting("notifyLeaderboard", v)} />
            </Row>
            <Row label="Reminders" sublabel="Nudges for overdue chores" icon={Bell} iconColor="bg-amber-300" last>
              <Toggle on={settings.notifyReminders} onChange={(v) => updateSetting("notifyReminders", v)} />
            </Row>
          </SettingCard>

          {/* ── Rewards ── */}
          <SectionHeader icon={Gift} label="Rewards" color="bg-pink-500" />
          <SettingCard>
            {rewardItems.map((item, i) => {
              const last = i === rewardItems.length - 1;
              if (item.key === "browse") {
                return (
                  <Row key="browse" label="Browse rewards" sublabel="See what you can claim with your stars" icon={Gift} iconColor="bg-pink-500" onClick={() => setLocation(`/family/${familyId}/rewards`)} last={last} />
                );
              }
              if (item.key === "manage") {
                return (
                  <Row key="manage" label="Manage rewards" sublabel="Add, edit or remove family rewards" icon={Gift} iconColor="bg-pink-400" onClick={() => setLocation(`/family/${familyId}/admin`)} last={last} />
                );
              }
              return null;
            })}
          </SettingCard>

          {/* ── App ── */}
          <SectionHeader icon={Smartphone} label="App" color="bg-slate-500" />
          <SettingCard>
            {appItems.map((item, i) => {
              const last = i === appItems.length - 1;
              if (item.key === "darkmode") {
                return (
                  <Row key="darkmode" label={settings.darkMode ? "Dark mode" : "Light mode"} sublabel="Switch the app theme" icon={settings.darkMode ? Moon : Sun} iconColor={settings.darkMode ? "bg-indigo-600" : "bg-yellow-400"} last={last}>
                    <Toggle on={settings.darkMode} onChange={(v) => updateSetting("darkMode", v)} />
                  </Row>
                );
              }
              if (item.key === "reset") {
                return (
                  <Row key="reset" label="Reset all data" sublabel="Clears all settings and signs you out" icon={Trash2} iconColor="bg-rose-600" onClick={() => setShowResetConfirm(true)} last={last} />
                );
              }
              return null;
            })}
          </SettingCard>

          {/* ── Parent control panel (admin only) ── */}
          {parent && (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation(`/family/${familyId}/admin`)}
              className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-4 mb-5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-xl flex-none">👑</div>
              <div className="flex-1">
                <p className="font-black text-sm text-amber-800 dark:text-amber-300">Parent control panel</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">Manage chores, rewards & family members</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </motion.div>
          )}

          {/* ── Privacy & Data ── */}
          <SectionHeader icon={ShieldCheck} label="Privacy & Data" color="bg-violet-500" />
          <SettingCard>
            <Row label="Download my data" sublabel="Export your profile and settings as JSON" icon={Download} iconColor="bg-violet-500" onClick={handleDownloadData} />
            <Row label="Delete my account" sublabel="Clears your local data and signs you out" icon={UserX} iconColor="bg-rose-500" onClick={() => setShowDeleteConfirm(true)} last />
          </SettingCard>

          {/* ── Legal ── */}
          <SectionHeader icon={FileText} label="Legal" color="bg-slate-500" />
          <SettingCard>
            <Row label="Terms of Service" sublabel="Rules for using ChoreQuest" icon={FileText} iconColor="bg-slate-500" onClick={() => setActiveScreen("tos")} />
            <Row label="Privacy Policy" sublabel="How we handle your data" icon={ShieldCheck} iconColor="bg-blue-500" onClick={() => setActiveScreen("privacy")} />
            <Row label="Disclaimer" sublabel="Important limitations and notices" icon={AlertTriangle} iconColor="bg-amber-500" onClick={() => setActiveScreen("disclaimer")} last />
          </SettingCard>

          {/* ── About ── */}
          <SectionHeader icon={Info} label="About" color="bg-teal-500" />
          <SettingCard>
            <Row label="App version" sublabel="ChoreQuest" icon={Info} iconColor="bg-teal-500">
              <span className="text-xs font-black text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">v{APP_VERSION}</span>
            </Row>
            <Row label="Contact support" sublabel="Get help or report a problem" icon={MessageCircle} iconColor="bg-green-500" onClick={() => setActiveScreen("contact")} last />
          </SettingCard>

          <p className="text-center text-xs text-muted-foreground pb-4">
            Made with 🐧 by ChoreQuest · v{APP_VERSION}
          </p>

        </div>
      </div>

      {/* ── Legal sub-screens ── */}
      <TermsScreen open={activeScreen === "tos"} onClose={() => setActiveScreen(null)} />
      <PrivacyScreen open={activeScreen === "privacy"} onClose={() => setActiveScreen(null)} />
      <DisclaimerScreen open={activeScreen === "disclaimer"} onClose={() => setActiveScreen(null)} />
      <ContactScreen open={activeScreen === "contact"} onClose={() => setActiveScreen(null)} />

      {/* ── Confirm dialogs ── */}
      <AnimatePresence>
        {showResetConfirm && (
          <ConfirmDialog
            key="reset"
            title="Reset all data?"
            body="This will clear your settings and sign you out. Your family's data stays safe on the server."
            confirmLabel="Reset & sign out"
            onConfirm={handleResetAll}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
        {showLeaveConfirm && (
          <ConfirmDialog
            key="leave"
            title="Leave family?"
            body="You'll be signed out of this family group. You can rejoin later with an invite link."
            confirmLabel="Leave family"
            onConfirm={handleLeaveFamily}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showDeleteConfirm && (
          <ConfirmDialog
            key="delete"
            title="Delete account?"
            body="This clears all your local data and signs you out. Your family's shared data stays on the server."
            confirmLabel="Delete & sign out"
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
