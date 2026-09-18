import type { Metadata } from "next";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { InfiniteMediaGrid } from "@/components/media/InfiniteMediaGrid";
import { SortTabs, type SortOption } from "@/components/media/SortTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TvIcon } from "@/components/ui/Icons";
import {
  getAiringTodayTV,
  getOnTheAirTV,
  getPopularTV,
  getTopRatedTV,
  getTrending,
} from "@/services/media.service";
import type { PagedMedia } from "@/types/media";

/* /tv — mirrors /movies, with the TV-specific sort keys. */

const SORTS: SortOption[] = [
  { value: "popular", label: "Popular" },
  { value: "trending", label: "Trending" },
  { value: "top_rated", label: "Top rated" },
  { value: "airing_today", label: "Airing today" },
  { value: "on_the_air", label: "On the air" },
];

const COPY: Record<string, string> = {
  popular: "The series everyone is bingeing right now.",
  trending: "The shows that gained the most attention this week.",
  top_rated: "The highest rated series of all time, by audience score.",
  airing_today: "New episodes broadcasting today.",
  on_the_air: "Series with episodes airing over the next few days.",
};

function resolveSort(raw: string | undefined): string {
  return raw && SORTS.some((option) => option.value === raw) ? raw : "popular";
}

function fetchPage(sort: string): Promise<PagedMedia> {
  switch (sort) {
    case "trending":
      return getTrending("tv", "week", 1);
    case "top_rated":
      return getTopRatedTV(1);
    case "airing_today":
      return getAiringTodayTV(1);
    case "on_the_air":
      return getOnTheAirTV(1);
    default:
      return getPopularTV(1);
  }
}

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "TV Shows",
  description:
    "Browse popular, trending and top rated TV shows. Season and episode guides, cast, ratings and instant streaming.",
  alternates: { canonical: "/tv" },
};

export default async function TVPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort = resolveSort(rawSort);
  const initial = await fetchPage(sort);

  return (
    <div className="page-shell">
      <PageHeader
        title="TV Shows"
        description={COPY[sort]}
        actions={<SortTabs basePath="/tv" options={SORTS} active={sort} />}
      />

      {initial.items.length === 0 ? (
        <EmptyState
          title="No series to show"
          message="We could not load this list right now. Please refresh in a moment, or try a different sort."
          icon={<TvIcon width={22} height={22} />}
          action={{ href: "/tv?sort=popular", label: "Show popular" }}
        />
      ) : (
        <InfiniteMediaGrid key={sort} initial={initial} mediaType="tv" sort={sort} />
      )}

      {/* Reserved display slot, after the grid. Empty unless configured. */}
      <AdPlaceholder zone="list-footer" />
    </div>
  );
}
