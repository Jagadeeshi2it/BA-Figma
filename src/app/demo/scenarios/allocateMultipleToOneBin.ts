import { DemoScenario } from '../types';

/**
 * Workflow D again, but showing what the tray is actually FOR (CLAUDE.md §2 D).
 *
 * The single-product walkthrough proves the mechanism; this one proves the point of it. Setting up a
 * cabinet means allocating dozens of products, and the tray takes several at once into one bin — the
 * batch case the pharmacy team described as how they work on site.
 *
 * Two things about it are deliberately different from the single-product scenario:
 *
 * **The list is built across two searches.** Ticking survives a query change (`selectedUnallocatedProducts`
 * is independent of the filter), and this scenario turns that into the demonstration: search, tick,
 * search something else, tick, then clear the box to see both still ticked. That last clear is not
 * decoration — it is the only moment both picks are on screen at once, which is the gap CLAUDE.md §8
 * records against the tray.
 *
 * **The destination is found by name before it is tapped.** Typing a bin name into the main search and
 * pressing Highlight Bin is how an operator sent to a specific bin finds it, and the main search box
 * stays visible while the tray is open precisely so it can be used this way. It also puts an amber ring
 * on the bin a beat before the cursor lands on it, so the viewer sees the destination being *chosen*
 * rather than a cursor arriving somewhere arbitrary.
 */

/**
 * Two of the eight products the seed reserves for the tray (`UNALLOCATED_RESERVE_IDS`), matched by
 * name rather than by tray id: ids are `unalloc-1`, `unalloc-2`… assigned by index over whatever is
 * still unallocated, so they renumber the moment anything is allocated.
 *
 * Neither is the product the single-product scenario uses, so running that one first does not empty
 * this one's tray.
 */
const FIRST_PRODUCT = 'MESNA';
const SECOND_PRODUCT = 'KADCYLA';

/**
 * The destination: the first bin on the open door that has room, resolved when the step runs rather
 * than written as a bin id — which bins are empty is a property of the seed, and the seed is expected
 * to be replaced by real cabinet data.
 *
 * Door 1 is where the app opens and holds nine available bins in the current seed, so no door-switching
 * is needed. If that stops being true this returns null and the runner stops with a stated reason
 * rather than clicking nothing.
 *
 * Assigning a bin does not change `bin.available`, so this resolves to the same card throughout the
 * scenario — which is what lets the reverse step tap it again to release it.
 */
const destinationBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

/**
 * That bin's name, for the search box. Read from `data-bin-name` rather than the card's heading text,
 * which carries the size suffix ("Bin 1A (1x1)") the search would not match.
 *
 * Falls back to empty, which types nothing and leaves the dropdown closed — the following step then
 * fails to find its target and the runner says so, rather than the walk continuing as if a bin had
 * been highlighted.
 */
const destinationBinName = () => destinationBin()?.getAttribute('data-bin-name') ?? '';

