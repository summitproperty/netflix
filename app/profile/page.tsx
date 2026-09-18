import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/auth/ProfileForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookmarkIcon, LogoutIcon } from "@/components/ui/Icons";
import { signOutAction } from "@/lib/auth/actions";
import { getProfile, requireUser } from "@/lib/auth/session";
import { countMyList } from "@/services/mylist.service";

/*
 * /profile — account settings. Display name and avatar URL are editable;
 * email and sign-in provider are read-only. Continue Watching (backed by the
 * same watch_progress table) is shown on /dashboard, not here — this page
 * stays focused on account/identity + My List.
 */

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your account name and review your saved titles.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  const [profile, savedCount] = await Promise.all([
    getProfile(user.id).catch(() => null),
    countMyList(user.id).catch(() => 0),
  ]);

  const displayName = profile?.display_name?.trim() || user.displayName;
  const avatarUrl = profile?.avatar_url?.trim() || user.avatarUrl;

  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        title="Your profile"
        description="Update how your name and avatar appear across the app."
      />

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <section className="card-surface p-5 sm:p-6">
          <ProfileForm
            displayName={displayName}
            avatarUrl={avatarUrl}
            email={user.email}
            provider={user.provider}
          />
        </section>

        <aside className="card-surface flex w-full flex-col gap-4 p-5 sm:w-64">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mist-500">
              My List
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">{savedCount}</p>
            <p className="text-xs text-mist-500">
              saved title{savedCount === 1 ? "" : "s"}
            </p>
          </div>

          <Link href="/my-list" className="btn-secondary w-full justify-center">
            <BookmarkIcon width={16} height={16} />
            View My List
          </Link>

          <form action={signOutAction}>
            <button type="submit" className="btn-ghost w-full justify-center">
              <LogoutIcon width={16} height={16} />
              Sign out
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
