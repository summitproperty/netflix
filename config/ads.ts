import { publicEnv } from "@/lib/config/env";

/**
 * ============================================================================
 * ADVERTISING CONFIGURATION — edit this file to add/change ExoClick tags
 * ============================================================================
 *
 * FINAL AD SYSTEM — full site inventory, listed top to bottom:
 *
 *   1. Home-top banner      — `lib/ads/zones.ts` zone "home-top" (pre-existing,
 *                              env-configured, untouched by this file).
 *   2. Movie-card ad        — `movieCardAd` below. One occasional ad card,
 *                              same size as a real MovieCard, inserted into
 *                              (not replacing/deleting) one homepage row.
 *   3. Section banner       — `sectionBanner` below. One banner between the
 *                              first row (Trending) and the next section.
 *   4. Dedicated bottom ad area (Browse Mode only, hidden on /watch):
 *        a. 3 stacked video slots   — `browseDock.video1/2/3`
 *        b. Provider ad area        — `browseDock.providerArea` (existing
 *                                      provider-issued inventory only — see
 *                                      its own comment below)
 *        c. 3 bottom banners        — `browseDock.banner1/2/3`
 *      See components/ads/dock/BrowseAdDock.tsx.
 *   5. Player ad breaks (Watch Mode) — `slots` below (slot1-5, cycled
 *      round-robin, no fixed max count). First opportunity ~2-4 minutes in,
 *      then ~6-8 minutes after each break closes, never in the final 5
 *      minutes. See lib/ads/opportunity-schedule.ts. Completely separate from
 *      the pre-existing preroll/mid/post-roll VAST system (lib/ads/config.ts),
 *      which this file does not touch.
 *
 * `floatingVideo`, `inPageVideo` and `banner` (singular) below are earlier
 * building blocks, NOT part of the active system (not rendered anywhere) —
 * kept only so nothing already-built is deleted.
 *
 * VIDEO TAGS (browseDock.video1-3, slots.slot1-5, floatingVideo, inPageVideo)
 * ---------------------------------------------------------------------------
 * Paste ONE of the following into each `vastTag` field:
 *   - a full https:// VAST/VMAP tag URL ExoClick gave you, or
 *   - the raw "<VAST ...>...</VAST>" XML itself, or
 *   - leave it as "" to turn that slot off — no request is ever made for an
 *     empty slot, and the site never invents a fake tag.
 *
 * SNIPPET FIELDS (movieCardAd, sectionBanner, browseDock.banner1-3,
 * browseDock.providerArea, banner)
 * ---------------------------------------------------------------------------
 * Paste the exact snippet the provider issued for that placement, as a single
 * string. It is injected exactly as given — nothing is rewritten or guessed,
 * and any refresh/rotation is left entirely to the provider's own script, per
 * their policy (this app never invents a refresh timer).
 *
 * ENVIRONMENT-VARIABLE FALLBACK
 * ---------------------------------------------------------------------------
 * If you'd rather keep tags out of source control, leave any `vastTag` field
 * here empty and set the matching NEXT_PUBLIC_AD_* variable in your .env
 * instead (see .env.example). A value set here always takes priority over the
 * matching environment variable.
 *
 * The pre-existing preroll/mid/post-roll VAST system (lib/ads/config.ts) and
 * the pre-existing display zones (lib/ads/zones.ts — home top, list footer,
 * detail below, watch below player) are separate from this file and keep
 * using their own configuration; neither is touched by anything below.
 * ============================================================================
 */

export type FloatingPosition = "bottom-right" | "bottom-left";

