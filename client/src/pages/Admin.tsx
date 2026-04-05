import { useEffect, useRef, useState } from "react";
import { Copy, Gift, Link as LinkIcon, Plus, Search, Settings, Shield, ShieldCheck, ShieldOff, Trophy, Users as UsersIcon } from "lucide-react";
import { useParams } from "wouter";
import { api, buildUrl } from "@shared/routes";
import type { User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/apiFetch";
import { useCreateChore } from "@/hooks/use-chores";
import { useFamilyUsers } from "@/hooks/use-families";
import { useCreateReward } from "@/hooks/use-rewards";
import { usePendingChoreReviews, usePendingRewardReviews, useReviewChore, useReviewReward } from "@/hooks/use-reviews";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const pendingRef = useRef<Set<number>>(new Set());

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
      const res = await apiFetch(buildUrl(api.families.getInviteInfo.path, { id }));
      if (!res.ok) return;
      const data = await res.json();
      setInviteCode(data.inviteCode);
      setInviteUrl(data.inviteUrl);
    };
    void fetchInvite();
  }, [currentUser, id]);

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
    <div className="pt-8 px-5 pb-32 min-h-screen bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
          <Settings className="text-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Keep the house fair, warm, and moving.</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-[1.75rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-5">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            Family invite
          </h2>
          <div className="space-y-3">
            <div className="rounded-2xl bg-background/80 p-3 border-2 border-primary/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Code</p>
                <p className="font-mono text-lg font-bold">{inviteCode || "Loading..."}</p>
              </div>
              <button className="rounded-xl bg-primary text-primary-foreground p-3" onClick={() => navigator.clipboard.writeText(inviteCode)}>
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl bg-background/80 p-3 border-2 border-accent/20 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Invite link</p>
                <p className="truncate text-sm text-foreground/70">{inviteUrl || "Loading..."}</p>
              </div>
              <button className="rounded-xl bg-accent text-accent-foreground p-3" onClick={() => navigator.clipboard.writeText(inviteUrl)}>
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Pending approvals
          </h2>
          <div className="space-y-3">
            {pendingChores.map((submission) => (
              <div key={`chore-${submission.id}`} className="rounded-2xl bg-muted/50 p-3">
                <p className="font-bold text-sm">Chore submission #{submission.id}</p>
                <p className="text-sm text-muted-foreground mt-1">Worth {submission.pointsAwarded} stars. Review it now.</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground" onClick={() => reviewChoreMutation.mutate({ id: submission.id, action: "approve" })}>
                    Approve
                  </button>
                  <button className="rounded-xl border border-border px-3 py-2 text-sm font-bold" onClick={() => reviewChoreMutation.mutate({ id: submission.id, action: "reject", note: "Give it one more pass." })}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingRewards.map((claim) => (
              <div key={`reward-${claim.id}`} className="rounded-2xl bg-muted/50 p-3">
                <p className="font-bold text-sm">Reward request #{claim.id}</p>
                <p className="text-sm text-muted-foreground mt-1">Costs {claim.totalCost} stars.</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground" onClick={() => reviewRewardMutation.mutate({ id: claim.id, action: "approve" })}>
                    Approve
                  </button>
                  <button className="rounded-xl border border-border px-3 py-2 text-sm font-bold" onClick={() => reviewRewardMutation.mutate({ id: claim.id, action: "reject", note: "Not this one just now." })}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingChores.length === 0 && pendingRewards.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing is waiting for review.</p>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-sm">
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
                  className="w-full rounded-2xl bg-muted/50 px-3 py-3 flex items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-bold text-sm">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-[0.18em]", hidden ? "text-muted-foreground" : "text-primary")}>
                    {hidden ? "Hidden" : "Visible"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Member roles
          </h2>
          <div className="space-y-2">
            {familyUsers.map((user) => (
              <div key={user.id} className="rounded-2xl bg-muted/50 px-3 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">
                    {user.username} {user.id === currentUser.id ? "(you)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                {user.id !== currentUser.id && (
                  <button
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-bold",
                      user.role === "admin" ? "border border-border" : "bg-primary text-primary-foreground",
                    )}
                    onClick={async () => {
                      const newRole = user.role === "admin" ? "member" : "admin";
                      const res = await apiRequest("PATCH", buildUrl(api.users.updateRole.path, { id: user.id }), { role: newRole });
                      const updated: User = await res.json();
                      queryClient.setQueryData<User[]>([...usersQueryKey], (old = []) => old.map((entry) => (entry.id === updated.id ? updated : entry)));
                    }}
                  >
                    {user.role === "admin" ? <><ShieldOff className="w-4 h-4 inline mr-1" />Demote</> : <><Shield className="w-4 h-4 inline mr-1" />Promote</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-sm">
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
            <button type="submit" className="w-full rounded-2xl bg-primary px-4 py-4 font-black text-primary-foreground">
              Add chore
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border-2 border-border bg-card p-5 shadow-sm">
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
            <button type="submit" className="w-full rounded-2xl bg-secondary px-4 py-4 font-black text-secondary-foreground">
              Add reward
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
