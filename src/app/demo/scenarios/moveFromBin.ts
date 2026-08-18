import { DemoStep, DemoScenario } from '../types';

/**
 * Workflow B end to end with `moveMode = 'bin'` — the four-step move pipeline, start to ledger
 * (CLAUDE.md §2 B).
 *
 *   ① Bin      pick the bin to move out of
 *   ② Target   pick the bin to move into
 *   ③ Review   say which of that bin's products actually leave
 *   ④ Move     take the quantity at the source, then place it at the target
 *
 * **The source bin must hold more than one product, and that is the whole reason this workflow is
 * distinct.** Picking a bin does not commit its contents: Review still asks which products are
 * leaving, and with a single-product bin that question answers itself — the walk would then be a
 * Move from Product wearing a different name. `stockedBinWithChoice` below insists on two or more.
 *
 * **It moves the full quantity, and nothing types a number.** The quantity page opens at the source
 * bin's whole amount (`transfer.quantity || productInfo.quantity`, and transfers are staged at 0), so
 * the happy path is to accept it. That is not only the shortest route — a partial move turns serial
 * scanning on, and the number of serials to scan is then whatever the seed happens to hold, which a
 * scenario cannot know without reading quantities out of the DOM and generating steps from them. A
 * partial move with scanning is worth its own walkthrough; it is not the happy path.
 *
 * The consequence is deliberate and is the closing beat: moving everything empties the source bin, so
 * the cabinet comes back with the zero-inventory banner raised over it. That banner is the app asking
 * whether the product should keep its now-empty bin, and it is the honest end of a full move.
 */

/**
 * A bin on the OPEN door with something in it AND a choice to make about what leaves.
 *
 * Resolved from the DOM when the step runs, never written as an id: which bins hold what is a
 * property of the seed, and the seed is expected to be replaced by real cabinet data. `available`
 * alone is not the question — that only says the bin is not empty.
 */
const stockedBinWithChoice = () =>
  Array.from(document.querySelectorAll('[data-bin-id][data-bin-available="false"]')).find(
    bin => Number(bin.getAttribute('data-bin-product-count') ?? 0) >= 2
  ) ?? null;

/**
 * A free bin to move into. The first one on the open door, which is also the one wearing the green
 * stroke the viewer can already see — the demo taps a bin that visibly had room.
 *
 * Step ② refuses a bin that is already a source (it "cannot also be moved to"), and a free bin never
 * is one, so this cannot collide with the pick above.
 */
const freeBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

/**
 * A door with both — something to move and somewhere to put it — so step ① and step ② can both be
 * answered without walking to another door mid-move.
 *
 * The move pipeline makes this harder than the allocation walk had it: only the OPEN door's bins are
 * in the DOM, so the scenario cannot look at another door's contents, and `data-door-free-bins`
 * answers only half the question. The other half is that every door in this seed holds stock, so a
 * door with a free bin is a door with both — which is why this resolves on the free-bin count alone
 * and then asserts the source separately.
 *
 * Two free bins rather than one: the target consumes a free bin, and asking for slack means the walk
 * is not standing on the last one in the cabinet.
 */
const doorWithRoom = () =>
  Array.from(document.querySelectorAll('[data-demo="door"]')).find(
    door => Number(door.getAttribute('data-door-free-bins') ?? 0) >= 1
  ) ?? null;

/**
 * Advance one step of the pipeline.
 *
 * Every stage's primary answers to the same anchor, because the bar's whole design is that the
 * operator looks at one place for what happens next. It also survives the labels, which change with
 * the step and the mode and whether the requirement is met — `Move To`, `Build Move List`,
 * `Start Qty Move` and `Proceed to Move To` are all this one control.
 */
const advance = (label: string, settleMs = 1600): DemoStep => ({
  kind: 'click',
  label,
  target: '[data-demo="pipeline-primary"]',
  settleMs,
  reverse: [{ kind: 'click', label: 'Step back', target: '[data-demo="pipeline-back"]' }],
});

