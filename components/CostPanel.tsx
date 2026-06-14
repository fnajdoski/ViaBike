"use client";

import { useState } from "react";
import { CURRENCY_RATES_AS_OF } from "@/data/currencyRates";
import { countryLabel } from "@/data/countryCodes";
import { TOLL_RATES_AS_OF } from "@/data/tollRates";
import { VIGNETTES_AS_OF } from "@/data/vignettes";
import type { MessageKey } from "@/lib/i18n/en";
import type { CostBreakdown } from "@/lib/types";
import { useFormat, useT } from "@/state/locale";
import { useRideCost } from "@/state/store";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-mute">{children}</h3>;
}

export default function CostPanel({ breakdown }: { breakdown: CostBreakdown | null }) {
  const prices = useRideCost((s) => s.prices);
  const tollguru = useRideCost((s) => s.tollguru);
  const warnings = useRideCost((s) => s.warnings);
  const extras = useRideCost((s) => s.extras);
  const status = useRideCost((s) => s.status);
  const { addExtra, removeExtra } = useRideCost.getState();
  const t = useT();
  const fmt = useFormat();
  const [extraLabel, setExtraLabel] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  if (status !== "done" || !breakdown) return null;

  const Estimate = () => (
    <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-warn">
      {t("cost.estimate")}
    </span>
  );

  const tollguruFuel = tollguru?.available ? tollguru.fuelEstimateEur : null;
  const fuelDiscrepancy =
    tollguruFuel != null && breakdown.fuelTotalEur > 0
      ? Math.abs(tollguruFuel - breakdown.fuelTotalEur) / breakdown.fuelTotalEur
      : null;

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="wordmark-solid text-2xl">{t("cost.title")}</h2>
        <p className="tile-number text-3xl text-fuel">
          {fmt.eur(breakdown.totalEur)}
          <Estimate />
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FUEL */}
        <div>
          <SectionTitle>{t("cost.fuelHeading")}</SectionTitle>
          <table className="w-full text-xs">
            <tbody>
              {breakdown.fuel.map((f) => (
                <tr key={f.iso2} className="border-b border-line/60">
                  <td className="py-1.5">{countryLabel(f.iso2)}</td>
                  <td className="py-1.5 text-right text-mute">{fmt.km(f.km)}</td>
                  <td className="py-1.5 text-right text-mute">{fmt.liters(f.liters)}</td>
                  <td className="py-1.5 text-right text-mute">{fmt.eur(f.pricePerLiterEur)}/{t("unit.l")}</td>
                  <td className="tile-number py-1.5 text-right">{fmt.eur(f.costEur)}</td>
                </tr>
              ))}
              <tr>
                <td className="pt-2 font-semibold" colSpan={4}>{t("cost.fuelTotal")}</td>
                <td className="tile-number pt-2 text-right font-semibold">{fmt.eur(breakdown.fuelTotalEur)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-mute">
            {t("cost.pricesLine", { date: prices?.asOf ?? "—", source: prices?.source ?? "builtin" })}
          </p>
          {fuelDiscrepancy != null && (
            <p className={`mt-1 text-[10px] ${fuelDiscrepancy > 0.25 ? "text-warn" : "text-good"}`}>
              {t(fuelDiscrepancy > 0.25 ? "cost.crosscheckOff" : "cost.crosscheckAgree", {
                amount: fmt.eur(tollguruFuel!),
              })}
            </p>
          )}
        </div>

        {/* TOLLS */}
        <div>
          <SectionTitle>
            {t("cost.tollsHeading")}
            {breakdown.tollsSource === "builtin-estimate" && <Estimate />}
          </SectionTitle>
          {breakdown.tolls.length === 0 ? (
            <p className="text-xs text-mute">{t("cost.tollsNone")}</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {breakdown.tolls.map((toll, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="py-1.5" title={toll.note}>
                      {countryLabel(toll.iso2)}
                    </td>
                    <td className="py-1.5 text-right text-mute">{toll.km > 0 ? fmt.km(toll.km) : ""}</td>
                    <td className="tile-number py-1.5 text-right">{fmt.eur(toll.costEur)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-semibold" colSpan={2}>{t("cost.tollsTotal")}</td>
                  <td className="tile-number pt-2 text-right font-semibold">{fmt.eur(breakdown.tollsTotalEur)}</td>
                </tr>
              </tbody>
            </table>
          )}
          <p className="mt-2 text-[10px] text-mute">
            {breakdown.tollsSource === "tollguru"
              ? t("cost.tollsTollguru")
              : t("cost.tollsEstimate", { date: TOLL_RATES_AS_OF })}
          </p>
        </div>

        {/* VIGNETTES + EXTRAS */}
        <div>
          <SectionTitle>{t("cost.vignettesHeading")}</SectionTitle>
          {breakdown.vignettes.length === 0 ? (
            <p className="text-xs text-mute">{t("cost.vignettesNone")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-xs">
              {breakdown.vignettes.map((v) => (
                <li key={v.iso2} className="rounded-md bg-panel2 px-3 py-2" title={v.note}>
                  <div className="flex justify-between">
                    <span>{countryLabel(v.iso2).split(" ")[0]} {v.label}</span>
                    <span className={`tile-number ${v.priceEur === 0 ? "text-good" : ""}`}>
                      {v.priceEur === 0 ? t("cost.vignetteFree") : fmt.eur(v.priceEur)}
                    </span>
                  </div>
                  {v.originalPrice && <p className="text-[10px] text-mute">{v.originalPrice}</p>}
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-mute">{v.note}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[10px] text-mute">{VIGNETTES_AS_OF}</p>

          <SectionTitle>
            <span className="mt-4 inline-block">{t("cost.extrasHeading")}</span>
          </SectionTitle>
          <ul className="flex flex-col gap-1 text-xs">
            {extras.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-md bg-panel2 px-3 py-1.5">
                <span>{e.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tile-number">{fmt.eur(e.amountEur)}</span>
                  <button onClick={() => removeExtra(e.id)} className="cursor-pointer text-mute hover:text-warn">✕</button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input
              value={extraLabel}
              onChange={(e) => setExtraLabel(e.target.value)}
              placeholder={t("cost.extraExample")}
              className="w-full rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs outline-none placeholder:text-mute focus:border-accent"
            />
            <input
              value={extraAmount}
              onChange={(e) => setExtraAmount(e.target.value)}
              placeholder="€"
              inputMode="decimal"
              className="w-20 rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs outline-none placeholder:text-mute focus:border-accent"
            />
            <button
              onClick={() => {
                const amount = Number(extraAmount);
                if (!extraLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
                addExtra(extraLabel.trim(), amount);
                setExtraLabel("");
                setExtraAmount("");
              }}
              className="shrink-0 cursor-pointer rounded-md border border-line px-3 text-xs text-mute transition hover:text-ink"
            >
              {t("cost.add")}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-3">
        <p className="text-[10px] leading-relaxed text-mute">
          {t("cost.disclaimer", { date: CURRENCY_RATES_AS_OF })} {t("cost.fuelDataLabel")}{" "}
          <a href="https://openvan.camp/en/developers" className="underline hover:text-ink" target="_blank" rel="noreferrer">
            OpenVan.camp
          </a>{" "}
          (CC BY 4.0).
        </p>
        {warnings.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-[10px] text-warn">• {t(w as MessageKey)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
