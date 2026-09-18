"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CheckIcon, PlusIcon, SpinnerIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { toggleMyListAction } from "@/lib/mylist/actions";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "@/types/media";

interface MyListButtonProps {
  item: Pick<
    MediaItem,
    | "id"
    | "mediaType"
    | "title"
    | "posterPath"
    | "backdropPath"
    | "releaseDate"
    | "voteAverage"
    | "href"
  >;
  /** Server-rendered starting state so the icon is correct on first paint. */
  initialInList?: boolean;
  variant?: "primary" | "secondary" | "icon";
  className?: string;
}

/**
 * Add/remove a title from My List. Optimistic: the icon flips immediately and
 * reverts if the server action fails. Signed-out visitors are sent to /login
 * with a redirect back to the title they were looking at.
 */
export function MyListButton({
  item,
  initialInList = false,
  variant = "secondary",
  className,
}: MyListButtonProps) {
  const [inList, setInList] = useState(initialInList);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleClick = () => {
    const optimistic = !inList;
    setInList(optimistic);

    startTransition(async () => {
      const result = await toggleMyListAction({
        mediaType: item.mediaType,
        tmdbId: item.id,
        title: item.title,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        releaseDate: item.releaseDate,
        voteAverage: item.voteAverage,
      });

      if (result.requiresAuth) {
        setInList(false);
        router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
        return;
      }

      if (!result.ok) {
        setInList(!optimistic);
        toast(result.message, "error");
        return;
      }

      setInList(result.inList);
      toast(result.message, "success");
      router.refresh();
    });
  };

  const label = inList ? "Remove from My List" : "Add to My List";
  const icon = pending ? (
    <SpinnerIcon width={16} height={16} />
  ) : inList ? (
    <CheckIcon width={16} height={16} />
  ) : (
    <PlusIcon width={16} height={16} />
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={label}
        aria-pressed={inList}
        title={label}
        className={cn(
          "rounded-full border border-white/15 bg-black/60 p-2 text-mist-100 backdrop-blur transition-all hover:border-brand/60 hover:text-white disabled:opacity-60",
          inList && "border-brand/50 text-brand",
          className,
        )}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={inList}
      className={cn(
        variant === "primary" ? "btn-primary" : "btn-secondary",
        className,
      )}
    >
      {icon}
      {inList ? "In My List" : "Add to My List"}
    </button>
  );
}

export default MyListButton;
