# Nafij Netflix

A production-ready, cinematic streaming front-end built with **Next.js 15 (App Router)**,
**TypeScript**, **Tailwind CSS**, **TMDB** for metadata and **Supabase** for accounts and
data. Playback, advertising, branding and colours are all swappable through adapters and
environment variables — no rewrite required.

The design is original: dark cinematic surfaces, a red/gold brand accent taken from the
NN MOVIES artwork, gradient hero fades and premium card hover states. No third-party
service's logo, artwork or UI is reproduced.

---

## What's inside

| Area | Details |
| --- | --- |
| Browse | Homepage hero + 15 dynamic rails, `/movies`, `/tv`, `/genres`, genre landing pages, infinite scroll |
| Search | `/search` across movies and TV, debounced, paginated, real empty state |
| Detail | `/movie/[tmdbId]`, `/tv/[tmdbId]` with cast, crew, similar, recommended, seasons and episodes |
| Watch | `/watch/movie/[tmdbId]`, `/watch/tv/[tmdbId]/[season]/[episode]` — 16:9 embed, fullscreen, prev/next episode |
| Accounts | Sign up, sign in, sign out, profile, forgot/reset password, optional Google OAuth |
| My List | `/my-list` with optimistic add/remove from every card, hero and watch page |
| Ads | Configurable pre/mid/post-roll VAST layer, off by default, ad-free window in minutes |
| SEO | Dynamic metadata, OG/Twitter cards, `sitemap.xml`, `robots.txt`, favicon set |

---

## 1. Requirements

