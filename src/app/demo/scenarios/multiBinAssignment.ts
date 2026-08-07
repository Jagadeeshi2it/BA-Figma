import { DemoStep, DemoScenario } from '../types';

/**
 * Workflow A end to end — giving products that are already stocked another bin (CLAUDE.md §2 A).
 *
 * Two rounds, which between them are the whole workflow:
 *
 *   1. one product  → two bins
 *   2. two products → one bin
 *
 * **Both directions, and no more.** The four-way grid the tray's walk runs (§2 D) would be the obvious
 * thing to copy and is the wrong shape here: the fourth case, many products into many bins, is the two
 * below happening at once and adds a round without adding a fact. Two rounds also keep the walk short
 * enough to sit through, which was the brief.
 *
 * **The panel stays open between them**, as it does in the tray's walk and for the same reason: the
 * operator giving one drug a second bin is usually about to do it again for the next one, and
 * `handleAssignProductsToBins` is built for that — it leaves the panel up and clears exactly what should
 * clear (the ticks, the tapped bins), while the newly filled bins flip to `available: false` so the
 * resolvers below simply find the next free ones.
 *
 * What this walk shows that the tray's cannot: every row here reports **where the product already lives**,
 * which is the context for choosing another bin and the reason this panel exists rather than the tray.
 */

/**
 * The products each round asks for by NAME.
 *
 * Names, not ids: a bin row's id is `${masterId}_${stamp}_${binId}` and this very walk mints new ones as
 * it goes. Each term is checked to put the intended product FIRST in the results — the steps tick the
 * first row rather than reading the list — and each one exists in the cabinet before the walk starts,
 * which is what makes it a Multi Bin case at all.
 *
 * COSELA is deliberately a product that already sits in two bins: the row lists both, so the round's
 * "and now a third and a fourth" is visible on the row itself rather than only in the ledger at the end.
 */
const ROUND_1 = 'COSELA';
const ROUND_2 = ['MITOMYCIN', 'POLIVY'];

/**
 * The bins with room on the OPEN door, resolved when a step runs rather than written as ids — which bins
 * are free is a property of the seed, and this walk changes it twice.
 *
 * Tapping a bin does not change `bin.available`; only allocating does. So these resolve to the same cards
 * throughout a round (which is what lets a reverse step tap one again to release it) and move past the
 * filled ones between rounds.
 */
const nthFreeBin = (index: number) => () =>
  Array.from(document.querySelectorAll('[data-bin-id][data-bin-available="true"]'))[index] ?? null;

/**
 * A door with at least `count` bins still free.
 *
 * Only the open door's bins are in the DOM, so a scenario cannot count another door's free bins by
 * looking — `data-door-free-bins` on the door buttons is what answers it. Written out here rather than
 * shared with the tray's walk: each scenario owns its resolvers, so editing one walk cannot quietly
 * change another.
 *
 * Re-resolved each round, so it moves on as doors fill. Returns null if no door has room, and the runner
 * stops with a stated reason rather than clicking nothing.
 */
const doorWithFreeBins = (count: number) => () =>
  Array.from(document.querySelectorAll('[data-demo="door"]')).find(
    door => Number(door.getAttribute('data-door-free-bins') ?? 0) >= count
  ) ?? null;

/**
 * Open a door with room before a round starts. Tapping the door already open is a harmless no-op, so this
 * is unconditional rather than the scenario trying to predict when it is needed.
 */
const openDoorWithRoom = (count: number): DemoStep => ({
  kind: 'click',
  label: count === 1 ? 'Open a door with a free bin' : `Open a door with ${count} free bins`,
  target: doorWithFreeBins(count),
  settleMs: 1200,
  // Nothing to put back: which door is open is not part of the selection.
  reverse: [],
});

/**
 * Find a product and tick it.
 *
 * The panel lists **nothing** until something is typed — it is a search tool over the whole cabinet, not a
 * catalogue to scroll (§2 A) — so unlike the tray's walk there is no "pick off the list" variant here.
 * That is the workflow, not a limitation: you arrive already knowing which drug needs another bin.
 */
const pickProduct = (term: string, previousTerm?: string): DemoStep[] => [
  {
    kind: 'type',
    label: `Search for ${term}`,
    target: '[data-demo="allocate-search"]',
    text: term,
    settleMs: 1200,
    reverse: [
      {
        kind: 'type',
        label: previousTerm ? `Back to ${previousTerm}` : 'Clear the search',
        target: '[data-demo="allocate-search"]',
        text: previousTerm ?? '',
      },
    ],
  },
  {
    kind: 'click',
    label: `Tick ${term}, and see where it already lives`,
    target: '[data-demo="allocate-product"]',
    settleMs: 1600,
    reverse: [{ kind: 'click', label: `Un-tick ${term}`, target: '[data-demo="allocate-product"]' }],
  },
];

/**
 * Tap a free bin as a destination.
 *
 * Bins are picked out on the shelves, never in the panel — which is why the footer's counter says
 * `Select bin(s) to allocate` until one is tapped, and why a tick has to come first: `handleBinClick`
 * refuses a bin outright while no product is chosen.
 */
const pickBin = (index: number, label: string): DemoStep => ({
  kind: 'click',
  label,
  target: nthFreeBin(index),
  settleMs: 1500,
  reverse: [{ kind: 'click', label: 'Release the bin', target: nthFreeBin(index) }],
});

