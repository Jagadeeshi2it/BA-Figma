/**
 * Put the cursor in an allocation panel's search box.
 *
 * Used when a bin tap is refused for having no product picked yet: the toast says to pick one "in this
 * panel", and this is what gives that sentence somewhere to point. The two panels sit at the right of a
 * screen whose whole left half is the cabinet the operator was just tapping, so a top-right toast alone
 * names a field that is nowhere near where they are looking — and in Multi Bin Assignment, where the
 * list is empty until something is typed, the search box IS the next action.
 *
 * Keyed on the `data-demo` anchors rather than a ref threaded up through the panels: `handleBinClick`
 * lives in the hook, which holds no DOM at all, and both anchors are already asserted to exist by
 * `node scripts/verify-demo-anchors.mjs` — so a rename fails in the terminal either way.
 *
 * Nothing here touches the HEADER search, which mirrors its focus in React state (`isSearchFocused`)
 * and must only ever be blurred through `dismissSearchList` — see CLAUDE.md §4. A panel's search box
 * keeps no such flag, so focusing it is just focus.
 */
export type AllocationPanel = 'allocate' | 'unallocated';

const SEARCH_ANCHOR: Record<AllocationPanel, string> = {
  allocate: 'allocate-search',
  unallocated: 'unallocated-search',
};

export const focusPanelSearch = (panel: AllocationPanel): void => {
  if (typeof document === 'undefined') return;
  const input = document.querySelector<HTMLInputElement>(
    `input[data-demo="${SEARCH_ANCHOR[panel]}"]`
  );
  // Deliberately silent when the panel is not on screen. The caller only reaches this from inside that
  // panel's own branch, so a miss means the anchor moved — which the verify script reports, and which
  // is not worth throwing at an operator mid-tap.
  input?.focus();
};
