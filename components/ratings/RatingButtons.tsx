"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SpinnerIcon, ThumbsDownIcon, ThumbsUpIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { setRatingAction } from "@/lib/ratings/actions";
import { cn } from "@/lib/utils/cn";
import type { MediaType } from "@/types/tmdb";

interface RatingButtonsProps {
  mediaType: MediaType;
  tmdbId: number;
  /** Path to revalidate after a change — the detail page itself. */
  detailPath: string;
  /** Server-rendered starting state so the buttons are correct on first paint. */
  initialRating?: 1 | -1 | null;
  className?: string;
}

/**
 * Like/dislike. Optimistic, same shape as MyListButton: the pressed state
 * flips immediately and reverts if the server action fails. Clicking the
 * already-active choice clears it. Signed-out visitors are sent to /login.
 */
export function RatingButtons({
  mediaType,
  tmdbId,
  detailPath,
  initialRating = null,
  className,
}: RatingButtonsProps) {
  const [rating, setRatingState] = useState<1 | -1 | null>(initialRating);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const vote = (value: 1 | -1) => {
    const optimistic = rating === value ? null : value;
    setRatingState(optimistic);

    startTransition(async () => {
      const result = await setRatingAction(mediaType, tmdbId, value, detailPath);

      if (result.requiresAuth) {
        setRatingState(rating);
        router.push(`/login?redirect=${encodeURIComponent(detailPath)}`);
        return;
      }

      if (!result.ok) {
        setRatingState(rating);
        toast(result.message, "error");
        return;
      }

      setRatingState(result.rating);
    });
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)} role="group" aria-label="Rate this title">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={pending}
        aria-pressed={rating === 1}
        aria-label="Like"
        title="Like"
        className={cn(
          "rounded-full border border-white/15 bg-black/60 p-2 text-mist-100 backdrop-blur transition-all hover:border-brand/60 hover:text-white disabled:opacity-60",
          rating === 1 && "border-emerald-400/60 text-emerald-300",
        )}
      >
        {pending && rating === 1 ? (
          <SpinnerIcon width={16} height={16} />
        ) : (
          <ThumbsUpIcon width={16} height={16} />
        )}
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={pending}
        aria-pressed={rating === -1}
        aria-label="Dislike"
        title="Dislike"
        className={cn(
          "rounded-full border border-white/15 bg-black/60 p-2 text-mist-100 backdrop-blur transition-all hover:border-brand/60 hover:text-white disabled:opacity-60",
          rating === -1 && "border-brand/60 text-brand",
        )}
      >
        {pending && rating === -1 ? (
          <SpinnerIcon width={16} height={16} />
        ) : (
          <ThumbsDownIcon width={16} height={16} />
        )}
      </button>
    </div>
  );
}

export default RatingButtons;
