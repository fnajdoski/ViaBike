import { describe, expect, it } from "vitest";
import { en } from "./en";
import { mk } from "./mk";

const tokens = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();

describe("i18n catalogs", () => {
  it("mk has exactly the same keys as en", () => {
    expect(Object.keys(mk).sort()).toEqual(Object.keys(en).sort());
  });

  it("has no empty values in either locale", () => {
    for (const [k, v] of Object.entries(en)) expect(v.trim(), `en ${k}`).not.toBe("");
    for (const [k, v] of Object.entries(mk)) expect(v.trim(), `mk ${k}`).not.toBe("");
  });

  it("preserves the same {placeholders} in every translation", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(tokens(mk[key]), `placeholders for ${key}`).toEqual(tokens(en[key]));
    }
  });

  it("keeps the brand wordmark Latin (untranslated) in mk", () => {
    expect(mk["install.title"]).toContain("RideCost");
  });
});
