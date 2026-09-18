import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

/** 404 page, also used by notFound() from invalid movie/TV ids. */
export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Logo variant="lockup" size={72} href={null} />
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        We could not find that title
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-500">
        The page you were looking for does not exist, or the title was removed from
        the catalog. Try searching for it instead.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/search" className="btn-secondary">
          Search the catalog
        </Link>
      </div>
    </div>
  );
}
