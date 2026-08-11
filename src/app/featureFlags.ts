/**
 * Demo-time feature switches.
 *
 * `SHOW_STEP4_POSITION_COUNTERS` in `PipelineFooter.tsx` is the existing idiom for this — a module-level
 * const, edited to change. That works for something being judged over a session. It does not work for a
 * switch you want to flip *between* demo runs, because a rebuild is fine but **a reload discards every
 * move the cabinet holds** (CLAUDE.md §4: `doorShelfConfig` is in-memory only). Toggling a feature would
 * cost the state you spent the last ten minutes building up to show it off.
 *
 * So each flag has three ways in, narrowest last:
 *
 *   1. the default below, for what ships;
 *   2. `?addMoveToBin=off` on the URL, read once at load — the reproducible way to start a run;
 *   3. `window.flags.addMoveToBin = false` from the console, which re-renders in place and keeps the
 *      cabinet exactly as it is.
 *
 * (3) is why this is a tiny store rather than a plain object: React has to be told. Subscribers are
 * notified on write, and `useFeatureFlag` bridges that into a component.
 */

export type FeatureFlags = {
  /**
   * Whether the placement screen offers `Add Move To Bin` — another Move To bin, picked mid-move, for
   * stock that will not fit the bin in front of the operator.
   *
   * Off, this screen behaves as it did before the feature: the flow is unchanged for a split planned at
   * step ②, and the one situation with no way out returns — stock already taken from its source, the
   * target full, `Cancel` refused because stock is in hand, and no `Back` in step ④. That dead end is
   * the point of the comparison, so hiding it is a demo decision, not a cleanup.
   */
  addMoveToBin: boolean;
};

const DEFAULTS: FeatureFlags = {
  addMoveToBin: true
};

/** `?addMoveToBin=off` / `=false` / `=0` reads as off; anything else present reads as on. */
function readOverrides(): Partial<FeatureFlags> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const overrides: Partial<FeatureFlags> = {};
  (Object.keys(DEFAULTS) as Array<keyof FeatureFlags>).forEach(name => {
    const raw = params.get(name);
    if (raw === null) return;
    overrides[name] = !['off', 'false', '0', 'no'].includes(raw.toLowerCase());
  });
  return overrides;
}

let current: FeatureFlags = { ...DEFAULTS, ...readOverrides() };

const listeners = new Set<() => void>();

export function getFlags(): FeatureFlags {
  return current;
}

export function setFlag<K extends keyof FeatureFlags>(name: K, value: FeatureFlags[K]): void {
  if (current[name] === value) return;
  // A new object, not a mutation: `useSyncExternalStore` compares snapshots by identity, so mutating in
  // place would notify and then hand React the same value it already had.
  current = { ...current, [name]: value };
  listeners.forEach(listener => listener());
}

export function subscribeToFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * `window.flags.addMoveToBin = false` from the console, live.
 *
 * A proxy rather than a plain object so a bare assignment is enough — `window.setFlag('…', false)` works
 * too but nobody remembers a function signature at a demo. Reading it prints the current values.
 */
export function installFlagConsoleApi(): void {
  if (typeof window === 'undefined') return;
  (window as any).flags = new Proxy({} as FeatureFlags, {
    get: (_target, name: string) => (current as any)[name],
    set: (_target, name: string, value) => {
      if (!(name in DEFAULTS)) {
        console.warn(`[flags] no such flag: ${name}. Known flags: ${Object.keys(DEFAULTS).join(', ')}`);
        return true;
      }
      setFlag(name as keyof FeatureFlags, Boolean(value));
      console.log(`[flags] ${name} = ${Boolean(value)}`);
      return true;
    },
    ownKeys: () => Object.keys(DEFAULTS),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
  });
}
