import type { Metadata } from "next";
import { Inter, Saira_Condensed } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "RideCost — motorcycle trip cost & rest-stop planner",
  description:
    "Knows your bike: total trip cost with per-country fuel, motorcycle tolls and vignettes, plus range-based fuel stops and cadence-based rest stops.",
};

/** Runs before paint: stored theme wins, else prefers-color-scheme, else light. */
const themeInit = `(function(){try{var t=localStorage.getItem("ridecost.theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${saira.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
