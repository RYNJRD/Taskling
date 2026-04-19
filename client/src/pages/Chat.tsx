import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Camera, X, Check, Image as ImageIcon, Palette } from "lucide-react";
import { api, buildUrl } from "../../shared/routes";
import type { Message, User } from "../../shared/schema";
import { useStore } from "../store/useStore";
import { apiFetch } from "../lib/apiFetch";
import { ScrollArea } from "../components/ui/scroll-area";
import { UserAvatar } from "../components/UserAvatar";
import { cn } from "../lib/utils";

export default function Chat() {
  const queryClient = useQueryClient();
  const { family, currentUser } = useStore();
  const [content, setContent] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New features state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [chatBg, setChatBg] = useState<string | null>(() => localStorage.getItem("chat_bg_preset"));
  const [showBgPicker, setShowBgPicker] = useState(false);

  const presets = [
    { id: "none", label: "Default", class: "bg-tab-chat" },
    { id: "purple", label: "Purple Haze", class: "bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-950 dark:to-purple-900" },
    { id: "peach", label: "Warm Peach", class: "bg-gradient-to-br from-orange-50 to-rose-100 dark:from-orange-950 dark:to-rose-900" },
    { id: "sky", label: "Sky Blue", class: "bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950 dark:to-indigo-900" },
    { id: "mint", label: "Soft Mint", class: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-900" },
    { id: "stars", label: "Night Stars", class: "bg-zinc-900 text-white" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setPreviewOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (!family || !currentUser || !selectedImage) return;
    sendMessage.mutate({
      familyId: family.id,
      userId: currentUser.id,
      senderName: currentUser.username,
      content: `[IMAGE:]${selectedImage}`
    });
    setPreviewOpen(false);
    setSelectedImage(null);
  };

  const selectBg = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      setChatBg(preset.class);
      localStorage.setItem("chat_bg_preset", preset.class);
    }
    setShowBgPicker(false);
  };


  const { data: users = [] } = useQuery<User[]>({
    queryKey: [buildUrl(api.families.getUsers.path, { id: family?.id || 0 })],
    enabled: !!family,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { id: family?.id || 0 })],
    enabled: !!family,
  });

  const sendMessage = useMutation({
    mutationFn: async (msg: { familyId: number; userId: number; senderName: string; content: string }) => {
      const res = await apiFetch(api.messages.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onMutate: async (msg) => {
      const queryKey = [buildUrl(api.messages.list.path, { id: msg.familyId })];
      const optimistic: Message = {
        id: Date.now() * -1,
        familyId: msg.familyId,
        userId: msg.userId,
        senderName: msg.senderName,
        content: msg.content,
        isSystem: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData<Message[]>(queryKey, (old = []) => [...old, optimistic]);
      return { queryKey };
    },
    onError: (_e, _v, ctx) => { if (ctx?.queryKey) queryClient.invalidateQueries({ queryKey: ctx.queryKey }); },
    onSuccess: (_r, _v, ctx) => { if (ctx?.queryKey) queryClient.invalidateQueries({ queryKey: ctx.queryKey }); setContent(""); },
  });

  useEffect(() => {
    if (!scrollRef.current || !shouldAutoScroll) return;
    const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, [messages, shouldAutoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const vp = e.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (!vp) return;
    setShouldAutoScroll(vp.scrollHeight - vp.scrollTop <= vp.clientHeight + 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !currentUser || !content.trim()) return;
    sendMessage.mutate({ familyId: family.id, userId: currentUser.id, senderName: currentUser.username, content: content.trim() });
  };

  return (
    <div className={cn("flex flex-col relative transition-colors duration-500", chatBg || "bg-tab-chat")} style={{ height: 'calc(100% - 5.5rem)' }}>
      
      {/* ── Background Picker Popover ── */}
      <AnimatePresence>
        {showBgPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBgPicker(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute bottom-0 inset-x-0 bg-card rounded-t-[2.5rem] p-6 pb-12 z-50 border-t-2 border-border shadow-2xl"
            >
              <h3 className="font-display text-xl font-bold mb-4">Choose Background</h3>
              <div className="grid grid-cols-3 gap-3">
                {presets.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => selectBg(p.id)}
                    className={cn(
                      "h-20 rounded-2xl border-2 flex items-center justify-center p-2 text-center text-[10px] font-bold transition-all",
                      p.class,
                      chatBg === p.class ? "border-primary scale-95" : "border-border"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Image Preview Modal ── */}
      <AnimatePresence>
        {previewOpen && selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-50 p-6 flex flex-col justify-center items-center"
          >
            <div className="relative max-w-full max-h-[80%] rounded-3xl overflow-hidden shadow-2xl">
              <img src={selectedImage} className="w-full h-full object-contain" alt="Preview" />
            </div>
            <div className="flex gap-4 mt-8 w-full max-w-md">
              <button 
                onClick={() => setPreviewOpen(false)}
                className="flex-1 h-16 rounded-3xl bg-white/10 text-white font-bold flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" /> Cancel
              </button>
              <button 
                onClick={handleSendImage}
                className="flex-1 h-16 rounded-3xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-transform"
              >
                <Check className="w-5 h-5" /> Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-2"
          >
            <button className="absolute top-10 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20">
              <X className="w-6 h-6" />
            </button>
            <img src={lightboxImage} className="max-w-full max-h-full object-contain" alt="Zoomed" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex-none px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b-2 border-slate-200/80 dark:border-slate-800/60 bg-card/95 dark:bg-zinc-950/95 backdrop-blur-md z-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Family Chat</h1>
              <p className="text-xs text-muted-foreground font-semibold">
                {users.length > 0 ? `${users.length} members` : "Keep the family in sync"}
              </p>
            </div>
          </div>
          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5 hidden sm:flex">
              {users.slice(0, 3).map((u) => (
                <div key={u.id} className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-primary/10">
                  <UserAvatar user={u} size="sm" />
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setShowBgPicker(true)}
              className="w-10 h-10 rounded-2xl bg-muted/50 border-2 border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors active:scale-95"
            >
              <Palette className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef} onScroll={handleScroll}>
        <div className="flex flex-col py-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isMe = message.userId === currentUser?.id;
              const sender = users.find((u) => u.id === message.userId);

              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

              const isSameAsPrev = prevMsg && 
                prevMsg.userId === message.userId && 
                !prevMsg.isSystem && !message.isSystem &&
                (new Date(message.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 2 * 60 * 1000);

              const hasNextSame = nextMsg && 
                nextMsg.userId === message.userId && 
                !nextMsg.isSystem && !message.isSystem &&
                (new Date(nextMsg.createdAt).getTime() - new Date(message.createdAt).getTime() < 2 * 60 * 1000);

              const marginTopClass = index === 0 ? "" : (isSameAsPrev ? "mt-1" : "mt-4");

              if (message.isSystem) {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-3"
                  >
                    <div className="px-5 py-2 rounded-2xl text-[11px] font-bold text-muted-foreground bg-card/80 border-2 border-slate-300/60 dark:border-slate-700/60 text-center max-w-[85%] shadow-sm">
                      {message.content}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={cn("flex gap-2 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto", marginTopClass)}
                >
                  {/* Avatar or Spacer */}
                  <div className="flex-shrink-0 self-end mb-1 w-8 flex justify-center">
                    {!hasNextSame && (
                      <UserAvatar
                        user={sender || ({ ...currentUser!, id: message.userId, username: message.senderName } as User)}
                        size="sm"
                      />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start")}>
                    {!isSameAsPrev && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">
                        {isMe ? "You" : message.senderName} · {format(new Date(message.createdAt), "HH:mm")}
                      </span>
                    )}
                    <div className={cn(
                      "text-sm font-medium shadow-sm leading-relaxed max-w-full break-all whitespace-pre-wrap overflow-hidden",
                      message.content.startsWith("[IMAGE:]") ? "p-1 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl" :
                      isMe
                        ? "bg-primary text-primary-foreground shadow-primary/20 border border-primary/80 rounded-2xl " + (hasNextSame ? "rounded-br-2xl " : "rounded-br-md ") + (isSameAsPrev ? "rounded-tr-md " : "")
                        : "bg-card text-card-foreground border-2 border-slate-300/70 dark:border-slate-700/70 rounded-2xl " + (hasNextSame ? "rounded-bl-2xl " : "rounded-bl-md ") + (isSameAsPrev ? "rounded-tl-md " : "")
                    )}>
                      {message.content.startsWith("[IMAGE:]") ? (
                        <div 
                          onClick={() => setLightboxImage(message.content.replace("[IMAGE:]", ""))}
                          className="relative group cursor-pointer"
                        >
                          <img 
                            src={message.content.replace("[IMAGE:]", "")} 
                            className="max-w-[220px] max-h-[300px] rounded-xl object-cover"
                            alt="Sent" 
                          />
                        </div>
                      ) : (
                        <div className="px-4 py-2.5">{message.content}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center flex-1 py-20 text-center">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 inner-shadow">
                <span className="text-6xl text-primary">🐧</span>
              </div>
              <p className="font-display text-2xl font-bold mb-2 text-foreground">Quiet in here!</p>
              <p className="text-sm text-muted-foreground font-medium w-64 max-w-full mx-auto">Say hi to your family or drop a quick emoji to get started.</p>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* ── Floating input bar ── */}
      <div className={cn(
        "flex-none px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t transition-all z-20 relative",
        chatBg ? "bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/10" : "border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-zinc-950/95 shadow-[0_-8px_30px_rgba(0,0,0,0.03)]"
      )}>
        <form onSubmit={handleSend} className="flex gap-2 max-w-2xl mx-auto items-center">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-muted/80 border-2 border-slate-300/50 flex items-center justify-center text-muted-foreground transition-all active:scale-90"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <motion.div
            animate={isFocused ? { boxShadow: "0 0 0 2px rgb(139 92 246 / 0.4)" } : { boxShadow: "0 0 0 0px transparent" }}
            className="flex-1 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-card shadow-sm transition-colors relative"
          >
            <input
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type a message…"
              className="w-full h-12 px-4 bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 outline-none"
            />
          </motion.div>
          <motion.button
            type="submit"
            disabled={sendMessage.isPending || !content.trim()}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md border-2",
              content.trim()
                ? "bg-primary text-primary-foreground shadow-primary/30 border-primary/80 active:scale-95"
                : "bg-muted text-muted-foreground border-slate-300 dark:border-slate-600",
            )}
          >
            <motion.div animate={content.trim() ? { rotate: -30 } : { rotate: 0 }} transition={{ type: "spring", stiffness: 400 }}>
              <Send className="w-[18px] h-[18px]" />
            </motion.div>
          </motion.button>
        </form>
      </div>
    </div>
  );
}
