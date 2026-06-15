"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/state/locale";
import { INTRO_ROUTE_D } from "./StaticIntro";

/**
 * "The route draws the logo." A blue route line sweeps across (SVG pathLength),
 * resolves into the VIABIKE wordmark (outline strokes in → solid fills, glow
 * pulse), holds, then the whole overlay lifts/dissolves upward as the picker
 * shows beneath. Skippable on any pointer/key. Only transform/opacity/pathLength
 * animate (compositor-friendly). LazyMotion + `m` keep the bundle lean, and the
 * whole module is dynamically imported so it never bloats the picker's JS.
 */
export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);

  // Signal done exactly once — never rely solely on the exit animation
  // completing, so a backgrounded tab (rAF paused mid-exit) can't get stuck.
  const triggerDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout>;
    const startExit = () => {
      setVisible(false); // plays the lift/dissolve exit
      exitTimer = setTimeout(triggerDone, 600); // guaranteed removal regardless of rAF
    };
    const playTimer = setTimeout(startExit, 2000);
    const skip = () => {
      clearTimeout(playTimer);
      startExit();
    };
    window.addEventListener("pointerdown", skip, { passive: true });
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(playTimer);
      clearTimeout(exitTimer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [triggerDone]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence onExitComplete={triggerDone}>
        {visible && (
          <m.div
            key="intro"
            className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-night"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -48 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <m.div
              className="hero-grid pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative px-6 text-center">
              <svg
                viewBox="0 0 620 170"
                className="mx-auto mb-2 w-[min(80vw,420px)]"
                fill="none"
                aria-hidden
                style={{ filter: "drop-shadow(0 0 7px var(--color-accent))" }}
              >
                <m.path
                  d={INTRO_ROUTE_D}
                  stroke="var(--color-accent)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.3 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.95, ease: "easeInOut" }}
                />
              </svg>

              <div className="relative inline-block">
                {/* glow pulse behind the wordmark */}
                <m.div
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{ background: "radial-gradient(ellipse at center, var(--color-accent), transparent 70%)" }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 0.35, 0.18], scale: [0.7, 1.15, 1] }}
                  transition={{ delay: 1.0, duration: 0.9, times: [0, 0.5, 1] }}
                />
                {/* outline strokes in first */}
                <m.span
                  aria-hidden
                  className="wordmark-outline block text-5xl tracking-[0.12em] sm:text-7xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                >
                  VIABIKE
                </m.span>
                {/* then the solid fill appears over it */}
                <m.h1
                  className="wordmark-solid absolute inset-0 text-5xl tracking-[0.12em] sm:text-7xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.05, duration: 0.45 }}
                >
                  VIA<span className="text-accent">BIKE</span>
                </m.h1>
              </div>

              <m.p
                className="text-mute mt-4 text-[11px] uppercase tracking-[0.35em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.35, duration: 0.4 }}
              >
                {t("intro.tagline")}
              </m.p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
