import type { NextConfig } from "next";

// Serwist runs in *configurator mode* (see serwist.config.mjs) so the service
// worker is built by @serwist/cli AFTER `next build`, with no webpack config
// injected here — the app keeps building on Turbopack. SW generation is simply
// skipped in dev (we never run `serwist build` for `next dev`).
const nextConfig: NextConfig = {};

export default nextConfig;
