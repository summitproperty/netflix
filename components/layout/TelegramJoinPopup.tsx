"use client";

import { useEffect, useState } from "react";

import { CloseIcon, TelegramIcon } from "@/components/ui/Icons";
import { TELEGRAM_POPUP_STORAGE_KEY, TELEGRAM_URL } from "@/lib/config/telegram";

/**
 * One-time Telegram join popup.
 *
 * - "Join Telegram"     -> opens TELEGRAM_URL in a new tab AND writes a
 *                          permanent dismissal to localStorage (same as
 *                          "Don't Show Again") — once someone has joined,
 *                          the popup never shows again on this browser/device.
 * - "Don't Show Again"  -> writes the same permanent dismissal without
 *                          opening the link.
 * - "X" (close)         -> hides the popup for this visit only. Nothing is
 *                          persisted, so it shows again on the next visit.
 *
 * Mounted once in the root layout. Runs entirely on the client: reading
 * localStorage during render would break server rendering, so visibility
 * starts `false` and is decided in an effect after mount.
 */
export function TelegramJoinPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(TELEGRAM_POPUP_STORAGE_KEY);
      if (dismissed !== "true") {
        setOpen(true);
      }
    } catch {
      // Storage unavailable (private mode, disabled storage, etc.) - fail
      // open so the popup still appears rather than silently erroring.
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const persistDismissal = () => {
    try {
      window.localStorage.setItem(TELEGRAM_POPUP_STORAGE_KEY, "true");
    } catch {
      // If storage can't be written, at least close it for this session.
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="telegram-popup-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-card animate-fade-up sm:p-7">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-mist-300 transition hover:bg-white/10 hover:text-mist-100"
        >
          <CloseIcon />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229ED9]/15 text-[#229ED9]">
            <TelegramIcon width={26} height={26} />
          </span>
          <h2 id="telegram-popup-title" className="text-lg font-semibold text-mist-100">
            Join our Telegram
          </h2>
          <p className="text-sm text-mist-300">
            Get the latest updates, new releases and announcements first.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={persistDismissal}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c8bc0]"
          >
            <TelegramIcon width={18} height={18} />
            Join Telegram
          </a>
          <button
            type="button"
            onClick={persistDismissal}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-mist-300 transition hover:bg-white/5 hover:text-mist-100"
          >
            Don&apos;t Show Again
          </button>
        </div>
      </div>
    </div>
  );
}
