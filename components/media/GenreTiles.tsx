import Link from "next/link";

import { genreAccent } from "@/lib/tmdb/genres";
import type { MediaType } from "@/types/media";

interface GenreTilesProps {
  mediaType: MediaType;
  genres: Array<{ id: number; name: string }>;
}

/**
 * Genre index tiles. Purely typographic (no artwork), which keeps /genres fast
 * and avoids fetching a poster for every genre.
 */
export function GenreTiles({ mediaType, genres }: GenreTilesProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {genres.map((genre) => (
        <li key={genre.id}>
          <Link
            href={`/genres/${mediaType}/${genre.id}`}
            className={`group flex h-24 flex-col justify-end rounded-xl border border-white/5 bg-gradient-to-br p-4 transition-all hover:border-brand/40 hover:shadow-glow sm:h-28 ${genreAccent(
              genre.name,
            )}`}
          >
            <span className="text-base font-bold tracking-tight text-mist-100 transition-colors group-hover:text-white sm:text-lg">
              {genre.name}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-mist-500">
              {mediaType === "movie" ? "Movies" : "TV Shows"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default GenreTiles;
