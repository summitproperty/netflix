import { Fragment } from "react";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { Hero } from "@/components/media/Hero";
import { MovieRow } from "@/components/media/MovieRow";
import { SectionBanner } from "@/components/media/SectionBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilmIcon } from "@/components/ui/Icons";
import { isTmdbConfigured } from "@/lib/config/server-env";
import { getViewerListKeys } from "@/lib/mylist/keys";
import { getHomeFeed } from "@/services/home.service";

/*
 * The homepage renders per request (the header needs the session cookie), but
 * every TMDB call underneath is cached and revalidated by the media service, so
 * this stays cheap.
 */

export default async function HomePage() {
  const [feed, myListKeys] = await Promise.all([
    getHomeFeed(),
    getViewerListKeys().catch((error) => {
      console.error("Homepage viewer list lookup failed:", error);
      return [];
    }),
  ]);

  if (feed.rows.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          // This panel replaces the hero, so it carries the page's only h1.
          as="h1"
          title="The catalog is unavailable right now"
          message={
            isTmdbConfigured()
              ? "This is usually temporary — please refresh in a moment."
              : // Visitors get the same neutral line; the operator hint only
                // shows on a dev server, so a live site never leaks setup
                // details or the name of the upstream data provider.
                process.env.NODE_ENV === "development"
                ? "Setup needed: add TMDB_TOKEN (or TMDB_API_KEY) to .env.local and restart the dev server."
                : "This is usually temporary — please refresh in a moment."
          }
          icon={<FilmIcon width={22} height={22} />}
          action={{ href: "/search", label: "Try searching" }}
        />
      </div>
    );
  }

  return (
    <>
      <Hero items={feed.hero} myListKeys={myListKeys} />

      <div className="relative z-10 -mt-6 pb-8 sm:-mt-10">
        {/*
          Reserved display slot, between the hero and the first row. Renders
          nothing until NEXT_PUBLIC_AD_ZONE_HOME_TOP is set, so it never covers
          the hero or pushes the rails down on a stock deployment.
        */}
        <div className="container-page">
          <AdPlaceholder zone="home-top" />
        </div>

        {feed.rows.map((row, index) => (
          <Fragment key={row.id}>
            <MovieRow
              id={row.id}
              title={row.title}
              href={row.href}
              items={row.items}
              priority={index === 0}
              // Occasional ad card: only the very first row (Trending), never
              // every row.
              showAd={index === 0}
            />
            {/* Major section banner: only once, right after the first row. */}
            {index === 0 ? <SectionBanner /> : null}
          </Fragment>
        ))}
      </div>
    </>
  );
}
