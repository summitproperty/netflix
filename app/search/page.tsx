import type { Metadata } from "next";

import { MovieRow } from "@/components/media/MovieRow";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { getPopularMovies, getTrending } from "@/services/media.service";
import { getSearchHistory } from "@/services/search-history.service";

/*
 * /search — the query lives in the URL so results are shareable and the back
 * button works. Fetching itself happens client-side against /api/media/search;
 * this server page only renders the shell plus a couple of suggestion rails for
 * the empty-query state.
 */

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search thousands of movies and TV shows by title. Filter by movies or series and start watching instantly.",
  alternates: { canonical: "/search" },
};

/** Signed-out visitors simply get an empty list — recent searches is an account feature. */
async function loadRecentSearches() {
  const user = await getCurrentUser();
  if (!user) return [];
  return getSearchHistory(user.id);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [suggestions, recentSearches] = await Promise.all([
    query.length === 0
      ? Promise.all([getTrending("all", "week", 1), getPopularMovies(1)])
      : Promise.resolve(null),
    query.length === 0 ? loadRecentSearches() : Promise.resolve([]),
  ]);

  return (
    <div className="page-shell">
      <PageHeader
        title={query.length > 0 ? `Results for “${query}”` : "Search"}
        description={
          query.length > 0
            ? undefined
            : "Find any movie or series by title. Start typing below."
        }
        actions={
          <SearchBar
            variant="page"
            initialQuery={query}
            autoFocus={query.length === 0}
            className="sm:w-80"
          />
        }
      />

      {query.length === 0 ? <RecentSearches entries={recentSearches} /> : null}

      {query.length > 0 ? (
        <SearchResults query={query} />
      ) : suggestions ? (
        <div className="-mx-1">
          <MovieRow
            id="search-trending"
            title="Trending this week"
            href="/movies?sort=trending"
            items={suggestions[0].items}
            priority
            className="!px-0"
          />
          <MovieRow
            id="search-popular"
            title="Popular movies"
            href="/movies?sort=popular"
            items={suggestions[1].items}
            className="!px-0"
          />
        </div>
      ) : null}
    </div>
  );
}
