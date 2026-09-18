import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/PageHeader";
import { BookmarkIcon, FilmIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { ContinueWatchingRow } from "@/components/media/ContinueWatchingRow";
import { requireUser } from "@/lib/auth/session";
import { publicEnv } from "@/lib/config/env";
import { countMyList } from "@/services/mylist.service";
import { getContinueWatching } from "@/services/watch-progress.service";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Nafij Netflix account dashboard.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [savedCount, continueWatching] = await Promise.all([
    countMyList(user.id).catch(() => 0),
    publicEnv.watchProgressEnabled
      ? getContinueWatching(user.id).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <div className="page-shell">
      <PageHeader
        title={`Welcome, ${user.displayName}`}
        description="Your account is ready. Choose what you want to do next."
      />

      <ContinueWatchingRow items={continueWatching} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardLink href="/movies" icon={<FilmIcon width={20} height={20} />} title="Browse movies" description="Explore movies and start watching." />
        <DashboardLink href="/tv" icon={<FilmIcon width={20} height={20} />} title="Browse TV shows" description="Find series and episodes." />
        <DashboardLink href="/my-list" icon={<BookmarkIcon width={20} height={20} />} title="My List" description={`${savedCount} saved title${savedCount === 1 ? "" : "s"}.`} />
        <DashboardLink href="/search" icon={<SearchIcon width={20} height={20} />} title="Search" description="Find a movie or show quickly." />
      </div>

      <section className="mt-6 card-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-hover">
            <UserIcon width={20} height={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-mist-100">Account</h2>
            <p className="mt-1 truncate text-sm text-mist-500">{user.email}</p>
            <p className="mt-1 text-xs text-mist-500">Signed in with {user.provider === "google" ? "Google" : "email"}.</p>
          </div>
          <Link href="/profile" className="ml-auto shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-mist-300 transition hover:bg-white/5">
            Manage profile
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="card-surface group p-5 transition hover:-translate-y-0.5 hover:border-white/15">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-mist-300 transition group-hover:bg-brand/15 group-hover:text-brand-hover">
        {icon}
      </span>
      <h2 className="mt-4 text-sm font-semibold text-mist-100">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-mist-500">{description}</p>
    </Link>
  );
}
