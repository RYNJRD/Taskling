import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { Message, User } from "@shared/schema";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiFetch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

export default function Chat() {
  const queryClient = useQueryClient();
  const { family, currentUser } = useStore();
  const [content, setContent] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: [buildUrl(api.families.getUsers.path, { id: family?.id || 0 })],
    enabled: !!family,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { id: family?.id || 0 })],
    enabled: !!family,
  });

  const sendMessage = useMutation({
    mutationFn: async (newMessage: { familyId: number; userId: number; senderName: string; content: string }) => {
      const res = await apiFetch(api.messages.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onMutate: async (newMessage) => {
      const queryKey = [buildUrl(api.messages.list.path, { id: newMessage.familyId })];
      const optimisticMessage: Message = {
        id: Date.now() * -1,
        familyId: newMessage.familyId,
        userId: newMessage.userId,
        senderName: newMessage.senderName,
        content: newMessage.content,
        isSystem: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, optimisticMessage]);
      return { queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
    onSuccess: (_result, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
      setContent("");
    },
  });

  useEffect(() => {
    if (!scrollRef.current || !shouldAutoScroll) return;
    const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      (viewport as HTMLElement).scrollTop = (viewport as HTMLElement).scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (!viewport) return;
    const isAtBottom = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + 100;
    setShouldAutoScroll(isAtBottom);
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!family || !currentUser || !content.trim()) return;
    sendMessage.mutate({
      familyId: family.id,
      userId: currentUser.id,
      senderName: currentUser.username,
      content: content.trim(),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto p-4 bg-background relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Family Chat</h1>
          <p className="text-muted-foreground font-medium">Keep the family in sync.</p>
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

      <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef} onScroll={handleScroll}>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${message.isSystem ? "items-center" : message.userId === currentUser?.id ? "items-end" : "items-start"}`}
              >
                {message.isSystem ? (
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-bold border flex items-center gap-2 max-w-[90%] mx-auto text-center justify-center",
                      message.content.includes("ROYALTY")
                        ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 text-yellow-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] py-4 text-lg rounded-[2rem]"
                        : "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    {message.content.includes("ROYALTY") ? "👑" : "🤖"} {message.content}
                  </div>
                ) : (
                  <div className={`flex gap-2 max-w-[85%] ${message.userId === currentUser?.id ? "flex-row-reverse" : "flex-row"}`}>
                    <UserAvatar
                      user={users.find((user) => user.id === message.userId) || ({ ...currentUser, id: message.userId, username: message.senderName } as User)}
                      size="sm"
                    />
                    <div className={`flex flex-col ${message.userId === currentUser?.id ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-2">
                        {message.senderName} • {format(new Date(message.createdAt), "HH:mm")}
                      </span>
                      <div
                        className={`px-4 py-2 rounded-2xl font-medium shadow-sm border ${
                          message.userId === currentUser?.id
                            ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
                            : "bg-card text-card-foreground border-border rounded-tl-none"
                        }`}
                      >
                        {message.content}
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
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message..."
          className="rounded-2xl border-2 focus-visible:ring-primary h-12 font-medium"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-2xl h-12 w-12 shrink-0 shadow-lg active:scale-95 transition-transform"
          disabled={sendMessage.isPending}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
