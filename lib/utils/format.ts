/** Small display formatters shared by server and client components. */

export function formatYear(date?: string | null): string {
  if (!date) return "";
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

/**
 * "2024-05-17" -> "May 17, 2024".
 *
 * TMDB dates are plain calendar dates, so they are formatted in UTC with a fixed
 * locale. Using the runtime's local zone here would render one day on the server
 * and another in a browser west of UTC, which React reports as a hydration
 * mismatch.
 */
export function formatDate(date?: string | null): string {
  if (!date) return "Unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** 128 -> "2h 8m" */
export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** 7.834 -> "7.8" */
export function formatRating(vote?: number | null): string {
  if (typeof vote !== "number" || vote <= 0) return "NR";
  return vote.toFixed(1);
}

/** 0-10 vote average as a 0-100 percentage. */
export function ratingPercent(vote?: number | null): number {
  if (typeof vote !== "number" || vote <= 0) return 0;
  return Math.round(Math.min(Math.max(vote, 0), 10) * 10);
}

export function formatVoteCount(count?: number | null): string {
  if (!count || count <= 0) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function formatCurrency(amount?: number | null): string {
  if (!amount || amount <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

/** Zero-padded season/episode label: (2, 7) -> "S02E07" */
export function episodeLabel(season: number, episode: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `S${pad(season)}E${pad(episode)}`;
}