- Node.js **18.18+** (20 LTS or newer recommended)
- npm 10+
- A free [TMDB](https://www.themoviedb.org/settings/api) account
- A free [Supabase](https://supabase.com) project

## 2. Install and run

### The one-command way

**Windows** — double-click **`start-local.cmd`** (or run it from a terminal).
**macOS / Linux** — `chmod +x start-local.sh && ./start-local.sh`

Either script checks your Node version, creates `.env.local` from `.env.example` if it does
not exist yet, tells you which values are still blank, installs dependencies on the first
run, and then starts the dev server. When the terminal prints `Ready`, open:

**→ http://localhost:3000**

Both scripts are safe to re-run: they never overwrite an existing `.env.local` and never
reinstall when `node_modules` is already present. Press `Ctrl+C` to stop the server.

The site loads with a blank `.env.local`, but the catalog will be empty until `TMDB_TOKEN`
is set, and sign-in / My List / profile need the two Supabase keys. See step 3.

If this copy came as the delivered zip, `.env.local` is **already present with the TMDB
token and API key filled in**, so the catalog works on the first run. That file is
gitignored — keep it local, never commit it, and replace the TMDB values whenever you
like. Only the two Supabase keys are still blank.

### The manual way

```bash
npm install
cp .env.example .env.local   # then fill in the values from step 3
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run setup       # the checks the launcher scripts run, without starting the server
npm run validate    # dependency-free static checks (imports, routes, secrets, env)
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run check       # validate + typecheck + lint
npm run build       # production build
npm start           # serve the production build
```

> **Note on this delivery:** `npm install`, `npm run build` and `npm run typecheck` could not
> be executed in the sandbox that generated this project — its npm registry access is
> blocked (HTTP 403). `npm run validate` was written for exactly that situation and passes
> with zero errors: it resolves every import, checks every named export, matches every
> internal link against the real route table, balances brackets in every source file,
> verifies every `process.env` key is documented, proves no client component pulls in a
> `server-only` module, and scans for hard-coded secrets. Run `npm install && npm run check
> && npm run build` on a machine with registry access as the final gate. The build also
> needs outbound network access the first time, because `next/font/google` fetches the
> font files at build time.

## 3. Environment variables

Every key lives in `.env.example` with a comment. Copy it to `.env.local` and fill in the
blanks. Nothing secret is ever hard-coded in source, and nothing without the
`NEXT_PUBLIC_` prefix is readable from the browser.

### Required

| Key | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production |
| `TMDB_TOKEN` | TMDB → Settings → API → **API Read Access Token** (v4). Server-side only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |

`TMDB_API_KEY` (v3) works as a fallback if you have no v4 token — set either one.

### Optional

| Key | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key. Bypasses RLS — never prefix it with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | Renders the "Continue with Google" button |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials |
| `NEXT_PUBLIC_VIDEO_*` | Video provider id and embed URL templates |
| `NEXT_PUBLIC_AD_*`, `AD_PROVIDER_TAG` | Advertising layer (see §7) |
| `NEXT_PUBLIC_BANNER_ADS_ENABLED`, `NEXT_PUBLIC_AD_DISPLAY_*`, `NEXT_PUBLIC_AD_ZONE_*` | Reserved display slots — blank and inert until filled (see §7b) |
| `TMDB_LANGUAGE`, `TMDB_REGION` | Catalog locale, defaults `en-US` / `US` |
| `NEXT_PUBLIC_WATCH_PROGRESS_ENABLED` | Optional watch-history feature, off by default |

**Never commit real values.** `.gitignore` already excludes `.env*` except `.env.example`,
and `npm run validate` fails the build if a real `.env` file or a credential-shaped string
appears in the repository.

## 4. Database and auth setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the whole of [`supabase/schema.sql`](supabase/schema.sql).
   It creates:
   - `public.profiles` — one row per account, auto-created by an `on_auth_user_created`
     trigger, with an `updated_at` touch trigger
   - `public.my_list` — saved titles, unique per `(user_id, media_type, tmdb_id)`
   - `public.watch_progress` — **optional**, only used when
     `NEXT_PUBLIC_WATCH_PROGRESS_ENABLED=true`
   - Row Level Security enabled on all three tables, with per-user select/insert/update/
     delete policies, so a signed-in viewer can only ever touch their own rows
3. **Authentication → URL Configuration**: set Site URL to your `NEXT_PUBLIC_SITE_URL` and
   add `<site-url>/auth/callback` to the redirect allow-list. Do this for localhost and for
   production.
4. **Authentication → Email**: leave email/password enabled. Password reset emails link to
   `/auth/callback?next=/reset-password`, which exchanges the one-time code for a session.

### Google OAuth (optional)

1. Google Cloud Console → **APIs & Services → Credentials → OAuth client ID** (Web).
2. Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client id/secret into Supabase → **Authentication → Providers → Google**.
4. Set `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` so the button renders.

The app never handles Google's secret itself — Supabase does the exchange. The
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` keys exist in `.env.example` only so you can
keep them with the rest of your configuration.

## 5. Project structure

```
app/                     routes only — every page is a Server Component by default
  api/media/*            server-side TMDB proxy (browse, search, season) for client fetches
  api/ads/vast           server-side VAST fetch, so the ad tag never reaches the browser
  auth/callback           OAuth + email link code exchange
  movie|tv/[tmdbId]       detail pages
  watch/movie|tv/...      auth-gated player pages
  sitemap.ts robots.ts    generated SEO endpoints
components/
  ads/                   AdPlaceholder — reserved display slot, blank by default
  brand layout media mylist search ui video   reusable UI
lib/
  ads/                   config, VAST parser, provider adapter, display-zone registry
  auth/                  session helpers, server actions, form state
  config/                env + site config (single source of truth)
  supabase/              browser, server and middleware clients
  tmdb/                  low-level client, normalizers, image URLs, genre tables
  video/                 provider adapter + types
  utils/                 cn, format, errors, rate-limit
services/                media/home/mylist services (server-only)
types/                   TMDB response types and normalized app types
supabase/schema.sql      tables, triggers and RLS policies
scripts/validate.mjs     offline static validation
scripts/setup-local.mjs  local bootstrap (node check, .env.local, install)
start-local.cmd|.sh      one-command local launcher (Windows | macOS/Linux)
public/                  logo, favicons, OG image
```

Credential boundary: only `lib/config/env.ts` reads `process.env`. `serverEnv` is used by
`server-only` modules (`lib/tmdb/client.ts`, `services/*`, `lib/supabase/server.ts`);
`publicEnv` holds `NEXT_PUBLIC_*` values that are safe in the browser. Client components
fetch through `/api/media/*` and never see a TMDB credential.

## 6. Swapping the video provider

`lib/video/providers.ts` builds an embed URL from a template, so a new provider is a
configuration change:

```env
NEXT_PUBLIC_VIDEO_PROVIDER=vidsrc
NEXT_PUBLIC_VIDEO_MOVIE_EMBED_TEMPLATE=https://vidsrc.sbs/embed/movie/{id}
NEXT_PUBLIC_VIDEO_TV_EMBED_TEMPLATE=https://vidsrc.sbs/embed/tv/{id}/{season}/{episode}
```

Placeholders are `{id}`, `{season}` and `{episode}`. Only `https:` URLs are accepted; a
malformed template resolves to `null`, which renders the clean **Video unavailable** card
instead of a broken frame. Set `NEXT_PUBLIC_VIDEO_PROVIDER=disabled` to turn playback off
entirely (browsing keeps working). For a provider that needs a signed URL or an SDK, add a
new object implementing the `VideoProvider` interface in the same file and return it from
`getVideoProvider()`.

**Legal note.** This project embeds a third-party player in a sandboxed iframe. It never
downloads, caches, mirrors, re-hosts or re-serves any video file. Configure only sources
you are authorised to embed.

## 7. Advertising layer

Ads are **off by default** and driven entirely from `lib/ads/config.ts`, which reads:

```env
NEXT_PUBLIC_AD_ENABLED=false            # master switch
NEXT_PUBLIC_AD_PROVIDER=vast            # vast | vmap | ima | none
NEXT_PUBLIC_PREROLL_ENABLED=false
NEXT_PUBLIC_MIDROLL_ENABLED=false
NEXT_PUBLIC_POSTROLL_ENABLED=false
NEXT_PUBLIC_INITIAL_AD_FREE_MINUTES=10  # guaranteed ad-free window at the start
NEXT_PUBLIC_MIDROLL_INTERVAL_MINUTES=20 # spacing after that window
NEXT_PUBLIC_MIDROLL_MAX_PER_SESSION=3   # 0 = unlimited
NEXT_PUBLIC_AD_VAST_TAG_URL=            # public tag, if your provider issues one
AD_PROVIDER_TAG=                        # private tag — stays on the server
```

`AdLayer` decides *when* a break may open, `AdSlot` decides *how* it plays, and
`/api/ads/vast` fetches the tag server-side (rate-limited, 5s timeout, 256 KB cap) so a
private `AD_PROVIDER_TAG` is never exposed and CORS never applies. With no tag configured
the endpoint returns an empty, spec-valid `<VAST version="4.0"/>` and playback continues
untouched.

What this layer deliberately does **not** do: fake or automated clicks, click fraud, forced
clicks, invisible click areas, deceptive buttons, forced redirects, banners, pop-ups or
interstitials. Impressions fire only from the video element's real `playing` event, click
trackers fire only inside the visible "Learn more" link's own click handler, and every
break is dismissible. Only legitimate provider-supplied VAST/VMAP tags are used.

Honest limitation: the feature itself is a cross-origin embed, so its playhead cannot be
read. Pre-rolls therefore gate the embed (it does not mount until the ad finishes), while
mid- and post-rolls are scheduled on elapsed session time and shown as dismissible overlays.

### 7b. Reserved display slots (ExoClick-ready, empty by default)

Separately from the video breaks above, four **in-flow display slots** are already placed in
the layout. They are deliberately blank: on a stock deployment they render no markup, reserve
no space and make no third-party request. Fill in the env keys when you have a network.

| Zone id | Where it renders | Env key | Reserved height (mobile / ≥640px) |
| --- | --- | --- | --- |
| `home-top` | Homepage, between the hero and the first rail | `NEXT_PUBLIC_AD_ZONE_HOME_TOP` | 100 / 90 |
| `list-footer` | Below the grid on `/movies`, `/tv`, `/genres/[type]/[id]` | `NEXT_PUBLIC_AD_ZONE_LIST_FOOTER` | 100 / 90 |
| `detail-below` | Movie and TV detail pages, under the cast list | `NEXT_PUBLIC_AD_ZONE_DETAIL_BELOW` | 250 / 250 |
| `watch-below-player` | Both watch pages, **below** the player — never over it | `NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER` | 100 / 90 |

A slot only serves when **all four** of these are true, so forgetting one leaves it blank
rather than half-broken:

```env
NEXT_PUBLIC_BANNER_ADS_ENABLED=true
NEXT_PUBLIC_AD_DISPLAY_SCRIPT_URL=https://a.magsrv.com/ad-provider.js   # https only
NEXT_PUBLIC_AD_DISPLAY_TAG_CLASS=eas6a97888e                            # from your dashboard
NEXT_PUBLIC_AD_ZONE_HOME_TOP=1234567                                    # this slot's zone id
```

For **ExoClick / magsrv** specifically: create a Banner zone per placement, copy the loader
URL and the `<ins>` class name it gives you into the two keys above, then paste each zone's
numeric id into the matching `NEXT_PUBLIC_AD_ZONE_*` key. `components/ads/AdPlaceholder.tsx`
emits the provider's own container (`<ins class="…" data-zoneid="…">`), loads the script with
`next/script` at `lazyOnload`, and pushes the single `AdProvider.push({ serve: {} })` call the
loader expects. Any network that uses the same class + zone-id pattern works unchanged; a
different pattern means editing that one component.

While building, set `NEXT_PUBLIC_AD_SLOT_OUTLINE=true` (automatic in development) to draw a
labelled dashed box where each slot sits, showing the zone id and the env key to fill.

Adding, moving or removing a slot is two edits: add the id to `AdZoneId` in
[`lib/ads/zones.ts`](lib/ads/zones.ts) with its label, env key and reserved heights, then drop
`<AdPlaceholder zone="your-id" />` where you want it.

Same rules as above apply here: no pop-ups, pop-unders, interstitials, overlays on top of the
player, invisible or stacked click areas, auto-clicks or forced redirects. The component
cannot express them — it renders one labelled, in-flow container and nothing else, refuses a
loader URL that is not `https:`, and never passes configuration through
`dangerouslySetInnerHTML`.

## 8. Re-branding

| Change | Where |
| --- | --- |
| Colours | `styles/globals.css` CSS variables (`--brand`, `--gold`, `--ink-*`, `--mist-*`); `tailwind.config.ts` maps them to `brand`, `gold`, `ink`, `mist` |
| Logo | Replace `public/brand/logo-full.png`, `logo-mark.png`, `public/logo.svg`, `public/logo-mark.svg`; `components/brand/Logo.tsx` has `mark` and `lockup` variants |
| Favicons | `app/icon.png`, `app/icon.svg`, `app/apple-icon.png`, `public/favicon-32.png` |
| Site name, tagline, social handles | `lib/config/site.ts` |
| Homepage rails | `lib/tmdb/genres.ts` → `HOMEPAGE_GENRE_ROWS` |

## 9. Deploy to Vercel

1. Push the repository to GitHub.
2. Vercel → **Add New → Project** → import the repo. The framework is detected
   automatically; no build-command changes are needed.
3. Add every key from `.env.example` under **Settings → Environment Variables** (Production
   and Preview). Set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
4. Deploy, then add `https://<your-domain>/auth/callback` to the Supabase redirect
   allow-list and update the Supabase Site URL.
5. Confirm `/sitemap.xml` and `/robots.txt` respond, and that `/watch/...` redirects a
   signed-out visitor to `/login?redirect=…`.

Caching is handled by route-level `revalidate` values (30 min for browse, 1 h for genres,
6 h for detail pages, 24 h for the sitemap), so the free tier is enough for normal traffic.

## 10. Security summary

- No TMDB token, database credential, auth secret, OAuth secret or private ad tag is ever
  sent to the browser, hard-coded in source, or printed in the UI
- `server-only` guards on every module that touches a secret; `npm run validate` proves no
  client component can reach one
- Supabase RLS restricts every table to its owning user; the anon key alone grants nothing
- `middleware.ts` refreshes sessions and protects `/watch`, `/my-list` and `/profile`
- `?redirect=` values are sanitised (`safeRedirectPath`), so no open redirect
- `/api/ads/vast` takes no URL from the caller — the destination comes from env only, so it
  cannot be used as an SSRF proxy; it is rate-limited per client
- The player runs in a sandboxed iframe with `referrerPolicy` locked down
- Account pages are `noindex`, and `/watch/*` is excluded from the sitemap and robots

## 11. Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Metadata and
images are © their respective owners. Branding in this repository is original artwork
created for Nafij Netflix.


## Cloudflare + GitHub environment

For the GitHub → Cloudflare deployment path, fill in `.env.cloudflare`.
Cloudflare should run `npm run cf:build` as the build command. The build wrapper
loads `.env.cloudflare` for `NEXT_PUBLIC_*` values and generates a server-only
fallback for TMDB, Supabase service-role, and the private ad tag. The normal
local workflow remains `.env.local` + `npm run dev`.

All ad placements are configuration-driven: VAST/VMAP video tags, display
zones, movie-card/section banners, Browse Dock banners/video slots, and a
provider area for provider-issued snippets such as ExoClick or Adsterra.
