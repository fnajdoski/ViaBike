import { spawnSync } from "node:child_process";
import { serwist } from "@serwist/next/config";

// Configurator mode: built by `serwist build` after `next build`, so the
// precache manifest can include Next's prerendered routes. Turbopack-clean —
// nothing is injected into next.config.ts.
const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || String(Date.now());

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // precache the app shell so the installed PWA opens with no network
  additionalPrecacheEntries: [{ url: "/", revision }],
});
