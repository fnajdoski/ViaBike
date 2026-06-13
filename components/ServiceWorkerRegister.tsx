"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist-built service worker (public/sw.js) in production
 * only. In dev NODE_ENV !== "production", so nothing registers — the SW is
 * effectively disabled in development, as required.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app still works, just not installable/offline */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
