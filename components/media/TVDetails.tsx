import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { CastList } from "@/components/media/CastList";
import { MediaDetails } from "@/components/media/MediaDetails";
import { MovieRow } from "@/components/media/MovieRow";
import { SeasonEpisodes } from "@/components/media/SeasonEpisodes";
import { episodeLabel } from "@/lib/utils/format";
import type { MediaDetail, SeasonDetail } from "@/types/media";

interface TVDetailsProps {
  detail: MediaDetail;
  /** First real season, pre-fetched on the server. */
  initialSeason: SeasonDetail | null;
  inMyList?: boolean;
  userRating?: 1 | -1 | null;
}

/** /tv/[tmdbId] body: header, season/episode browser, cast and related rails. */
export function TVDetails({
  detail,
  initialSeason,
  inMyList = false,
  userRating = null,
}: TVDetailsProps) {
  const seasonCount = detail.numberOfSeasons ?? detail.seasons.length;
  const extraMeta = [
    seasonCount ? `${seasonCount} season${seasonCount === 1 ? "" : "s"}` : "",
    detail.numberOfEpisodes ? `${detail.numberOfEpisodes} episodes` : "",
  ].filter(Boolean);

  const firstSeason = initialSeason?.seasonNumber ?? detail.seasons[0]?.seasonNumber ?? 1;
  const firstEpisode = Math.max(initialSeason?.episodes[0]?.episodeNumber ?? 1, 1);

  return (
    <MediaDetails
      detail={detail}
      inMyList={inMyList}
      userRating={userRating}
      extraMeta={extraMeta}
      watchHref={`/watch/tv/${detail.id}/${firstSeason}/${firstEpisode}`}
      // Label follows the real target: shows that open on season 2 (or whose
      // first season starts at episode 0) must not advertise "S1 E1".
      watchLabel={`Watch ${episodeLabel(firstSeason, firstEpisode)}`}
    >
      <SeasonEpisodes
        tvId={detail.id}
        seasons={detail.seasons}
        initialSeason={initialSeason}
      />

      <CastList cast={detail.cast} title="Series cast" />

      {/* Reserved display slot — empty unless a zone id is configured. */}
      <AdPlaceholder zone="detail-below" />

      {detail.similar.length > 0 ? (
        <MovieRow
          title="Similar shows"
          id={`similar-tv-${detail.id}`}
          items={detail.similar}
          className="!px-0"
        />
      ) : null}

      {detail.recommendations.length > 0 ? (
        <MovieRow
          title="Recommended for you"
          id={`recommended-tv-${detail.id}`}
          items={detail.recommendations}
          className="!px-0"
        />
      ) : null}
    </MediaDetails>
  );
}

export default TVDetails;
