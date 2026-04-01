import * as ToastPrimitives from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function ToastIcon({ variant }: { variant?: string }) {
  if (variant === "destructive") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-400" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
      <CheckCircle2 className="h-4 w-4 text-violet-300" />
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastPrimitives.Provider swipeDirection="up" swipeThreshold={20}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <ToastPrimitives.Root
          key={id}
          {...props}
          className={cn(
            "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
            "rounded-2xl p-4 shadow-2xl",
            "border border-white/[0.08]",
            "backdrop-blur-xl",
            // slide in from bottom, swipe up to dismiss
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-6 data-[state=open]:fade-in-0 data-[state=open]:duration-300",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200",
            "data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:transition-none",
            "data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out]",
            "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-top-full data-[swipe=end]:duration-200",
            variant === "destructive"
              ? "bg-red-950/90 shadow-red-950/40"
              : "bg-gray-950/90 shadow-gray-950/40",
          )}
        >
          {/* Colored left accent line */}
          <div
            className={cn(
              "absolute left-0 top-3 bottom-3 w-1 rounded-full",
              variant === "destructive" ? "bg-red-500" : "bg-violet-500",
            )}
          />

          {/* Icon */}
          <div className="ml-2">
            <ToastIcon variant={variant} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            {title && (
              <ToastPrimitives.Title className="text-sm font-bold text-white leading-snug">
                {title}
              </ToastPrimitives.Title>
            )}
            {description && (
              <ToastPrimitives.Description
                className={cn(
                  "text-xs leading-relaxed mt-0.5",
                  variant === "destructive" ? "text-red-200/80" : "text-white/60",
                )}
              >
                {description}
              </ToastPrimitives.Description>
            )}
          </div>

          {action}

          {/* Close button */}
          <ToastPrimitives.Close
            className="shrink-0 rounded-full p-1.5 text-white/30 hover:text-white/80 hover:bg-white/10 transition-all"
            toast-close=""
          >
            <X className="h-3.5 w-3.5" />
          </ToastPrimitives.Close>
        </ToastPrimitives.Root>
      ))}

      {/* Viewport: bottom-center, safe distance from edges */}
      <ToastPrimitives.Viewport className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col gap-2 w-[min(calc(100vw-2rem),400px)] outline-none" />
    </ToastPrimitives.Provider>
  );
}
