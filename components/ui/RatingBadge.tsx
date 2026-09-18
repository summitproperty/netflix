import { StarIcon } from "@/components/ui/Icons";
import { formatRating, formatVoteCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface RatingBadgeProps {
  vote: number | null | undefined;
  voteCount?: number | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * TMDB vote average as a compact gold badge. Renders "NR" (not rated) instead of
 * a misleading 0.0 when TMDB has no votes yet.
 */
export function RatingBadge({
  vote,
  voteCount,
  size = "sm",
  className,
}: RatingBadgeProps) {
  const value = formatRating(vote);
  const rated = value !== "NR";
  const votes = formatVoteCount(voteCount);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-gold/25 bg-black/45 font-semibold backdrop-blur",
        rated ? "text-gold" : "text-mist-500",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-sm",
        className,
      )}
      title={
        rated
          ? `Rated ${value} / 10${votes ? ` from ${votes} votes` : ""}`
          : "Not yet rated"
      }
    >
      <StarIcon width={size === "sm" ? 11 : 14} height={size === "sm" ? 11 : 14} />
      {value}
      {votes && size === "md" ? (
        <span className="font-normal text-mist-500">({votes})</span>
      ) : null}
    </span>
  );
}

export default RatingBadge;
