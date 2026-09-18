import type { Metadata } from "next";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { InfiniteMediaGrid } from "@/components/media/InfiniteMediaGrid";
import { SortTabs, type SortOption } from "@/components/media/SortTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilmIcon } from "@/components/ui/Icons";
import {
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrending,
  getUpcomingMovies,
} from "@/services/media.service";
import type { PagedMedia } from "@/types/media";

/*
 * /movies — one grid, five server-rendered sort views. The sort keys here match
 * the allowlist in app/api/media/browse/route.ts so "load more" keeps working.
 */

const SORTS: SortOption[] = [
  { value: "popular", label: "Popular" },
  { value: "trending", label: "Trending" },
  { value: "top_rated", label: "Top rated" },
  { value: "now_playing", label: "In cinemas" },
  { value: "upcoming", label: "Upcoming" },
];

const COPY: Record<string, string> = {
  popular: "The movies everyone is watching right now.",
  trending: "What gained the most attention across the last seven days.",
  top_rated: "The highest rated films of all time, by audience score.",
  now_playing: "Currently showing in theatres around the world.",
  upcoming: "Releasing soon — line up your next watch.",
};

function resolveSort(raw: string | undefined): string {
  return raw && SORTS.some((option) => option.value === raw) ? raw : "popular";
}

function fetchPage(sort: string): Promise<PagedMedia> {
  switch (sort) {
    case "trending":
      return getTrending("movie", "week", 1);
    case "top_rated":
      return getTopRatedMovies(1);
    case "now_playing":
      return getNowPlayingMovies(1);
    case "upcoming":
      return getUpcomingMovies(1);
    default:
      return getPopularMovies(1);
  }
}

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Movies",
  description:
    "Browse popular, trending, top rated, in-cinemas and upcoming movies. Full metadata, ratings and instant streaming.",
  alternates: { canonical: "/movies" },
};

export default async function MoviesPage({
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
        title="Movies"
        description={COPY[sort]}
        actions={<SortTabs basePath="/movies" options={SORTS} active={sort} />}
      />

      {initial.items.length === 0 ? (
        <EmptyState
          title="No movies to show"
          message="We could not load this list right now. Please refresh in a moment, or try a different sort."
          icon={<FilmIcon width={22} height={22} />}
          action={{ href: "/movies?sort=popular", label: "Show popular" }}
        />
      ) : (
        <InfiniteMediaGrid
          key={sort}
          initial={initial}
          mediaType="movie"
          sort={sort}
        />
      )}

      {/* Reserved display slot, after the grid. Empty unless configured. */}
      <AdPlaceholder zone="list-footer" />
    </div>
  );
}
