import { useState } from "react";
import { useCreateChore } from "../hooks/use-chores";
import { useCreateReward } from "../hooks/use-rewards";
import { useFamilyUsers } from "../hooks/use-families";
import { useToast } from "../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { cn } from "../lib/utils";
import { Shield, Plus, Gift, ClipboardList } from "lucide-react";

interface QuickActionModalsProps {
  familyId: number;
  isOpen: boolean;
  onClose: () => void;
  type: 'chore' | 'reward';
}

export function QuickActionModals({ familyId, isOpen, onClose, type }: QuickActionModalsProps) {
  const { toast } = useToast();
  const { data: familyUsers = [] } = useFamilyUsers(familyId);
  const createChoreMutation = useCreateChore();
  const createRewardMutation = useCreateReward();

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateChore = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createChoreMutation.mutateAsync({
        familyId,
        title: choreTitle,
        description: choreDescription,
        points: Number(chorePoints),
        type: choreType,
        assigneeId: choreType === "box" || choreAssignee === "__anyone__" ? null : Number(choreAssignee),
        requiresApproval: choreNeedsApproval,
        emoji: "",
      });
      toast({ title: "Chore created" });
      onClose();
    } catch {
      toast({ title: "Could not create chore", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReward = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createRewardMutation.mutateAsync({
        familyId,
        title: rewardTitle,
        description: rewardDescription,
        costPoints: Number(rewardPoints),
        requiresApproval: rewardNeedsApproval,
        emoji: "",
      });
      toast({ title: "Reward created" });
      onClose();
    } catch {
      toast({ title: "Could not create reward", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-2xl border-2 border-border bg-input px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] rounded-[2rem] p-6 gap-6 border-2 border-slate-300 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
             <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center",
               type === 'chore' ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-600"
             )}>
                {type === 'chore' ? <ClipboardList size={24} /> : <Gift size={24} />}
             </div>
             <div>
                <DialogTitle className="text-xl font-bold">
                  {type === 'chore' ? "Assign Chore" : "Create Reward"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {type === 'chore' ? "Add a new task for the family." : "Add something fun to earn."}
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        {type === 'chore' ? (
          <form onSubmit={handleCreateChore} className="space-y-3">
            <input value={choreTitle} onChange={(event) => setChoreTitle(event.target.value)} placeholder="Empty dishwasher" className={inputClass} required />
            <textarea value={choreDescription} onChange={(event) => setChoreDescription(event.target.value)} placeholder="Optional note" className={cn(inputClass, "min-h-20 resize-none")} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Stars</p>
                <input type="number" min="1" value={chorePoints} onChange={(event) => setChorePoints(event.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type</p>
                <select value={choreType} onChange={(event) => setChoreType(event.target.value as any)} className={inputClass}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="box">Shared</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assign To</p>
                <select value={choreAssignee} onChange={(event) => setChoreAssignee(event.target.value)} className={inputClass}>
                  <option value="__anyone__">Anyone</option>
                  {familyUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground px-1">
              <input type="checkbox" checked={choreNeedsApproval} onChange={(event) => setChoreNeedsApproval(event.target.checked)} className="rounded" />
              Require parent approval
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary px-4 py-4 font-bold text-primary-foreground border-2 border-primary/80 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Add Chore"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateReward} className="space-y-3">
            <input value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} placeholder="Movie night choice" className={inputClass} required />
            <textarea value={rewardDescription} onChange={(event) => setRewardDescription(event.target.value)} placeholder="Optional details" className={cn(inputClass, "min-h-20 resize-none")} />
            <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Star Cost</p>
                <input type="number" min="1" value={rewardPoints} onChange={(event) => setRewardPoints(event.target.value)} className={inputClass} required />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground px-1">
              <input type="checkbox" checked={rewardNeedsApproval} onChange={(event) => setRewardNeedsApproval(event.target.checked)} className="rounded" />
              Require parent approval
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-secondary px-4 py-4 font-bold text-secondary-foreground border-2 border-secondary/80 shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Add Reward"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
