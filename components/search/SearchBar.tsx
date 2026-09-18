"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, SearchIcon, SpinnerIcon } from "@/components/ui/Icons";
import { posterUrl } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils/cn";
import type { MediaItem, PagedMedia } from "@/types/media";

interface SearchBarProps {
  /** "nav" collapses to an icon on small screens; "page" is always expanded. */
  variant?: "nav" | "page";
  initialQuery?: string;
  autoFocus?: boolean;
  className?: string;
}

/** Typing this many characters starts a lookup. One letter is too noisy. */
const MIN_CHARS = 2;
/** Wait this long after the last keystroke before asking the server. */
const DEBOUNCE_MS = 280;
const MAX_SUGGESTIONS = 8;

const TYPE_LABEL = { movie: "Movie", tv: "TV" } as const;

/**
 * Search entry point with live suggestions.
 *
 * Typing shows a dropdown of matching titles (movies and series together)
 * straight away — no need to press Enter. Enter still goes to /search?q=...,
 * so a full result page stays shareable, bookmarkable and back-button friendly.
 *
 * The lookup itself goes to /api/media/search, a narrow server route: the
 * catalog credentials stay on the server and never reach the browser.
 */
export function SearchBar({
  variant = "page",
  initialQuery = "",
  autoFocus = false,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(variant === "page");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showList, setShowList] = useState(false);
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** Monotonic id: a slow earlier response must never overwrite a newer one. */
  const requestId = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setValue(initialQuery), [initialQuery]);

  useEffect(() => {
    if (open && variant === "nav") inputRef.current?.focus();
  }, [open, variant]);
  // Debounced lookup. Cancels in-flight work when the term changes again.
  useEffect(() => {
    const term = value.trim();

    if (term.length < MIN_CHARS) {
      requestId.current += 1;
      setItems([]);
      setLoading(false);
      setFailed(false);
      setActive(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const id = requestId.current + 1;
      requestId.current = id;
      setLoading(true);
      setFailed(false);

      try {
        const params = new URLSearchParams({ q: term, page: "1", type: "multi" });
        const response = await fetch(`/api/media/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = (await response.json()) as PagedMedia;
        if (id !== requestId.current) return;
        setItems(data.items.slice(0, MAX_SUGGESTIONS));
        setActive(-1);
      } catch {
        if (controller.signal.aborted) return;
        if (id !== requestId.current) return;
        setItems([]);
        setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // On /search itself the grid follows what is being typed, so the page never
  // feels stuck behind an Enter press. replace() keeps the back button clean.
  // Elsewhere (e.g. the mobile drawer) typing must not navigate on its own.
  useEffect(() => {
    if (variant !== "page" || pathname !== "/search") return;
    const term = value.trim();
    if (term === initialQuery.trim()) return;
    if (term.length > 0 && term.length < MIN_CHARS) return;

    const timer = setTimeout(() => {
      router.replace(term.length > 0 ? `/search?q=${encodeURIComponent(term)}` : "/search", {
        scroll: false,
      });
    }, 480);
    return () => clearTimeout(timer);
  }, [initialQuery, pathname, router, value, variant]);

  // Clicking anywhere else closes the dropdown.
  useEffect(() => {
    if (!showList) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [showList]);
  const closeList = useCallback(() => {
    setShowList(false);
    setActive(-1);
  }, []);

  const goToResults = useCallback(
    (term: string) => {
      const query = term.trim();
      if (query.length === 0) {
        inputRef.current?.focus();
        return;
      }
      closeList();
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [closeList, router],
  );

  const openItem = useCallback(
    (item: MediaItem) => {
      closeList();
      setValue(item.title);
      router.push(item.href);
    },
    [closeList, router],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (active >= 0 && items[active]) {
      openItem(items[active]);
      return;
    }
    goToResults(value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (showList) {
        closeList();
        return;
      }
      if (variant === "nav") setOpen(false);
      return;
    }
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowList(true);
      setActive((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setShowList(true);
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
    }
  };

  const term = value.trim();
  const listId = `search-suggestions-${variant}`;
  const listVisible =
    showList && term.length >= MIN_CHARS && (items.length > 0 || loading || failed);
  if (variant === "nav" && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="rounded-full p-2 text-mist-300 transition-colors hover:bg-white/10 hover:text-mist-100"
      >
        <SearchIcon width={18} height={18} />
      </button>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form role="search" onSubmit={submit} className="flex items-center">
        <label htmlFor={`search-${variant}`} className="sr-only">
          Search movies and TV shows
        </label>
        <div className="relative flex-1">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500"
          />
          <input
            id={`search-${variant}`}
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-expanded={listVisible}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 && items[active]
                ? `${listId}-${items[active].mediaType}-${items[active].id}`
                : undefined
            }
            onChange={(event) => {
              setValue(event.target.value);
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            onKeyDown={onKeyDown}
            placeholder="Search movies, TV shows..."
            enterKeyHint="search"
            maxLength={120}
            className={cn(
              "field !pl-9",
              variant === "nav" ? "w-44 sm:w-64" : "w-full !py-3 !pl-10 !text-base",
            )}
          />
          {loading ? (
            <SpinnerIcon
              width={15}
              height={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-500"
            />
          ) : null}
        </div>
        {variant === "nav" ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              closeList();
              setOpen(false);
            }}
            aria-label="Close search"
            className="ml-1 rounded-full p-1.5 text-mist-500 transition-colors hover:text-mist-100"
          >
            <CloseIcon width={16} height={16} />
          </button>
        ) : (
          <button type="submit" className="btn-primary ml-2 shrink-0">
            Search
          </button>
        )}
      </form>
      {/* Live suggestions. Absolutely positioned so it never shifts the page. */}
      {listVisible ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-800/98 shadow-2xl backdrop-blur"
        >
          {items.length > 0 ? (
            <ul className="max-h-[min(70vh,26rem)] overflow-y-auto py-1">
              {items.map((item, index) => {
                const thumb = posterUrl(item.posterPath, "w185");
                return (
                  <li key={`${item.mediaType}-${item.id}`}>
                    <button
                      id={`${listId}-${item.mediaType}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => openItem(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        index === active ? "bg-white/10" : "hover:bg-white/5",
                      )}
                    >
                      <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-ink-700">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-mist-100">
                          {item.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-mist-500">
                          <span className="rounded border border-white/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">
                            {TYPE_LABEL[item.mediaType]}
                          </span>
                          {item.year ? <span>{item.year}</span> : null}
                          {item.voteAverage > 0 ? (
                            <span className="text-gold">★ {item.voteAverage.toFixed(1)}</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-mist-500">
              {loading
                ? "Searching..."
                : failed
                  ? "Could not load suggestions. Press Enter to try the full search."
                  : `Nothing found for “${term}”.`}
            </p>
          )}

          <button
            type="button"
            onClick={() => goToResults(value)}
            className="flex w-full items-center justify-between border-t border-white/10 px-3 py-2.5 text-left text-xs font-semibold text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-100"
          >
            <span className="truncate">See all results for “{term}”</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </div>
  );




}

export default SearchBar;
