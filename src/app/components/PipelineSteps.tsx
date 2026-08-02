import React from 'react';
import { Check } from 'lucide-react';

/**
 * The Move Quantity pipeline's spine, shown on every stage so the operator can see where they are
 * and how far is left. Before this, the flow was several screens deep with no step count — you found
 * the next screen by pressing a button and arriving on it (UX-AUDIT H1-1).
 *
 *   ① Source → ② Target → ③ Review → ④ Move
 *
 * Every stage is now a full page carrying this header — including Review, which used to be a modal
 * overlay and read as a different kind of surface from the pages around it.
 *
 * Step ④ "Move" deliberately spans TWO screens: taking the quantity at the source and placing it in
 * the target are two halves of one move, so a standalone "Place" step misrepresented them as
 * separate errands. The indicator stays on "Move" across both; each screen's own header says whether
 * you're taking or placing.
 */
export type PipelineStep = 1 | 2 | 3 | 4;

// Step ① is named for what the chosen kind of move actually collects — products in a Product move,
// bins in a Bin move — rather than the generic "Source". The operator picked the unit in the menu, so
// the step that carries it out should say the same word back. Step ② stays "Target": the destination
// is a bin whichever kind this is.
const sourceLabelFor = (moveMode?: 'bin' | 'product' | null) =>
  moveMode === 'product' ? 'Product' : moveMode === 'bin' ? 'Bin' : 'Source';

export default function PipelineSteps({
  current,
  moveMode
}: {
  current: PipelineStep;
  moveMode?: 'bin' | 'product' | null;
}) {
  const STEPS: { n: PipelineStep; label: string }[] = [
    { n: 1, label: sourceLabelFor(moveMode) },
    { n: 2, label: 'Target' },
    { n: 3, label: 'Review' },
    { n: 4, label: 'Move' }
  ];

  return (
    <div
      className="flex items-center gap-2 bg-white border-b border-gray-200 px-6 py-3"
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
  );
}
