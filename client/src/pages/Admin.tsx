import { useEffect, useRef, useState } from "react";
import { Check, Copy, Gift, Link as LinkIcon, Plus, Search, Settings, Shield, ShieldCheck, ShieldOff, Star, Trophy, Users as UsersIcon, X } from "lucide-react";
import { useParams } from "wouter";
import { api, buildUrl } from "../../../shared/routes";
import type { User } from "../../../shared/schema";
import { queryClient, apiRequest } from "../lib/queryClient";
import { apiFetch } from "../lib/apiFetch";
import { useCreateChore } from "../hooks/use-chores";
import { useFamilyUsers } from "../hooks/use-families";
import { useCreateReward } from "../hooks/use-rewards";
import { usePendingChoreReviews, usePendingRewardReviews, useReviewChore, useReviewReward } from "../hooks/use-reviews";
import { UserAvatar } from "../components/UserAvatar";
import { useStore } from "../store/useStore";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export default function Admin() {
  const { familyId } = useParams();
  const id = Number(familyId || 0);
  const { currentUser } = useStore();
  const { toast } = useToast();
  const { data: familyUsers = [] } = useFamilyUsers(id);
  const { data: pendingChores = [] } = usePendingChoreReviews(id);
  const { data: pendingRewards = [] } = usePendingRewardReviews(id);
  const createChoreMutation = useCreateChore();
  const createRewardMutation = useCreateReward();
  const reviewChoreMutation = useReviewChore(id);
  const reviewRewardMutation = useReviewReward(id);

  const [inviteCode, setInviteCode] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isSpawning, setIsSpawning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pendingRef = useRef<Set<number>>(new Set());

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iOS Safari / non-HTTPS
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopiedField(field);
      toast({ title: "Copied!", description: `${field} copied to clipboard.` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const [choreTitle, setChoreTitle] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [chorePoints, setChorePoints] = useState("20");
  const [choreType, setChoreType] = useState<"daily" | "weekly" | "monthly" | "box">("daily");
  const [choreAssignee, setChoreAssignee] = useState("__anyone__");
  const [choreNeedsApproval, setChoreNeedsApproval] = useState(false);

  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("120");
  const [rewardNeedsApproval, setRewardNeedsApproval] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    const fetchInvite = async () => {
      try {
        const res = await apiFetch("/api/my-family/invite");
        if (!res.ok) return;
        const data = await res.json();
        setInviteCode(data.inviteCode);
        setInviteUrl(data.inviteUrl);
      } catch (err) {
        console.error("Invite fetch error:", err);
      }
    };
    void fetchInvite();
  }, [currentUser]);

  const handleRegenerateInvite = async () => {
    if (isSpawning) return;
    setIsSpawning(true);
    try {
      const res = await apiFetch("/api/my-family/invite/regenerate", { method: "POST" });
      if (!res.ok) throw new Error("Spawn error");
      const data = await res.json();
      setInviteCode(data.inviteCode);
      setInviteUrl(data.inviteUrl);
      toast({ title: "New link spawned! 🚀", description: "The old link will no longer work." });
    } catch {
      toast({ title: "Could not spawn link", variant: "destructive" });
    } finally {
      setTimeout(() => setIsSpawning(false), 800);
    }
  };

  useEffect(() => {
    if (window.location.hash === '#members') {
      const el = document.getElementById('members-section');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6 pb-32">
        <div className="w-24 h-24 rounded-[2rem] bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-5xl shadow-lg">
          👑
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-2">Parents only 😊</h2>
          <p className="text-sm text-muted-foreground max-w-[260px]">
            This area is for parents. You can still complete chores and claim rewards from the other tabs!
          </p>
        </div>
        <div className="bg-primary/8 rounded-2xl px-5 py-4 border border-primary/20 max-w-[280px]">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">What you can do</p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li>✅ Complete your chores</li>
            <li>✅ Earn stars &amp; climb the leaderboard</li>
            <li>✅ Claim rewards you've earned</li>
            <li>✅ Chat with your family</li>
          </ul>
        </div>
      </div>
    );
  }

  const usersQueryKey = [api.families.getUsers.path, id] as const;
  const leaderboardQueryKey = [api.families.getLeaderboard.path, id] as const;

  const isPending = (userId: number) => pendingRef.current.has(userId);

  const setPending = (userId: number, value: boolean) => {
    if (value) pendingRef.current.add(userId);
    else pendingRef.current.delete(userId);
  };

  const updateUserInCache = (userId: number, hideFromLeaderboard: boolean) => {
    const updater = (old: User[] | undefined) => old?.map((user) => (user.id === userId ? { ...user, hideFromLeaderboard } : user));
    queryClient.setQueryData<User[]>([...usersQueryKey], updater);
    queryClient.setQueryData<User[]>([...leaderboardQueryKey], updater);
  };

  const handleToggleLeaderboard = async (userId: number, currentHidden: boolean) => {
    if (isPending(userId)) return;
    setPending(userId, true);
    updateUserInCache(userId, !currentHidden);

    try {
      const res = await apiRequest("PATCH", buildUrl(api.users.toggleLeaderboard.path, { id: userId }), { hideFromLeaderboard: !currentHidden });
      const user: User = await res.json();
      updateUserInCache(user.id, user.hideFromLeaderboard ?? false);
    } catch {
      updateUserInCache(userId, currentHidden);
      toast({ title: "Could not update leaderboard setting", variant: "destructive" });
    } finally {
      setPending(userId, false);
    }
  };

  const handleCreateChore = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createChoreMutation.mutateAsync({
        familyId: id,
        title: choreTitle,
        description: choreDescription,
        points: Number(chorePoints),
        type: choreType,
        assigneeId: choreType === "box" || choreAssignee === "__anyone__" ? null : Number(choreAssignee),
        requiresApproval: choreNeedsApproval,
        emoji: "",
      });
      setChoreTitle("");
      setChoreDescription("");
      setChorePoints("20");
      setChoreType("daily");
      setChoreAssignee("__anyone__");
      setChoreNeedsApproval(false);
      toast({ title: "Chore created" });
    } catch {
      toast({ title: "Could not create chore", variant: "destructive" });
    }
  };

  const handleCreateReward = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createRewardMutation.mutateAsync({
        familyId: id,
        title: rewardTitle,
        description: rewardDescription,
        costPoints: Number(rewardPoints),
        requiresApproval: rewardNeedsApproval,
        emoji: "",
      });
      setRewardTitle("");
      setRewardDescription("");
      setRewardPoints("120");
      setRewardNeedsApproval(false);
      toast({ title: "Reward created" });
    } catch {
      toast({ title: "Could not create reward", variant: "destructive" });
    }
  };

  const filteredUsers = familyUsers.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const inputClass = "w-full rounded-2xl border-2 border-border bg-input px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="pt-[max(2rem,env(safe-area-inset-top))] px-5 pb-32 min-h-screen bg-tab-admin">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
          <Settings className="text-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground font-medium">Keep the house fair, warm, and moving.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="rounded-[1.75rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              Family invite
            </h2>
            <button 
              onClick={handleRegenerateInvite}
              disabled={isSpawning}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-1.5",
                isSpawning && "animate-pulse scale-95 opacity-50"
              )}
            >
              <RefreshCw className={cn("w-3 h-3", isSpawning && "animate-spin")} />
              {isSpawning ? "Spawning..." : "Regenerate"}
            </button>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-background/80 p-3 border-2 border-primary/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Code</p>
                <p className="font-mono text-lg font-bold">{inviteCode || "Loading..."}</p>
              </div>
              <button className="rounded-xl bg-primary text-primary-foreground p-3 shrink-0 transition-transform active:scale-95" onClick={() => copyToClipboard(inviteCode, "Invite code")}>
                {copiedField === "Invite code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="rounded-2xl bg-background/80 p-3 border-2 border-accent/20 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Invite link</p>
                <p className="truncate text-sm text-foreground/70">{inviteUrl || "Loading..."}</p>
              </div>
              <button className="rounded-xl bg-accent text-accent-foreground p-3 shrink-0 transition-transform active:scale-95" onClick={() => copyToClipboard(inviteUrl, "Invite link")}>
                {copiedField === "Invite link" ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-primary/30 bg-card p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Pending approvals
            </h2>
            {(pendingChores.length + pendingRewards.length) > 0 && (
              <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-2.5 py-1">
                {pendingChores.length + pendingRewards.length}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* ── Chore submissions ── */}
            {(pendingChores as any[]).map((submission) => {
              const submitter: User | undefined = submission.user;
              const chore = submission.chore;
              return (
                <div key={`chore-${submission.id}`} className="rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-background overflow-hidden shadow-sm">
                  {/* Header strip */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/40">
                    {submitter && <UserAvatar user={submitter} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">
                        {submitter?.username ?? `User #${submission.userId}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">Chore completion request</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-1 rounded-xl">
                      ✔ Chore
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className="font-bold text-base">
                      {chore?.title ?? `Chore #${submission.choreId}`}
                    </p>
                    {chore?.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{chore.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold">{chore?.points ?? submission.pointsAwarded} stars on approval</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                      onClick={async () => {
                        try {
                          await reviewChoreMutation.mutateAsync({ id: submission.id, action: "approve" });
                          toast({ title: "Chore approved! 🌟", description: `${submitter?.username ?? "They"} earned ${chore?.points ?? 0} stars.` });
                        } catch {
                          toast({ title: "Could not approve chore", variant: "destructive" });
                        }
                      }}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold active:scale-[0.97] transition-transform"
                      onClick={async () => {
                        const note = window.prompt("Reason for rejection?", "Give it one more pass.");
                        if (note === null) return; // User cancelled
                        try {
                          await reviewChoreMutation.mutateAsync({ id: submission.id, action: "reject", note: note || "Give it one more pass." });
                          toast({ title: "Chore rejected" });
                        } catch {
                          toast({ title: "Could not reject chore", variant: "destructive" });
                        }
                      }}
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}

            {/* ── Reward claims ── */}
            {(pendingRewards as any[]).map((claim) => {
              const requester: User | undefined = claim.user;
              const reward = claim.reward;
              return (
                <div key={`reward-${claim.id}`} className="rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-background overflow-hidden shadow-sm">
                  {/* Header strip */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/40">
                    {requester && <UserAvatar user={requester} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">
                        {requester?.username ?? `User #${claim.userId}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">Reward request</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600 bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400 px-2 py-1 rounded-xl">
                      🎁 Reward
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className="font-bold text-base">
                      {reward?.title ?? `Reward #${claim.rewardId}`}
                    </p>
                    {reward?.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold">{claim.totalCost} stars</span>
                      </div>
                      {claim.quantity > 1 && (
                        <span className="text-xs text-muted-foreground font-medium">× {claim.quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold shadow-sm active:scale-[0.97] transition-transform"
                      onClick={async () => {
                        try {
                          await reviewRewardMutation.mutateAsync({ id: claim.id, action: "approve" });
                          toast({ title: "Reward approved! 🎉", description: `${requester?.username ?? "They"} can now enjoy ${reward?.title ?? "their reward"}.` });
                        } catch {
                          toast({ title: "Could not approve reward", variant: "destructive" });
                        }
                      }}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold active:scale-[0.97] transition-transform"
                      onClick={async () => {
                        try {
                          await reviewRewardMutation.mutateAsync({ id: claim.id, action: "reject", note: "Not this one just now." });
                          toast({ title: "Reward rejected" });
                        } catch {
                          toast({ title: "Could not reject reward", variant: "destructive" });
                        }
                      }}
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingChores.length === 0 && pendingRewards.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-bold text-sm">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">Nothing is waiting for review.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-slate-300 dark:border-slate-600 bg-card p-5 shadow-md">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Leaderboard visibility
          </h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search family members..." className="w-full rounded-xl bg-muted/50 pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const hidden = user.hideFromLeaderboard ?? false;
              return (
                <button
                  key={user.id}
                  onClick={() => handleToggleLeaderboard(user.id, hidden)}
                  className="w-full rounded-2xl bg-muted/50 px-3 py-3 flex items-center justify-between gap-3 text-left border-2 border-transparent hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <span className={cn("text-xs font-bold uppercase tracking-[0.18em]", hidden ? "text-muted-foreground" : "text-primary")}>
                    {hidden ? "Hidden" : "Visible"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="members-section" className="rounded-[1.75rem] border-2 border-slate-300 dark:border-slate-600 bg-card p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Member management
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {familyUsers.length} total
            </span>
          </div>
          <div className="space-y-3">
            {familyUsers.map((user) => (
              <div key={user.id} className="rounded-2xl bg-muted/30 p-4 flex items-center justify-between gap-4 border-2 border-transparent hover:border-primary/10 transition-all">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size="md" />
                  <div>
                    <p className="font-bold text-sm">
                      {user.username} {user.id === currentUser.id ? "(You)" : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className={cn(
                         "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                         user.role === 'admin' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                       )}>
                         {user.role === 'admin' ? 'Parent' : 'Child'}
                       </span>
                    </div>
                  </div>
                </div>
                {user.id !== currentUser.id && (
                  <button
                    className={cn(
                      "rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95",
                      user.role === "admin" 
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                        : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20",
                    )}
                    onClick={async () => {
                      try {
                        const newRole = user.role === "admin" ? "member" : "admin";
                        const res = await apiRequest("PATCH", buildUrl(api.users.updateRole.path, { id: user.id }), { role: newRole });
                        const updated: User = await res.json();
                        queryClient.setQueryData<User[]>([...usersQueryKey], (old = []) => old.map((entry) => (entry.id === updated.id ? updated : entry)));
                        toast({
                          title: newRole === "admin" ? "Promoting to parent" : "Role updated",
                          description: newRole === "admin" ? `${user.username} is now a parent` : `${user.username} is now a regular member`,
                        });
                      } catch {
                        toast({ title: "Could not update role", variant: "destructive" });
                      }
                    }}
                  >
                    {user.role === "admin" ? <><ShieldOff className="w-3.5 h-3.5 inline mr-1" />Demote</> : <><Shield className="w-3.5 h-3.5 inline mr-1" />Promote</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-slate-300 dark:border-slate-600 bg-card p-5 shadow-md">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-primary" /> Create chore
          </h2>
          <form onSubmit={handleCreateChore} className="space-y-3">
            <input value={choreTitle} onChange={(event) => setChoreTitle(event.target.value)} placeholder="Empty dishwasher" className={inputClass} required />
            <textarea value={choreDescription} onChange={(event) => setChoreDescription(event.target.value)} placeholder="Optional friendly note" className={cn(inputClass, "min-h-24 resize-none")} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="1" value={chorePoints} onChange={(event) => setChorePoints(event.target.value)} className={inputClass} required />
              <select value={choreType} onChange={(event) => setChoreType(event.target.value as typeof choreType)} className={inputClass}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="box">Shared chore</option>
              </select>
            </div>
            <select value={choreAssignee} onChange={(event) => setChoreAssignee(event.target.value)} className={inputClass}>
              <option value="__anyone__">Anyone can help</option>
              {familyUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={choreNeedsApproval} onChange={(event) => setChoreNeedsApproval(event.target.checked)} />
              Require parent approval
            </label>
            <button type="submit" className="w-full rounded-2xl bg-primary px-4 py-4 font-bold text-primary-foreground border-2 border-primary/80 shadow-md shadow-primary/20 active:scale-[0.98] transition-transform">
              Add chore
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border-2 border-slate-300 dark:border-slate-600 bg-card p-5 shadow-md">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="text-secondary" /> Create reward
          </h2>
          <form onSubmit={handleCreateReward} className="space-y-3">
            <input value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} placeholder="Movie night choice" className={inputClass} required />
            <textarea value={rewardDescription} onChange={(event) => setRewardDescription(event.target.value)} placeholder="Optional details" className={cn(inputClass, "min-h-24 resize-none")} />
            <input type="number" min="1" value={rewardPoints} onChange={(event) => setRewardPoints(event.target.value)} className={inputClass} required />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={rewardNeedsApproval} onChange={(event) => setRewardNeedsApproval(event.target.checked)} />
              Require parent approval
            </label>
            <button type="submit" className="w-full rounded-2xl bg-secondary px-4 py-4 font-bold text-secondary-foreground border-2 border-secondary/80 shadow-md shadow-secondary/20 active:scale-[0.98] transition-transform">
              Add reward
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
