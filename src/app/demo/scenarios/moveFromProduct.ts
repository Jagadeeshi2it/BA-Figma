import { DemoStep, DemoScenario } from '../types';

/**
 * Workflow B end to end with `moveMode = 'product'` — the same four steps as Move from Bin, entered
 * through the other door (CLAUDE.md §2 B).
 *
 * The two walks are deliberately near-identical from step ② onward, because the workflows are: one
 * pipeline with two ways in, not two pipelines. Everything worth watching is in step ①, and it is all
 * a consequence of the operator having declared the unit up front:
 *
 *   - **the bin card is inert.** A tap on it is refused with an explanation; the PRODUCT ROW is the
 *     target. This is the inverse of the Bin walk, where the row is inert and the card answers.
 *   - **the badge says `2 Selected`, not `Move From`.** They picked products; the bin came along as a
 *     consequence, so the card reports what was chosen rather than a role it was given.
 *   - **the footer's from-end is just `Move`.** `Move From` names a place, and nothing was chosen from
 *     anywhere here (`sourceEndLabel`).
 *   - **Review is product-centric** — headed by the product, paging products, where the Bin walk's is
 *     headed by the bin.
 *
 * **One product, from one bin.** The flagship behaviour of this workflow is the other route in: picking
 * a product out of the search dropdown takes it *in every bin it lives in* — "wherever this drug is".
 * That is genuinely worth demonstrating and it is **not** this walk, for a mechanical reason. How many
 * bins a product occupies is seed data, and a multi-bin pick makes two separate step counts depend on
 * it: Review pages source bin by source bin, each needing its own `Select`, and step ④ then takes from
 * each in turn. A scenario is a static list of steps; it cannot count either without the runner
 * learning to repeat a step until a condition clears. **That is the right way to build it** — see
 * DEMO.md §10d — and it deserves its own walkthrough rather than being smuggled into this one, where a
 * seed change would silently turn it into a walk that stops halfway.
 *
 * As with Move from Bin, the full quantity is accepted rather than typed, which keeps serial scanning
 * out of it and ends the walk on the emptied bin's zero-inventory banner.
 */

/**
 * A product row that can actually be picked, with something in it to move.
 *
 * Two conditions, and both matter. The anchor is only carried while the row *picks* — in a Bin move or
 * at either kind's target step the identical row is inert — so its presence already means the app is
 * in the state this walk expects. The quantity filter is the second: a product at 0 is movable by
 * design (what moves is the allocation, CLAUDE.md §2 E) but it is not the happy path, and the seed
 * holds several such rows.
 */
const pickableProductRow = () =>
  Array.from(document.querySelectorAll('[data-demo="source-product-row"]')).find(
    row => Number(row.getAttribute('data-product-quantity') ?? 0) > 0
  ) ?? null;

/**
 * A free bin to move into — the first on the open door, wearing the green stroke the viewer can
 * already see. A free bin holds nothing, so it can never be the source this walk just picked from,
 * which is the collision step ② refuses.
 */
const freeBin = () => document.querySelector('[data-bin-id][data-bin-available="true"]');

/**
 * A door with somewhere to put things. Every door in this seed holds stock, so a door with a free bin
 * is a door with both ends of a move available — and only the OPEN door's bins are in the DOM, which
 * is what `data-door-free-bins` on the door buttons exists to answer.
 */
const doorWithRoom = () =>
  Array.from(document.querySelectorAll('[data-demo="door"]')).find(
    door => Number(door.getAttribute('data-door-free-bins') ?? 0) >= 1
  ) ?? null;

/**
 * Advance one step of the pipeline. Every stage's primary answers to the same anchor — see the note on
 * `demoId` in `PipelineFooter.tsx` for why that is the design rather than a shortcut.
 */
const advance = (label: string, settleMs = 1600): DemoStep => ({
  kind: 'click',
  label,
  target: '[data-demo="pipeline-primary"]',
  settleMs,
  reverse: [{ kind: 'click', label: 'Step back', target: '[data-demo="pipeline-back"]' }],
});

