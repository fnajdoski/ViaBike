"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { en, type MessageKey } from "@/lib/i18n/en";
import { mk } from "@/lib/i18n/mk";

export type Locale = "en" | "mk";
export const LOCALES: Locale[] = ["en", "mk"];

const STORAGE_KEY = "viabike.locale";
const catalogs: Record<Locale, Record<MessageKey, string>> = { en, mk };

type Params = Record<string, string | number>;

function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/**
 * Locale state. English is the default (server + first client paint, so no
 * hydration mismatch); init() adopts the stored choice, else the browser
 * language, on mount.
 */
export const useLocale = create<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  init: () => void;
}>((set, get) => ({
  locale: "en",
  setLocale: (locale) => {
    document.documentElement.setAttribute("lang", locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* private mode — won't persist */
    }
    set({ locale });
  },
  init: () => {
    let locale: Locale = "en";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "mk") locale = stored;
      else if (navigator.language?.toLowerCase().startsWith("mk")) locale = "mk";
    } catch {
      /* default en */
    }
    document.documentElement.setAttribute("lang", locale);
    if (locale !== get().locale) set({ locale });
  },
}));

/** Translator bound to the current locale: t("key", { param }). */
export function useT() {
  const locale = useLocale((s) => s.locale);
  return useMemo(() => {
    const dict = catalogs[locale];
    return (key: MessageKey, params?: Params): string => format(dict[key] ?? en[key] ?? key, params);
  }, [locale]);
}

/** Locale-aware number / currency / distance / date formatters. */
export function useFormat() {
  const locale = useLocale((s) => s.locale);
  const t = useT();
  return useMemo(() => {
    const tag = locale === "mk" ? "mk" : "en";
    const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
    const one = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
    const eurFmt = (n: number) =>
      new Intl.NumberFormat(tag, {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: Math.abs(n) >= 100 ? 0 : 2,
        maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2,
      }).format(n);
    return {
      num: (n: number) => int.format(n),
      km: (n: number) => `${int.format(Math.round(n))} ${t("unit.km")}`,
      liters: (n: number) => `${one.format(n)} ${t("unit.l")}`,
      eur: eurFmt,
      duration: (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
      },
      date: (iso: string) => {
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(d);
      },
    };
  }, [locale, t]);
}
