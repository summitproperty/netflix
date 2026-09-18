import { publicEnv } from "@/lib/config/env";
import type { VideoProvider, VideoRequest, VideoSource } from "@/lib/video/types";

/**
 * Video provider registry.
 *
 * Legal note: this module only ever produces an embed URL for a provider the
 * operator has configured and is authorised to embed. It never downloads,
 * caches, mirrors or redistributes any video, and it never rewrites a
 * provider's stream. Point the env templates at a different provider to switch.
 */

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** Fills {id}/{season}/{episode} and refuses anything that is not https. */
function renderTemplate(template: string, request: VideoRequest): string | null {
  const url = template
    .replaceAll("{id}", String(request.tmdbId))
    .replaceAll("{season}", String(request.season ?? ""))
    .replaceAll("{episode}", String(request.episode ?? ""));

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Provider backed by two URL templates. This covers every embed-style provider,
 * which is why swapping providers needs no new code.
 */
export function createTemplateProvider(options: {
  id: string;
  label: string;
  movieTemplate: string;
  tvTemplate: string;
  homepage?: string;
  allowFullscreen?: boolean;
}): VideoProvider {
  const {
    id,
    label,
    movieTemplate,
    tvTemplate,
    homepage,
    allowFullscreen = true,
  } = options;

  return {
    id,
    label,
    homepage,
    build(request: VideoRequest): VideoSource | null {
      if (!isPositiveInt(request.tmdbId)) return null;

      let template: string;
      if (request.mediaType === "movie") {
        if (!movieTemplate) return null;
        template = movieTemplate;
      } else {
        if (!tvTemplate) return null;
        // Season 0 (specials) is valid; episode numbering starts at 1.
        const seasonOk =
          typeof request.season === "number" &&
          Number.isInteger(request.season) &&
          request.season >= 0;
        if (!seasonOk || !isPositiveInt(request.episode)) return null;
        template = tvTemplate;
      }

      const embedUrl = renderTemplate(template, request);
      if (!embedUrl) return null;

      return {
        providerId: id,
        providerLabel: label,
        embedUrl,
        kind: "iframe",
        allowFullscreen,
        referrerPolicy: "no-referrer",
      };
    },
  };
}

/** Provider that intentionally serves nothing (kill switch). */
export const disabledProvider: VideoProvider = {
  id: "none",
  label: "Disabled",
  build: () => null,
};

/**
 * The configured provider. Templates come from
 * NEXT_PUBLIC_VIDEO_MOVIE_EMBED_TEMPLATE / NEXT_PUBLIC_VIDEO_TV_EMBED_TEMPLATE,
 * so a new provider is one env change away.
 */
export function getVideoProvider(): VideoProvider {
  const id = publicEnv.videoProvider.toLowerCase();

  if (id === "none" || id === "off" || id === "disabled") {
    return disabledProvider;
  }

  return createTemplateProvider({
    id,
    label: id === "vidsrc" ? "VidSrc" : id,
    movieTemplate: publicEnv.videoMovieTemplate,
    tvTemplate: publicEnv.videoTvTemplate,
  });
}

/** Convenience wrapper used by the watch pages. */
export function getVideoSource(request: VideoRequest): VideoSource | null {
  return getVideoProvider().build(request);
}
