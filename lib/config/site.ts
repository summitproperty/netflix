/**
 * Central branding + navigation configuration.
 *
 * Everything user-visible about the brand lives here: change the name, tagline,
 * logo paths or nav items and the whole app follows. No component hard-codes
 * the brand name.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Requires an authenticated session. */
  protected?: boolean;
};

export const siteConfig = {
  name: "Nafij Netflix",
  shortName: "Nafij",
  tagline: "Movies and TV, streamed in premium dark mode.",
  description:
    "Nafij Netflix is a premium cinematic streaming experience: browse trending movies, top-rated TV shows, full cast and crew details, and build your own watchlist.",
  keywords: [
    "Nafij Netflix",
    "streaming",
    "movies",
    "tv shows",
    "watch online",
    "trending movies",
    "top rated tv",
  ],
  locale: "en_US",
  /** Square emblem from the supplied artwork (transparent background). */
  logoMark: "/brand/logo-mark.png",
  /** Full emblem + wordmark lockup, for auth screens and large placements. */
  logoLockup: "/brand/logo-full.png",
  /** Untouched source artwork, kept so branding can be regenerated. */
  logoSource: "/brand/source-logo.png",
  /**
   * Vector fallbacks distilled from the artwork. Served as static files, not
   * through next/image: optimizing remote SVG needs `dangerouslyAllowSVG`,
   * which stays off. `logoMarkVector` is consumed by app/manifest.ts;
   * `logoVector` is the lockup for anything outside the app (docs, emails,
   * store listings) that wants a resolution-independent asset.
   */
  logoVector: "/logo.svg",
  logoMarkVector: "/logo-mark.svg",
  /** 512px raster emblem, used by the web app manifest (app/manifest.ts). */
  appIcon: "/brand/icon-512.png",
  ogImage: "/og-image.png",
  themeColor: "#09090b",
  /** Shown in the footer; TMDB's terms require attribution. */
  attribution:
    "This product uses the TMDB API but is not endorsed or certified by TMDB.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard", protected: true },
    { label: "Movies", href: "/movies" },
    { label: "TV Shows", href: "/tv" },
    { label: "Genres", href: "/genres" },
    { label: "My List", href: "/my-list", protected: true },
  ] as NavItem[],
  footerLinks: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard", protected: true },
    { label: "Movies", href: "/movies" },
    { label: "TV Shows", href: "/tv" },
    { label: "Genres", href: "/genres" },
    { label: "Search", href: "/search" },
    { label: "My List", href: "/my-list" },
    { label: "Profile", href: "/profile" },
  ] as NavItem[],
} as const;

/**
 * Absolute site URL, used for metadata, sitemap and auth redirects.
 * Falls back to the Vercel-provided URL so preview deployments work with no
 * extra configuration.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel && vercel.trim().length > 0) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

/** Absolute URL helper for metadata and redirects. */
export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
