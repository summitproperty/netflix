import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { BrowseAdDock } from "@/components/ads/dock/BrowseAdDock";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { TelegramJoinPopup } from "@/components/layout/TelegramJoinPopup";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteUrl, siteConfig } from "@/lib/config/site";
import "@/styles/globals.css";

/*
 * Root layout. Fonts, global metadata, the toast provider and the persistent
 * chrome (header + footer) live here; every route only renders its own content.
 */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: getSiteUrl(),
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
 robots: { index: true, follow: true },
verification: {
  other: {
   "d6781cf61265948740ec231e4ec191a58ba41984":
  "d6781cf61265948740ec231e4ec191a58ba41984",
  },
},
alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read once per request and pass a serializable subset to the client navbar.
  const user = await getCurrentUser();
  const viewer = user
    ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      }
    : null;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <ToastProvider>
          <Navbar viewer={viewer} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          {/*
            Browse Mode ad dock: 3 floating videos + 2 banners, fixed to the
            bottom of the viewport. Mounted once here (not per page) so
            navigation never duplicates it; it hides itself on /watch routes.
            Renders nothing until config/ads.ts has at least one tag/snippet
            configured.
          */}
          <BrowseAdDock />
          <TelegramJoinPopup />
        </ToastProvider>
      </body>
    </html>
  );
}
