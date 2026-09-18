import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config/site";

/*
 * robots.txt — public catalog pages are crawlable; account, watch and API routes
 * are not (they are personal, gated or machine-only).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/watch/",
          "/my-list",
          "/profile",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
