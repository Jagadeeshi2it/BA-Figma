import React from 'react';
import { Check } from 'lucide-react';

/**
 * The Move Quantity pipeline's spine, shown on every stage so the operator can see where they are
 * and how far is left. Before this, the flow was several screens deep with no step count — you found
 * the next screen by pressing a button and arriving on it (UX-AUDIT H1-1).
 *
 *   ① Bin                    ② Target   ③ Review   ④ Move
 *     Tap the bins holding
 *     the stock to move.
 *
 * Every stage is a full page carrying this header — including Review, which used to be a modal
 * overlay and read as a different kind of surface from the pages around it.
 *
 * Step ④ "Move" deliberately spans TWO screens: taking the quantity at the source and placing it in
 * the target are two halves of one move, so a standalone "Place" step misrepresented them as
 * separate errands. The indicator stays on "Move" across both; each screen's own header says whether
 * you're taking or placing.
 *
 * Knowing you are on step 1 of 4 does not tell you what to DO on step 1, and the canvas cannot say it
 * either — while a move is open, changeAllocationMode reaches BinCard only to DISABLE things, so the
 * shelves go quiet with nothing signalling that a tap now means "select" (UX-AUDIT H1-2). So each step
 * carries its own instruction, hung beneath its label rather than in a row of its own: the sentence
 * belongs to one step, and putting it under that step's name says so without a second band of chrome.
 * Only the active step shows it — the others are places you have been or will be, and their
 * instructions would be answering questions nobody is asking yet.
 */
export type PipelineStep = 1 | 2 | 3 | 4;

type MoveMode = 'bin' | 'product' | null | undefined;

// Step ① is named for what the chosen kind of move actually collects — products in a Product move,
// bins in a Bin move — rather than the generic "Source". The operator picked the unit in the menu, so
// the step that carries it out should say the same word back. Step ② stays "Target": the destination
// is a bin whichever kind this is.
const sourceLabelFor = (moveMode: MoveMode) =>
  moveMode === 'product' ? 'Product' : moveMode === 'bin' ? 'Bin' : 'Source';

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
const instructionFor = (step: PipelineStep, moveMode: MoveMode): string => {
  switch (step) {
    case 1:
      return moveMode === 'product'
        ? 'Tap a product inside a bin, or find one with search.'
        : 'Tap the bins holding the stock you want to move.';
    case 2:
      return 'Tap the bins the stock should go to.';
    case 3:
      return moveMode === 'product'
        ? "Choose which of the product's bins to take from."
        : 'Choose which products to move out of each bin.';
    case 4:
      return 'Take the quantity at the source bin, then place it in the target bin.';
  }
};

export default function PipelineSteps({
  current,
  moveMode
}: {
  current: PipelineStep;
  moveMode?: MoveMode;
}) {
  const STEPS: { n: PipelineStep; label: string }[] = [
    { n: 1, label: sourceLabelFor(moveMode) },
    { n: 2, label: 'Target' },
    { n: 3, label: 'Review' },
    { n: 4, label: 'Move' }
  ];

  return (
    // px-10 rather than px-6: the connectors run the full width between steps, so the page's own
    // gutter is what sets how far apart the steps sit. Tighter padding pushed the first and last steps
    // out to the edges and left the run between them looking cramped.
    <div className="bg-white border-b border-gray-200 px-10 py-3">
      <div
        // items-center: each circle sits centred against its own label-plus-instruction block, and
        // because the row's height comes from the tallest of those blocks, every circle still lands on
        // the same line — the spine stays a spine.
        className="flex items-center gap-3"
        role="list"
        aria-label={`Move Quantity — step ${current} of 4`}
      >
        {STEPS.map((step, i) => {
          const done = step.n < current;
          const active = step.n === current;
          return (
            <React.Fragment key={step.n}>
              <div
                // Every step takes an equal share of the row, so the circles are evenly spaced. Sized
                // to content before, the active step ran ~250px against ~70px for the others, which
                // pushed its neighbours along and left the gaps visibly lopsided — the instruction was
                // setting the spine's rhythm. An equal share means the text changes what fills a step,
                // never where the next one starts.
                className="flex items-center gap-2 flex-1 min-w-0"
                role="listitem"
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold shrink-0 transition-colors ${
                    done
                      ? 'bg-[#095192] text-white'
                      : active
                        ? 'bg-[#095192] text-white ring-4 ring-[#F1F6FA]'
                        : 'bg-white border border-[#d9d9d9] text-[#676b74]'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : step.n}
                </span>

                <span className="flex flex-col">
                  {/* leading-[24px] matches the circle's height, so the label sits centred against it
                      no matter whether an instruction hangs below. */}
                  <span
                    className={`text-[14px] leading-[24px] whitespace-nowrap ${
                      active ? 'font-semibold text-[#020817]' : done ? 'text-[#020817]' : 'text-[#676b74]'
                    }`}
                  >
                    {step.label}
                  </span>
                  {active && (
                    // Bounded rather than nowrap: the sentences are long enough that on one line they
                    // would shove the remaining steps off the right edge.
                    <span className="text-[13px] leading-[18px] text-[#676b74] max-w-[240px]">
                      {instructionFor(current, moveMode)}
                    </span>
                  )}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                // Connector fills to #095192 once its left step is done, so the coloured run is a
                // progress bar as much as a divider. Fixed width now that the steps take the flexible
                // share: two flexible things competing is what let the widest step decide the spacing.
                // The row's items-center puts it on the circles' line without a nudge.
                <span
                  className={`h-px w-8 shrink-0 ${step.n < current ? 'bg-[#095192]' : 'bg-[#d9d9d9]'}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