export const AD_CONFIG = {
  /**
   * Earlier single-floating-video building block. NOT part of the active
   * system and NOT rendered anywhere — superseded by `browseDock` below.
   * components/ads/FloatingVideoAd.tsx still exists (unused) in case this
   * simpler single-ad shape is wanted again.
   */
  floatingVideo: {
    enabled: publicEnv.floatingVideoAdEnabled,
    position: "bottom-right" as FloatingPosition, // "bottom-right" | "bottom-left"

    // ── PASTE EXOCLICK VAST/VMAP TAG (URL or raw XML) HERE ──────────────────
    vastTag: publicEnv.adFloatingVastTagUrl,
    // ─────────────────────────────────────────────────────────────────────
  },

  /**
   * In-page video ad component (components/ads/InPageVideoAd.tsx) exists and
   * is fully wired, but is NOT part of the active ad system and is not
   * rendered anywhere. Left here, disabled, in case it's wanted later.
   */
  inPageVideo: {
    enabled: publicEnv.inPageVideoAdEnabled,

    // ── PASTE EXOCLICK VAST/VMAP TAG (URL or raw XML) HERE ──────────────────
    vastTag: publicEnv.adInPageVastTagUrl,
    // ─────────────────────────────────────────────────────────────────────
  },

  /**
   * Earlier single-banner building block (distinct from browseDock's banner
   * slots and from sectionBanner/movieCardAd below). NOT part of the active
   * ad system — kept disabled and unused (components/ads/BannerAd.tsx exists
   * but is not rendered anywhere). Do not enable/render this without asking
   * first.
   */
  banner: {
    enabled: publicEnv.bannerAdEnabled,

    // ── PASTE THE FULL EXOCLICK <ins>/<script> SNIPPET HERE (one string) ──
    snippet: publicEnv.adBannerSnippet,
    // ─────────────────────────────────────────────────────────────────────
  },

  /**
   * Movie-card ad: one occasional ad card the exact size of a real
   * MovieCard, inserted into one homepage row (see app/page.tsx and
   * components/media/AdMovieCard.tsx). Movie data is never removed to make
   * room for it — the ad is an extra card, not a replacement. Renders
   * nothing (no card at all, row looks completely normal) until a snippet is
   * configured.
   */
  movieCardAd: {
    enabled: publicEnv.movieCardAdEnabled,
    // ── PASTE THE FULL EXOCLICK NATIVE/BANNER SNIPPET HERE ─────────────────
    snippet: publicEnv.adMovieCardSnippet,
    // ─────────────────────────────────────────────────────────────────────
  },

  /**
   * Major section banner: one banner between the first homepage row
   * (Trending) and the next section. See components/media/SectionBanner.tsx
   * and app/page.tsx. Renders nothing until configured.
   */
  sectionBanner: {
    enabled: publicEnv.sectionBannerAdEnabled,
    // ── PASTE THE FULL EXOCLICK BANNER SNIPPET HERE ─────────────────────────
    snippet: publicEnv.adSectionBannerSnippet,
    // ─────────────────────────────────────────────────────────────────────
  },

  /**
   * The player's video ad-opportunity breaks. Timing lives in
   * lib/ads/opportunity-schedule.ts (first opportunity ~2-4 minutes in, then
   * ~6-8 minutes after each break closes, never in the final 5 minutes) — this
   * file only holds the tags. There is no fixed maximum breaks count: long
   * titles cycle back through slot1-5 round-robin for as many opportunities
   * as their duration allows (a technical runaway-safety ceiling exists, but
   * it is not a product policy). An opportunity with an empty tag is silently
   * skipped; short titles automatically use fewer.
   */
  slots: {
    // ── PASTE EXOCLICK VAST TAG HERE (opportunity tag #1) ───────────────────
    slot1: { vastTag: "" },
    // ── PASTE EXOCLICK VAST TAG HERE (opportunity tag #2) ───────────────────
    slot2: { vastTag: "" },
    // ── PASTE EXOCLICK VAST TAG HERE (opportunity tag #3) ───────────────────
    slot3: { vastTag: "" },
    // ── PASTE EXOCLICK VAST TAG HERE (opportunity tag #4) ───────────────────
    slot4: { vastTag: "" },
    // ── PASTE EXOCLICK VAST TAG HERE (opportunity tag #5) ───────────────────
    slot5: { vastTag: "" },
  },

  /**
   * DEDICATED BOTTOM AD AREA (Browse Mode only) — fixed to the bottom of the
   * viewport, hidden entirely on /watch pages. Top to bottom: 3 stacked video
   * slots, then the provider ad area, then 3 banners (the site's lowest ad
   * row). See components/ads/dock/BrowseAdDock.tsx.
   *
   * Each video slot rotates on its own: when its creative finishes (or
   * fails), that slot alone requests its next ad — the other two are never
   * affected and never reload together.
   *
   * The three banner slots and the provider area each render their pasted
   * snippet once. Any further in-slot refresh/rotation is left entirely to
   * the provider's own script, per its own refresh/frequency rules — this
   * app never forces a refresh.
   */
  browseDock: {
    enabled: publicEnv.browseDockAdEnabled,

    video1: {
      // ── PASTE EXOCLICK VAST TAG HERE (stacked video ad #1) ───────────────
      vastTag: "",
    },
    video2: {
      // ── PASTE EXOCLICK VAST TAG HERE (stacked video ad #2) ───────────────
      vastTag: "",
    },
    video3: {
      // ── PASTE EXOCLICK VAST TAG HERE (stacked video ad #3) ───────────────
      vastTag: "",
    },

    /**
     * Existing legitimate provider inventory only (e.g. an ExoClick
     * popup/popunder or additional native tag your account is eligible for).
     * Pasted exactly as the provider issued it — this app does not invent a
     * popup/popunder mechanism of its own, does not force multiple windows
     * open at once, and does not synthesize clicks. If you have no such
     * provider-issued snippet yet, leave this empty; nothing renders and
     * nothing is invented in its place.
     */
    providerArea: {
      // ── PASTE THE FULL PROVIDER SNIPPET HERE (ExoClick / Adsterra / etc.) ──
      snippet: publicEnv.adBrowseProviderSnippet,
      // ───────────────────────────────────────────────────────────────────
    },

    banner1: {
      // ── PASTE THE FULL EXOCLICK <ins>/<script> SNIPPET HERE ──────────────
      snippet: publicEnv.adBrowseBanner1Snippet,
    },
    banner2: {
      // ── PASTE THE FULL EXOCLICK <ins>/<script> SNIPPET HERE ──────────────
      snippet: publicEnv.adBrowseBanner2Snippet,
    },
    banner3: {
      // ── PASTE THE FULL EXOCLICK <ins>/<script> SNIPPET HERE ──────────────
      snippet: publicEnv.adBrowseBanner3Snippet,
    },
  },
} as const;

export type AdConfigShape = typeof AD_CONFIG;
