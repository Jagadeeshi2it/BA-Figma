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
 */
const PRODUCT_SEARCH = 'SOLU-CORTEF';

/**
 * The first bin on the open door that has room, resolved when the step runs rather than written as
 * a fixed bin id: which bins are empty is a property of the seed, and the seed is expected to be
 * replaced by real cabinet data. `data-bin-available` is set by BinCard from the same `bin.available`
 * that draws the green stroke, so the demo taps a bin the viewer can see is free.
 *
 * Door 1 is the door the app opens on and holds nine available bins in the current seed, so no
 * door-switching step is needed. If that stops being true this returns null and the runner stops
 * with a stated reason rather than clicking nothing.
 */
const firstEmptyBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

/**
 * Labels name the step; they never narrate it. They are read in the control panel, not over the
 * app — see `DemoStep.label`. The pacing is what does the explaining: the settle after a click is
 * long enough for the viewer to see what the click changed.
 */
export const allocateUnallocatedProduct: DemoScenario = {
  id: 'allocate-unallocated-product',
  title: 'Allocate an Unallocated Product',
  description: 'Assign a product that has no bin at all to an empty bin.',
  steps: [
    // A beat before anything moves, so the cursor does not appear to be mid-gesture already.
    { kind: 'note', label: 'The cabinet, as it stands', settleMs: 900 },
    { kind: 'click', label: 'Open the Allocate/Move menu', target: '[data-demo="workflow-trigger"]' },
    {
      kind: 'click',
      label: 'Choose Allocate Product',
      target: '[data-demo="workflow-allocate-product"]',
      settleMs: 900,
    },
    {
      kind: 'await',
      label: 'The unallocated tray opens',
      target: '[data-demo="unallocated-search"]',
      settleMs: 1000,
    },
    {
      kind: 'type',
      label: 'Search the tray',
      target: '[data-demo="unallocated-search"]',
      text: PRODUCT_SEARCH,
      settleMs: 900,
    },
    {
      kind: 'click',
      label: 'Tick the product',
      target: '[data-demo="unallocated-product"]',
      settleMs: 1100,
    },
    // The tick reveals the "Select bin(s) to allocate" line in the footer. Long enough to notice it.
    { kind: 'note', label: 'The panel now asks for a bin', settleMs: 1300 },
    {
      kind: 'click',
      label: 'Tap an empty bin',
      target: firstEmptyBin,
      settleMs: 1400,
    },
    {
      kind: 'click',
      label: 'Allocate',
      target: '[data-demo="unallocated-allocate"]',
      settleMs: 1600,
    },
    // The bin now stocks the product at zero, and the tray is one shorter. Both are on screen; the
    // pause is what gives the viewer time to find them.
    { kind: 'note', label: 'Allocated', settleMs: 2600 },
  ],
};
