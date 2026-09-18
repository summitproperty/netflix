import type { NamedAdSlot } from "@/lib/ads/named-tags";

/**
 * Timing helpers for the player's video ad-opportunity breaks, separate from
 * the preroll/mid/post-roll VAST system in lib/ads/config.ts.
 *
 * Rules:
 *  - First opportunity: a random delay of ~2-4 minutes after the session
 *    starts.
 *  - Every opportunity after that: a random delay of ~6-8 minutes, counted
 *    from when the PREVIOUS break actually closed (finished, was skipped, or
 *    failed) — not from a fixed schedule computed once at the start. This is
 *    an adaptive, event-driven cycle, never a fixed exact interval.
 *  - Never a new opportunity inside the final 5 minutes of the title.
 *  - NO fixed maximum opportunity count: short titles naturally get fewer,
 *    long titles get correspondingly more — purely a function of duration
 *    and the tail guard. A high technical safety ceiling exists only to stop
 *    a runaway loop; it is not a product policy.
 *  - The 5 tags configured in config/ads.ts (slots.slot1-5) are cycled
 *    round-robin across however many opportunities the title's duration
 *    produces.
 *  - Playback position is approximated from elapsed session time, the same
 *    approach AdLayer already uses, because the player is a cross-origin
 *    third-party embed whose real playhead this app cannot read — the tail
 *    guard is only ever applied against the known TMDB runtime (or a
 *    conservative fallback when that's missing), never an invented duration.
 */

const FIRST_MIN_MINUTES = 2;
const FIRST_MAX_MINUTES = 4;
const REPEAT_MIN_MINUTES = 6;
const REPEAT_MAX_MINUTES = 8;
const TAIL_GUARD_MINUTES = 5;
const FALLBACK_RUNTIME_MINUTES = 100;
// Runaway-loop safety net only — not a product limit on ad count.
export const OPPORTUNITY_SAFETY_CEILING = 200;

const SLOT_ORDER: NamedAdSlot[] = ["slot1", "slot2", "slot3", "slot4", "slot5"];

function randomBetweenMinutes(minMinutes: number, maxMinutes: number): number {
  return minMinutes + Math.random() * (maxMinutes - minMinutes);
}

/** Random ~2-4 minute delay before the first opportunity of a session. */
export function firstOpportunityDelaySeconds(): number {
  return Math.round(randomBetweenMinutes(FIRST_MIN_MINUTES, FIRST_MAX_MINUTES) * 60);
}

/** Random ~6-8 minute delay after a break closes, before the next one is due. */
export function repeatOpportunityDelaySeconds(): number {
  return Math.round(randomBetweenMinutes(REPEAT_MIN_MINUTES, REPEAT_MAX_MINUTES) * 60);
}

/**
 * True once `elapsedSeconds` has entered the final 5 minutes of the title.
 * Falls back to a conservative estimated runtime when the real one is
 * unknown (the same approach used elsewhere in this app), rather than
 * skipping the guard altogether.
 */
export function isPastTailGuard(
  elapsedSeconds: number,
  runtimeMinutes: number | null | undefined,
): boolean {
  const runtime = runtimeMinutes && runtimeMinutes > 0 ? runtimeMinutes : FALLBACK_RUNTIME_MINUTES;
  const cutoffSeconds = Math.max(runtime - TAIL_GUARD_MINUTES, 0) * 60;
  return elapsedSeconds >= cutoffSeconds;
}

/** Round-robins through the 5 configured tag slots for opportunity #`index` (0-based). */
export function slotForOpportunity(index: number): NamedAdSlot {
  return SLOT_ORDER[index % SLOT_ORDER.length];
}
