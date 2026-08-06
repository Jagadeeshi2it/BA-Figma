/**
 * The Move Quantity pipeline's step vocabulary — shared by every stage's footer (PipelineFooter.tsx)
 * so the step count and per-step instruction can't disagree between stages.
 *
 * The visible stepper band (① Bin → ② Target → ③ Review → ④ Move) that used to render from this file
 * was removed once the bottom-bar footer's own Step n/4 cell replaced it — the band was kept behind a
 * switch for comparison, and the bar won.
 */
export type PipelineStep = 1 | 2 | 3 | 4;

export const TOTAL_PIPELINE_STEPS = 4;

type MoveMode = 'bin' | 'product' | null | undefined;

/**
 * What to do on this step, in one sentence, named as the physical act rather than the UI mechanic.
 * This is the device the quantity page already uses ("Remove the quantity shown from this bin, then
 * tap…"), which the audit singled out as working, and it extends the workflow menu's descriptions
 * rather than adding a help centre — what H10-1 asks for.
 *
 * The two kinds diverge only where they genuinely differ — how the source is gathered. Step ①'s
 * Product wording names the product row as the tap target on purpose: the bin itself is inert in that
 * kind, so telling the user to "tap a bin" would aim them at the one thing that cannot answer — the
 * silently dead control H9-1 describes.
 */
/**
 * What to say when a tap lands on the wrong kind of thing.
 *
 * Both halves of a move step have exactly one unit — the bin in a Bin move, the product in a Product
 * move, the bin again at the target — and a tap on the other one is refused. It used to be refused in
 * silence: `handleBinClick` returns early for a Product move and the product rows simply stop being
 * clickable in a Bin move, so the operator taps, nothing at all happens, and a control that is working
 * exactly as designed is indistinguishable from one that is broken (`UX-AUDIT H9-1`).
 *
 * The message names the thing that WOULD work, not the mistake — the footer instruction already says
 * what the step is for, and repeating it as a scolding adds nothing. Both live here, beside that
 * instruction, so the correction and the standing advice cannot drift into contradicting each other.
 *
 * Returns null where the tap is legitimate, so a caller can use it as the test as well as the copy.
 */
export const binTapRefusal = (step: PipelineStep, moveMode: MoveMode): string | null =>
  step === 1 && moveMode === 'product'
    ? 'This move goes by product — tap a product inside the bin, or search for it.'
    : null;

export const productTapRefusal = (step: PipelineStep, moveMode: MoveMode): string | null => {
  // The target is a whole bin in either kind of move, so a product row means nothing on step ②.
  if (step === 2) return 'Tap the bin itself to choose it as Move To.';
  return moveMode === 'bin' ? 'This move goes by bin — tap the bin itself to choose it as Move From.' : null;
};

/** One id for both, so tapping repeatedly replaces the toast instead of stacking eight of them. */
export const WRONG_UNIT_TOAST_ID = 'move-wrong-unit';

export const instructionFor = (step: PipelineStep, moveMode: MoveMode): string => {
  switch (step) {
    // Steps ① and ② are deliberately parallel — "to move stock from" / "to move stock to" — because they
    // are the same gesture at the two ends, and the footer cells beside them are named the same way.
    case 1:
      return moveMode === 'product'
        ? 'Search for the products to move, or tap them in a bin.'
        : 'Tap the bins to move stock from.';
    case 2:
      return 'Tap the bins to move stock to.';
    case 3:
      return moveMode === 'product'
        ? "Choose which of the product's bins to move from."
        : 'Choose which products to move out of each bin.';
    case 4:
      return 'Take the quantity where you are moving from, then place it where you are moving to.';
  }
};
