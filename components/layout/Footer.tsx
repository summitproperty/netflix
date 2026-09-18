import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/config/site";

/** Site footer: navigation, legal note and the required TMDB attribution. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/5 bg-ink-900">
      <div className="container-page py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo variant="lockup" size={54} />
            <p className="mt-3 text-sm leading-relaxed text-mist-500">
              {siteConfig.tagline}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-mist-300">
              Browse
            </h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {siteConfig.footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-mist-500 transition-colors hover:text-mist-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-w-xs text-xs leading-relaxed text-mist-500">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-mist-300">
              About this site
            </h2>
            <p>{siteConfig.attribution}</p>
            <p className="mt-2">
              Playback is provided by a third-party embed provider. {siteConfig.name} does
              not host, upload or store any video files.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/5 pt-5 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          {/*
            Kept deliberately small but present: the metadata provider's API
            terms require this credit line. Removing it can get an API key
            revoked, which would empty the whole catalog.
          */}
          <p>
            Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or
            certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
