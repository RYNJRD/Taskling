import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, ChevronLeft, Loader2, Users, Link as LinkIcon } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function JoinFamily() {
  const [, setLocation] = useLocation();
  const { code: urlCode } = useParams();
  const { setFamily } = useStore();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isViaLink = !!urlCode;

  // Auto-populate code from URL and attempt auto-join
  useEffect(() => {
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      // Auto-attempt join when arriving via link
      handleJoinWithCode(urlCode.toUpperCase());
    }
  }, [urlCode]);

  const handleJoinWithCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/families/code/${inviteCode.trim().toUpperCase()}`);
      if (!res.ok) {
        setError("No family found with that code. Check and try again!");
        return;
      }
      const family = await res.json();
      setFamily(family);
      toast({ 
        title: "Family found!", 
        description: `Welcome to ${family.name}`,
        duration: 3000,
      });
      setLocation(`/family/${family.id}/users`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => handleJoinWithCode(code);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-multiply" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-20 h-20 bg-white rounded-[1.5rem] shadow-bouncy flex items-center justify-center mb-6"
      >
        {isViaLink ? (
          <LinkIcon className="w-10 h-10 text-primary" />
        ) : (
          <Users className="w-10 h-10 text-primary" />
        )}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="font-display text-3xl font-bold text-foreground mb-2"
      >
        {isViaLink ? "Joining via Link..." : "Join a Family"}
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground font-medium mb-8 max-w-[260px]"
      >
        {isViaLink 
          ? "Please wait while we connect you to your family"
          : "Enter the invite code your family shared with you"
        }
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm space-y-4 relative z-10"
      >
        <div className="relative">
          <Input
            data-testid="input-invite-code"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter invite code"
            className={cn(
              "h-14 rounded-2xl border-2 pr-14 font-bold text-lg text-center uppercase tracking-widest",
              error ? "border-destructive" : "focus-visible:ring-primary"
            )}
            maxLength={20}
          />
          <button
            data-testid="button-join-submit"
            onClick={handleJoin}
            disabled={!code.trim() || isLoading}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
              code.trim()
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-destructive text-xs font-bold px-2"
            data-testid="text-join-error"
          >
            {error}
          </motion.p>
        )}

        <button
          data-testid="button-back-join"
          onClick={() => setLocation("/get-started")}
          className="flex items-center gap-1 mx-auto text-sm font-bold text-muted-foreground hover:text-primary transition-colors mt-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </motion.div>
    </div>
  );
}
