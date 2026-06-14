"use client";

import { useEffect } from "react";
import { LOCALES, useLocale } from "@/state/locale";

/** Compact EN/MK toggle; sits beside the theme toggle in the header. */
export default function LanguageSwitcher() {
  const locale = useLocale((s) => s.locale);
  const { setLocale, init } = useLocale.getState();

  // adopt persisted / browser locale on mount (default en before this)
  useEffect(init, [init]);

  return (
    <div className="panel inline-flex overflow-hidden rounded-full p-0.5 text-[11px]" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`cursor-pointer rounded-full px-2.5 py-1 uppercase transition ${
            locale === l ? "bg-accent font-semibold text-night" : "text-mute hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
