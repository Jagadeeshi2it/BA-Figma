import { DemoStep, DemoScenario } from '../types';

/**
 * Workflow D end to end — every allocation pattern the app supports, in one unbroken sitting
 * (CLAUDE.md §2 D).
 *
 * Four rounds, in order of increasing shape:
 *
 *   1. one product  → one bin
 *   2. many products → one bin
 *   3. one product  → many bins
 *   4. many products → many bins
 *
 * **The panel never closes between them, and that is the point.** Split across four scenarios, each
 * would open the tray, do one thing and shut it, which is not how a cabinet gets set up — the operator
 * stays in the tray and works through the shelf. Run as one walk it also shows the thing four separate
 * demos cannot: the tray shortening and the free bins running out as the work proceeds.
 *
 * What makes the seam between rounds work is `handleConfirmAssignment`, which leaves the panel open and
 * resets exactly what should reset — allocated products leave the tray, the ticks and bin picks clear,
 * and the allocated bin flips to `available: false`. So each round starts clean without a step to clean
 * it, and the bin resolvers below simply find the next free bins.
 */

/**
 * Six of the eight products the seed reserves for the tray (`UNALLOCATED_RESERVE_IDS`), matched by NAME.
 * Tray ids are `unalloc-1`, `unalloc-2`… assigned by index over whatever is still unallocated, so they
 * renumber after every round of this very scenario — a step naming one would be wrong by round two.
 *
 * Each term matches exactly one of the eight. Two are deliberately left over, so the tray still has
 * something in it at the end rather than bottoming out into its "nothing to allocate" state.
 */
const ROUND_1 = ['SOLU-CORTEF'];
const ROUND_2 = ['MESNA', 'KADCYLA'];
const ROUND_3 = ['VYLOY'];
const ROUND_4 = ['DOXORUBICIN', 'VINORELBINE'];

/**
 * The bins with room, in the order they appear on the open door — resolved when a step runs, never
 * written as ids. Which bins are empty is a property of the seed, and this scenario changes it four
 * times as it goes.
 *
 * Selecting a bin does not change `bin.available`; only allocating does. So within a round these
 * resolve to the same cards throughout (which is what lets a reverse step tap one again to release it),
 * and between rounds they advance past whatever was just filled.
 *
 * Door 1 is where the app opens and holds nine free bins in the current seed; the walk needs six. If
 * that stops being true, `nthFreeBin` returns null and the runner stops with a stated reason rather
 * than clicking nothing.
 */
const freeBins = () =>
  Array.from(document.querySelectorAll('[data-bin-id][data-bin-available="true"]'));
const nthFreeBin = (index: number) => () => freeBins()[index] ?? null;

/**
 * The first free bin's name, for the search box — read from `data-bin-name` rather than the card's
 * heading, which carries the size suffix ("Bin 1A (1x1)") the search would not match.
 */
const firstFreeBinName = () => freeBins()[0]?.getAttribute('data-bin-name') ?? '';

/** Find a product in the tray and tick it. Two steps, and every round is built from them. */
const pickProduct = (term: string, previousTerm?: string): DemoStep[] => [
  {
    kind: 'type',
    label: `Search the tray for ${term}`,
    target: '[data-demo="unallocated-search"]',
    text: term,
    settleMs: 1000,
    // Back to whatever the box held before this step, which is the previous product's term mid-round
    // and an empty box at the start of one.
    reverse: [
      {
        kind: 'type',
        label: previousTerm ? `Back to ${previousTerm}` : 'Clear the search',
        target: '[data-demo="unallocated-search"]',
        text: previousTerm ?? '',
      },
    ],
  },
  {
    kind: 'click',
    // The filter has narrowed the tray to one row, so the first match IS the product searched for.
    label: `Tick ${term}`,
    target: '[data-demo="unallocated-product"]',
    settleMs: 1100,
    reverse: [{ kind: 'click', label: `Un-tick ${term}`, target: '[data-demo="unallocated-product"]' }],
  },
];

/** Tap a free bin as a destination. */
const pickBin = (index: number, label: string): DemoStep => ({
  kind: 'click',
  label,
  target: nthFreeBin(index),
  settleMs: 1400,
  reverse: [{ kind: 'click', label: 'Release the bin', target: nthFreeBin(index) }],
});

/**
 * Commit a round. No `reverse`, and there cannot be one: unallocation is not reachable from this panel
 * — it only exists behind the zero-inventory banner after a move (CLAUDE.md §2 C). Previous rebuilds
 * from the start instead, which is correct but visibly a replay.
 */
const allocate = (label: string): DemoStep => ({
  kind: 'click',
  label,
  target: '[data-demo="unallocated-allocate"]',
  settleMs: 2200,
});

