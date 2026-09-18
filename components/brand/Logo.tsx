import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Emblem only (nav, mobile) or emblem + wordmark (auth screens, footer). */
  variant?: "mark" | "lockup";
  /** Rendered height in px; width follows the artwork ratio. */
  size?: number;
  /** Wrap in a link to the homepage. */
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Brand logo. The artwork itself is configured in lib/config/site.ts, so
 * re-branding means swapping the file paths there (or replacing
 * public/brand/source-logo.png and re-running scripts/generate-branding.py).
 */

/** "Nafij Netflix" -> ["Nafij", "Netflix"], so the wordmark follows siteConfig. */
const [wordmarkTop, ...restOfName] = siteConfig.name.split(" ");
const wordmarkBottom = restOfName.join(" ");

export function Logo({
  variant = "mark",
  size = 36,
  href = "/",
  showWordmark = true,
  className,
  priority = false,
}: LogoProps) {
  const isLockup = variant === "lockup";
  const src = isLockup ? siteConfig.logoLockup : siteConfig.logoMark;
  const width = isLockup ? Math.round(size * 1.06) : size;

  const art = (
    <Image
      src={src}
      alt={`${siteConfig.name} logo`}
      width={width}
      height={size}
      priority={priority}
      sizes={`${width}px`}
      className="h-full w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
    />
  );

  const content = (
    <span
      className={cn("flex items-center gap-2.5", className)}
      style={{ height: size }}
    >
      {art}
      {!isLockup && showWordmark ? (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-[15px] font-extrabold uppercase tracking-[0.16em] text-mist-100">
            {wordmarkTop}
          </span>
          {wordmarkBottom ? (
            <span className="text-[15px] font-extrabold uppercase tracking-[0.16em] text-brand">
              {wordmarkBottom}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className="shrink-0 rounded transition-opacity hover:opacity-85"
    >
      {content}
    </Link>
  );
}

export default Logo;
