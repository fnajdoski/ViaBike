"use client";

import { useEffect, useState } from "react";

/** Tracks connectivity. Assumes online on the server / first paint (no flash),
 * then syncs to navigator.onLine and online/offline events on mount. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
