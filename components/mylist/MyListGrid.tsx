"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { BookmarkIcon, CloseIcon, PlayIcon, SpinnerIcon } from "@/components/ui/Icons";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { useToast } from "@/components/ui/Toast";
import { removeFromMyListAction } from "@/lib/mylist/actions";
import { posterUrl } from "@/lib/tmdb/images";
import type { MediaItem } from "@/types/media";

interface MyListGridProps {
  items: MediaItem[];
}

/** My List page grid: poster cards with an inline remove control. */
export function MyListGrid({ items }: MyListGridProps) {
  const [list, setList] = useState(items);
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set());
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const remove = (item: MediaItem) => {
    const key = `${item.mediaType}-${item.id}`;
    // A Set, because two cards can be removed at once; a single key would clear
    // the first card's spinner as soon as the second request started.
    setRemoving((current) => new Set(current).add(key));
    setList((current) =>
      current.filter((entry) => `${entry.mediaType}-${entry.id}` !== key),
    );

    startTransition(async () => {
      const result = await removeFromMyListAction(item.mediaType, item.id);
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      if (!result.ok) {
        // Functional update: re-inserting a captured snapshot would resurrect
        // titles that other cards removed while this request was in flight.
        setList((current) =>
          current.some((entry) => `${entry.mediaType}-${entry.id}` === key)
            ? current
            : [...current, item].sort(
                (a, b) => items.indexOf(a) - items.indexOf(b),
              ),
        );
        toast(result.message, "error");
        return;
      }
      toast(`Removed ${item.title} from My List.`, "success");
    });
  };

  if (list.length === 0) {
    return (
      <EmptyState
        title="Your list is empty"
        message="Add movies and shows with the Add to My List button and they will appear here, ready to watch."
        icon={<BookmarkIcon width={22} height={22} />}
        action={{ href: "/", label: "Browse titles" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 xl:grid-cols-7">
      {list.map((item) => {
        const key = `${item.mediaType}-${item.id}`;
        const poster = posterUrl(item.posterPath, "w342");
        const busy = removing.has(key);

        return (
          <article key={key} className="group/card relative">
            <Link href={item.href} className="block" aria-label={`${item.title} details`}>
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/5 bg-ink-700 shadow-card transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:border-brand/40">
                {poster ? (
                  <Image
                    src={poster}
                    alt={`${item.title} poster`}
                    fill
                    sizes="(max-width: 440px) 44vw, 190px"
                    className="object-cover transition-transform duration-500 group-hover/card:scale-[1.05]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-mist-500">
                    {item.title}
                  </div>
                )}
                <RatingBadge vote={item.voteAverage} className="absolute left-1.5 top-1.5" />
              </div>
              <h3 className="mt-2 line-clamp-1 text-sm font-medium text-mist-100">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-mist-500">
                {item.mediaType === "movie" ? "Movie" : "TV"}
                {item.year ? ` · ${item.year}` : ""}
              </p>
            </Link>

            <button
              type="button"
              onClick={() => remove(item)}
              disabled={busy}
              aria-label={`Remove ${item.title} from My List`}
              className="absolute right-1.5 top-1.5 rounded-full border border-white/15 bg-black/70 p-1.5 text-mist-300 backdrop-blur transition-colors hover:border-brand/60 hover:text-white disabled:opacity-60"
            >
              {busy ? (
                <SpinnerIcon width={13} height={13} />
              ) : (
                <CloseIcon width={13} height={13} />
              )}
            </button>

            <Link
              href={item.watchHref}
              className="btn-primary mt-2 w-full !px-2 !py-1.5 text-xs"
            >
              <PlayIcon width={12} height={12} />
              Watch
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default MyListGrid;
