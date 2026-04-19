import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bell, Check, ChevronRight, Download, FileText,
  Flame, Gift, Info, Link2, LogOut, MessageCircle, Moon,
  Pencil, RefreshCw, Shield, ShieldCheck, Smartphone,
  Sun, Trash2, Users, X, AlertTriangle, UserX, TrendingUp
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useSettings, type PointsResetCycle } from "../hooks/use-settings";
import { isParent } from "../lib/permissions";
import type { UserRole } from "../../shared/constants";
import { apiFetch } from "../lib/apiFetch";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { api, buildUrl } from "../../shared/routes";
import { cn } from "../lib/utils";
import {
  TermsScreen, PrivacyScreen, DisclaimerScreen, ContactScreen,
  type LegalScreenId,
} from "../components/LegalScreen";

const APP_VERSION = "1.0.1";

/* ─────────────────────────────────────────────
   Premium Design Components
   ──────────────────────────────────────────── */

/**
 * Section Header: Small, subtle, and widely tracked
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 px-5 mb-2 mt-8 first:mt-2">
      {title}
    </h3>
  );
}

/**
 * Settings Group: Grouped list style with thin dividers
 */
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-card rounded-2xl border-2 border-slate-300/80 dark:border-slate-700/80 shadow-sm overflow-hidden divide-y divide-border/50">
      {children}
    </div>
  );
}

/**
 * Settings Row: Optimized for alignment and hierarchy
 */