export const allocateMultipleToOneBin: DemoScenario = {
  id: 'allocate-multiple-to-one-bin',
  title: 'Allocate Multiple Products to One Location',
  description: 'Assign several unallocated products to a single empty bin in one operation.',
  steps: [
    { kind: 'note', label: 'The cabinet, as it stands', settleMs: 1800 },
    {
      kind: 'click',
      label: 'Open the Allocate/Move menu',
      target: '[data-demo="workflow-trigger"]',
      reverse: [
        { kind: 'click', label: 'Close the menu', target: '[data-demo="workflow-trigger"]' },
      ],
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

    // ---- Build the list: two products, two searches ----
    {
      kind: 'type',
      label: 'Search for the first product',
      target: '[data-demo="unallocated-search"]',
      text: FIRST_PRODUCT,
      settleMs: 1100,
      reverse: [
        { kind: 'type', label: 'Clear the search', target: '[data-demo="unallocated-search"]', text: '' },
      ],
    },
    {
      kind: 'click',
      // The filter has narrowed the tray to one row, so the first match IS the product searched for.
      label: 'Tick the first product',
      target: '[data-demo="unallocated-product"]',
      settleMs: 1300,
      reverse: [
        { kind: 'click', label: 'Un-tick it', target: '[data-demo="unallocated-product"]' },
      ],
    },
    {
      kind: 'type',
      label: 'Search for a second product',
      target: '[data-demo="unallocated-search"]',
      text: SECOND_PRODUCT,
      settleMs: 1100,
      // Back to the first product's query, not to an empty box: that is the state this step began in.
      reverse: [
        {
          kind: 'type',
          label: 'Back to the first search',
          target: '[data-demo="unallocated-search"]',
          text: FIRST_PRODUCT,
        },
      ],
    },
    {
      kind: 'click',
      label: 'Tick the second product',
      target: '[data-demo="unallocated-product"]',
      settleMs: 1300,
      reverse: [
        { kind: 'click', label: 'Un-tick it', target: '[data-demo="unallocated-product"]' },
      ],
    },
    {
      kind: 'type',
      // The reveal: both ticks have survived two query changes, and clearing the filter is the only
      // way to see them together. The footer has been counting them the whole time.
      label: 'Clear the search to see both picks',
      target: '[data-demo="unallocated-search"]',
      text: '',
      settleMs: 2000,
      reverse: [
        {
          kind: 'type',
          label: 'Back to the second search',
          target: '[data-demo="unallocated-search"]',
          text: SECOND_PRODUCT,
        },
      ],
    },
    { kind: 'note', label: 'Two products on the list', settleMs: 1600 },

    // ---- Find the destination, then take it ----
    {
      kind: 'type',
      // The main search stays visible while the tray is open, so it is still the way to find a bin.
      label: 'Search for the destination bin',
      target: '[data-demo="main-search"]',
      text: destinationBinName,
      settleMs: 1300,
      reverse: [
        { kind: 'type', label: 'Clear the bin search', target: '[data-demo="main-search"]', text: '' },
      ],
    },
    {
      kind: 'click',
      // Highlight, not select: in the tray a bin hit only locates (binActionFor), and the bin is taken
      // by tapping the card itself — which is the next step.
      //
      // The FIRST bin row is the right one, and not by luck. Bin names are unique only within a door,
      // so this query matches one bin per door; searchBinsByName sorts available bins first and keeps
      // door order within that group, and the destination is by definition an available bin on Door 1.
      label: 'Highlight the bin on the shelf',
      target: '[data-demo="search-bin-action"]',
      settleMs: 1600,
      // The highlight is its own state (binHighlight) and clearing the box drops it, so one act undoes
      // both the ring and the query the button wrote into the box.
      reverse: [
        { kind: 'type', label: 'Clear the bin search', target: '[data-demo="main-search"]', text: '' },
      ],
    },
    { kind: 'note', label: 'The destination, found by name', settleMs: 1500 },
    {
      kind: 'click',
      label: 'Assign both products to that bin',
      target: destinationBin,
      settleMs: 2000,
      reverse: [{ kind: 'click', label: 'Release the bin', target: destinationBin }],
    },
    // The footer now reads two products into one bin — the whole claim of this scenario, on screen
    // before anything is committed.
    { kind: 'note', label: 'Two products, one location', settleMs: 2200 },

    {
      kind: 'click',
      label: 'Allocate',
      target: '[data-demo="unallocated-allocate"]',
      settleMs: 2200,
      // No reverse, and there cannot be one: unallocation is not reachable from this panel — it only
      // exists behind the zero-inventory banner after a move (CLAUDE.md §2 C). Previous rebuilds.
    },
    // Both products are now rows in the bin, and the tray is two shorter.
    { kind: 'note', label: 'Both allocated, in one operation', settleMs: 2400 },

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
      // this button back on screen.
      label: 'Open History',
      target: '[data-demo="history-trigger"]',
      settleMs: 1400,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // Two entries under Today, not one. The ledger is where a batch allocation stops being a claim
    // about the tray and becomes a record of two transactions.
    { kind: 'note', label: 'Both recorded under Today', settleMs: 3500 },
  ],
};
