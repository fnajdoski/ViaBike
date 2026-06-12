import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ridecost.theme";

/**
 * Theme state. The <html> class is set before first paint by the inline
 * script in app/layout.tsx (stored choice, else prefers-color-scheme, else
 * light). React hydration can re-patch <html> attributes and strip the
 * class, so init() re-derives the intended theme and re-asserts it on mount
 * — mount is authoritative, not the DOM.
 */
export const useTheme = create<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  init: () => void;
}>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode etc. — theme just won't persist */
    }
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === "light" ? "dark" : "light"),
  init: () => {
    let theme: Theme = "light";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      theme =
        stored === "dark" || stored === "light"
          ? stored
          : matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    } catch {
      /* default to light */
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (theme !== get().theme) set({ theme });
  },
}));
