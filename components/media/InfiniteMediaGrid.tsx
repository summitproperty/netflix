"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MediaGrid } from "@/components/media/MediaGrid";
import { GridSkeleton } from "@/components/ui/LoadingSkeleton";
import { SpinnerIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import type { MediaItem, MediaType, PagedMedia } from "@/types/media";

interface InfiniteMediaGridProps {
  initial: PagedMedia;
  mediaType: MediaType;
  /** Sort key accepted by /api/media/browse (popular, top_rated, ...). */
  sort: string;
  /** Restrict to a TMDB genre id (used by /genres/[mediaType]/[id]). */
  genreId?: number;
  /** Hard ceiling so a bad scroll loop cannot hammer the API. */
  maxPages?: number;
}

/**
 * Grid that appends further pages from the server API route. Auto-loads when the
 * sentinel scrolls into view, and always keeps a manual button as a fallback for
 * keyboard users and browsers without IntersectionObserver.
 */
export function InfiniteMediaGrid({
  initial,
  mediaType,
  sort,
  genreId,
  maxPages = 20,
}: InfiniteMediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const seen = useRef(
    new Set(initial.items.map((item) => `${item.mediaType}-${item.id}`)),
  );
  const sentinel = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const lastPage = Math.min(initial.totalPages, maxPages);
  const hasMore = page < lastPage;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setFailed(false);

    const next = page + 1;
    const params = new URLSearchParams({
      type: mediaType,
      sort,
      page: String(next),
    });
    if (genreId) params.set("genre", String(genreId));

    try {
      const response = await fetch(`/api/media/browse?${params.toString()}`);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const data = (await response.json()) as PagedMedia;
      const fresh = data.items.filter((item) => {
        const key = `${item.mediaType}-${item.id}`;
        if (seen.current.has(key)) return false;
        seen.current.add(key);
        return true;
      });

      setItems((current) => [...current, ...fresh]);
      setPage(next);
    } catch {
      setFailed(true);
      toast("Could not load more titles. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [genreId, hasMore, loading, mediaType, page, sort, toast]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || failed) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [failed, hasMore, loadMore]);

  return (
    <div>
      <MediaGrid items={items} priorityCount={6} />

      {loading ? (
        <div className="mt-4">
          <GridSkeleton count={7} />
        </div>
      ) : null}

      <div ref={sentinel} className="h-px w-full" aria-hidden="true" />

      <div className="mt-6 flex flex-col items-center gap-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? <SpinnerIcon width={16} height={16} /> : null}
            {loading ? "Loading" : failed ? "Retry" : "Load more"}
          </button>
        ) : (
          <p className="text-xs text-mist-500">
            {items.length > 0 ? "You have reached the end of this list." : null}
          </p>
        )}
        <p className="text-[11px] text-mist-500" aria-live="polite">
          Showing {items.length} titles
        </p>
      </div>
    </div>
  );
}

export default InfiniteMediaGrid;
