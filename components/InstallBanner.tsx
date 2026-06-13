"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "ridecost:install-dismissed";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function dismissedRecently(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  const webkit = /WebKit/.test(ua);
  const notOtherBrowser = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && notOtherBrowser;
}

export default function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    // Android / Chromium: capture the deferred prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      // re-check here too: the event can re-fire after a dismiss, and we must
      // keep honoring the 14-day quiet period
      if (!dismissedRecently()) setVisible(true);
    };
    // hide + remember once installed
    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no beforeinstallprompt — show the instructional variant instead
    if (isIosSafari()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => undefined);
    setPromptEvent(null);
    setVisible(false);
  }

  if (!visible || (!promptEvent && !iosHint)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] motion-safe:animate-[slideUp_.28s_ease-out]"
      role="dialog"
      aria-label="Install RideCost"
    >
      <style>{`@keyframes slideUp{from{transform:translateY(110%)}to{transform:translateY(0)}}`}</style>
      <div className="panel flex w-full max-w-md items-center gap-3 px-4 py-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-base">
          🏍️
        </span>
        {iosHint ? (
          <p className="min-w-0 flex-1 text-xs leading-snug text-ink">
            Add <span className="font-semibold">RideCost</span> to your Home Screen — tap the Share
            icon <span aria-hidden>􀈂</span> <span className="text-mute">↑</span>, then{" "}
            <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>.
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-xs leading-snug text-ink">
            <span className="font-semibold">Install RideCost</span>
            <span className="block text-mute">Add it to your device for full-screen, one-tap access.</span>
          </p>
        )}
        {!iosHint && (
          <button
            onClick={install}
            className="shrink-0 cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-night transition hover:brightness-110"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 cursor-pointer rounded-md px-1.5 text-mute transition hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