export const moveFromProduct: DemoScenario = {
  id: 'move-from-product',
  title: 'Move from Product',
  description: 'The same move, entered by the product rather than the bin — the rows answer, the cards do not.',
  steps: [
    { kind: 'note', label: 'The cabinet, as it stands', settleMs: 1800 },
    {
      kind: 'click',
      label: 'Open the Allocate/Move menu',
      target: '[data-demo="workflow-trigger"]',
      reverse: [{ kind: 'click', label: 'Close the menu', target: '[data-demo="workflow-trigger"]' }],
    },
    {
      kind: 'click',
      // The one click the rest of the walk follows from. Intent is not recoverable from a selection,
      // so the app never infers it (CLAUDE.md §3, moveMode) — and this is where it is declared.
      label: 'Choose Move from Product',
      target: '[data-demo="workflow-move-from-product"]',
      settleMs: 1400,
      reverse: [
        { kind: 'click', label: 'Leave the move', target: '[data-demo="pipeline-cancel"]' },
        { kind: 'click', label: 'Reopen the menu', target: '[data-demo="workflow-trigger"]' },
      ],
    },
    {
      kind: 'await',
      label: 'The move opens on step 1 of 4',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 1600,
    },

    // ── ① The product to move ──────────────────────────────────────────────────
    // The footer says so too: `Move from Product · Step 1/4`, and its primary is waiting for
    // "products to move" where the Bin walk's waits for bins. The prefix exists for exactly this —
    // steps ① and ② differ by kind, and a tap on the canvas means different things in each.
    { kind: 'note', label: 'Step 1 — here the unit is the product, not the bin', settleMs: 2000 },
    {
      kind: 'click',
      label: 'Open a door with room to move into',
      target: doorWithRoom,
      settleMs: 1200,
      reverse: [],
    },
    {
      kind: 'click',
      // The gesture that makes this workflow itself. The bin card underneath is inert — tapping it is
      // refused with "this move goes by product" — and the row is what answers.
      label: 'Tap a product inside a bin',
      target: pickableProductRow,
      settleMs: 2000,
      // Picking toggles, exactly as a bin tap does in the other kind, so the same row un-picks.
      reverse: [{ kind: 'click', label: 'Un-pick the product', target: pickableProductRow }],
    },
    // The row goes blue — the product was chosen, so the colour belongs to it. The bin joins the
    // selection as a consequence and says `1 Selected` rather than `Move From`, because a count of
    // what was picked is the true thing to report and a role it was never given is not.
    { kind: 'note', label: 'The row is blue; the bin just reports the count', settleMs: 2400 },
    advance('Move To', 1800),

    // ── ② The bin to move into ─────────────────────────────────────────────────
    // From here the two kinds have converged: the target is always a bin, so step ② is the same screen
    // with the same rules — which is why the footer drops the workflow prefix after this.
    { kind: 'note', label: 'Step 2 — the target is a bin in either kind', settleMs: 1600 },
    {
      kind: 'click',
      label: 'Tap a free bin as Move To',
      target: freeBin,
      settleMs: 1800,
      reverse: [{ kind: 'click', label: 'Release the bin', target: freeBin }],
    },
    { kind: 'note', label: 'Move To, in green', settleMs: 1800 },
    advance('Build Move List', 2000),

    // ── ③ Confirm what is leaving ──────────────────────────────────────────────
    {
      kind: 'await',
      label: 'Review opens headed by the product',
      target: '[data-demo="review-select-product"]',
      settleMs: 1400,
    },
    // The mirror of the Bin walk's step ③. There it lists a bin's products and asks which leave; here
    // the product is the heading and the bin is scoped to what was picked in it — so the list is one
    // row rather than the bin's whole contents.
    { kind: 'note', label: 'Step 3 — scoped to the product, not the bin’s contents', settleMs: 2400 },
    {
      kind: 'click',
      label: 'Confirm the product leaves this bin',
      target: '[data-demo="review-select-product"]',
      settleMs: 1800,
      // Turns into a dimmed "Selected" and stops answering; Previous rebuilds from the start.
    },
    advance('Start Qty Move', 2200),

    // ── ④a Take it at the source ───────────────────────────────────────────────
    {
      kind: 'await',
      label: 'The source bin, to take stock from',
      target: '[data-demo="step4-quantity"]',
      settleMs: 1600,
    },
    { kind: 'note', label: 'Step 4 — the full quantity, ready to take', settleMs: 2600 },
    {
      kind: 'click',
      label: 'Take it and go to the target',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 2200,
      // No Back exists in step ④ in either kind; Cancel discards the move rather than stepping back.
    },

    // ── ④b Place it at the target ──────────────────────────────────────────────
    {
      kind: 'await',
      label: 'The target bin, to place it in',
      target: '[data-demo="step4-placement"]',
      settleMs: 1600,
    },
    { kind: 'note', label: 'Same step, other end of the move', settleMs: 2400 },
    {
      kind: 'click',
      label: 'Place it — this is the commit',
      target: '[data-demo="pipeline-primary"]',
      settleMs: 2600,
    },

    // ── The result, and the ledger ─────────────────────────────────────────────
    { kind: 'note', label: 'Moved — and the emptied row asks what to do next', settleMs: 3600 },
    {
      kind: 'click',
      label: 'Open History',
      target: '[data-demo="history-trigger"]',
      settleMs: 1600,
      reverse: [{ kind: 'click', label: 'Leave History', target: '[data-demo="history-back"]' }],
    },
    // The ledger does not record which door the operator came in through, and should not: the same
    // move by either route produces the same row. That is the clearest statement that these are one
    // workflow with two entrances.
    { kind: 'note', label: 'Recorded identically to a Move from Bin', settleMs: 4000 },
  ],
};
