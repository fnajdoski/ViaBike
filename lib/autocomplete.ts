/** Shared types + tiny helpers for address autocomplete (client + tests). */

export type Suggestion = {
  name: string; // primary label, e.g. "Milano"
  detail: string; // disambiguation, e.g. "Lombardy, Italy"
  lat: number;
  lon: number;
};

/** Don't query on every keystroke — only once there's something to match. */
export const MIN_QUERY_LEN = 3;

export function shouldQuery(raw: string): boolean {
  return raw.trim().length >= MIN_QUERY_LEN;
}

/** Trailing-edge debounce with a `cancel()` to drop a pending call on unmount. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}
