"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { ProfileMenu, type Viewer } from "@/components/layout/ProfileMenu";
import { SearchBar } from "@/components/search/SearchBar";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

interface NavbarProps {
  viewer: Viewer | null;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sticky header. Transparent over the hero, then fades to a solid bar once the
 * page scrolls. Nav items come from siteConfig, so adding a section is a
 * one-line change there.
 */
export function Navbar({ viewer }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || menuOpen
          ? "border-b border-white/5 bg-ink-900/92 backdrop-blur"
          : "bg-gradient-to-b from-black/80 via-black/35 to-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main navigation"
        className="container-page flex items-center gap-4"
        style={{ height: "var(--nav-height)" }}
      >
        <Logo priority />

        <ul className="ml-2 hidden items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(pathname, item.href)
                    ? "font-semibold text-white"
                    : "text-mist-300 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <SearchBar variant="nav" />
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-full p-2 text-mist-300 transition-colors hover:bg-white/10 hover:text-mist-100 sm:hidden"
          >
            <SearchIcon width={18} height={18} />
          </Link>

          <ProfileMenu viewer={viewer} />

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-mist-300 transition-colors hover:bg-white/10 hover:text-mist-100 md:hidden"
          >
            {menuOpen ? (
              <CloseIcon width={20} height={20} />
            ) : (
              <MenuIcon width={20} height={20} />
            )}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        // The drawer must scroll itself: the effect above locks body scrolling
        // while it is open, so on a short/landscape phone the last items would
        // otherwise be unreachable. `dvh` keeps it correct while mobile browser
        // chrome slides in and out.
        <div
          id="mobile-nav"
          className="max-h-[calc(100dvh-var(--nav-height))] animate-fade-in overflow-y-auto overscroll-contain border-t border-white/5 bg-ink-900/97 md:hidden"
        >
          <div className="container-page py-4">
            <SearchBar variant="page" className="mb-4" />
            <ul className="space-y-1">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-base transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-brand/15 font-semibold text-white"
                        : "text-mist-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {!viewer ? (
                <li className="pt-2">
                  <Link href="/login" className="btn-primary w-full">
                    Sign in
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
