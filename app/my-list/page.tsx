import type { Metadata } from "next";

import { MyListGrid } from "@/components/mylist/MyListGrid";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth/session";
import { logError } from "@/lib/utils/errors";
import { getMyList } from "@/services/mylist.service";
import type { MediaItem } from "@/types/media";

/*
 * /my-list — signed-in only. requireUser() redirects to
 * /login?redirect=/my-list, matching the middleware guard.
 */

export const metadata: Metadata = {
  title: "My List",
  description: "The movies and series you saved to watch later.",
  robots: { index: false, follow: false },
};

export default async function MyListPage() {
  // Outside the try/catch on purpose: requireUser() throws Next's redirect
  // signal, which must never be swallowed by the database error handler below.
  const user = await requireUser("/my-list");

  let items: MediaItem[] = [];
  let failed = false;

  try {
    items = await getMyList(user.id);
  } catch (error) {
    logError("my-list/page", error);
    failed = true;
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="My List"
        description={
          items.length > 0
            ? `${items.length} saved title${items.length === 1 ? "" : "s"}.`
            : "Everything you save shows up here, on every device you sign in on."
        }
      />

      {failed ? (
        <ErrorState
          title="We could not load your list"
          message="Your saved titles are safe — the database just did not respond. Please refresh in a moment."
          action={{ href: "/my-list", label: "Try again" }}
        />
      ) : (
        <MyListGrid items={items} />
      )}
    </div>
  );
}
