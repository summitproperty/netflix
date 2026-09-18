import type { NextConfig } from "next";

/**
 * Nafij Netflix - Next.js configuration.
 *
 * Only remote image hosts that we actually render are allowed, so a compromised
 * TMDB response cannot turn the image optimizer into an open proxy.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
    // Cloudflare Workers doesn't run Next's built-in image optimizer (no
    // sharp/Node runtime for it). TMDB already serves pre-sized images via
    // the /t/p/{size}/ path segment, so images are unaffected visually —
    // only the extra optimization pass is skipped. See:
    // https://opennext.js.org/cloudflare/howtos/image
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
