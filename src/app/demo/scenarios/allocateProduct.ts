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
const ROUND_1 = ['MESNA'];
// Round 2 names nothing either: it takes whatever the CLIMATE filter leaves — FLUOROURACIL and OPDIVO
// in the current seed. That is the point of the round, so naming them would undo it. The tray carrying
// at least TWO Climate products is a precondition, enforced by hand in UNALLOCATED_RESERVE_IDS: Select
// All over a single row is not a bulk allocation.
const ROUND_3 = ['VYLOY'];
// Round 4 names nothing: it picks the top two rows off the unfiltered list (see pickFromList), which in
// the current seed leaves DOXORUBICIN and VINORELBINE by the time it runs. Naming them would be a
// second place to keep in step with the rounds above.
//
// ROUND_1 must not be one of the two CLIMATE products, or round 2 has one row to select and stops being
// a bulk allocation. It was SOLU-CORTEF, which was Climate at the time — hence MESNA. (SOLU-CORTEF has
// since left the tray entirely; it lost the badge when the Climate rate dropped to ~1 in 6.)


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
 * Open a door with room, immediately before the bins are tapped — never at the top of a round.
 *
 * Each round is everything-in-the-tray, then one trip to the cabinet, which is the order the decision is
 * actually made in: what needs a home, and only then where. Opening the door first also cost a visible
 * round trip, since the round really starts at the search box: the cursor left the tray for the cabinet
 * and came straight back to the panel it had just been in.
 *
 * Round 2 needs no such step — it goes to a fridge, which `firstFridge` opens — but it already follows
 * the same order: filter, Select All, and only then the cold store.
 *
 * **Skipped when that door is already open.** Tapping it is a harmless no-op to the app and was left
 * unconditional on that basis — but not to a viewer, who reads every click as meaningful and sees the
 * cursor press a door the walk is already standing on. The resolver cannot answer it: the door is the
 * right one, the click is the redundant part.
 */
