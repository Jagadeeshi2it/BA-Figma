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
 * The products the searching rounds ask for by NAME, out of the eight the seed reserves for the tray
 * (`UNALLOCATED_RESERVE_IDS`).
 * Tray ids are `unalloc-1`, `unalloc-2`… assigned by index over whatever is still unallocated, so they
 * renumber after every round of this very scenario — a step naming one would be wrong by round two.
 *
 * Each term matches exactly one of the eight. Two are deliberately left over, so the tray still has
 * something in it at the end rather than bottoming out into its "nothing to allocate" state.
 */
const ROUND_1 = ['SOLU-CORTEF'];
const ROUND_2 = ['MESNA', 'KADCYLA'];
const ROUND_3 = ['VYLOY'];
// Round 4 names nothing: it picks the top two rows off the unfiltered list (see pickFromList), which in
// the current seed leaves FLUOROURACIL and DOXORUBICIN by the time it runs. Naming them would be a
// second place to keep in step with the three rounds above.


/**
 * The bins with room on the OPEN door, in the order they appear — resolved when a step runs, never
 * written as ids. Which bins are empty is a property of the seed, and this scenario changes it four
 * times as it goes.
 *
 * Selecting a bin does not change `bin.available`; only allocating does. So within a round these
 * resolve to the same cards throughout (which is what lets a reverse step tap one again to release it),
 * and between rounds they advance past whatever was just filled.
 */
const freeBins = () =>
  Array.from(document.querySelectorAll('[data-bin-id][data-bin-available="true"]'));
const nthFreeBin = (index: number) => () => freeBins()[index] ?? null;

/**
 * A door with at least `count` bins still free — the step that has to run before every round.
 *
 * The walk needs six free bins and no single door has them. The seed spreads fifteen across the
 * cabinet: one behind Door 1, two behind each of Doors 2–8. Worse, only the OPEN door's bins are in the
 * DOM, so a scenario cannot count another door's free bins by looking — which is what `data-door-free-bins`
 * on each door button is for.
 *
 * This is also the more honest demonstration. Setting up a cabinet is not done standing at one door;
 * the operator works along the shelves, and the walk showing that is closer to the job than one that
 * happened to find everything in front of it.
 *
 * Re-resolved every round, so it naturally moves on as doors fill up. Returns null when no door has
 * enough left, and the runner stops with a stated reason rather than clicking nothing.
 */
const doorWithFreeBins = (count: number) => () =>
  Array.from(document.querySelectorAll('[data-demo="door"]')).find(
    door => Number(door.getAttribute('data-door-free-bins') ?? 0) >= count
  ) ?? null;

/**
 * Round 2 used to find its bin by NAME first — typing it into the main search and pressing Highlight
 * Bin, so the destination lit up a beat before the cursor arrived. It is removed, and not because the
 * idea was wrong: the dropdown does not reliably open for a synthetic click on the search box, so the
 * step stalled the walk in front of the viewer. The runner's dispatchRealClick focuses its target, but
 * the box's list is gated on React's own onFocus having fired, and during a run it sometimes has not.
 * Worth revisiting as a runner fix rather than a scenario one — see DEMO.md §12.
 *
 * Open a door with room before a round starts. Tapping the door already open is a harmless no-op, so
 * this can be unconditional rather than the scenario trying to predict when it is needed.
 */
const openDoorWithRoom = (count: number): DemoStep => ({
  kind: 'click',
  label: count === 1 ? 'Open a door with a free bin' : `Open a door with ${count} free bins`,
  target: doorWithFreeBins(count),
  settleMs: 1200,
  // Nothing to put back: which door is open is not part of the selection, and the previous round's
  // door is wherever the resolver was pointing before — the rebuild handles it if Previous goes past.
  reverse: [],
});

/**
 * A tray row by position, for the rounds that pick off the list rather than searching.
 *
 * Position is only safe because the list is unfiltered when these run: the tray's order is the seed's,
 * minus whatever this walk has already allocated, so it is deterministic within a run. It would NOT be
 * safe under a filter, which is why the round clears the box first — and it is still no basis for
 * naming a product, so these steps' labels say "a product", not which one.
 */
const nthTrayProduct = (index: number) => () =>
  document.querySelectorAll('[data-demo="unallocated-product"]')[index] ?? null;

/** Tick a row straight off the list. */
const pickFromList = (index: number, label: string): DemoStep => ({
  kind: 'click',
  label,
  target: nthTrayProduct(index),
  settleMs: 1200,
  reverse: [{ kind: 'click', label: 'Un-tick it', target: nthTrayProduct(index) }],
});

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
    openDoorWithRoom(1),
    ...pickProduct(ROUND_1[0]),
    pickBin(0, 'Tap a free bin'),
    allocate('Allocate'),
    { kind: 'note', label: 'Allocated — and the tray is one shorter', settleMs: 2200 },

    // ── 2. Several products, one bin ───────────────────────────────────────────
    { kind: 'note', label: 'Now several products into one bin', settleMs: 1400 },
    openDoorWithRoom(1),
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
    pickBin(0, 'Tap a free bin'),
    { kind: 'note', label: 'Two products, one location', settleMs: 1800 },
    allocate('Allocate'),
    { kind: 'note', label: 'Both landed in the same bin', settleMs: 2200 },

    // ── 3. One product, several bins ───────────────────────────────────────────
    { kind: 'note', label: 'Now one product across two bins', settleMs: 1400 },
    openDoorWithRoom(2),
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
    openDoorWithRoom(2),
    {
      kind: 'type',
      // Searching is not the only way in, and by this round it would be the wrong one to show. An
      // operator setting up a cabinet works down the list of what still needs a home rather than
      // recalling six names to type — so this round clears the filter and picks off the list, which is
      // also what makes the remaining tray visible as a list at all.
      label: 'Clear the filter to browse what is left',
      target: '[data-demo="unallocated-search"]',
      text: '',
      settleMs: 1600,
      reverse: [
        {
          kind: 'type',
          label: `Back to ${ROUND_3[0]}`,
          target: '[data-demo="unallocated-search"]',
          text: ROUND_3[0],
        },
      ],
    },
    pickFromList(0, 'Tick a product from the list'),
    pickFromList(1, 'And the one below it'),
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
