"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BookmarkIcon, ChevronDownIcon, LogoutIcon, UserIcon } from "@/components/ui/Icons";
import { signOutAction } from "@/lib/auth/actions";

/** Serializable subset of the session user (keeps this file free of server imports). */
export interface Viewer {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ProfileMenuProps {
  viewer: Viewer | null;
}

/** Account dropdown. Signed-out visitors get a plain Sign in link instead. */
export function ProfileMenu({ viewer }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!viewer) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-xs sm:text-sm">
          Sign in
        </Link>
        <Link href="/signup" className="btn-primary !px-3.5 !py-1.5 text-xs sm:text-sm">
          Sign up
        </Link>
      </div>
    );
  }

  const initial = (viewer.displayName || viewer.email || "?").charAt(0).toUpperCase();

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1 pr-2 transition-colors hover:border-white/25"
      >
        {viewer.avatarUrl ? (
          <Image
            src={viewer.avatarUrl}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {initial}
          </span>
        )}
        <ChevronDownIcon width={14} height={14} className="text-mist-500" />
        <span className="sr-only">Account menu</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="card-surface absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 animate-fade-up overflow-hidden p-1 shadow-card"
        >
          <div className="border-b border-white/5 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-mist-100">
              {viewer.displayName}
            </p>
            <p className="truncate text-xs text-mist-500">{viewer.email}</p>
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-100"
          >
            <UserIcon width={16} height={16} />
            Profile
          </Link>
          <Link
            href="/my-list"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-100"
          >
            <BookmarkIcon width={16} height={16} />
            My List
          </Link>

          <form action={signOutAction} className="border-t border-white/5 pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist-300 transition-colors hover:bg-brand/15 hover:text-mist-100"
            >
              <LogoutIcon width={16} height={16} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
