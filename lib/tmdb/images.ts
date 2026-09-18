/**
 * TMDB image URL helpers. Safe to import from client components: the image CDN
 * host is public and needs no credentials.
 */

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export const POSTER_SIZES = ["w185", "w342", "w500", "w780", "original"] as const;
export const BACKDROP_SIZES = ["w780", "w1280", "original"] as const;
export const PROFILE_SIZES = ["w185", "h632", "original"] as const;
export const STILL_SIZES = ["w300", "w500", "original"] as const;

export type PosterSize = (typeof POSTER_SIZES)[number];
export type BackdropSize = (typeof BACKDROP_SIZES)[number];
export type ProfileSize = (typeof PROFILE_SIZES)[number];
export type StillSize = (typeof STILL_SIZES)[number];

function buildUrl(path: string | null | undefined, size: string): string | null {
  if (!path) return null;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${IMAGE_BASE}/${size}${clean}`;
}

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = "w500",
): string | null {
  return buildUrl(path, size);
}

export function backdropUrl(
  path: string | null | undefined,
  size: BackdropSize = "w1280",
): string | null {
  return buildUrl(path, size);
}

export function profileUrl(
  path: string | null | undefined,
  size: ProfileSize = "w185",
): string | null {
  return buildUrl(path, size);
}

export function stillUrl(
  path: string | null | undefined,
  size: StillSize = "w300",
): string | null {
  return buildUrl(path, size);
}

export function youTubeThumbnail(key: string): string {
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
}
