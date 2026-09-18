import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext build config for the Cloudflare Workers adapter.
 *
 * No incremental cache / queue overrides are configured on purpose: the app
 * doesn't rely on ISR revalidation or the Next.js image optimizer, so the
 * default in-memory dev behavior + Cloudflare's own edge cache for GET
 * responses is enough. Add an R2/KV incremental cache here only if ISR is
 * introduced later.
 */
export default defineCloudflareConfig();
