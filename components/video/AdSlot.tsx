"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, SpinnerIcon } from "@/components/ui/Icons";
import type { LinearAd } from "@/lib/ads/vast";

interface AdSlotProps {
  ad: LinearAd;
  /** Called when the ad completes, is skipped, or fails. */
  onFinish: () => void;
  /** Fired once, when the creative genuinely starts playing. */
  onStarted?: () => void;
  /** "Ad break" heading suffix, e.g. "before the film". */
  contextLabel?: string;
}

/**
 * Plays one linear ad creative.
 *
 * Compliance notes (see lib/ads/config.ts for the full policy):
 *  - The slot is clearly labelled "Advertisement" and is never disguised as
 *    content or as a player control.
 *  - The only clickable elements are the viewer's own controls and a single,
 *    visible "Learn more" link. There are no invisible or overlapping click
 *    areas, no auto-clicks and no forced redirects.
 *  - The impression is reported once, from the video element's real `playing`
 *    event — never on render and never on a timer.
 *  - Any failure ends the break immediately, so advertising can never stop
 *    someone from watching.
 */
export function AdSlot({ ad, onFinish, onStarted, contextLabel }: AdSlotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // State, not a ref: the loading spinner has to disappear the moment the
  // creative starts, and a ref write does not re-render.
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(true);
  const [stalled, setStalled] = useState(false);

  const remaining =
    ad.durationSeconds > 0 ? Math.max(ad.durationSeconds - elapsed, 0) : null;
  const canSkip = elapsed >= ad.skipOffsetSeconds;

  const finish = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    onFinish();
  }, [onFinish]);

  // Autoplay is only allowed while muted, so the ad starts muted with an
  // obvious unmute control rather than being silently blocked.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setStalled(true));
  }, []);

  // If the creative never starts within 8 seconds, drop the break. The timer is
  // armed once per slot: `finish` is stable because AdLayer memoises onFinish.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!startedRef.current) finish();
    }, 8_000);
    return () => clearTimeout(timer);
  }, [finish]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-ink-900/80 px-3 py-2">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
          Advertisement
          {contextLabel ? (
            <span className="font-medium normal-case tracking-normal text-mist-500">
              {contextLabel}
            </span>
          ) : null}
        </span>

        <div className="flex items-center gap-2">
          {remaining !== null ? (
            <span className="text-[11px] text-mist-300" aria-live="off">
              {remaining}s
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = !video.muted;
              setMuted(video.muted);
            }}
            className="rounded-md border border-white/15 px-2 py-1 text-[11px] font-semibold text-mist-300 transition-colors hover:text-white"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={finish}
            disabled={!canSkip}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-mist-300 transition-colors enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canSkip ? (
              <>
                <CloseIcon width={12} height={12} />
                Skip ad
              </>
            ) : (
              `Skip in ${Math.max(ad.skipOffsetSeconds - elapsed, 0)}s`
            )}
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          className="h-full w-full object-contain"
          playsInline
          muted={muted}
          autoPlay
          preload="auto"
          onPlaying={() => {
            if (startedRef.current) return;
            startedRef.current = true;
            setStarted(true);
            setStalled(false);
            onStarted?.();
          }}
          onTimeUpdate={(event) =>
            setElapsed(Math.floor(event.currentTarget.currentTime))
          }
          onEnded={finish}
          onError={finish}
        />

        {!started && !stalled ? (
          <span className="absolute inset-0 flex items-center justify-center text-mist-500">
            <SpinnerIcon width={22} height={22} />
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-ink-900/80 px-3 py-2">
        <span className="truncate text-xs text-mist-500">{ad.title}</span>
        {ad.clickThroughUrl ? (
          <a
            href={ad.clickThroughUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={() => {
              // Only a real viewer click reaches here, so the provider's click
              // trackers are fired here and nowhere else.
              for (const url of ad.clickTrackingUrls.slice(0, 5)) {
                try {
                  void fetch(url, { method: "GET", mode: "no-cors", keepalive: true });
                } catch {
                  /* tracking must never break the UI */
                }
              }
            }}
            className="shrink-0 text-xs font-semibold text-brand-hover underline-offset-2 hover:underline"
          >
            Learn more
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default AdSlot;