/**
 * Commit a round. No `reverse`, and there cannot be one: nothing in this panel unallocates, and the
 * app's only unallocation is the zero-inventory banner after a move (§2 C). Previous rebuilds from the
 * start instead, which is correct and visibly a replay.
 */
const allocate: DemoStep = {
  kind: 'click',
  label: 'Allocate',
  target: '[data-demo="allocate-confirm"]',
  settleMs: 2400,
};

export const multiBinAssignment: DemoScenario = {
  id: 'multi-bin-assignment',
  title: 'Multi Bin Assignment',
  description: 'Give an allocated product another bin — one product into two, then two products into one.',
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
      // The second entry, not the first. Both say "assign bins"; this one is for products that already
      // have one, which is the distinction the two entries' near-identical wording exists to draw.
      label: 'Choose Multi Bin Assignment',
      target: '[data-demo="workflow-multi-bin-assignment"]',
      settleMs: 1300,
      // The entry both closed the menu and opened the panel, so going back is two acts.
      reverse: [
        { kind: 'click', label: 'Close the panel', target: '[data-demo="allocate-cancel"]' },
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
      ],
    },
    {
      kind: 'await',
      label: 'The assignment panel opens',
      target: '[data-demo="allocate-search"]',
      settleMs: 1400,
    },
    // The panel is empty on purpose and a viewer should be given a moment to notice, or the search that
    // follows looks like it is filtering something that was already there.
    { kind: 'note', label: 'Nothing is listed until you search for it', settleMs: 1800 },

    // ── 1. One product, two bins ───────────────────────────────────────────────
    { kind: 'note', label: 'One product, two more bins', settleMs: 1400 },
    openDoorWithRoom(2),
    ...pickProduct(ROUND_1),
    // The row now lists the bins it already occupies. That list is the whole reason this panel is not
    // the tray: it is what stops you picking a bin the drug is already in, and the app refuses that tap
    // anyway (one identity twice in a bin splits it into two rows and every count doubles it).
    { kind: 'note', label: 'It is already in two bins — these are two more', settleMs: 2200 },
    pickBin(0, 'Tap a free bin'),
    pickBin(1, 'And a second one'),
    // The picked bins are listed on the row in purple, under the ones it already occupies — where it is
    // now, and where it is going, in one place.
    { kind: 'note', label: 'Both destinations, on the product’s own row', settleMs: 2000 },
    allocate,
    // Every new location opens at 0 vials: allocating gives a product somewhere to be, and stock arrives
    // by moving it in, which is the other workflow's job. Worth stating, because a viewer who expects the
    // vials to follow the allocation will read the zeroes as a failure.
    { kind: 'note', label: 'Two new locations, both starting at zero', settleMs: 2600 },

    // ── 2. Two products, one bin ───────────────────────────────────────────────
    { kind: 'note', label: 'Now the other way round — two products, one bin', settleMs: 1600 },
    openDoorWithRoom(1),
    ...pickProduct(ROUND_2[0]),
    // A second search does not lose the first pick: the panel holds the picked product OBJECTS, not their
    // keys, so a product found under one query survives the next one (§2 A).
    ...pickProduct(ROUND_2[1], ROUND_2[0]),
    {
      kind: 'click',
      // …but surviving is not the same as being visible, which is what this control answers: it clears
      // the box, and a clear box is what puts the `Selected products` list on screen. Nothing else
      // happens — the selection is not touched, because a control that reviewed and reset it would be one
      // tap from losing several searches' work.
      label: 'Tap the counter to see both picks',
      target: '[data-demo="allocate-review-selection"]',
      settleMs: 1800,
      reverse: [
        {
          kind: 'type',
          label: `Back to ${ROUND_2[1]}`,
          target: '[data-demo="allocate-search"]',
          text: ROUND_2[1],
        },
      ],
    },
    { kind: 'note', label: 'Both, newest first, each with its own locations', settleMs: 2400 },
    pickBin(0, 'Tap one free bin for both'),
    { kind: 'note', label: 'One bin, taking both products', settleMs: 1800 },
    allocate,
    { kind: 'note', label: 'Two products now share a bin', settleMs: 2400 },

    // ── The ledger ─────────────────────────────────────────────────────────────
    {
      kind: 'click',
      label: 'Close the panel',
      target: '[data-demo="allocate-cancel"]',
      settleMs: 1200,
      reverse: [
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
        { kind: 'click', label: 'Reopen the panel', target: '[data-demo="workflow-multi-bin-assignment"]' },
      ],
    },
    {
      kind: 'click',
      // Only reachable now: History hides while any workflow is open, so closing the panel is what puts
      // this button back on screen — two steps in this order, not one.
      label: 'Open History',
      target: '[data-demo="history-trigger"]',
      settleMs: 1400,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // Two `New Bin Allocation` entries under Today, filed exactly as the tray's allocations are, because
    // it is the same event: a product gaining a location. This panel wrote nothing to the ledger at all
    // until 2026-08-07 — the one workflow whose entire output is an allocation was the one missing from
    // the allocation record — so the walk ending here is also the check that it still does.
    { kind: 'note', label: 'Both rounds, recorded under Today', settleMs: 4000 },
  ],
};
