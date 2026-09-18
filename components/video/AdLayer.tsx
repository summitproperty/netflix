"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdSlot } from "@/components/video/AdSlot";
import { adConfig, buildAdSchedule, type AdCue } from "@/lib/ads/config";
import { getAdProvider, type AdBreak } from "@/lib/ads/providers";

interface AdLayerProps {
  /** TMDB runtime, used to place mid-rolls and the post-roll. */
  runtimeMinutes: number | null;
  /** True once the viewer has started the session (the player is mounted). */
  active: boolean;
  /**
   * Called with true while a pre-roll must finish before the title may start.
   * The player uses this to delay mounting the embed, so an ad and the feature
   * can never play at the same time.
   */
  onGateChange?: (blocked: boolean) => void;
  /** Called with true whenever this layer has any break on screen (pre/mid/post). */
  onBreakActive?: (active: boolean) => void;
  /** True while another player ad system (the opportunity layer) is showing a
   * break — pauses the session clock so the two can never overlap. */
  suppressed?: boolean;
}

/**
 * Break scheduler. Owns *when* an ad may appear; AdSlot owns how one plays.
 *
 * Honest limitation, stated here and in the README: the feature itself is a
 * third-party embed, so this layer cannot read its playhead. Elapsed session
 * time is used instead. Pre-rolls therefore gate the embed (accurate), while
 * mid- and post-rolls appear over the player and are always dismissible — they
 * never seize the screen and never redirect anywhere.
 */
export function AdLayer({
  runtimeMinutes,
  active,
  onGateChange,
  onBreakActive,
  suppressed = false,
}: AdLayerProps) {
  const [cues] = useState<AdCue[]>(() => buildAdSchedule(runtimeMinutes));
  const [cueIndex, setCueIndex] = useState(0);
  const [current, setCurrent] = useState<AdBreak | null>(null);
  const elapsed = useRef(0);
  const requesting = useRef(false);
  const provider = getAdProvider();

  const nextCue = cues[cueIndex] ?? null;
  // The gate must also cover the window where the pre-roll tag has been
  // requested but not yet resolved — otherwise the embed mounts, starts the
  // title, and is then torn down when the creative arrives.
  const gated =
    adConfig.enabled &&
    active &&
    (nextCue?.position === "preroll" || current?.cue.position === "preroll");

  useEffect(() => {
    onGateChange?.(gated);
  }, [gated, onGateChange]);

  useEffect(() => {
    onBreakActive?.(current !== null);
  }, [current, onBreakActive]);

  // Advance the session clock and open breaks as they come due.
  useEffect(() => {
    if (!adConfig.enabled || !active || suppressed || !nextCue) return;

    const controller = new AbortController();

    const openBreak = async (cue: AdCue) => {
      if (requesting.current) return;
      requesting.current = true;

      const resolved = await provider.requestBreak(cue, controller.signal);
      requesting.current = false;

      // No creative (or a failed request) simply retires the cue.
      if (!resolved) {
        setCueIndex((index) => index + 1);
        return;
      }
      setCurrent(resolved);
    };

    if (nextCue.offsetSeconds <= elapsed.current && !current) {
      void openBreak(nextCue);
      return () => controller.abort();
    }

    const timer = setInterval(() => {
      if (current) return;
      elapsed.current += 1;
      if (elapsed.current >= nextCue.offsetSeconds) {
        void openBreak(nextCue);
      }
    }, 1_000);

    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [active, current, nextCue, provider, suppressed]);

  // Stable identities: AdSlot arms its "creative never started" timer from
  // `onFinish`, so an inline arrow here would restart that timer on every
  // render and the timer would never fire.
  const handleFinish = useCallback(() => {
    setCurrent(null);
    setCueIndex((index) => index + 1);
  }, []);

  const handleStarted = useCallback(() => {
    if (current) provider.reportImpression(current.ad);
  }, [current, provider]);

  if (!current) return null;

  const contextLabel =
    current.cue.position === "preroll"
      ? "before the title"
      : current.cue.position === "postroll"
        ? "after the title"
        : "short break";

  return (
    <AdSlot
      // A fresh key per break resets the slot's own timers and elapsed counter.
      key={current.cue.id}
      ad={current.ad}
      contextLabel={contextLabel}
      onStarted={handleStarted}
      onFinish={handleFinish}
    />
  );
}

export default AdLayer;
