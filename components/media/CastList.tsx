import Image from "next/image";

import { UserIcon } from "@/components/ui/Icons";
import { profileUrl } from "@/lib/tmdb/images";
import type { CastMember } from "@/types/media";

interface CastListProps {
  cast: CastMember[];
  title?: string;
  limit?: number;
}

/** Horizontal cast rail with a graceful fallback when a headshot is missing. */
export function CastList({ cast, title = "Top billed cast", limit = 18 }: CastListProps) {
  if (cast.length === 0) return null;
  const people = cast.slice(0, limit);

  return (
    <section aria-labelledby="cast-heading">
      <h2 id="cast-heading" className="section-title mb-3">
        {title}
      </h2>
      <div className="rail">
        {people.map((person) => {
          const photo = profileUrl(person.profilePath, "w185");
          return (
            <figure key={`${person.id}-${person.role}`} className="w-[112px] shrink-0">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/5 bg-ink-700">
                {photo ? (
                  <Image
                    src={photo}
                    alt={person.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-mist-500">
                    <UserIcon width={28} height={28} />
                  </div>
                )}
              </div>
              <figcaption className="mt-1.5">
                <span className="line-clamp-2 block text-xs font-medium text-mist-100">
                  {person.name}
                </span>
                {person.role ? (
                  <span className="line-clamp-2 mt-0.5 block text-[11px] text-mist-500">
                    {person.role}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

export default CastList;
