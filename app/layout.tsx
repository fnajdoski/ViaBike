import type { Metadata, Viewport } from "next";
import { Inter, Saira_Condensed } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import InstallBanner from "@/components/InstallBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SessionManager from "@/components/SessionManager";

// Inter carries Cyrillic so Macedonian body text renders cleanly. Saira
// Condensed is Latin-only (display/wordmark); translated display headings fall
// back per-glyph to Inter via the font stack in globals.css.
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-body" });
const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "RideCost — motorcycle trip cost & rest-stop planner",
  description:
    "Knows your bike: total trip cost with per-country fuel, motorcycle tolls and vignettes, plus range-based fuel stops and cadence-based rest stops.",
  applicationName: "RideCost",
  appleWebApp: { capable: true, title: "RideCost", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // match the light/dark token backgrounds so the browser/OS chrome blends in
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edeff2" },
    { media: "(prefers-color-scheme: dark)", color: "#07090d" },
  ],
};

/** Runs before paint: stored theme wins, else prefers-color-scheme, else light. */
const themeInit = `(function(){try{var t=localStorage.getItem("ridecost.theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${saira.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <SessionManager />
        {children}
        <InstallBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
