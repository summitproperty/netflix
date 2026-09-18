/**
 * Video provider adapter types.
 *
 * The app never talks to a streaming host directly: it asks the registry below
 * for a `VideoSource`, which is only ever an embed URL rendered inside an
 * iframe. Nothing is downloaded, proxied, mirrored or re-hosted — swapping
 * providers is a configuration change, not a code change.
 */

export type VideoMediaType = "movie" | "tv";

export interface VideoRequest {
  mediaType: VideoMediaType;
  tmdbId: number;
  /** TV only. */
  season?: number;
  /** TV only. */
  episode?: number;
}

export interface VideoSource {
  providerId: string;
  providerLabel: string;
  /** Absolute https URL to embed. */
  embedUrl: string;
  /** Only "iframe" today; a first-party player would add "hls" / "dash". */
  kind: "iframe";
  allowFullscreen: boolean;
  /** Value for the iframe's `referrerpolicy` attribute. */
  referrerPolicy: "no-referrer" | "origin" | "strict-origin-when-cross-origin";
}

export interface VideoProvider {
  id: string;
  label: string;
  /** Documentation/attribution link, shown in the player footnote. */
  homepage?: string;
  /**
   * Returns null when the provider cannot serve this request (disabled, or a
   * TV request with no season/episode). Callers then render the shared
   * "Video unavailable" state.
   */
  build(request: VideoRequest): VideoSource | null;
}

/** Placeholders understood by the embed templates. */
export const VIDEO_TEMPLATE_TOKENS = ["{id}", "{season}", "{episode}"] as const;
