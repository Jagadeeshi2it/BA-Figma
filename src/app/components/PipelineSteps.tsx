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
export const instructionFor = (step: PipelineStep, moveMode: MoveMode): string => {
  switch (step) {
    case 1:
      return moveMode === 'product'
        ? 'Search for and select product(s) to move, or select product(s) from bin(s).'
        : 'Tap the bins holding the stock you want to move.';
    case 2:
      return 'Tap the bins to move the stock to.';
    case 3:
      return moveMode === 'product'
        ? "Choose which of the product's bins to take from."
        : 'Choose which products to move out of each bin.';
    case 4:
      return 'Take the quantity where you are moving from, then place it where you are moving to.';
  }
};