const openDoorWithRoom = (count: number): DemoStep => ({
  kind: 'click',
  label: count === 1 ? 'Open a door with a free bin' : `Open a door with ${count} free bins`,
  target: doorWithFreeBins(count),
  skipWhen: () => doorWithFreeBins(count)()?.getAttribute('data-door-open') === 'true',
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

/**
 * Set the tray's badge filter. Two clicks, because it is a Radix Select — the trigger opens a portalled
 * listbox, and the options only exist once it is open.
 *
 * Reversing puts it back to `All products` rather than to whatever was set before: the filter is reset
 * on every open of the tray, so "before" is `all` at every point a Previous can land on in this walk.
 */
const setBadgeFilter = (value: string, label: string): DemoStep[] => [
  {
    kind: 'click',
    label: 'Open the badge filter',
    target: '[data-demo="unallocated-badge-filter"]',
    settleMs: 900,
    reverse: [{ kind: 'click', label: 'Close the filter', target: '[data-demo="unallocated-badge-filter"]' }],
  },
  {
    kind: 'click',
    label: `Filter to ${label}`,
    target: `[data-demo="badge-filter-option-${value}"]`,
    settleMs: 1600,
    reverse: [
      { kind: 'click', label: 'Reopen the filter', target: '[data-demo="unallocated-badge-filter"]' },
      { kind: 'click', label: 'Back to all products', target: '[data-demo="badge-filter-option-all"]' },
    ],
  },
];

/**
 * The fridge to put climate-sensitive stock in.
 *
 * Found by `data-door-kind`, never by the "Fridge N" label. It cannot be found by `data-door-free-bins`
 * either — a fridge's one pooled bin is stocked in this seed, so it reports no room, and a bin holding
 * something is not a bin that is full (the app models no capacity at all, CLAUDE.md §5).
 */
const firstFridge = () => document.querySelector('[data-demo="door"][data-door-kind="fridge"]');

/**
 * A fridge's single bin. Not `nthFreeBin`, which filters on `data-bin-available="true"` and would find
 * nothing here for the reason above. A fridge has exactly one bin, so the first is the only one.
 */
const fridgeBin = () => document.querySelector('[data-bin-id]');

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
    openDoorWithRoom(1),
    pickBin(0, 'Tap a free bin'),
    allocate('Allocate'),
    { kind: 'note', label: 'Allocated — and the tray is one shorter', settleMs: 2200 },

    // ── 2. Several products, one location — by badge, into a fridge ────────────
    //
    // The general "many products, one bin" case, done the way the job is actually done rather than by
    // typing two names. Climate-sensitive stock belongs in a fridge, so the operator narrows the tray to
    // what needs cold storage, takes all of it, and puts it away in one act. Every product this filter
    // finds has the same destination — which is exactly when Select All is the right control and exactly
    // why the filter sits opposite it.
    //
    // It replaces a round that searched two names in turn and then cleared the box so both picks were on
    // screen at once. That version existed to show the tray's invisible-selection gap (CLAUDE.md §8),
    // which is a caveat rather than a workflow; this shows the workflow, and the caveat is still visible
    // in round 4 where a filtered pick and an unfiltered one meet.
    { kind: 'note', label: 'Now the bulk case — everything that needs a fridge', settleMs: 1800 },
    {
      kind: 'type',
      // Round 1 left its product's name in the box, and the two narrowings compose as AND — so the
      // filter would land on top of a query for one specific drug and find nothing. Clearing first is
      // also the honest order to show it in: the point of this round is that no typing is needed.
      label: 'Clear the search first',
      target: '[data-demo="unallocated-search"]',
      text: '',
      settleMs: 1200,
      reverse: [
        { kind: 'type', label: `Back to ${ROUND_1[0]}`, target: '[data-demo="unallocated-search"]', text: ROUND_1[0] },
      ],
    },
    ...setBadgeFilter('climate', 'Climate'),
    // Nothing was typed and nothing was read row by row: the tray is now exactly the cold-storage list.
    { kind: 'note', label: 'The tray is only the climate-sensitive stock now', settleMs: 2200 },
    {
      kind: 'click',
      // Select All acts on what is LISTED, so under a filter it means "all the Climate products" — the
      // hook and the panel share one predicate for that, or this tap would take the whole tray
      // (CLAUDE.md §2 D).
      label: 'Select All of them',
      target: '[data-demo="unallocated-select-all"]',
      settleMs: 1800,
      reverse: [{ kind: 'click', label: 'Clear the selection', target: '[data-demo="unallocated-select-all"]' }],
    },
    {
      kind: 'click',
      label: 'Open a fridge',
      target: firstFridge,
      settleMs: 1400,
      reverse: [],
    },
    {
      kind: 'click',
      label: 'Tap the fridge’s bin',
      target: fridgeBin,
      settleMs: 1600,
      reverse: [{ kind: 'click', label: 'Release the bin', target: fridgeBin }],
    },
    { kind: 'note', label: 'Two products, one cold location', settleMs: 1800 },
    allocate('Allocate'),
    // Both land in the fridge at 0 vials, as every allocation does. The filter is still on Climate and
    // the tray now has nothing to show under it — which is the next step's problem, and a real one.
    { kind: 'note', label: 'Both in the fridge — and no climate stock left waiting', settleMs: 2600 },

    // ── 3. One product, several bins ───────────────────────────────────────────
    // The filter survives an allocation — it is only reset when the tray is opened or closed — so it has
    // to be put back before anything else can be found. Not housekeeping smuggled into the walk: it is
    // the one moment the filter's persistence is visible, and a viewer who has just watched it empty the
    // tray should see that the tray is not empty.
    ...setBadgeFilter('all', 'all products'),
    { kind: 'note', label: 'Filter cleared — the rest of the tray is still there', settleMs: 1800 },
    { kind: 'note', label: 'Now one product across two bins', settleMs: 1400 },
    ...pickProduct(ROUND_3[0]),
    openDoorWithRoom(2),
    pickBin(0, 'Tap the first bin'),
    pickBin(1, 'Tap a second bin'),
    { kind: 'note', label: 'One product, two locations', settleMs: 1800 },
    allocate('Allocate'),
    // A product in two bins is the split the pharmacy team asked for — one drug, two places to reach
    // for it — and both rows start at zero, since stock arrives by restocking, not by allocating.
    { kind: 'note', label: 'The same product now lives in both', settleMs: 2400 },

    // ── 4. Several products, several bins ──────────────────────────────────────
    { kind: 'note', label: 'And the general case: several of each', settleMs: 1400 },
    {
      kind: 'type',
      // Searching is not the only way in, and by this round it would be the wrong one to show. An
      // operator setting up a cabinet works down the list of what still needs a home rather than
      // recalling six names to type — so this round clears the search and picks off the list, which is
      // also what makes the remaining tray visible as a list at all.
      // "the search", not "the filter" — the tray now has a badge filter as well, and this step clears
      // the box. Calling the query a filter was harmless when it was the only narrowing and is not now.
      label: 'Clear the search to browse what is left',
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
    openDoorWithRoom(2),
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
