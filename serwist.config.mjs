import { serwist } from "@serwist/next/config";

// Configurator mode: built by `serwist build` after `next build`, so the
// precache manifest can include Next's prerendered routes. Turbopack-clean —
// nothing is injected into next.config.ts.
export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});
