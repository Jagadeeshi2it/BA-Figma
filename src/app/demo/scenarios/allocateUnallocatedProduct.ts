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
 * that draws the green stroke, so the demo taps a bin the operator can see is free.
 *
 * Door 1 is the door the app opens on and holds nine available bins in the current seed, so no
 * door-switching step is needed. If that stops being true this returns null and the runner stops
 * with a stated reason rather than clicking nothing.
 */
const firstEmptyBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

export const allocateUnallocatedProduct: DemoScenario = {
  id: 'allocate-unallocated-product',
  title: 'Allocate an Unallocated Product',
  description: 'Assign a product that has no bin at all to an empty bin.',
  steps: [
    {
      kind: 'note',
      caption: 'Some products in the catalogue have no bin yet. This is how one gets a home.',
      settleMs: 1600,
    },
    {
      kind: 'click',
      caption: 'Every allocation and move starts here.',
      target: '[data-demo="workflow-trigger"]',
    },
    {
      kind: 'click',
      caption: 'Allocate Product — the tray of products with no bin at all.',
      target: '[data-demo="workflow-allocate-product"]',
      settleMs: 900,
    },
    {
      kind: 'await',
      caption: 'The tray lists everything waiting for a bin.',
      target: '[data-demo="unallocated-search"]',
      settleMs: 1200,
    },
    {
      kind: 'type',
      caption: 'Search by name, NDC or inventory type.',
      target: '[data-demo="unallocated-search"]',
      text: PRODUCT_SEARCH,
      settleMs: 900,
    },
    {
      kind: 'click',
      caption: 'Tick the product to allocate.',
      target: '[data-demo="unallocated-product"]',
      settleMs: 1100,
    },
    {
      kind: 'note',
      caption: 'Now the bin. Green means the bin has room.',
      settleMs: 1400,
    },
    {
      kind: 'click',
      caption: 'Tap an empty bin on the shelves — that is the allocation.',
      target: firstEmptyBin,
      settleMs: 1400,
    },
    {
      kind: 'click',
      caption: 'Allocate. The button stays disabled until both a product and a bin are chosen.',
      target: '[data-demo="unallocated-allocate"]',
      settleMs: 1600,
    },
    {
      kind: 'note',
      caption:
        'Allocated. The bin now stocks the product at zero — stock arrives by moving it in, which is a different workflow.',
      settleMs: 3000,
    },
  ],
};
