"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import StaticIntro from "./intro/StaticIntro";

// Motion only loads when the full intro actually plays — kept out of the
// picker's initial JS. StaticIntro covers the screen until the chunk arrives.
const IntroAnimation = dynamic(() => import("./intro/IntroAnimation"), {
  ssr: false,
  loading: () => <StaticIntro />,
});

const SEEN_KEY = "viabike:introSeen";
type Phase = "init" | "static" | "animate" | "done";

function focusPicker() {
  // move focus to the picker without popping the mobile keyboard
  document.getElementById("picker-root")?.focus({ preventScroll: true });
}

/**
 * Decides what the intro does (initial-bundle, no Motion):
 *  - already seen this session → remove instantly (quick fade of the static frame);
 *  - prefers-reduced-motion → a brief static beat, no animation;
 *  - otherwise → the full animated intro (Motion lazy-loaded).
 * The static overlay renders during SSR/first paint so the picker never flashes
 * underneath before the intro appears.
 */
export default function IntroGate() {
  const [phase, setPhase] = useState<Phase>("init");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* no sessionStorage — treat as first load */
    }
    if (seen) {
      setPhase("done");
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    const reduced =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("static");
      const id = setTimeout(() => {
        setPhase("done");
        focusPicker();
      }, 650);
      return () => clearTimeout(id);
    }
    setPhase("animate");
  }, []);

  if (phase === "done") return null;
  if (phase === "animate")
    return (
      <IntroAnimation
        onDone={() => {
          setPhase("done");
          focusPicker();
        }}
      />
    );
  return <StaticIntro />; // init + reduced-motion static beat
}
