"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { requestNamedAd } from "@/lib/ads/request-named-ad";
import type { NamedAdSlot } from "@/lib/ads/named-tags";
import { reportImpressions, type LinearAd } from "@/lib/ads/vast";

// Provider-safe cooldown before a slot with no fill tries again. Long enough
// to avoid a tight request loop, short enough that a slot recovers quickly
// once the provider has something to serve.
const NO_FILL_RETRY_MS = 60_000;

interface DockVideoSlotProps {
  slot: NamedAdSlot;
  ariaLabel: string;
}

/**
 * One video slot in the Browse Mode dock's stacked video row (three separate
 * instances of this component, each with its own `slot`).
 *
 * Fully self-contained and isolated: it requests its own creative, and when
 * that creative finishes (or fails to play at all) it — and only it —
 * requests the next one. No close button (Browse Mode dock policy); always
 * muted. A missing tag or a failed request just means this cell stays empty;
 * nothing else on the page is affected. Reports a legitimate impression pixel
 * exactly once per creative, only once playback actually starts.
 */
export function DockVideoSlot({ slot, ariaLabel }: DockVideoSlotProps) {
  const [ad, setAd] = useState<LinearAd | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards the impression pixel so it fires exactly once per creative, and
  // only once the browser actually reports the video playing — never on
  // load, never on render.
  const impressionFiredRef = useRef(false);

  const setAndPrepare = useCallback((resolved: LinearAd) => {
    impressionFiredRef.current = false;
    setAd(resolved);
  }, []);

  const load = useCallback(async () => {
    const resolved = await requestNamedAd(slot);
    if (!mountedRef.current) return;

    if (!resolved) {
      // No-fill: this slot alone retries later. Other slots are unaffected.
      retryTimer.current = setTimeout(() => {
        void load();
      }, NO_FILL_RETRY_MS);
      return;
    }
    setAndPrepare(resolved);
  }, [slot, setAndPrepare]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [load]);

  const advance = useCallback(() => {
    setAd(null);
    void load();
  }, [load]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ad) return;
    // Muted autoplay should always be permitted by the browser; if it's
    // blocked anyway, just move on to the next opportunity for this slot.
    video.play().catch(advance);
  }, [ad, advance]);

  const handlePlaying = useCallback(() => {
    if (impressionFiredRef.current || !ad) return;
    impressionFiredRef.current = true;
    // Legitimate impression: fired once, only now that the browser confirms
    // the creative is actually playing — never on load, never on render.
    reportImpressions(ad.impressionUrls);
  }, [ad]);

  if (!ad) return null;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative aspect-video max-h-14 w-full overflow-hidden rounded-md border border-white/5 bg-ink-900/60 sm:max-h-20"
    >
      <span className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-gold sm:text-[9px]">
        Sponsored
      </span>
      <video
        ref={videoRef}
        src={ad.mediaUrl}
        className="h-full w-full object-contain"
        playsInline
        muted
        autoPlay
        preload="auto"
        onPlaying={handlePlaying}
        onEnded={advance}
        onError={advance}
      />
    </div>
  );
}

export default DockVideoSlot;
