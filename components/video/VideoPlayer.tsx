"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdLayer } from "@/components/video/AdLayer";
import { AdOpportunityLayer } from "@/components/video/AdOpportunityLayer";
import { AlertIcon, SpinnerIcon } from "@/components/ui/Icons";
import { adConfig, describeAdPolicy } from "@/lib/ads/config";
import { publicEnv } from "@/lib/config/env";
import { cn } from "@/lib/utils/cn";
import { saveWatchProgressAction } from "@/lib/watch-progress/actions";
import type { VideoSource } from "@/lib/video/types";
import type { MediaType } from "@/types/tmdb";

/** Identifies which title/episode to save Continue Watching progress against. */
export interface ProgressKey {
  mediaType: MediaType;
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface VideoPlayerProps {
  /** Null when the configured provider cannot serve this title. */
  source: VideoSource | null;
  title: string;
  /** TMDB runtime, only used to schedule ad breaks. */
  runtimeMinutes?: number | null;
  /** Shown under the frame, e.g. "S02E04 · The Reckoning". */
  subtitle?: string;
  className?: string;
  /**
   * Enables Continue Watching persistence for this title (see
   * saveWatchProgressAction). Omit to leave it off, e.g. for a preview
   * player. Also gated by NEXT_PUBLIC_WATCH_PROGRESS_ENABLED, so this prop
   * alone does not turn the feature on for a deployment that has it off.
   */
  progressKey?: ProgressKey;
}

const LOAD_TIMEOUT_MS = 15_000;
// How often the (approximate — see the note below) elapsed watch time is
// saved. Deliberately not aggressive: this is a "recently watched" signal,
// not a scrubber position, so infrequent saves are enough and keep this
// well inside the "no unnecessary database requests" budget.
const PROGRESS_SAVE_INTERVAL_SECONDS = 20;

/**
 * Responsive 16:9 embed with loading, error and "video unavailable" states.
 *
 * The stream is always a third-party embed rendered in a sandboxed iframe: no
 * video file is ever downloaded, cached, mirrored or re-served by this app. We
 * cannot read the embed's playhead (cross-origin by design), which is why the
 * error state is time-based, the ad layer works on session time, and — when
 * `progressKey` is set — Continue Watching progress is also an elapsed-time
 * approximation rather than a real resume position (see saveWatchProgressAction
 * and services/watch-progress.service.ts for the full explanation).
 */
export function VideoPlayer({
  source,
  title,
  runtimeMinutes = null,
  subtitle,
  className,
  progressKey,
}: VideoPlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Start gated whenever a pre-roll is even possible, so the embed cannot mount
  // for a frame before AdLayer reports that a break is pending.
  const [adGate, setAdGate] = useState(adConfig.enabled && adConfig.preroll);
  // Cross-suppression so AdLayer (preroll/mid/post) and AdOpportunityLayer
  // (the 6-9 minute opportunity breaks) can never both hold a break at once —
  // "maximum one active player ad" applies across the two schedulers combined.
  const [adLayerBusy, setAdLayerBusy] = useState(false);
  const [opportunityBusy, setOpportunityBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const adNotice = describeAdPolicy();

  // The 15s "not responding" window must not run while an ad is holding the
  // frame: the embed has not been asked to load yet. Clearing `adGate` re-runs
  // this effect, which starts a fresh window at the moment the embed mounts.
  useEffect(() => {
    if (!source || loaded || adGate) return;
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [adGate, attempt, loaded, source]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Continue Watching: while the embed is actually mounted (not during a
  // pending ad, not before it has loaded), periodically save elapsed session
  // time as an approximate watch position. One best-effort final save fires
  // on unmount too, though a hard navigation can still race past it — the
  // periodic saves are what keep this reasonably fresh either way.
  useEffect(() => {
    if (!publicEnv.watchProgressEnabled || !progressKey || !loaded) return;

    const key = progressKey;
    const elapsed = { current: 0 };
    const durationSeconds = runtimeMinutes ? runtimeMinutes * 60 : null;

    const save = () => {
      void saveWatchProgressAction({
        mediaType: key.mediaType,
        tmdbId: key.tmdbId,
        seasonNumber: key.seasonNumber,
        episodeNumber: key.episodeNumber,
        positionSeconds: elapsed.current,
        durationSeconds,
      });
    };

    const timer = setInterval(() => {
      elapsed.current += 1;
      if (elapsed.current % PROGRESS_SAVE_INTERVAL_SECONDS === 0) save();
    }, 1_000);

    return () => {
      clearInterval(timer);
      if (elapsed.current > 0) save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- progressKey's
    // fields are primitives read once per mount; re-keying on the object
    // identity would restart the timer every render.
  }, [loaded, publicEnv.watchProgressEnabled, progressKey?.mediaType, progressKey?.tmdbId, progressKey?.seasonNumber, progressKey?.episodeNumber, runtimeMinutes]);

  const retry = useCallback(() => {
    setLoaded(false);
    setTimedOut(false);
    setAttempt((value) => value + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const node = frameRef.current;
    if (!node) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    // Not every browser (or embedded webview) allows this; failing is harmless
    // because the embed keeps its own fullscreen control.
    void node.requestFullscreen?.().catch(() => undefined);
  }, []);

  if (!source) {
    return (
      <div
        role="alert"
        className={cn(
          "card-surface flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center",
          className,
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
          <AlertIcon width={22} height={22} />
        </span>
        <h2 className="text-lg font-semibold text-mist-100">Video unavailable</h2>
        <p className="max-w-md text-sm leading-relaxed text-mist-500">
          {title} cannot be streamed right now. The source may not carry this
          title yet, or streaming has been turned off for this deployment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={frameRef}
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-card",
          fullscreen && "rounded-none border-0",
        )}
      >
        {/* The embed only mounts once no pre-roll is pending, so an ad and the
            feature can never play over each other. */}
        {!adGate ? (
          <iframe
            key={attempt}
            src={source.embedUrl}
            title={`${title} player`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen={source.allowFullscreen}
            referrerPolicy={source.referrerPolicy}
           sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            loading="eager"
            onLoad={() => {
              setLoaded(true);
              setTimedOut(false);
            }}
          />
        ) : null}

        {!loaded && !timedOut && !adGate ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/80 text-mist-500">
            <SpinnerIcon width={26} height={26} />
            <p className="text-xs">Starting {title}…</p>
          </div>
        ) : null}

        {timedOut && !loaded ? (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900/92 px-6 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
              <AlertIcon width={22} height={22} />
            </span>
            <h2 className="text-base font-semibold text-mist-100">
              The player is not responding
            </h2>
            <p className="max-w-sm text-xs leading-relaxed text-mist-500">
              The stream did not start in time. This is usually temporary — try
              again, or come back in a few minutes.
            </p>
            <button type="button" onClick={retry} className="btn-primary">
              Try again
            </button>
          </div>
        ) : null}

        <AdLayer
          runtimeMinutes={runtimeMinutes}
          active
          onGateChange={setAdGate}
          onBreakActive={setAdLayerBusy}
          suppressed={opportunityBusy}
        />

        {/* The player's ad-opportunity breaks (config/ads.ts, cycled slot1-5).
            Separate schedule and separate tags from AdLayer above; paused
            (not dropped) while a break from AdLayer is holding the screen so
            the two never stack — at most one player ad is ever active. */}
        <AdOpportunityLayer
          runtimeMinutes={runtimeMinutes}
          active
          suppressed={adGate || adLayerBusy}
          onBreakActive={setOpportunityBusy}
        />

        {/* In fullscreen only this subtree is painted, so the exit control has
            to live inside it — the meta row below the frame is off-screen. */}
        {fullscreen ? (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-3 top-3 z-30 rounded-md border border-white/20 bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-mist-100 transition-colors hover:bg-ink-900"
          >
            Exit fullscreen
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-mist-500">
        <span className="truncate">
          {subtitle ? `${subtitle} · ` : ""}
          Source: {source.providerLabel}
        </span>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md border border-white/10 px-2.5 py-1 font-semibold text-mist-300 transition-colors hover:text-white"
        >
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>

      {adConfig.enabled && adNotice ? (
        <p className="mt-1 text-[11px] text-mist-500">{adNotice}</p>
      ) : null}
    </div>
  );
}

export default VideoPlayer;
