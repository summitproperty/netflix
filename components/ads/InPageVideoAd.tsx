"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, SpinnerIcon } from "@/components/ui/Icons";
import { AD_CONFIG } from "@/config/ads";
import { requestNamedAd } from "@/lib/ads/request-named-ad";
import type { LinearAd } from "@/lib/ads/vast";
import { cn } from "@/lib/utils/cn";

interface InPageVideoAdProps {
  className?: string;
}

/**
 * In-page (in-flow) video ad — rendered inline in page content, never as an
 * overlay and never floating. Renders nothing until a creative resolves, and
 * renders nothing again the moment it fails, finishes, or is closed: no
 * reserved blank box, no layout shift on a stock deployment.
 */
export function InPageVideoAd({ className }: InPageVideoAdProps) {
  const config = AD_CONFIG.inPageVideo;
  const [ad, setAd] = useState<LinearAd | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!config.enabled) return;
    let cancelled = false;
    void requestNamedAd("inpage").then((resolved) => {
      if (!cancelled && resolved) setAd(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [config.enabled]);

  const dismiss = useCallback(() => setDismissed(true), []);

  if (!config.enabled || !ad || dismissed) return null;

  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className={cn("card-surface my-6 overflow-hidden rounded-xl border border-white/10", className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
          Advertisement
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close ad"
          className="rounded p-0.5 text-mist-300 transition-colors hover:text-white"
        >
          <CloseIcon width={12} height={12} />
        </button>
      </div>

      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          className="h-full w-full object-contain"
          playsInline
          muted={muted}
          autoPlay
          preload="auto"
          onPlaying={() => setStarted(true)}
          onEnded={dismiss}
          onError={dismiss}
        />
        {!started ? (
          <span className="absolute inset-0 flex items-center justify-center text-mist-500">
            <SpinnerIcon width={20} height={20} />
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
          className="text-[11px] font-semibold text-mist-300 transition-colors hover:text-white"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        {ad.clickThroughUrl ? (
          <a
            href={ad.clickThroughUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="text-[11px] font-semibold text-brand-hover underline-offset-2 hover:underline"
          >
            Learn more
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default InPageVideoAd;
