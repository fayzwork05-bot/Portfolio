import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { League_Gothic, Days_One, Dela_Gothic_One, Sancreek, Bebas_Neue, Barlow_Condensed } from "next/font/google";
import { site } from "@/data/site";
import "./globals.css";

// Hero lettering candidates supplied by the client (OFL, single weight 400): src/fonts/*.ttf
const anton = localFont({ src: "../fonts/Anton-Regular.ttf", weight: "400", variable: "--font-anton", display: "swap" });
const bebasLocal = localFont({ src: "../fonts/BebasNeue-Regular.ttf", weight: "400", variable: "--font-bebas-local", display: "swap" });
const league = League_Gothic({ subsets: ["latin"], variable: "--font-league", display: "swap" });
const days = Days_One({ subsets: ["latin"], weight: "400", variable: "--font-days", display: "swap" });
const dela = Dela_Gothic_One({ subsets: ["latin"], weight: "400", variable: "--font-dela", display: "swap" });
const sancreek = Sancreek({ subsets: ["latin"], weight: "400", variable: "--font-sancreek", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-barlow", display: "swap" });

const title = `${site.name} | ${site.role}`;
const description = `Portfolio of ${site.name}, ${site.role.toLowerCase()}. Short-form, commercials, motion graphics and YouTube edits.`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"), // set NEXT_PUBLIC_SITE_URL on Vercel
  title,
  description,
  openGraph: { title, description, type: "website", siteName: site.name },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#e4e4e4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${bebasLocal.variable} ${league.variable} ${days.variable} ${dela.variable} ${sancreek.variable} ${bebas.variable} ${barlow.variable}`}>
      <head>
        {/* Acumin Pro is an Adobe Fonts family: add it to a web project there and set NEXT_PUBLIC_ADOBE_KIT_ID */}
        {process.env.NEXT_PUBLIC_ADOBE_KIT_ID && <link rel="stylesheet" href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_ADOBE_KIT_ID}.css`} />}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
