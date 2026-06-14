import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce, MIN_QUERY_LEN, shouldQuery } from "./autocomplete";

describe("shouldQuery", () => {
  it(`requires ≥ ${MIN_QUERY_LEN} non-space characters`, () => {
    expect(shouldQuery("")).toBe(false);
    expect(shouldQuery("mi")).toBe(false);
    expect(shouldQuery("  m  ")).toBe(false);
    expect(shouldQuery("mil")).toBe(true);
    expect(shouldQuery("  milano ")).toBe(true);
  });
});

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once with the latest args after the delay", () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d("a");
    d("b");
    d("c");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("cancel() drops a pending call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d("x");
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });
});