function SettingRow({
  label,
  description,
  icon: Icon,
  danger,
  children,
  onClick,
}: {
  label: string;
  description?: string;
  icon?: React.ElementType;
  danger?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 transition-colors",
        onClick ? "cursor-pointer hover:bg-muted/30 active:bg-muted/50" : ""
      )}
    >
      {Icon && (
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50",
          danger ? "text-destructive" : "text-muted-foreground"
        )}>
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div className="flex-1 min-w-0 pr-2">
        <p className={cn(
          "text-[15px] font-medium leading-tight",
          danger ? "text-destructive" : "text-foreground"
        )}>
          {label}
        </p>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-0.5 leading-tight">
            {description}
          </p>
        )}
      </div>
      <div className="flex-none flex items-center gap-2">
        {children}
        {!children && onClick && (
          <ChevronRight size={16} className="text-muted-foreground/30" strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}

/**
 * Modern iOS-style Toggle
 */
function ModernToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={cn(
        "relative w-10 h-6 rounded-full transition-colors duration-300",
        on ? "bg-primary" : "bg-muted-foreground/20"
      )}
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

/**
 * Refined Dialog for destructive actions
 */
function RefinedConfirmDialog({
  title, body, confirmLabel, onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-md p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl border border-border/50 text-center"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-destructive w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed px-2">{body}</p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-destructive text-destructive-foreground text-sm font-bold shadow-lg shadow-destructive/20 active:scale-[0.98] transition-transform"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl bg-muted text-foreground text-sm font-bold active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main Redesign
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
  const role: UserRole = currentUser?.role === "admin" ? "admin" : "member";
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
      toast({ title: "Name updated" });
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
    toast({ title: "Invite link copied" });
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
      user: currentUser ? {
        id: currentUser.id, username: currentUser.username, role: currentUser.role,
        points: currentUser.points, streak: currentUser.streak,
        familyId: currentUser.familyId, avatarConfig: currentUser.avatarConfig,
        createdAt: currentUser.createdAt,
      } : null,
      family: family ? { id: family.id, name: family.name } : null,
      settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taskling-data-${currentUser?.username ?? "user"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported" });
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

  return (
    <>
      <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-zinc-950 font-sans">
        {/* ── Top Bar (Premium Static) ── */}
        <div className="flex-none flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 bg-slate-50 dark:bg-zinc-950 sticky top-0 z-10">
          <button
            onClick={() => setLocation(`/family/${familyId}/profile`)}
            className="group flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-background border-2 border-slate-300/80 dark:border-slate-700/80 shadow-sm group-hover:shadow transition-all group-active:scale-95">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </div>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            {parent && (
               <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full bg-primary/10 border border-primary/20">
                 <Shield size={10} className="text-primary" />
                 <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Admin Access</span>
               </div>
            )}
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* ── Formatted Lists ── */}
        <div className="flex-1 overflow-y-auto pb-32">
          
          <SectionHeader title="Account" />
          <SettingsGroup>
            <div className="px-4 py-3.5">
               <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground">
                    <Pencil size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium leading-tight">Display name</p>
                    <AnimatePresence mode="wait">
                      {editingName ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 mt-2"
                        >
                          <input
                            autoFocus
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                            className="flex-1 text-sm bg-background rounded-xl px-4 py-2 border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            maxLength={40}
                          />
                          <button onClick={handleSaveName} className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </motion.div>
                      ) : (
                        <p className="text-[13px] text-muted-foreground mt-0.5">{currentUser.username}</p>
                      )}
                    </AnimatePresence>
                  </div>
                  {!editingName && (
                    <button onClick={() => { setEditingName(true); setNameValue(currentUser.username); }} className="text-sm font-bold text-primary px-3 py-1.5 rounded-lg hover:bg-primary/5">
                      Edit
                    </button>
                  )}
               </div>
            </div>
            <SettingRow 
              label="Avatar customization" 
              description="Modify your visual character" 
              icon={Smartphone} 
              onClick={() => setLocation(`/family/${familyId}/profile`)} 
            />
          </SettingsGroup>

          <SectionHeader title="Family Group" />
          <SettingsGroup>
            <SettingRow label="Group name" description={family?.name ?? "Family"} icon={Users} />
            {parent && (
              <SettingRow 
                label={copiedInvite ? "Link copied!" : "Share invite link"} 
                description="Invite new members to your family" 
                icon={copiedInvite ? Check : Link2} 
                onClick={handleCopyInvite} 
              />
            )}
            <SettingRow 
              label="Leave Family" 
              description="Disconnect from this family" 
              icon={LogOut} 
              danger 
              onClick={() => setShowLeaveConfirm(true)} 
            />
          </SettingsGroup>

          {parent && (
            <>
              <SectionHeader title="Chores Engine" />
              <SettingsGroup>
                <SettingRow label="Streak system" description="Encourage daily consistency" icon={Flame}>
                  <ModernToggle on={settings.enableStreaks} onChange={(v) => updateSetting("enableStreaks", v)} />
                </SettingRow>
                <div className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground">
                      <RefreshCw size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium leading-tight">Points reset cycle</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">Automated cleanup frequency</p>
                    </div>
                    <button onClick={() => setCycleOpen(!cycleOpen)} className="flex items-center gap-1.5 text-sm font-bold text-primary">
                      {cycleLabels[settings.pointsResetCycle]}
                      <ChevronRight size={14} className={cn("transition-transform", cycleOpen && "rotate-90")} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {cycleOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {(Object.entries(cycleLabels) as [PointsResetCycle, string][]).map(([val, label]) => (
                            <button
                              key={val}
                              onClick={() => { updateSetting("pointsResetCycle", val); setCycleOpen(false); }}
                              className={cn(
                                "py-3 px-3 rounded-xl text-xs font-bold border-2 transition-all",
                                settings.pointsResetCycle === val
                                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                  : "bg-background border-slate-300 dark:border-slate-600 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SettingsGroup>
            </>
          )}

          <SectionHeader title="Alerts & Notifications" />
          <SettingsGroup>
            <SettingRow label="Task updates" description="Notify on milestone completions" icon={Bell}>
              <ModernToggle on={settings.notifyTaskComplete} onChange={(v) => updateSetting("notifyTaskComplete", v)} />
            </SettingRow>
            <SettingRow label="Ranking shifts" description="Alert when leaderboard positions change" icon={TrendingUp}>
              <ModernToggle on={settings.notifyLeaderboard} onChange={(v) => updateSetting("notifyLeaderboard", v)} />
            </SettingRow>
            <SettingRow label="Smart reminders" description="Gentle nudges for pending tasks" icon={Info}>
              <ModernToggle on={settings.notifyReminders} onChange={(v) => updateSetting("notifyReminders", v)} />
            </SettingRow>
          </SettingsGroup>

          <SectionHeader title="Application" />
          <SettingsGroup>
            <SettingRow label="Visual appearance" description={settings.darkMode ? "Dark mode active" : "Bright mode active"} icon={settings.darkMode ? Moon : Sun}>
               <ModernToggle on={settings.darkMode} onChange={(v) => updateSetting("darkMode", v)} />
            </SettingRow>
            <SettingRow label="App version" description={APP_VERSION} icon={Info} />
            <SettingRow label="Contact help" description="Request technical assistance" icon={MessageCircle} onClick={() => setActiveScreen("contact")} />
          </SettingsGroup>

          <SectionHeader title="Privacy & Security" />
          <SettingsGroup>
            <SettingRow label="Export user data" description="Download profile as JSON" icon={Download} onClick={handleDownloadData} />
            <SettingRow label="Privacy Policy" icon={ShieldCheck} onClick={() => setActiveScreen("privacy")} />
            <SettingRow label="Terms of Service" icon={FileText} onClick={() => setActiveScreen("tos")} />
            <SettingRow label="Delete account" description="Permanent profile removal" icon={UserX} danger onClick={() => setShowDeleteConfirm(true)} />
          </SettingsGroup>

          {parent && (
            <>
              <SectionHeader title="Danger Zone" />
              <SettingsGroup>
                <SettingRow label="Factory Reset" description="Reset all data and configurations" icon={Trash2} danger onClick={() => setShowResetConfirm(true)} />
              </SettingsGroup>
            </>
          )}

          <div className="py-12 px-6 text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Taskling · Built for Families</p>
            <p className="text-[10px] font-medium text-muted-foreground/35 italic">v{APP_VERSION} · Stability build</p>
          </div>
        </div>
      </div>

      <TermsScreen open={activeScreen === "tos"} onClose={() => setActiveScreen(null)} />
      <PrivacyScreen open={activeScreen === "privacy"} onClose={() => setActiveScreen(null)} />
      <DisclaimerScreen open={activeScreen === "disclaimer"} onClose={() => setActiveScreen(null)} />
      <ContactScreen open={activeScreen === "contact"} onClose={() => setActiveScreen(null)} />

      <AnimatePresence>
        {showResetConfirm && (
          <RefinedConfirmDialog
            key="reset"
            title="Factory Reset"
            body="This will permanently clear all local configurations and sign you out. This action cannot be undone."
            confirmLabel="Confirm Reset"
            onConfirm={handleResetAll}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
        {showLeaveConfirm && (
          <RefinedConfirmDialog
            key="leave"
            title="Leave Family?"
            body="You will lose access to all shared chores and history. You can only rejoin with a new invite link."
            confirmLabel="Exit Family"
            onConfirm={handleLeaveFamily}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showDeleteConfirm && (
          <RefinedConfirmDialog
            key="delete"
            title="Delete Profile?"
            body="Your personal statistics and avatar settings will be purged. Shared family data will remain intact."
            confirmLabel="Delete Forever"
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
