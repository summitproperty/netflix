import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";

/**
 * Web app manifest, served at /manifest.webmanifest.
 *
 * Next's file conventions already handle the favicon and Apple touch icon
 * (app/icon.svg, app/icon.png, app/apple-icon.png). This adds the installable
 * metadata plus the larger raster icons, so Android/Chrome has a maskable
 * source instead of scaling the 32px favicon up.
 *
 * The route is static, so it costs nothing at request time.
 */

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.themeColor,
    theme_color: siteConfig.themeColor,
    orientation: "portrait-primary",
    categories: ["entertainment", "video"],
    icons: [
      {
        src: siteConfig.logoMarkVector,
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      { src: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      {
        src: siteConfig.appIcon,
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: siteConfig.appIcon,
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
