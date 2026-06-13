import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideCost — motorcycle trip cost & rest-stop planner",
    short_name: "RideCost",
    description:
      "Knows your bike: total trip cost with per-country fuel, motorcycle tolls and vignettes, plus range-based fuel stops and cadence-based rest stops.",
    start_url: "/",
    display: "standalone",
    background_color: "#edeff2",
    theme_color: "#edeff2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