export const allocateProduct: DemoScenario = {
  id: 'allocate-product',
  title: 'Allocate Product',
  description: 'Every allocation pattern — one or many products, into one or many bins — in one sitting.',
  steps: [
    // A beat before anything moves, so the cursor does not appear to be mid-gesture already.
    { kind: 'note', label: 'The cabinet, as it stands', settleMs: 1800 },
    {
      kind: 'click',
      label: 'Open the Allocate/Move menu',
      target: '[data-demo="workflow-trigger"]',
      reverse: [{ kind: 'click', label: 'Close the menu', target: '[data-demo="workflow-trigger"]' }],
    },
    {
      kind: 'click',
      label: 'Choose Allocate Product',
      target: '[data-demo="workflow-allocate-product"]',
      settleMs: 1300,
      // The entry both closed the menu and opened the tray, so going back is two acts.
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

    // ── 1. One product, one bin ────────────────────────────────────────────────
    { kind: 'note', label: 'One product, one bin', settleMs: 1400 },
    ...pickProduct(ROUND_1[0]),
    pickBin(0, 'Tap a free bin'),
    allocate('Allocate'),
    { kind: 'note', label: 'Allocated — and the tray is one shorter', settleMs: 2200 },

    // ── 2. Several products, one bin ───────────────────────────────────────────
    { kind: 'note', label: 'Now several products into one bin', settleMs: 1400 },
    ...pickProduct(ROUND_2[0]),
    ...pickProduct(ROUND_2[1], ROUND_2[0]),
    {
      kind: 'type',
      // Not housekeeping: ticks survive a query change, so the two picks were made under different
      // filters and clearing the box is the only moment both are on screen at once. That invisibility
      // is the gap CLAUDE.md §8 records against the tray — shown here rather than explained.
      label: 'Clear the search to see both picks',
      target: '[data-demo="unallocated-search"]',
      text: '',
      settleMs: 1800,
      reverse: [
        {
          kind: 'type',
          label: `Back to ${ROUND_2[1]}`,
          target: '[data-demo="unallocated-search"]',
          text: ROUND_2[1],
        },
      ],
    },
    {
      kind: 'type',
      // The one round that finds its destination by name. The main search stays visible while the tray
      // is open precisely so it can be used this way, and it puts an amber ring on the bin a beat before
      // the cursor lands there — so the viewer sees the destination being CHOSEN rather than a cursor
      // arriving somewhere arbitrary. Done once, not in all four rounds: the capability is worth showing,
      // and showing it four times is padding.
      label: 'Search for the destination bin',
      target: '[data-demo="main-search"]',
      text: firstFreeBinName,
      settleMs: 1200,
      reverse: [
        { kind: 'type', label: 'Clear the bin search', target: '[data-demo="main-search"]', text: '' },
      ],
    },
    {
      kind: 'click',
      // Highlight, not select: in the tray a bin hit only locates (binActionFor); the bin is taken by
      // tapping the card, which is the next step.
      //
      // The FIRST bin row is the right one, and not by luck. Bin names are unique only within a door,
      // so this query matches one bin per door; searchBinsByName sorts free bins first and keeps door
      // order within that group, and the destination is by definition a free bin on Door 1.
      label: 'Highlight it on the shelf',
      target: '[data-demo="search-bin-action"]',
      settleMs: 1500,
      // Clearing the box drops the highlight too, so one act undoes both the ring and the query the
      // button wrote into the box.
      reverse: [
        { kind: 'type', label: 'Clear the bin search', target: '[data-demo="main-search"]', text: '' },
      ],
    },
    pickBin(0, 'Tap the bin the search found'),
    { kind: 'note', label: 'Two products, one location', settleMs: 1800 },
    allocate('Allocate'),
    { kind: 'note', label: 'Both landed in the same bin', settleMs: 2200 },

    // ── 3. One product, several bins ───────────────────────────────────────────
    { kind: 'note', label: 'Now one product across two bins', settleMs: 1400 },
    ...pickProduct(ROUND_3[0]),
    pickBin(0, 'Tap the first bin'),
    pickBin(1, 'Tap a second bin'),
    { kind: 'note', label: 'One product, two locations', settleMs: 1800 },
    allocate('Allocate'),
    // A product in two bins is the split the pharmacy team asked for — one drug, two places to reach
    // for it — and both rows start at zero, since stock arrives by restocking, not by allocating.
    { kind: 'note', label: 'The same product now lives in both', settleMs: 2400 },

    // ── 4. Several products, several bins ──────────────────────────────────────
    { kind: 'note', label: 'And the general case: several of each', settleMs: 1400 },
    ...pickProduct(ROUND_4[0]),
    ...pickProduct(ROUND_4[1], ROUND_4[0]),
    {
      kind: 'type',
      label: 'Clear the search to see both picks',
      target: '[data-demo="unallocated-search"]',
      text: '',
      settleMs: 1600,
      reverse: [
        {
          kind: 'type',
          label: `Back to ${ROUND_4[1]}`,
          target: '[data-demo="unallocated-search"]',
          text: ROUND_4[1],
        },
      ],
    },
    pickBin(0, 'Tap the first bin'),
    pickBin(1, 'Tap a second bin'),
    // Every product goes into every bin — the tray assigns the cross product, not a pairing. Worth a
    // longer beat, because it is the one round whose result is not obvious from the tap count.
    { kind: 'note', label: 'Two products into both bins', settleMs: 2000 },
    allocate('Allocate'),
    { kind: 'note', label: 'Four rows, from two taps and two ticks', settleMs: 2400 },

    // ── The ledger ─────────────────────────────────────────────────────────────
    {
      kind: 'click',
      label: 'Close the tray',
      target: '[data-demo="unallocated-cancel"]',
      settleMs: 1200,
      reverse: [
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
        { kind: 'click', label: 'Reopen the tray', target: '[data-demo="workflow-allocate-product"]' },
      ],
    },
    {
      kind: 'click',
      // Only reachable now: History hides while any workflow is open, so closing the tray is what puts
      // this button back on screen — which is why these are two steps in this order and not one.
      label: 'Open History',
      target: '[data-demo="history-trigger"]',
      settleMs: 1400,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // Four entries under Today, one per round. The ledger is where the walk stops being a claim about
    // the tray and becomes a record: an allocation that shows only as a 0-vial row in a bin is easy to
    // read as nothing having happened.
    { kind: 'note', label: 'All four, recorded under Today', settleMs: 4000 },
  ],
};
