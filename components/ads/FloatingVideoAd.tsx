"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon } from "@/components/ui/Icons";
import { AD_CONFIG } from "@/config/ads";
import { requestNamedAd } from "@/lib/ads/request-named-ad";
import type { LinearAd } from "@/lib/ads/vast";
import { cn } from "@/lib/utils/cn";

/** After the viewer closes it (or it finishes), wait this long before trying again. */
const COOLDOWN_MS = 6 * 60 * 1000;

/**
 * Small sticky/floating video ad anchored to a screen corner.
 *
 * Entirely independent of the movie player: it requests its own creative and
 * any failure (no tag configured, network error, blocked, empty response)
 * just means it never renders — nothing else on the page is affected.
 *
 * Closing it only dismisses the ad currently showing (policy: never disabled
 * for the session/title/site). After a cooldown it may request a fresh one.
 */
export function FloatingVideoAd() {
  const config = AD_CONFIG.floatingVideo;
  const [ad, setAd] = useState<LinearAd | null>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryLoad = useCallback(async () => {
    if (!config.enabled) return;
    const resolved = await requestNamedAd("floating");
    if (!mountedRef.current || !resolved) return;
    setAd(resolved);
    setVisible(true);
  }, [config.enabled]);

  useEffect(() => {
    mountedRef.current = true;
    void tryLoad();
    return () => {
      mountedRef.current = false;
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, [tryLoad]);

  useEffect(() => {
    if (!visible || !ad) return;
    const video = videoRef.current;
    if (!video) return;
    // Autoplay is only reliable while muted; if even that is blocked, just
    // hide this slot rather than show a stalled/broken frame.
    video.play().catch(() => setVisible(false));
  }, [visible, ad]);

  const scheduleRetry = useCallback(() => {
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => {
      if (mountedRef.current) void tryLoad();
    }, COOLDOWN_MS);
  }, [tryLoad]);

  const close = useCallback(() => {
    setVisible(false);
    setAd(null);
    scheduleRetry();
  }, [scheduleRetry]);

  if (!config.enabled || !visible || !ad) return null;

  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className={cn(
        "fixed bottom-4 z-40 w-[220px] overflow-hidden rounded-lg border border-white/10 bg-ink-900 shadow-card sm:w-[260px]",
        config.position === "bottom-left" ? "left-4" : "right-4",
      )}
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      <div className="flex items-center justify-between gap-2 bg-ink-900/95 px-2 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
          Sponsored
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close ad"
          className="rounded p-0.5 text-mist-300 transition-colors hover:text-white"
        >
          <CloseIcon width={12} height={12} />
        </button>
      </div>

      <video
        ref={videoRef}
        src={ad.mediaUrl}
        className="aspect-video w-full bg-black object-contain"
        playsInline
        muted={muted}
        autoPlay
        preload="auto"
        onEnded={close}
        onError={close}
      />

      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
          className="text-[10px] font-semibold text-mist-300 transition-colors hover:text-white"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        {ad.clickThroughUrl ? (
          <a
            href={ad.clickThroughUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="truncate text-[10px] font-semibold text-brand-hover underline-offset-2 hover:underline"
          >
            Learn more
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default FloatingVideoAd;
