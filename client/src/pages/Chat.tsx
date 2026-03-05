import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type { Message, User } from "@shared/schema";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiFetch";

export default function Chat() {
  const { family, currentUser } = useStore();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: users = [] } = useTanstackQuery<User[]>({
    queryKey: [buildUrl(api.families.getUsers.path, { id: family?.id || 0 })],
    enabled: !!family,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { id: family?.id || 0 })],
    enabled: !!family,
    refetchInterval: 1000,
  });

  const mutation = useMutation({
    mutationFn: async (newMsg: any) => {
      const res = await apiFetch(api.messages.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { id: family?.id || 0 })] });
      setContent("");
    },
  });

  useEffect(() => {
    if (scrollRef.current && shouldAutoScroll) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
    if (target) {
      const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      setShouldAutoScroll(isAtBottom);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !family || !currentUser) return;
    mutation.mutate({
      familyId: family.id,
      userId: currentUser.id,
      senderName: currentUser.username,
      content,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto p-4 bg-background relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Family Chat</h1>
          <p className="text-muted-foreground font-medium">Hang out with the fam!</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-2xl font-black text-primary tracking-tighter tabular-nums leading-none">
            {format(currentTime, "HH:mm")}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {format(currentTime, "eee, MMM do")}
          </div>
        </div>
      </div>

      <ScrollArea 
        className="flex-1 pr-4 mb-4" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${msg.isSystem ? "items-center" : msg.userId === currentUser?.id ? "items-end" : "items-start"}`}
              >
                {msg.isSystem ? (
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-sm font-bold border flex items-center gap-2 max-w-[90%] mx-auto text-center justify-center",
                    msg.content.includes("ROYALTY") 
                      ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 text-yellow-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse py-4 text-lg rounded-[2rem]"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {msg.content.includes("ROYALTY") ? "👑" : "🤖"} {msg.content}
                  </div>
                ) : (
                  <div className={`flex gap-2 max-w-[85%] ${msg.userId === currentUser?.id ? "flex-row-reverse" : "flex-row"}`}>
                    {!msg.isSystem && (
                      <UserAvatar 
                        user={users.find(u => u.id === msg.userId) || { ...currentUser, id: msg.userId, username: msg.senderName } as any} 
                        size="sm" 
                      />
                    )}
                    <div className={`flex flex-col ${msg.userId === currentUser?.id ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-2">
                        {msg.senderName} • {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                      <div className={`px-4 py-2 rounded-2xl font-medium shadow-sm border ${
                        msg.userId === currentUser?.id 
                          ? "bg-primary text-primary-foreground border-primary rounded-tr-none" 
                          : "bg-card text-card-foreground border-border rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="rounded-2xl border-2 focus-visible:ring-primary h-12 font-medium"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-2xl h-12 w-12 shrink-0 shadow-lg active:scale-95 transition-transform"
          disabled={mutation.isPending}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