export const moveFromBin: DemoScenario = {
  id: 'move-from-bin',
  title: 'Move from Bin',
  description: 'A bin’s stock relocated end to end — pick the bin, the destination, what leaves, and place it.',
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
      // The kind is declared here and never inferred (CLAUDE.md §3, moveMode). Everything the rest of
      // the walk sees follows from this one click: which taps the canvas answers, what step ① is
      // called, which instruction the footer prints.
      label: 'Choose Move from Bin',
      target: '[data-demo="workflow-move-from-bin"]',
      settleMs: 1400,
      reverse: [
        { kind: 'click', label: 'Leave the move', target: '[data-demo="pipeline-cancel"]' },
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
      ],
    },
    {
      kind: 'await',
      // The footer is the pipeline's only chrome — no stepper band, no banner — so its appearing IS
      // the move having started.
      label: 'The move opens on step 1 of 4',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 1600,
    },

    // ── ① The bin to move out of ───────────────────────────────────────────────
    { kind: 'note', label: 'Step 1 — which bin are we moving out of', settleMs: 1600 },
    {
      kind: 'click',
      label: 'Open a door with room to move into',
      target: doorWithRoom,
      // Skipped when that door is already the open one, which in this seed it usually is: pressing Door 1
      // while standing on Door 1 reads as the walk not knowing where it is, and a viewer takes every
      // click as meaningful. The resolver cannot answer this — the door is the right one, the click is
      // what is redundant.
      skipWhen: () => doorWithRoom()?.getAttribute('data-door-open') === 'true',
      settleMs: 1200,
      // Which door is open is not part of the selection, so there is nothing to put back.
      reverse: [],
    },
    {
      kind: 'click',
      label: 'Tap a stocked bin as Move From',
      target: stockedBinWithChoice,
      settleMs: 1800,
      // A bin tap toggles in a Bin move, so releasing it is the same tap again.
      reverse: [{ kind: 'click', label: 'Release the bin', target: stockedBinWithChoice }],
    },
    // The card takes the blue stroke and the Move From badge, the bin name goes blue with it, and the
    // footer's left cell fills in — the primary stops saying what it is waiting for and names the
    // next step instead.
    { kind: 'note', label: 'Move From — and the footer unblocks', settleMs: 2000 },
    advance('Move To', 1800),

    // ── ② The bin to move into ─────────────────────────────────────────────────
    { kind: 'note', label: 'Step 2 — and where is it going', settleMs: 1600 },
    {
      kind: 'click',
      label: 'Tap a free bin as Move To',
      target: freeBin,
      settleMs: 1800,
      reverse: [{ kind: 'click', label: 'Release the bin', target: freeBin }],
    },
    // Green, not blue: the two ends of a move are told apart by colour on the card, the bin name and
    // the badge alike.
    { kind: 'note', label: 'Move To, in green', settleMs: 1800 },
    advance('Build Move List', 2000),

    // ── ③ Which of the bin's products actually leave ───────────────────────────
    {
      kind: 'await',
      label: 'Review opens on the bin’s contents',
      target: '[data-demo="review-select-product"]',
      settleMs: 1400,
    },
    // The step this workflow exists for. Choosing the bin did not commit what is in it — Review lists
    // every product the bin holds and each one is opted in by hand.
    { kind: 'note', label: 'Step 3 — the bin holds several; which are leaving', settleMs: 2400 },
    {
      kind: 'click',
      // Only the un-taken rows carry the anchor, so this is always a product still available to pick.
      label: 'Select the first product',
      target: '[data-demo="review-select-product"]',
      settleMs: 1800,
      // Nothing to put back through this button: it turns into a dimmed "Selected" and stops
      // answering. Previous rebuilds from the start, which is correct and visibly a replay.
    },
    // The rest of the bin stays put. That is the answer a Bin move gives and a Product move never
    // asks for.
    { kind: 'note', label: 'One product leaves; the rest stay', settleMs: 2200 },
    advance('Start Qty Move', 2200),

    // ── ④a Take it at the source ───────────────────────────────────────────────
    {
      kind: 'await',
      label: 'The source bin, to take stock from',
      target: '[data-demo="step4-quantity"]',
      settleMs: 1600,
    },
    // Opens at the bin's whole amount, so the happy path is to accept it. The screen also carries
    // Unlock Door beside the product name — the recovery the operator reaches for when the app
    // believes it sent the unlock and the cabinet did not open.
    { kind: 'note', label: 'Step 4 — the full quantity, ready to take', settleMs: 2600 },
    {
      kind: 'click',
      label: 'Take it and go to the target',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 2200,
      // There is no Back in step ④. Cancel is the only exit and it discards the move rather than
      // stepping through it, so this cannot be reversed through the UI (CLAUDE.md §2 B).
    },

    // ── ④b Place it at the target ──────────────────────────────────────────────
    {
      kind: 'await',
      label: 'The target bin, to place it in',
      target: '[data-demo="step4-placement"]',
      settleMs: 1600,
    },
    // Still 4/4. Taking and placing are two halves of one errand, not two steps — a separate "Place"
    // step misrepresented them as separate jobs. Serial scanning is off because the whole quantity is
    // moving: there is nothing to split between bins and so nothing to tell apart.
    { kind: 'note', label: 'Same step, other end of the move', settleMs: 2400 },
    {
      kind: 'click',
      label: 'Place it — this is the commit',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 2600,
    },

    // ── The result, and the ledger ─────────────────────────────────────────────
    // Emptying the bin raises the zero-inventory banner over the cabinet. It is not an error and it is
    // not dismissed here: a product at 0 still holds its bin, and the banner is the app asking whether
    // it should keep it — a question with no deadline, which is exactly why it waits rather than
    // interrupting at the moment of the commit.
    { kind: 'note', label: 'Moved — and the emptied bin asks what to do next', settleMs: 3600 },
    {
      kind: 'click',
      // Back on screen only now: History hides while any workflow is open.
      label: 'Open History',
      target: '[data-demo="history-trigger"]',
      settleMs: 1600,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // Filed as a move, not an allocation: Moved From and Moved To both named, with the quantity that
    // left and what each bin was left holding.
    { kind: 'note', label: 'Recorded — from which bin, to which bin', settleMs: 4000 },
  ],
};
