import { useParams } from "wouter";
import { useStore } from "@/store/useStore";
import { useCreateChore } from "@/hooks/use-chores";
import { useCreateReward } from "@/hooks/use-rewards";
import { useFamilyUsers } from "@/hooks/use-families";
import { Settings, Plus, Star, Gift, Trophy, Check, Search, Link as LinkIcon, Copy, CheckCheck, Users as UsersIcon, Shield, ShieldOff } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { buildUrl, api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { apiFetch } from "@/lib/apiFetch";

export default function Admin() {
  const { familyId } = useParams();
  const id = parseInt(familyId || "0");
  const { currentUser } = useStore();
  const { toast } = useToast();

  const createChoreMutation = useCreateChore();
  const createRewardMutation = useCreateReward();
  const { data: familyUsers = [], isLoading: usersLoading } = useFamilyUsers(id);

  const [choreTitle, setChoreTitle] = useState("");
  const [chorePoints, setChorePoints] = useState("10");
  const [choreType, setChoreType] = useState<"daily" | "weekly" | "monthly" | "box">("daily");
  const [choreAssignee, setChoreAssignee] = useState<string>("__anyone__");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardPoints, setRewardPoints] = useState("50");

  // Invite info state
  const [inviteCode, setInviteCode] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(true);

  const pendingRef = useRef<Set<number>>(new Set());
  const [, forceRender] = useState(0);

  // Fetch invite info on mount
  useEffect(() => {
    if (currentUser && id) {
      fetchInviteInfo();
    }
  }, [currentUser, id]);

  const fetchInviteInfo = async () => {
    try {
      setInviteLoading(true);
      const res = await apiFetch(`/api/families/${id}/invite`);
      if (res.ok) {
        const data = await res.json();
        setInviteCode(data.inviteCode);
        setInviteUrl(data.inviteUrl);
      }
    } catch (error) {
      console.error("Failed to fetch invite info:", error);
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast({ 
        title: "Copied!", 
        description: `Invite ${type === 'code' ? 'code' : 'link'} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to copy to clipboard", 
        variant: "destructive" 
      });
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="p-8 text-center text-destructive font-bold">Access Denied. Admins only.</div>;
  }

  const usersQueryKey = [api.families.getUsers.path, id] as const;
  const leaderboardQueryKey = [api.families.getLeaderboard.path, id] as const;

  const isPending = (userId: number) => pendingRef.current.has(userId);

  const setPending = (userId: number, value: boolean) => {
    if (value) {
      pendingRef.current.add(userId);
    } else {
      pendingRef.current.delete(userId);
    }
    forceRender(c => c + 1);
  };

  const updateUserInCache = (userId: number, hideFromLeaderboard: boolean) => {
    const updater = (old: User[] | undefined) =>
      old?.map(u => u.id === userId ? { ...u, hideFromLeaderboard } : u);
    queryClient.setQueryData<User[]>([...usersQueryKey], updater);
    queryClient.setQueryData<User[]>([...leaderboardQueryKey], updater);
  };

  const handleToggleLeaderboard = async (userId: number, currentHidden: boolean) => {
    if (isPending(userId)) return;

    const newValue = !currentHidden;
    setPending(userId, true);

    await queryClient.cancelQueries({ queryKey: [...usersQueryKey] });
    await queryClient.cancelQueries({ queryKey: [...leaderboardQueryKey] });

    updateUserInCache(userId, newValue);

    try {
      const res = await apiRequest(
        "PATCH",
        buildUrl(api.users.toggleLeaderboard.path, { id: userId }),
        { hideFromLeaderboard: newValue }
      );
      const serverUser: User = await res.json();

      updateUserInCache(serverUser.id, serverUser.hideFromLeaderboard);

      toast({
        title: serverUser.hideFromLeaderboard ? "Removed from leaderboard" : "Added to leaderboard",
        description: `${serverUser.username} ${serverUser.hideFromLeaderboard ? "won't appear" : "will now appear"} on the leaderboard`,
      });
    } catch {
      updateUserInCache(userId, currentHidden);
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    } finally {
      setPending(userId, false);
    }
  };

  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPublic = choreAssignee === "__anyone__";
      const basePoints = parseInt(chorePoints);
      const finalPoints = isPublic && choreType !== "box" ? Math.round(basePoints * 1.2) : basePoints;
      await createChoreMutation.mutateAsync({
        familyId: id,
        title: choreTitle,
        points: finalPoints,
        type: choreType,
        assigneeId: choreType === 'box' || isPublic ? null : parseInt(choreAssignee),
        emoji: "",
      });
      setChoreTitle("");
      setChorePoints("10");
      setChoreType("daily");
      setChoreAssignee("__anyone__");
      toast({ title: "Chore created!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create chore", variant: "destructive" });
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRewardMutation.mutateAsync({
        familyId: id,
        title: rewardTitle,
        costPoints: parseInt(rewardPoints),
        emoji: "",
      });
      setRewardTitle("");
      setRewardPoints("50");
      toast({ title: "Reward created!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to create reward", variant: "destructive" });
    }
  };

  const filteredUsers = familyUsers
    .filter(u => {
      if (filter === "visible") return !u.hideFromLeaderboard;
      if (filter === "hidden") return u.hideFromLeaderboard;
      return true;
    })
    .filter(u => !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const visibleCount = familyUsers.filter(u => !u.hideFromLeaderboard).length;
  const hiddenCount = familyUsers.filter(u => u.hideFromLeaderboard).length;

  const inputClass = "w-full bg-input px-4 py-3 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="pt-8 px-6 pb-32 min-h-screen bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
          <Settings className="text-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground" data-testid="text-admin-title">Admin</h1>
      </div>

      <div className="space-y-8">
        {/* Invite Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-5 rounded-[1.5rem] border-2 border-primary/20 shadow-sm">
          <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <UsersIcon className="text-primary w-5 h-5" /> Family Invite
          </h2>
          <p className="text-xs font-medium text-muted-foreground mb-4">
            Share this code or link to invite family members
          </p>

          {inviteLoading ? (
            <div className="space-y-3">
              <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Invite Code */}
              <div className="bg-background/80 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    Invite Code
                  </div>
                  <div className="font-mono font-bold text-xl text-foreground tracking-wider">
                    {inviteCode || "Loading..."}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(inviteCode, 'code')}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0",
                    copiedCode 
                      ? "bg-green-500 text-white" 
                      : "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                  )}
                  data-testid="button-copy-code"
                >
                  {copiedCode ? (
                    <CheckCheck className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Invite Link */}
              <div className="bg-background/80 backdrop-blur-sm border-2 border-accent/30 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    Invite Link
                  </div>
                  <div className="font-medium text-sm text-foreground/70 truncate">
                    {inviteUrl || "Loading..."}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(inviteUrl, 'url')}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0",
                    copiedUrl 
                      ? "bg-green-500 text-white" 
                      : "bg-accent text-accent-foreground shadow-md hover:shadow-lg"
                  )}
                  data-testid="button-copy-url"
                >
                  {copiedUrl ? (
                    <CheckCheck className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <LinkIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-2 font-medium">
                🔒 Only admins can view and share invite codes
              </p>
            </div>
          )}
        </section>

        <section className="bg-card p-5 rounded-[1.5rem] border-2 border-border shadow-sm">
          <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <Trophy className="text-accent w-5 h-5" /> Leaderboard Visibility
          </h2>
          <p className="text-xs font-medium text-muted-foreground mb-4">
            Choose which accounts appear publicly on the leaderboard
          </p>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-search-users"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-muted/50 pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-2 mb-4">
            {([
              { key: "all", label: `All (${familyUsers.length})` },
              { key: "visible", label: `Visible (${visibleCount})` },
              { key: "hidden", label: `Hidden (${hiddenCount})` },
            ] as const).map(f => (
              <button
                key={f.key}
                data-testid={`button-filter-${f.key}`}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 animate-pulse">
                  <div className="w-5 h-5 rounded bg-muted" />
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-20 rounded bg-muted" />
                    <div className="h-2.5 w-12 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredUsers.map(user => {
                const isShown = !user.hideFromLeaderboard;
                const isBusy = isPending(user.id);
                return (
                  <div
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    data-testid={`button-toggle-leaderboard-${user.id}`}
                    onClick={() => {
                      if (!isBusy) handleToggleLeaderboard(user.id, user.hideFromLeaderboard);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                        e.preventDefault();
                        handleToggleLeaderboard(user.id, user.hideFromLeaderboard);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-3 text-left transition-all cursor-pointer select-none first:pt-0 last:pb-0",
                      isBusy && "opacity-40 pointer-events-none"
                    )}
                  >
                    <div
                      aria-checked={isShown}
                      role="checkbox"
                      data-testid={`checkbox-leaderboard-${user.id}`}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isShown
                          ? "bg-primary border-primary"
                          : "bg-transparent border-muted-foreground/30"
                      )}
                    >
                      {isShown && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 transition-colors",
                      isShown ? "bg-primary" : "bg-muted-foreground/20"
                    )}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold text-sm truncate transition-colors",
                          isShown ? "text-foreground" : "text-muted-foreground/40"
                        )}>
                          {user.username}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          user.role === "admin"
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {user.role}
                        </span>
                      </div>
                      {!isShown && (
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground/15 pointer-events-none" />
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-users-match">No users match your search</p>
              )}
            </div>
          )}
        </section>

        <section className="bg-card p-5 rounded-[1.5rem] border-2 border-border shadow-sm">
          <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <Shield className="text-primary w-5 h-5" /> Member Roles
          </h2>
          <p className="text-xs font-medium text-muted-foreground mb-4">
            Promote members to admin or demote admins to member
          </p>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-20 rounded bg-muted" />
                  </div>
                  <div className="w-20 h-8 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {familyUsers.map(user => {
                const isAdmin = user.role === "admin";
                const isSelf = user.id === currentUser?.id;
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0",
                      isAdmin ? "bg-accent" : "bg-primary"
                    )}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-foreground truncate block">
                        {user.username}
                        {isSelf && <span className="text-muted-foreground text-xs ml-1">(you)</span>}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        isAdmin ? "text-accent" : "text-muted-foreground"
                      )}>
                        {user.role}
                      </span>
                    </div>
                    {!isSelf && (
                      <button
                        data-testid={`button-toggle-role-${user.id}`}
                        onClick={async () => {
                          const newRole = isAdmin ? "member" : "admin";
                          try {
                            const res = await apiRequest(
                              "PATCH",
                              buildUrl(api.users.updateRole.path, { id: user.id }),
                              { role: newRole }
                            );
                            const updated: User = await res.json();
                            const updater = (old: User[] | undefined) =>
                              old?.map(u => u.id === updated.id ? { ...u, role: updated.role } : u);
                            queryClient.setQueryData<User[]>([...usersQueryKey], updater);
                            queryClient.setQueryData<User[]>([...leaderboardQueryKey], updater);
                            toast({
                              title: isAdmin ? "Demoted to member" : "Promoted to admin",
                              description: `${user.username} is now a ${newRole}`,
                            });
                          } catch {
                            toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5",
                          isAdmin
                            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            : "bg-accent/10 text-accent hover:bg-accent/20"
                        )}
                      >
                        {isAdmin ? (
                          <><ShieldOff className="w-3.5 h-3.5" /> Demote</>
                        ) : (
                          <><Shield className="w-3.5 h-3.5" /> Promote</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-card p-5 rounded-[1.5rem] border-2 border-border shadow-sm">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Plus className="text-primary" /> Create Chore
          </h2>
          <form onSubmit={handleCreateChore} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Title</label>
              <input
                data-testid="input-chore-title"
                value={choreTitle} onChange={e => setChoreTitle(e.target.value)}
                placeholder="e.g. Wash the dishes" className={inputClass} required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Points</label>
                <div className="relative">
                  <input
                    data-testid="input-chore-points"
                    type="number" value={chorePoints} onChange={e => setChorePoints(e.target.value)}
                    className={inputClass} required min="1"
                  />
                  <Star className="absolute right-3 top-3.5 w-5 h-5 text-accent fill-accent opacity-50" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Type</label>
                <select
                  data-testid="select-chore-type"
                  value={choreType} onChange={e => setChoreType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="box">Open Chore / Chore Box</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Assign To</label>
              <select
                data-testid="select-chore-assignee"
                value={choreAssignee}
                onChange={e => setChoreAssignee(e.target.value)}
                className={inputClass}
              >
                <option value="__anyone__">Anyone (Public) — Extra points</option>
                {familyUsers.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.username}</option>
                ))}
              </select>
            </div>
            <button
              data-testid="button-create-chore"
              type="submit" disabled={createChoreMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-bouncy-primary active:translate-y-[2px] active:shadow-bouncy-active transition-all"
            >
              {createChoreMutation.isPending ? "Creating..." : "Add Chore"}
            </button>
          </form>
        </section>

        <section className="bg-card p-5 rounded-[1.5rem] border-2 border-border shadow-sm">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Gift className="text-secondary" /> Create Reward
          </h2>
          <form onSubmit={handleCreateReward} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Title</label>
              <input
                data-testid="input-reward-title"
                value={rewardTitle} onChange={e => setRewardTitle(e.target.value)}
                placeholder="e.g. Ice Cream Trip" className={inputClass} required
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground ml-1 mb-1 block">Cost (Points)</label>
              <input
                data-testid="input-reward-cost"
                type="number" value={rewardPoints} onChange={e => setRewardPoints(e.target.value)}
                className={inputClass} required min="1"
              />
            </div>
            <button
              data-testid="button-create-reward"
              type="submit" disabled={createRewardMutation.isPending}
              className="w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-bold active:translate-y-[2px] transition-transform"
            >
              {createRewardMutation.isPending ? "Creating..." : "Add Reward"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
