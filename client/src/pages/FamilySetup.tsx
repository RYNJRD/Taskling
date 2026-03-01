import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, Star, Users, Home, Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getFamilyTimeZone } from "@shared/streak";

interface MemberDraft {
  name: string;
  gender: string;
  age: string;
  role: string;
}

interface ChoreDraft {
  title: string;
  points: string;
  type: string;
  assigneeName: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function FamilySetup() {
  const [, setLocation] = useLocation();
  const { setFamily, setCurrentUser } = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([
    { name: "", gender: "", age: "", role: "admin" },
  ]);
  const [chores, setChores] = useState<ChoreDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMember = () => {
    setMembers([...members, { name: "", gender: "", age: "", role: "member" }]);
  };

  const removeMember = (i: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i: number, field: keyof MemberDraft, value: string) => {
    const updated = [...members];
    updated[i] = { ...updated[i], [field]: value };
    setMembers(updated);
  };

  const addChore = () => {
    setChores([...chores, { title: "", points: "10", type: "daily", assigneeName: members[0]?.name || "" }]);
  };

  const removeChore = (i: number) => {
    setChores(chores.filter((_, idx) => idx !== i));
  };

  const updateChore = (i: number, field: keyof ChoreDraft, value: string) => {
    const updated = [...chores];
    updated[i] = { ...updated[i], [field]: value };
    setChores(updated);
  };

  const canProceedStep0 = familyName.trim().length >= 2;
  const canProceedStep1 = members.length >= 1 && members.every(m => m.name.trim() && m.gender && m.age && parseInt(m.age) > 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const timeZone = getFamilyTimeZone(null);
      const famRes = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim(), timeZone }),
      });
      if (!famRes.ok) throw new Error("Failed to create family");
      const family = await famRes.json();

      const createdUsers: any[] = [];
      for (const m of members) {
        const userRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId: family.id,
            username: m.name.trim(),
            role: m.role,
            gender: m.gender.toLowerCase(),
            age: parseInt(m.age),
          }),
        });
        if (!userRes.ok) throw new Error("Failed to create member");
        createdUsers.push(await userRes.json());
      }

      for (const c of chores) {
        const isPublicAssignee = c.assigneeName === "__anyone__" || c.assigneeName === "";
        const assignee = isPublicAssignee ? null : createdUsers.find(u => u.username === c.assigneeName);
        const basePoints = parseInt(c.points) || 10;
        const finalPoints = isPublicAssignee && c.type !== "box" ? Math.round(basePoints * 1.2) : basePoints;
        await fetch("/api/chores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId: family.id,
            title: c.title.trim(),
            points: finalPoints,
            type: c.type,
            assigneeId: c.type === "box" || isPublicAssignee ? null : (assignee?.id || createdUsers[0]?.id),
            emoji: "",
          }),
        });
      }

      setFamily(family);
      setCurrentUser(createdUsers[0]);
      toast({ 
        title: "Family created!", 
        description: `Welcome to ${family.name}! Find your invite code in Admin panel.`,
        duration: 5000,
      });
      setLocation(`/family/${family.id}/users`);
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Family Name", "Family Members", "Set Up Chores"];

  const inputClass = "h-12 rounded-2xl border-2 font-medium text-base focus-visible:ring-primary";
  const selectClass = "h-12 rounded-2xl border-2 font-medium text-base bg-background px-4 focus:ring-2 focus:ring-primary/50 outline-none w-full";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <button
            data-testid="button-back-setup"
            onClick={() => step > 0 ? setStep(step - 1) : setLocation("/get-started")}
            className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {step + 1} of 3</p>
            <p className="text-sm font-bold text-foreground">{steps[step]}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all duration-500",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                  <Home className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground ml-1 mb-2 block">What's your family name?</label>
                <Input
                  data-testid="input-family-name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder='e.g. "The Smiths"'
                  className={inputClass}
                  autoFocus
                />
              </div>
              <Button
                data-testid="button-next-step-0"
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="w-full h-12 rounded-2xl font-bold text-base"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground text-center mb-4">Add everyone in the family</p>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {members.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card p-4 rounded-2xl border-2 border-border shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {i === 0 ? "Admin (you)" : `Member ${i + 1}`}
                      </span>
                      {i > 0 && (
                        <button onClick={() => removeMember(i)} className="text-destructive hover:text-destructive/80 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      data-testid={`input-member-name-${i}`}
                      value={m.name}
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                      placeholder="Name"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        data-testid={`select-member-gender-${i}`}
                        value={m.gender}
                        onChange={(e) => updateMember(i, "gender", e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Gender</option>
                        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <Input
                        data-testid={`input-member-age-${i}`}
                        type="number"
                        value={m.age}
                        onChange={(e) => updateMember(i, "age", e.target.value)}
                        placeholder="Age"
                        className={inputClass}
                        min={1}
                        max={120}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                data-testid="button-add-member"
                onClick={addMember}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Another Member
              </button>

              <Button
                data-testid="button-next-step-1"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full h-12 rounded-2xl font-bold text-base"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center">
                  <Star className="w-8 h-8 text-accent fill-accent" />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground text-center mb-2">Add some chores to get started</p>
              <p className="text-xs text-muted-foreground text-center mb-4">You can always add more later from the Admin page</p>

              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {chores.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card p-4 rounded-2xl border-2 border-border shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chore {i + 1}</span>
                      <button onClick={() => removeChore(i)} className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      data-testid={`input-chore-title-${i}`}
                      value={c.title}
                      onChange={(e) => updateChore(i, "title", e.target.value)}
                      placeholder="Chore name"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          data-testid={`input-chore-points-${i}`}
                          type="number"
                          value={c.points}
                          onChange={(e) => updateChore(i, "points", e.target.value)}
                          placeholder="Points"
                          className={cn(inputClass, "pr-8")}
                          min={1}
                        />
                        <Star className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent fill-accent opacity-40" />
                      </div>
                      <select
                        data-testid={`select-chore-type-${i}`}
                        value={c.type}
                        onChange={(e) => updateChore(i, "type", e.target.value)}
                        className={selectClass}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="box">Open Chore / Chore Box</option>
                      </select>
                    </div>
                    <select
                      data-testid={`select-chore-assignee-${i}`}
                      value={c.assigneeName}
                      onChange={(e) => updateChore(i, "assigneeName", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Assign to...</option>
                      <option value="__anyone__">Anyone (Public) — Extra points</option>
                      {members.filter(m => m.name.trim()).map((m, mi) => (
                        <option key={mi} value={m.name.trim()}>{m.name.trim()}</option>
                      ))}
                    </select>
                  </motion.div>
                ))}
              </div>

              <button
                data-testid="button-add-chore"
                onClick={addChore}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-accent/30 text-accent-foreground font-bold flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add a Chore
              </button>

              <Button
                data-testid="button-create-family-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-bouncy-primary"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Family...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Create Family</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
