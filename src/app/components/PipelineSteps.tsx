import React from 'react';
import { Check } from 'lucide-react';

/**
 * The Move Quantity pipeline's spine, shown on every stage so the operator can see where they are
 * and how far is left. Before this, the flow was several screens deep with no step count — you found
 * the next screen by pressing a button and arriving on it (UX-AUDIT H1-1).
 *
 *   ① Bin/Product → ② Target → ③ Review → ④ Move
 *   Tap the bins holding the stock to move.            ■ source  ■ target
 *
 * Every stage is now a full page carrying this header — including Review, which used to be a modal
 * overlay and read as a different kind of surface from the pages around it.
 *
 * Step ④ "Move" deliberately spans TWO screens: taking the quantity at the source and placing it in
 * the target are two halves of one move, so a standalone "Place" step misrepresented them as
 * separate errands. The indicator stays on "Move" across both; each screen's own header says whether
 * you're taking or placing.
 *
 * The second row is the answer to a question the step numbers cannot answer. Knowing you are on step
 * 1 of 4 does not tell you what to DO on step 1 — the canvas itself stays silent, because
 * changeAllocationMode reaches BinCard only to disable things (UX-AUDIT H1-2), so nothing says a tap
 * now means "select". One sentence per step, phrased as the physical action, is the same device the
 * quantity page already uses ("Remove the quantity shown from this bin, then tap…"), which the audit
 * singled out as working. It also extends the workflow menu's descriptions rather than adding a help
 * centre, which is what H10-1 asks for.
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
        // Names both routes, and says the tap target is the PRODUCT rather than the bin — the bin is
        // inert in this kind, so "tap a bin" would send the user at the one thing that won't answer.
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

// Decodes the two outline colours the shelves use while a move is open. They were doing real work
// unlabelled — blue for source, green for target — learnable only by trial (UX-AUDIT H4-2, H8-2).
// Swatches take the exact colours BinCard writes its own "Source Bin" / "Target Bin" labels in, so
// the key and the thing it explains cannot drift apart.
function ColourKey() {
  return (
    <div className="flex items-center gap-3 shrink-0" aria-hidden="true">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] border-2 border-[#165dfc]" />
        <span className="text-[12px] leading-[16px] text-[#676b74]">source</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px] border-2 border-[#359f5a]" />
        <span className="text-[12px] leading-[16px] text-[#676b74]">target</span>
      </span>
    </div>
  );
}

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

  // The key only appears where those colours are actually on screen: the shelves during bin picking,
  // and the Review page's two column headers. Step ④ has no source/target tinting to decode, so a key
  // there would explain something the user cannot see.
  const showColourKey = current < 4;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div
        className="flex items-center gap-2"
        role="list"
        aria-label={`Move Quantity — step ${current} of 4`}
      >
        {STEPS.map((step, i) => {
          const done = step.n < current;
          const active = step.n === current;
          return (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2 shrink-0" role="listitem" aria-current={active ? 'step' : undefined}>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold transition-colors ${
                    done
                      ? 'bg-[#095192] text-white'
                      : active
                        ? 'bg-[#095192] text-white ring-4 ring-[#F1F6FA]'
                        : 'bg-white border border-[#d9d9d9] text-[#676b74]'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : step.n}
                </span>
                <span
                  className={`text-[14px] leading-[20px] whitespace-nowrap ${
                    active ? 'font-semibold text-[#020817]' : done ? 'text-[#020817]' : 'text-[#676b74]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                // Connector fills to #095192 once its left step is done, so the coloured run is a
                // progress bar as much as a divider.
                <span
                  className={`h-px flex-1 min-w-[16px] ${step.n < current ? 'bg-[#095192]' : 'bg-[#d9d9d9]'}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Instruction and key share one row: the sentence reads from the left where the eye lands after
          the steps, the key sits out of the way on the right. gap-4 rather than justify-between so a
          short sentence isn't stranded halfway across a wide header. */}
      <div className="flex items-start justify-between gap-4 mt-1.5">
        <p className="text-[13px] leading-[18px] text-[#676b74]">
          {instructionFor(current, moveMode)}
        </p>
        {showColourKey && <ColourKey />}
      </div>
    </div>
  );
}
