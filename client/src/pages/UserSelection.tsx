import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useFamily, useFamilyUsers } from "@/hooks/use-families";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { Loader2 } from "lucide-react";

export default function UserSelection() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const familyId = parseInt(id || "0");
  const [selectingUserId, setSelectingUserId] = useState<number | null>(null);
  
  const { data: family, isLoading: familyLoading } = useFamily(familyId);
  const { data: users, isLoading: usersLoading } = useFamilyUsers(familyId);
  const { setFamily, setCurrentUser } = useStore();

  if (familyLoading || usersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="font-display text-xl font-bold text-primary animate-pulse">Loading Family...</div>
      </div>
    );
  }

  if (!family || !users) return <div>Error loading data</div>;

  const handleSelectUser = (user: any) => {
    setSelectingUserId(user.id);
    // Brief delay to show the loading state
    setTimeout(() => {
      setFamily(family);
      setCurrentUser(user);
      setLocation(`/family/${family.id}/dashboard`);
    }, 600);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { scale: 0.8, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background pt-12 px-6">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Who's playing?</h1>
        <p className="text-muted-foreground font-medium mt-2">Welcome to {family.name}</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-6"
      >
        {users.map((user) => (
          <motion.button
            key={user.id}
            variants={item}
            disabled={selectingUserId !== null}
            onClick={() => handleSelectUser(user)}
            className="bg-card rounded-[2rem] p-6 border-2 border-border shadow-bouncy flex flex-col items-center gap-4 hover:border-primary/50 transition-colors active:scale-95 relative overflow-hidden"
          >
            {selectingUserId === user.id && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-50 backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <UserAvatar user={user} size="lg" />
            <div>
              <div className="font-display font-bold text-lg text-foreground">{user.username}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user.role}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
