import { useSyncExternalStore } from 'react';
import { FeatureFlags, getFlags, subscribeToFlags } from '../featureFlags';

/**
 * Read a demo flag so a console write re-renders the component that depends on it.
 *
 * `useSyncExternalStore` rather than a `useState` + effect pair, which would need the effect to run
 * before it could see a value written between render and mount — the exact window a console toggle
 * lands in.
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(name: K): FeatureFlags[K] {
  return useSyncExternalStore(
    subscribeToFlags,
    () => getFlags()[name],
    () => getFlags()[name]
  );
}
