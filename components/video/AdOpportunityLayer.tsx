"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdSlot } from "@/components/video/AdSlot";
import {
  firstOpportunityDelaySeconds,
  isPastTailGuard,
  OPPORTUNITY_SAFETY_CEILING,
  repeatOpportunityDelaySeconds,
  slotForOpportunity,
} from "@/lib/ads/opportunity-schedule";
import { requestNamedAd } from "@/lib/ads/request-named-ad";
import type { LinearAd } from "@/lib/ads/vast";

interface AdOpportunityLayerProps {
  /** TMDB runtime, used only for the final-5-minute tail guard. */
  runtimeMinutes: number | null;
  /** True once the viewer has started the session. */
  active: boolean;
  /**
   * True while something else must hold the screen first (e.g. AdLayer's own
   * pre/mid/post-roll break). The session clock simply pauses — no
   * opportunity is ever dropped, it is just delayed. Keeps "maximum one
   * active player ad" true across the two schedulers combined.
   */
  suppressed?: boolean;
  /** Called with true whenever this layer has a break on screen. */
  onBreakActive?: (active: boolean) => void;
}

interface OpenBreak {
  index: number;
  ad: LinearAd;
}

/**
 * The player's video ad-opportunity breaks (config/ads.ts: slots.slot1-5,
 * cycled round-robin).
 *
 * Adaptive, event-driven timing: the first opportunity fires ~2-4 minutes
 * after the session starts; every opportunity after that fires ~6-8 minutes
 * after the PREVIOUS one actually closed (finished, was skipped, or failed
 * to load) — never a fixed schedule computed once, never a fixed exact
 * interval. No fixed maximum count: it keeps offering opportunities until
 * the final-5-minute tail guard blocks further ones (a high safety ceiling
 * exists only to stop a runaway loop, not as a product policy).
 *
 * Fully independent of the movie and of AdLayer's preroll/mid/post-roll VAST
 * system: it never gates or mounts/unmounts the embed, it only ever draws a
 * dismissible overlay on top of the frame — same as AdLayer's mid-rolls. An
 * "opportunity" is only ever an attempt; a failed or empty resolution simply
 * retires that attempt and the movie was never touched. At most one active
 * break at a time (this layer only ever holds a single `current`).
 */
export function AdOpportunityLayer({
  runtimeMinutes,
  active,
  suppressed = false,
  onBreakActive,
}: AdOpportunityLayerProps) {
  const [current, setCurrent] = useState<OpenBreak | null>(null);
  const elapsed = useRef(0);
  const opportunityIndex = useRef(0);
  const nextDueAt = useRef(firstOpportunityDelaySeconds());
  const requesting = useRef(false);

  useEffect(() => {
    onBreakActive?.(current !== null);
  }, [current, onBreakActive]);

  const scheduleNext = useCallback((fromSeconds: number) => {
    nextDueAt.current = fromSeconds + repeatOpportunityDelaySeconds();
  }, []);

  useEffect(() => {
    if (!active || suppressed || current) return;
    if (opportunityIndex.current >= OPPORTUNITY_SAFETY_CEILING) return;
    if (isPastTailGuard(elapsed.current, runtimeMinutes)) return;

    const controller = new AbortController();

    const openBreak = async () => {
      if (requesting.current) return;
      requesting.current = true;

      const index = opportunityIndex.current;
      opportunityIndex.current += 1;
      const ad = await requestNamedAd(slotForOpportunity(index), controller.signal);
      requesting.current = false;

      // No creative (or a failed request) simply retires this attempt; the
      // next one is still ~6-8 minutes out from right now, not from a fixed
      // schedule.
      if (!ad) {
        scheduleNext(elapsed.current);
        return;
      }
      setCurrent({ index, ad });
    };

    if (elapsed.current >= nextDueAt.current) {
      void openBreak();
      return () => controller.abort();
    }

    const timer = setInterval(() => {
      if (current) return;
      elapsed.current += 1;
      if (isPastTailGuard(elapsed.current, runtimeMinutes)) {
        clearInterval(timer);
        return;
      }
      if (elapsed.current >= nextDueAt.current) {
        void openBreak();
      }
    }, 1_000);

    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [active, suppressed, current, runtimeMinutes, scheduleNext]);

  // Stable identity: AdSlot arms a timer from onFinish, so this must not be
  // recreated every render. Covers finish, skip, and close alike — the next
  // countdown always starts fresh from here, whatever ended this break.
  const handleFinish = useCallback(() => {
    setCurrent(null);
    scheduleNext(elapsed.current);
  }, [scheduleNext]);

  if (!current) return null;

  return <AdSlot key={current.index} ad={current.ad} contextLabel="short break" onFinish={handleFinish} />;
}

export default AdOpportunityLayer;
