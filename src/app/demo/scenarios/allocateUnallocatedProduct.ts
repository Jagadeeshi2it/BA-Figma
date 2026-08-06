import { DemoScenario } from '../types';

/**
 * Workflow D — the Unallocated Products tray (CLAUDE.md §2 D).
 *
 * The happy path, end to end: open the tray from the workflow menu, find a product that has no bin
 * at all, tick it, give it an empty bin, allocate.
 *
 * The product is pinned by NAME, not by its position in the tray. Tray ids are `unalloc-1`,
 * `unalloc-2`… assigned by index over whatever is still unallocated, so the third row is a
 * different product the moment anything else is allocated — and the demo scaffolding in
 * `doorConfigurations.ts` is tagged for deletion, which will renumber them again. SOLU-CORTEF is a
 * `Purchased` product, which also means the scenario cannot trip the one real domain rule if it
 * ever lands on an E-Kit bin (CLAUDE.md §5).
 *
 * **Every step that changes something says how to change it back** (`reverse`), which is what makes
 * Previous a real step backwards rather than a replay. Almost all of this workflow is toggles, so
 * almost all of it reverses: ticking un-ticks, tapping a bin un-taps, a typed query clears. The one
 * exception is Allocate itself — nothing in the tray un-allocates — and it is the only step that
 * falls back to the rebuild.
 */
const PRODUCT_SEARCH = 'SOLU-CORTEF';

/**
 * The first bin on the open door that has room, resolved when the step runs rather than written as
 * a fixed bin id: which bins are empty is a property of the seed, and the seed is expected to be
 * replaced by real cabinet data. `data-bin-available` is set by BinCard from the same `bin.available`
 * that draws the green stroke, so the demo taps a bin the viewer can see is free.
 *
 * Selecting a bin does not change `bin.available`, so this resolves to the same card on the way back
 * as on the way out — which is what lets the reverse step simply tap it again.
 *
 * Door 1 is the door the app opens on and holds nine available bins in the current seed, so no
 * door-switching step is needed. If that stops being true this returns null and the runner stops
 * with a stated reason rather than clicking nothing.
 */
const firstEmptyBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

/**
 * Labels name the step; they never narrate it. They are read in the control panel, not over the
 * app. The pacing is what does the explaining: the settle after a click is the time the viewer has
 * to find what the click changed, which is why the two biggest ones are on the bin tap and the
 * allocation.
 */
export const allocateUnallocatedProduct: DemoScenario = {
  id: 'allocate-unallocated-product',
  title: 'Allocate an Unallocated Product',
  description: 'Assign a product that has no bin at all to an empty bin.',
  steps: [
    // A beat before anything moves, so the cursor does not appear to be mid-gesture already.
    { kind: 'note', label: 'The cabinet, as it stands', settleMs: 1800 },
    {
      kind: 'click',
      label: 'Open the Allocate/Move menu',
      target: '[data-demo="workflow-trigger"]',
      // The trigger toggles its own popover, so closing it again is the same tap.
      reverse: [
        { kind: 'click', label: 'Close the menu', target: '[data-demo="workflow-trigger"]' },
      ],
    },
    {
      kind: 'click',
      label: 'Choose Allocate Product',
      target: '[data-demo="workflow-allocate-product"]',
      settleMs: 1300,
      // Two acts to undo one: the entry both closed the menu and opened the tray, so going back
      // means shutting the tray AND putting the menu back the way it was.
      reverse: [
        { kind: 'click', label: 'Close the tray', target: '[data-demo="unallocated-cancel"]' },
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
      ],
    },
    {
      kind: 'await',
      label: 'The unallocated tray opens',
      target: '[data-demo="unallocated-search"]',
      settleMs: 1200,
    },
    {
      kind: 'type',
      label: 'Search the tray',
      target: '[data-demo="unallocated-search"]',
      text: PRODUCT_SEARCH,
      settleMs: 1200,
      reverse: [
        {
          kind: 'type',
          label: 'Clear the search',
          target: '[data-demo="unallocated-search"]',
          text: '',
        },
      ],
    },
    {
      kind: 'click',
      label: 'Tick the product',
      target: '[data-demo="unallocated-product"]',
      settleMs: 1400,
      reverse: [
        { kind: 'click', label: 'Un-tick the product', target: '[data-demo="unallocated-product"]' },
      ],
    },
    // The tick reveals the "Select bin(s) to allocate" line in the footer. Long enough to notice it.
    { kind: 'note', label: 'The panel now asks for a bin', settleMs: 1600 },
    {
      kind: 'click',
      label: 'Tap an empty bin',
      target: firstEmptyBin,
      settleMs: 1800,
      reverse: [{ kind: 'click', label: 'Release the bin', target: firstEmptyBin }],
    },
    {
      kind: 'click',
      label: 'Allocate',
      target: '[data-demo="unallocated-allocate"]',
      settleMs: 2000,
      // No `reverse`, and there cannot be one: unallocation is not reachable from this panel — it
      // only exists behind the zero-inventory banner after a move (CLAUDE.md §2 C). Previous rebuilds
      // instead. If an unallocate path ever reaches the tray, this is the step to give a reverse to.
    },
    // The bin now stocks the product at zero, and the tray is one shorter. Both are on screen; the
    // pause is what gives the viewer time to find them.
    { kind: 'note', label: 'Allocated', settleMs: 2400 },
    {
      kind: 'click',
      label: 'Close the tray',
      target: '[data-demo="unallocated-cancel"]',
      settleMs: 1200,
      // Reopening it is the two clicks that opened it in the first place. The tray clears its own
      // ticks on open, but there is nothing left ticked by this point for that to lose.
      reverse: [
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
        { kind: 'click', label: 'Reopen the tray', target: '[data-demo="workflow-allocate-product"]' },
      ],
    },
    {
      kind: 'click',
      label: 'Open History',
      // Only reachable now: History hides while any workflow is open, so closing the tray is what
      // puts this button back on screen — which is why the two steps are in this order and not one.
      target: '[data-demo="history-trigger"]',
      settleMs: 1400,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // The ledger is the proof. An allocation that only shows as a 0-vial row in a bin is easy to
    // read as nothing having happened; the entry under Today says the transaction was recorded.
    { kind: 'note', label: 'Recorded under Today', settleMs: 3500 },
  ],
};
