"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PlayIcon, SpinnerIcon } from "@/components/ui/Icons";
import { TextSkeleton } from "@/components/ui/LoadingSkeleton";
import { stillUrl } from "@/lib/tmdb/images";
import { episodeLabel, formatDate, formatRuntime } from "@/lib/utils/format";
import type { SeasonDetail, SeasonSummary } from "@/types/media";

interface SeasonEpisodesProps {
  tvId: number;
  seasons: SeasonSummary[];
  /** Server-rendered first season so episodes are visible without JS. */
  initialSeason: SeasonDetail | null;
}

/**
 * Season switcher + episode list. Each episode links straight to its watch page
 * (/watch/tv/{id}/{season}/{episode}), which is auth-protected by middleware.
 */
export function SeasonEpisodes({ tvId, seasons, initialSeason }: SeasonEpisodesProps) {
  const firstNumber = initialSeason?.seasonNumber ?? seasons[0]?.seasonNumber ?? 1;
  const [selected, setSelected] = useState(firstNumber);
  const [season, setSeason] = useState<SeasonDetail | null>(initialSeason);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // Guards against a slow response for a season the viewer already left.
  const requestId = useRef(0);

  const load = useCallback(
    async (seasonNumber: number) => {
      const id = requestId.current + 1;
      requestId.current = id;
      setLoading(true);
      setFailed(false);
      try {
        const response = await fetch(`/api/media/tv/${tvId}/season/${seasonNumber}`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = (await response.json()) as SeasonDetail;
        if (id !== requestId.current) return;
        setSeason(data);
      } catch {
        if (id !== requestId.current) return;
        setSeason(null);
        setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [tvId],
  );

  useEffect(() => {
    if (selected === initialSeason?.seasonNumber) {
      setSeason(initialSeason);
      setFailed(false);
      return;
    }
    void load(selected);
  }, [initialSeason, load, selected]);

  if (seasons.length === 0) return null;

  return (
    <section aria-labelledby="episodes-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="episodes-heading" className="section-title">
          Episodes
        </h2>
        <label className="flex items-center gap-2 text-xs text-mist-500">
          <span className="sr-only sm:not-sr-only">Season</span>
          <select
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
            className="field !w-auto !py-1.5 text-sm"
            aria-label="Select season"
          >
            {seasons.map((item) => (
              <option key={item.id} value={item.seasonNumber}>
                {item.name} ({item.episodeCount})
              </option>
            ))}
          </select>
          {loading ? <SpinnerIcon width={14} height={14} /> : null}
        </label>
      </div>

      {failed ? (
        <ErrorState
          title="Episodes unavailable"
          message="We could not load this season right now."
          onRetry={() => void load(selected)}
        />
      ) : loading && !season ? (
        <div className="card-surface p-4">
          <TextSkeleton lines={5} />
        </div>
      ) : season && season.episodes.length > 0 ? (
        <ol className="space-y-2.5">
          {season.episodes.map((episode) => {
            const still = stillUrl(episode.stillPath, "w500");
            const runtime = formatRuntime(episode.runtimeMinutes);
            return (
              <li
                key={episode.id}
                className="card-surface flex flex-col gap-3 p-3 transition-colors hover:border-brand/30 sm:flex-row"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-ink-700 sm:w-52">
                  {still ? (
                    <Image
                      src={still}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 208px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-mist-500">
                      No preview
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-semibold text-brand">
                      {episodeLabel(episode.seasonNumber, episode.episodeNumber)}
                    </span>
                    <h3 className="text-sm font-semibold text-mist-100">{episode.name}</h3>
                  </div>
                  <p className="mt-1 text-[11px] text-mist-500">
                    {formatDate(episode.airDate)}
                    {runtime ? ` · ${runtime}` : ""}
                  </p>
                  {episode.overview ? (
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-mist-300">
                      {episode.overview}
                    </p>
                  ) : null}
                  <Link
                    href={`/watch/tv/${tvId}/${episode.seasonNumber}/${episode.episodeNumber}`}
                    className="btn-primary mt-3 !px-3 !py-1.5 text-xs"
                  >
                    <PlayIcon width={13} height={13} />
                    Play episode
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-mist-500">
          No episode information for this season yet.
        </p>
      )}
    </section>
  );
}

export default SeasonEpisodes;
