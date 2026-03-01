import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Star, ShoppingBag, Check, Save, RotateCcw, ChevronDown } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: 'pants', label: 'Pants' },
  { id: 'jacket', label: 'Jacket' },
];

const ITEMS: Record<string, { id: string; label: string; image: string }[]> = {
  pants: [
    { id: 'default', label: 'Classic Slacks', image: '/avatar/pants_layer.png' },
  ],
  jacket: [
    { id: 'default', label: 'Suit Jacket', image: '/avatar/jacket_layer.png' },
  ],
};

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
  const { toast } = useToast();
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [config, setConfig] = useState<any>(() => {
    try {
      return JSON.parse(currentUser?.avatarConfig || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setShowScrollHint(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mutation = useMutation({
    mutationFn: async (newConfig: any) => {
      const res = await fetch(buildUrl(api.users.updateAvatar.path, { id: currentUser?.id || 0 }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarConfig: JSON.stringify(newConfig) }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.families.getUsers.path, { id: data.familyId })] });
      toast({
        title: "Look Saved!",
        description: "Your new avatar is ready to rock!",
      });
    },
  });

  const handleSave = () => {
    mutation.mutate(config);
  };

  const handleReset = () => {
    try {
      const original = JSON.parse(currentUser?.avatarConfig || '{}');
      setConfig(original);
      toast({
        title: "Reset",
        description: "Returned to your saved look.",
      });
    } catch (e) {
      setConfig({});
    }
  };

  const updateItem = (section: string, itemId: string) => {
    const newConfig = { ...config, [section]: config[section] === itemId ? null : itemId };
    setConfig(newConfig);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-background min-h-screen pb-32">
      {/* Coins Balance Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-4 bg-gradient-to-br from-accent to-accent/80 rounded-[2rem] border-4 border-white shadow-xl text-white relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Star size={60} className="fill-white" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">Current Balance</p>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-7 h-7 fill-yellow-400 text-yellow-500 drop-shadow-md" />
            <span className="text-3xl font-black tracking-tighter drop-shadow-md">{currentUser?.points || 0}</span>
          </div>
          <Link href={`/family/${currentUser?.familyId}/rewards`}>
            <Button className="w-full h-11 bg-white text-accent hover:bg-white/90 rounded-xl font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Spend Your Stars?!
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight mb-2">My Avatar</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Customise your look!</p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            onClick={handleSave} 
            className="rounded-xl font-bold shadow-lg"
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset} 
            className="rounded-xl font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-12 bg-primary/5 rounded-[40px] flex items-center justify-center border-4 border-primary/10 shadow-inner overflow-hidden">
        <UserAvatar user={{ ...currentUser, avatarConfig: JSON.stringify(config) } as any} size="xl" className="bg-transparent border-none shadow-none" />
      </div>

      <AnimatePresence>
        {showScrollHint && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1 mb-8 text-primary font-bold"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Scroll for options</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ChevronDown size={24} className="stroke-[3]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="pants" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 border-2 border-muted w-full mb-6">
          {SECTIONS.map((s) => (
            <TabsTrigger 
              key={s.id} 
              value={s.id}
              className="flex-1 rounded-xl font-black uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((s) => (
          <TabsContent key={s.id} value={s.id}>
            <div className="grid grid-cols-3 gap-3">
              {ITEMS[s.id].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateItem(s.id, item.id)}
                  className={cn(
                    "aspect-square rounded-2xl border-4 bg-card shadow-md relative flex flex-col items-center justify-center p-2 transition-all",
                    config[s.id] === item.id ? "border-primary ring-2 ring-primary/20" : "border-white"
                  )}
                >
                  <img src={item.image} alt={item.label} className="w-full h-full object-contain mb-1" />
                  <span className="text-[8px] font-black uppercase text-muted-foreground truncate w-full">{item.label}</span>
                  {config[s.id] === item.id && (
                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
