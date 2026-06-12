"use client";

import { useEffect } from "react";
import { useTheme } from "@/state/theme";

export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const { toggle, init } = useTheme.getState();

  // re-assert the persisted/system theme — hydration may strip the class
  // the pre-paint script set on <html>
  useEffect(init, [init]);

  return (
    <button
      onClick={toggle}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      aria-label="Toggle color theme"
      className="panel grid h-8 w-8 cursor-pointer place-items-center rounded-full text-sm transition hover:border-accent/60"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
