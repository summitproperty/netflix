"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { AlertIcon, CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils/cn";

/**
 * Tiny toast system: context provider + `useToast()`.
 * Announced politely to assistive tech and dismissible by keyboard.
 */

export type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 3800;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-2), { id, message, variant }]);
      setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        One live region for the stack. `aria-atomic="false"` + additions-only
        means a new toast is announced on its own instead of re-reading every
        visible toast, and the children carry no role of their own — a nested
        role="status" inside a live region is announced twice by some readers.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur animate-fade-up",
              item.variant === "success" &&
                "border-emerald-500/30 bg-emerald-950/85 text-emerald-100",
              item.variant === "error" &&
                "border-brand/40 bg-[#2a0a0f]/90 text-mist-100",
              item.variant === "info" && "border-white/10 bg-ink-800/95 text-mist-100",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {item.variant === "success" ? (
                <CheckIcon width={16} height={16} />
              ) : (
                <AlertIcon width={16} height={16} />
              )}
            </span>
            <p className="flex-1 leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded p-0.5 text-mist-500 transition-colors hover:text-mist-100"
              aria-label="Dismiss notification"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Falls back to a no-op outside the provider so components stay portable. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return context ?? { toast: () => undefined };
}
