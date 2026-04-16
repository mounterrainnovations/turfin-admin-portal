"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { ToastItem, ToastOptions, ToastTone } from "./types";

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<
  ToastTone,
  {
    accent: string;
    badge: string;
    ring: string;
    icon: React.ComponentType<{ size?: number; className?: string; weight?: "fill" | "regular" | "bold" }>;
  }
> = {
  success: {
    accent: "#8a9e60",
    badge: "bg-[#8a9e60]/10 text-[#5f7338]",
    ring: "shadow-[0_14px_40px_rgba(74,94,40,0.18)]",
    icon: CheckCircle,
  },
  error: {
    accent: "#b05252",
    badge: "bg-red-50 text-red-700",
    ring: "shadow-[0_14px_40px_rgba(176,82,82,0.18)]",
    icon: XCircle,
  },
  info: {
    accent: "#4f6b8a",
    badge: "bg-slate-100 text-slate-700",
    ring: "shadow-[0_14px_40px_rgba(79,107,138,0.18)]",
    icon: Info,
  },
  warning: {
    accent: "#c4953a",
    badge: "bg-amber-50 text-amber-700",
    ring: "shadow-[0_14px_40px_rgba(196,149,58,0.18)]",
    icon: WarningCircle,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, any>>({});

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const toast: ToastItem = {
        id,
        tone: "info",
        durationMs: 4200,
        ...options,
      };

      setToasts((current) => [...current, toast]);

      timersRef.current[id] = window.setTimeout(() => {
        dismissToast(id);
      }, toast.durationMs);

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of Object.values(timers)) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.tone ?? "info"];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`toast-enter pointer-events-auto overflow-hidden rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl ${style.ring}`}
            >
              <div className="h-1 w-full" style={{ backgroundColor: style.accent }} />
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.badge}`}
                >
                  <Icon size={18} weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-gray-900">
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {toast.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
                  aria-label="Dismiss notification"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
