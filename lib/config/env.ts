/**
 * Environment access helpers.
 *
 * Rules enforced here:
 *  - Anything reachable from the browser must be read from an explicit
 *    `process.env.NEXT_PUBLIC_*` literal (Next.js inlines those at build time).
 *  - Secrets are only ever read through `serverEnv`, which is imported from
 *    server-only modules. They are never returned to the client.
 */

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function str(value: string | undefined, fallback = ""): string {
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const publicEnv = {
  siteUrl: str(process.env.NEXT_PUBLIC_SITE_URL),

  supabaseUrl: str(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: str(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  googleOAuthEnabled: bool(process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED, true),

  videoProvider: str(process.env.NEXT_PUBLIC_VIDEO_PROVIDER, "vidsrc"),
  videoMovieTemplate: str(
    process.env.NEXT_PUBLIC_VIDEO_MOVIE_EMBED_TEMPLATE,
    "https://vidsrc.sbs/embed/movie/{id}",
  ),
  videoTvTemplate: str(
    process.env.NEXT_PUBLIC_VIDEO_TV_EMBED_TEMPLATE,
    "https://vidsrc.sbs/embed/tv/{id}/{season}/{episode}",
  ),

  adEnabled: bool(process.env.NEXT_PUBLIC_AD_ENABLED, false),
  adProvider: str(process.env.NEXT_PUBLIC_AD_PROVIDER, "vast"),
  prerollEnabled: bool(process.env.NEXT_PUBLIC_PREROLL_ENABLED, false),
  midrollEnabled: bool(process.env.NEXT_PUBLIC_MIDROLL_ENABLED, false),
  postrollEnabled: bool(process.env.NEXT_PUBLIC_POSTROLL_ENABLED, false),
  initialAdFreeMinutes: num(process.env.NEXT_PUBLIC_INITIAL_AD_FREE_MINUTES, 10),
  midrollIntervalMinutes: num(
    process.env.NEXT_PUBLIC_MIDROLL_INTERVAL_MINUTES,
    20,
  ),
  midrollMaxPerSession: num(process.env.NEXT_PUBLIC_MIDROLL_MAX_PER_SESSION, 3),
  adVastTagUrl: str(process.env.NEXT_PUBLIC_AD_VAST_TAG_URL),
  adVmapTagUrl: str(process.env.NEXT_PUBLIC_AD_VMAP_TAG_URL),

  bannerAdsEnabled: bool(process.env.NEXT_PUBLIC_BANNER_ADS_ENABLED, false),

  /*
   * Display ("banner") ad slots. These stay reserved-but-empty until the site
   * owner supplies a network. Every key is read as an explicit literal because
   * Next.js only inlines NEXT_PUBLIC_* when it can see the property access.
   */
  adDisplayNetwork: str(process.env.NEXT_PUBLIC_AD_DISPLAY_NETWORK, "exoclick"),
  adDisplayScriptUrl: str(process.env.NEXT_PUBLIC_AD_DISPLAY_SCRIPT_URL),
  adDisplayTagClass: str(process.env.NEXT_PUBLIC_AD_DISPLAY_TAG_CLASS),
  /** Renders a labelled dashed outline where each slot sits. */
  adSlotOutline: bool(process.env.NEXT_PUBLIC_AD_SLOT_OUTLINE, false),
  adZoneHomeTop: str(process.env.NEXT_PUBLIC_AD_ZONE_HOME_TOP),
  adZoneListFooter: str(process.env.NEXT_PUBLIC_AD_ZONE_LIST_FOOTER),
  adZoneDetailBelow: str(process.env.NEXT_PUBLIC_AD_ZONE_DETAIL_BELOW),
  adZoneWatchBelowPlayer: str(process.env.NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER),

  /*
   * Env-variable fallback for the named ad slots in config/ads.ts (Browse
   * Mode dock's 3 video slots, the legacy floating/in-page slots, and the 5
   * player ad-opportunity slots). A tag pasted directly into config/ads.ts
   * always takes priority over these — see lib/ads/named-tags.ts.
   */
  adDockVideo1VastTagUrl: str(process.env.NEXT_PUBLIC_AD_DOCK_VIDEO1_VAST_TAG_URL),
  adDockVideo2VastTagUrl: str(process.env.NEXT_PUBLIC_AD_DOCK_VIDEO2_VAST_TAG_URL),
  adDockVideo3VastTagUrl: str(process.env.NEXT_PUBLIC_AD_DOCK_VIDEO3_VAST_TAG_URL),
  adFloatingVastTagUrl: str(process.env.NEXT_PUBLIC_AD_FLOATING_VAST_TAG_URL),
  adInPageVastTagUrl: str(process.env.NEXT_PUBLIC_AD_INPAGE_VAST_TAG_URL),
  adSlot1VastTagUrl: str(process.env.NEXT_PUBLIC_AD_SLOT1_VAST_TAG_URL),
  adSlot2VastTagUrl: str(process.env.NEXT_PUBLIC_AD_SLOT2_VAST_TAG_URL),
  adSlot3VastTagUrl: str(process.env.NEXT_PUBLIC_AD_SLOT3_VAST_TAG_URL),
  adSlot4VastTagUrl: str(process.env.NEXT_PUBLIC_AD_SLOT4_VAST_TAG_URL),
  adSlot5VastTagUrl: str(process.env.NEXT_PUBLIC_AD_SLOT5_VAST_TAG_URL),

  adBannerSnippet: str(process.env.NEXT_PUBLIC_AD_BANNER_SNIPPET),
  adMovieCardSnippet: str(process.env.NEXT_PUBLIC_AD_MOVIE_CARD_SNIPPET),
  adSectionBannerSnippet: str(process.env.NEXT_PUBLIC_AD_SECTION_BANNER_SNIPPET),
  adBrowseProviderSnippet: str(process.env.NEXT_PUBLIC_AD_BROWSE_PROVIDER_SNIPPET),
  adBrowseBanner1Snippet: str(process.env.NEXT_PUBLIC_AD_BROWSE_BANNER1_SNIPPET),
  adBrowseBanner2Snippet: str(process.env.NEXT_PUBLIC_AD_BROWSE_BANNER2_SNIPPET),
  adBrowseBanner3Snippet: str(process.env.NEXT_PUBLIC_AD_BROWSE_BANNER3_SNIPPET),

  floatingVideoAdEnabled: bool(process.env.NEXT_PUBLIC_AD_FLOATING_VIDEO_ENABLED, true),
  inPageVideoAdEnabled: bool(process.env.NEXT_PUBLIC_AD_INPAGE_VIDEO_ENABLED, false),
  bannerAdEnabled: bool(process.env.NEXT_PUBLIC_AD_BANNER_ENABLED, false),
  movieCardAdEnabled: bool(process.env.NEXT_PUBLIC_AD_MOVIE_CARD_ENABLED, true),
  sectionBannerAdEnabled: bool(process.env.NEXT_PUBLIC_AD_SECTION_BANNER_ENABLED, true),
  browseDockAdEnabled: bool(process.env.NEXT_PUBLIC_AD_BROWSE_DOCK_ENABLED, true),

  watchProgressEnabled: bool(
    process.env.NEXT_PUBLIC_WATCH_PROGRESS_ENABLED,
    false,
  ),
} as const;

/** True when Supabase auth/database is configured. */
export const isSupabaseConfigured =
  publicEnv.supabaseUrl !== "" && publicEnv.supabaseAnonKey !== "";

/**
 * Server-only environment.
 *
 * IMPORTANT: On Cloudflare Workers, secrets/bindings are runtime values.
 * Do not snapshot them once at module initialization; read them when the
 * server code actually needs them. This keeps TMDB working with Cloudflare
 * Secrets/Variables as well as local `.env.local` values.
 */
export const serverEnv = {
  get tmdbToken() {
    return str(process.env.TMDB_TOKEN);
  },
  get tmdbApiKey() {
    return str(process.env.TMDB_API_KEY);
  },
  get tmdbBaseUrl() {
    return str(process.env.TMDB_API_BASE_URL, "https://api.themoviedb.org/3");
  },
  get tmdbLanguage() {
    return str(process.env.TMDB_LANGUAGE, "en-US");
  },
  get tmdbRegion() {
    return str(process.env.TMDB_REGION, "US");
  },
  get supabaseServiceRoleKey() {
    return str(process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get adProviderTag() {
    return str(process.env.AD_PROVIDER_TAG);
  },
} as const;

/** True when at least one TMDB credential is present at request/runtime time. */
export function isTmdbConfigured(): boolean {
  return serverEnv.tmdbToken !== "" || serverEnv.tmdbApiKey !== "";
}
