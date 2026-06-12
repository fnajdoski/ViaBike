"use client";

import { useState } from "react";
import { CURRENCY_RATES_AS_OF } from "@/data/currencyRates";
import { countryLabel } from "@/data/countryCodes";
import { TOLL_RATES_AS_OF } from "@/data/tollRates";
import { VIGNETTES_AS_OF } from "@/data/vignettes";
import { fmtEur, fmtKm, fmtLiters } from "@/lib/format";
import type { CostBreakdown } from "@/lib/types";
import { useRideCost } from "@/state/store";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-mute">{children}</h3>;
}

function EstimateBadge() {
  return (
    <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-warn">
      estimate
    </span>
  );
}

export default function CostPanel({ breakdown }: { breakdown: CostBreakdown | null }) {
  const prices = useRideCost((s) => s.prices);
  const tollguru = useRideCost((s) => s.tollguru);
  const warnings = useRideCost((s) => s.warnings);
  const extras = useRideCost((s) => s.extras);
  const status = useRideCost((s) => s.status);
  const { addExtra, removeExtra } = useRideCost.getState();
  const [extraLabel, setExtraLabel] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  if (status !== "done" || !breakdown) return null;

  const tollguruFuel = tollguru?.available ? tollguru.fuelEstimateEur : null;
  const fuelDiscrepancy =
    tollguruFuel != null && breakdown.fuelTotalEur > 0
      ? Math.abs(tollguruFuel - breakdown.fuelTotalEur) / breakdown.fuelTotalEur
      : null;

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="wordmark-solid text-2xl">TRIP COST</h2>
        <p className="tile-number text-3xl text-fuel">
          {fmtEur(breakdown.totalEur)}
          <EstimateBadge />
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FUEL */}
        <div>
          <SectionTitle>Fuel — priced per country</SectionTitle>
          <table className="w-full text-xs">
            <tbody>
              {breakdown.fuel.map((f) => (
                <tr key={f.iso2} className="border-b border-line/60">
                  <td className="py-1.5">{countryLabel(f.iso2)}</td>
                  <td className="py-1.5 text-right text-mute">{fmtKm(f.km)}</td>
                  <td className="py-1.5 text-right text-mute">{fmtLiters(f.liters)}</td>
                  <td className="py-1.5 text-right text-mute">€{f.pricePerLiterEur.toFixed(2)}/L</td>
                  <td className="tile-number py-1.5 text-right">{fmtEur(f.costEur)}</td>
                </tr>
              ))}
              <tr>
                <td className="pt-2 font-semibold" colSpan={4}>Fuel total</td>
                <td className="tile-number pt-2 text-right font-semibold">{fmtEur(breakdown.fuelTotalEur)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-mute">
            Prices {prices?.asOf ?? "from the built-in table"} · source: {prices?.source ?? "builtin"}.
          </p>
          {fuelDiscrepancy != null && (
            <p className={`mt-1 text-[10px] ${fuelDiscrepancy > 0.25 ? "text-warn" : "text-good"}`}>
              TollGuru cross-check: {fmtEur(tollguruFuel!)}{" "}
              {fuelDiscrepancy > 0.25 ? "— large discrepancy, double-check consumption/prices." : "— agrees within 25%."}
            </p>
          )}
        </div>

        {/* TOLLS */}
        <div>
          <SectionTitle>
            Tolls — motorcycle class
            {breakdown.tollsSource === "builtin-estimate" && <EstimateBadge />}
          </SectionTitle>
          {breakdown.tolls.length === 0 ? (
            <p className="text-xs text-mute">No per-km tolls expected on this route.</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {breakdown.tolls.map((t, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="py-1.5" title={t.note}>
                      {countryLabel(t.iso2)}
                    </td>
                    <td className="py-1.5 text-right text-mute">{t.km > 0 ? fmtKm(t.km) : ""}</td>
                    <td className="tile-number py-1.5 text-right">{fmtEur(t.costEur)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-semibold" colSpan={2}>Tolls total</td>
                  <td className="tile-number pt-2 text-right font-semibold">{fmtEur(breakdown.tollsTotalEur)}</td>
                </tr>
              </tbody>
            </table>
          )}
          <p className="mt-2 text-[10px] text-mute">
            {breakdown.tollsSource === "tollguru"
              ? "Exact plazas from TollGuru, motorcycle class."
              : `Rough per-km estimate (${TOLL_RATES_AS_OF}) — add a TollGuru key for exact plazas.`}
          </p>
        </div>

        {/* VIGNETTES + EXTRAS */}
        <div>
          <SectionTitle>Vignettes & passes — one-off, not per trip</SectionTitle>
          {breakdown.vignettes.length === 0 ? (
            <p className="text-xs text-mute">No vignette countries on this route.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-xs">
              {breakdown.vignettes.map((v) => (
                <li key={v.iso2} className="rounded-md bg-panel2 px-3 py-2" title={v.note}>
                  <div className="flex justify-between">
                    <span>{countryLabel(v.iso2).split(" ")[0]} {v.label}</span>
                    <span className={`tile-number ${v.priceEur === 0 ? "text-good" : ""}`}>
                      {v.priceEur === 0 ? "free" : fmtEur(v.priceEur)}
                    </span>
                  </div>
                  {v.originalPrice && <p className="text-[10px] text-mute">{v.originalPrice}</p>}
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-mute">{v.note}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[10px] text-mute">Vignette data {VIGNETTES_AS_OF}.</p>

          <SectionTitle>
            <span className="mt-4 inline-block">Extras (ferries, parking, food…)</span>
          </SectionTitle>
          <ul className="flex flex-col gap-1 text-xs">
            {extras.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-md bg-panel2 px-3 py-1.5">
                <span>{e.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tile-number">{fmtEur(e.amountEur)}</span>
                  <button onClick={() => removeExtra(e.id)} className="cursor-pointer text-mute hover:text-warn">✕</button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input
              value={extraLabel}
              onChange={(e) => setExtraLabel(e.target.value)}
              placeholder="e.g. Ferry"
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
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-3">
        <p className="text-[10px] leading-relaxed text-mute">
          ⚠️ Everything here is an <strong>estimate — verify before relying on it</strong>. Currency
          normalized to EUR (rates {CURRENCY_RATES_AS_OF}); non-EUR amounts show the original where
          known. Vignettes are fixed-period passes, listed once — not a per-trip cost. Fuel price
          data:{" "}
          <a href="https://openvan.camp/en/developers" className="underline hover:text-ink" target="_blank" rel="noreferrer">
            OpenVan.camp
          </a>{" "}
          (CC BY 4.0).
        </p>
        {warnings.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-[10px] text-warn">• {w}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
