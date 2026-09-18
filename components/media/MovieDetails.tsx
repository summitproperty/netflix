import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { CastList } from "@/components/media/CastList";
import { MediaDetails } from "@/components/media/MediaDetails";
import { MovieRow } from "@/components/media/MovieRow";
import type { MediaDetail } from "@/types/media";

interface MovieDetailsProps {
  detail: MediaDetail;
  inMyList?: boolean;
  userRating?: 1 | -1 | null;
}

/** /movie/[tmdbId] body: header, cast, similar and recommended rails. */
export function MovieDetails({ detail, inMyList = false, userRating = null }: MovieDetailsProps) {
  return (
    <MediaDetails detail={detail} inMyList={inMyList} userRating={userRating}>
      <CastList cast={detail.cast} />

      {/* Reserved display slot — empty unless a zone id is configured. */}
      <AdPlaceholder zone="detail-below" />

      {detail.similar.length > 0 ? (
        <MovieRow
          title="Similar movies"
          id={`similar-${detail.id}`}
          items={detail.similar}
          className="!px-0"
        />
      ) : null}

      {detail.recommendations.length > 0 ? (
        <MovieRow
          title="Recommended for you"
          id={`recommended-${detail.id}`}
          items={detail.recommendations}
          className="!px-0"
        />
      ) : null}
    </MediaDetails>
  );
}

export default MovieDetails;
