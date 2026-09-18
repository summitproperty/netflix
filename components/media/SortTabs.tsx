import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export interface SortOption {
  value: string;
  label: string;
}

interface SortTabsProps {
  /** Base path the tabs link to, e.g. "/movies". */
  basePath: string;
  options: SortOption[];
  active: string;
  className?: string;
}

/**
 * Sort switcher rendered as real links (?sort=...), so each view is shareable
 * and works without JavaScript.
 */
export function SortTabs({ basePath, options, active, className }: SortTabsProps) {
  return (
    <nav aria-label="Sort" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => {
        const selected = option.value === active;
        return (
          <Link
            key={option.value}
            href={`${basePath}?sort=${option.value}`}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              selected
                ? "bg-brand text-white"
                : "border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default SortTabs;
