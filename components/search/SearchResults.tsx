"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MediaGrid } from "@/components/media/MediaGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchIcon, SpinnerIcon } from "@/components/ui/Icons";
import { GridSkeleton } from "@/components/ui/LoadingSkeleton";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import type { MediaItem, PagedMedia } from "@/types/media";

interface SearchResultsProps {
  query: string;
}

type Filter = "multi" | "movie" | "tv";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "multi", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

const MAX_PAGES = 20;

/**
 * Client-side search results. Talks to /api/media/search (a narrow server route)
 * so the TMDB credentials never reach the browser.
 */
export function SearchResults({ query }: SearchResultsProps) {
  const [filter, setFilter] = useState<Filter>("multi");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "paging" | "error" | "ready">(
    "idle",
  );
  const seen = useRef(new Set<string>());
  const sentinel = useRef<HTMLDivElement>(null);
  // Monotonic request id: typing quickly, or switching filter mid-flight, must
  // not let a slow earlier response overwrite a newer one.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (query.trim().length === 0) return;
      const id = requestId.current + 1;
      requestId.current = id;
      setStatus(replace ? "loading" : "paging");

      const params = new URLSearchParams({
        q: query,
        page: String(nextPage),
        type: filter,
      });

      try {
        const response = await fetch(`/api/media/search?${params.toString()}`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = (await response.json()) as PagedMedia;
        if (id !== requestId.current) return;

        if (replace) seen.current = new Set();
        const fresh = data.items.filter((item) => {
          const key = `${item.mediaType}-${item.id}`;
          if (seen.current.has(key)) return false;
          seen.current.add(key);
          return true;
        });

        setItems((current) => (replace ? fresh : [...current, ...fresh]));
        setPage(data.page);
        setTotalPages(Math.min(data.totalPages, MAX_PAGES));
        setTotalResults(data.totalResults);
        setStatus("ready");
      } catch {
        if (id !== requestId.current) return;
        setStatus("error");
      }
    },
    [filter, query],
  );

  useEffect(() => {
    setItems([]);
    setPage(0);
    void fetchPage(1, true);
  }, [fetchPage]);

  const hasMore = page > 0 && page < totalPages;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || status !== "ready" || !hasMore) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchPage(page + 1, false);
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, page, status]);

  if (query.trim().length === 0) {
    return (
      <EmptyState
        title={`Search ${siteConfig.name}`}
        message="Type a movie or TV show name to get started. Try a title, a franchise or a character."
        icon={<SearchIcon width={22} height={22} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Result type">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === option.value
                  ? "bg-brand text-white"
                  : "border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {status === "ready" && totalResults > 0 ? (
          <p className="text-xs text-mist-500" aria-live="polite">
            {totalResults.toLocaleString("en-US")} results for &ldquo;{query}&rdquo;
          </p>
        ) : null}
      </div>

      {status === "loading" ? <GridSkeleton count={14} /> : null}

      {status === "error" ? (
        <ErrorState
          title="Search failed"
          message="We could not reach the catalog. Check your connection and try again."
          onRetry={() => void fetchPage(1, true)}
        />
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <EmptyState
          title="No results found"
          message={`Nothing matched "${query}". Try a different spelling, a shorter title, or browse by genre instead.`}
          icon={<SearchIcon width={22} height={22} />}
          action={{ href: "/genres", label: "Browse genres" }}
        />
      ) : null}

      {items.length > 0 ? <MediaGrid items={items} priorityCount={6} /> : null}

      {status === "paging" ? (
        <div className="mt-4">
          <GridSkeleton count={7} />
        </div>
      ) : null}

      <div ref={sentinel} className="h-px w-full" aria-hidden="true" />

      {hasMore && (status === "ready" || status === "paging") ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void fetchPage(page + 1, false)}
            disabled={status === "paging"}
            className="btn-secondary"
          >
            {status === "paging" ? <SpinnerIcon width={16} height={16} /> : null}
            Load more results
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default SearchResults;
