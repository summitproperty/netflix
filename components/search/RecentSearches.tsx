"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { ClockIcon, CloseIcon, SpinnerIcon } from "@/components/ui/Icons";
import { clearSearchHistoryAction, removeSearchHistoryEntryAction } from "@/lib/search-history/actions";
import type { SearchHistoryEntry } from "@/services/search-history.service";

interface RecentSearchesProps {
  entries: SearchHistoryEntry[];
}

/**
 * Recent-searches chips for the empty-query state of /search. Server-backed
 * (see services/search-history.service.ts), so this is only ever rendered
 * for a signed-in viewer with at least one saved search — the caller
 * decides that, this component just renders what it's given.
 */
export function RecentSearches({ entries }: RecentSearchesProps) {
  const [items, setItems] = useState(entries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [clearing, startClearing] = useTransition();

  if (items.length === 0) return null;

  const removeOne = (id: string) => {
    setPendingId(id);
    const previous = items;
    setItems((current) => current.filter((entry) => entry.id !== id));

    void removeSearchHistoryEntryAction(id).then((result) => {
      setPendingId(null);
      if (!result.ok) setItems(previous);
    });
  };

  const clearAll = () => {
    const previous = items;
    startClearing(async () => {
      const result = await clearSearchHistoryAction();
      if (result.ok) {
        setItems([]);
      } else {
        setItems(previous);
      }
    });
  };

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mist-500">
          <ClockIcon width={14} height={14} />
          Recent searches
        </p>
        <button
          type="button"
          onClick={clearAll}
          disabled={clearing}
          className="text-xs font-medium text-mist-500 transition hover:text-mist-100 disabled:opacity-60"
        >
          {clearing ? "Clearing…" : "Clear all"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((entry) => (
          <span
            key={entry.id}
            className="group flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-sm text-mist-300"
          >
            <Link href={`/search?q=${encodeURIComponent(entry.query)}`} className="hover:text-mist-100">
              {entry.query}
            </Link>
            <button
              type="button"
              onClick={() => removeOne(entry.id)}
              disabled={pendingId === entry.id}
              aria-label={`Remove "${entry.query}" from recent searches`}
              className="rounded-full p-1 text-mist-500 transition hover:bg-white/10 hover:text-mist-100 disabled:opacity-60"
            >
              {pendingId === entry.id ? (
                <SpinnerIcon width={12} height={12} />
              ) : (
                <CloseIcon width={12} height={12} />
              )}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default RecentSearches;
