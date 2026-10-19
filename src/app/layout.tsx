import type { Metadata, Viewport } from "next";
import { Caprasimo, EB_Garamond, Figtree, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { DemoBanner } from "@/components/DemoBanner";
import { MembersProvider } from "@/components/MembersProvider";
import { Grain } from "@/components/ui/Grain";
import { SITE } from "@/config/site";
import { PLAYER_COOKIE } from "@/lib/auth";
import { getMembers } from "@/lib/session";
import "./globals.css";

// Caprasimo is display, Figtree is body, the mono is for the Manifesto and Time Bombs.
const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caprasimo",
});
const figtree = Figtree({ subsets: ["latin"], display: "swap", variable: "--font-figtree" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono-face" });
// Prophecies only, and only ever italic.
const garamond = EB_Garamond({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-eb-garamond",
});

const TITLE = SITE.name;
const DESCRIPTION = "For 100 days, behave as if the lives you want are available to you.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  // Rooms are private; the public /about page opts back in.
  robots: { index: false, follow: false },
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: TITLE, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  appleWebApp: { capable: true, statusBarStyle: "default", title: SITE.shortName },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#4a2c17", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Only a signed-in player gets the member map: /about is public and indexable, so it must not carry names.
  // The fallback keeps /about and /setup rendering before the database is migrated; pages that need data fail on their own query.
  const members = (await cookies()).has(PLAYER_COOKIE) ? await getMembers().catch(() => ({})) : {};
  return (
    <html
      lang="en"
      className={`${caprasimo.variable} ${figtree.variable} ${mono.variable} ${garamond.variable}`}
    >
      <body className="min-h-dvh relative">
        <MembersProvider members={members}>
          <DemoBanner />
          {children}
        </MembersProvider>
        <Grain />
      </body>
    </html>
  );
}
