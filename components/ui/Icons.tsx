import type { SVGProps } from "react";

/**
 * Inline icon set (no icon dependency, no runtime cost).
 * All icons inherit `currentColor` and are hidden from screen readers; label
 * the interactive element instead.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width={20}
      height={20}
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      width={20}
      height={20}
      {...props}
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.3-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m15 6-6 6 6 6" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 6 6 6-6 6" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      width={16}
      height={16}
      {...props}
    >
      <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85L12 3.6z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Base>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 12H4.5M8 8.5 4.5 12 8 15.5" />
      <path d="M11 5h6.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5H11" />
    </Base>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 4.5h12v15l-6-3.6-6 3.6v-15z" />
    </Base>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.5 3 19.5h18L12 4.5z" />
      <path d="M12 10v4.2M12 17h.01" />
    </Base>
  );
}

export function FilmIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M8 4.5v15M16 4.5v15M3 12h18M3 8.2h5M3 15.8h5M16 8.2h5M16 15.8h5" />
    </Base>
  );
}

export function TvIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m8 3 4 3 4-3" />
    </Base>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5z" />
    </Base>
  );
}

export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      width={20}
      height={20}
      className={`animate-spin ${className ?? ""}`}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      width={20}
      height={20}
      {...props}
    >
      <path d="M21.05 3.87 2.7 11.02c-1.25.5-1.24 1.19-.23 1.5l4.7 1.47 1.8 5.62c.22.6.38.84.78.84.4 0 .58-.18.8-.4l1.92-1.87 4 2.95c.73.4 1.26.2 1.44-.68l2.6-12.28c.28-1.15-.42-1.66-1.46-1.3ZM7.9 13.44l9.6-6.06c.45-.28.86-.13.52.18l-8.16 7.38-.32 3.42-1.64-4.92Z" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      width={18}
      height={18}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.06-1.36-.18-2H12v3.79h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.22c1.88-1.73 2.98-4.28 2.98-7.32z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.22-2.5c-.9.6-2.05.95-3.4.95a6 6 0 0 1-5.63-4.14H3.05v2.6A9.98 9.98 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.37 13.87a5.99 5.99 0 0 1 0-3.74v-2.6H3.05a9.98 9.98 0 0 0 0 8.94l3.32-2.6z"
      />
      <path
        fill="#EA4335"
        d="M12 6.05c1.47 0 2.79.5 3.83 1.5l2.85-2.85A9.6 9.6 0 0 0 12 2a9.98 9.98 0 0 0-8.95 5.53l3.32 2.6A6 6 0 0 1 12 6.05z"
      />
    </svg>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 20V10l4.5-6.2a1.5 1.5 0 0 1 2.7 1V9h4.6a2 2 0 0 1 1.95 2.44l-1.4 6.2A2 2 0 0 1 17.45 19H10a3 3 0 0 1-3-3" />
      <path d="M7 20H4.5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4.5 10H7" />
    </Base>
  );
}

export function ThumbsDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 4v10l-4.5 6.2a1.5 1.5 0 0 1-2.7-1V15H5.2a2 2 0 0 1-1.95-2.44l1.4-6.2A2 2 0 0 1 6.55 5H14a3 3 0 0 1 3 3" />
      <path d="M17 4h2.5A1.5 1.5 0 0 1 21 5.5v7a1.5 1.5 0 0 1-1.5 1.5H17" />
    </Base>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  );
}
