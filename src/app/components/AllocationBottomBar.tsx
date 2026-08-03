import React from 'react';
import { LogOut, LogIn, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  PipelineFooterShell,
  FooterDivider,
  FooterActions,
  StepCell,
  SummaryCell,
  FooterButton,
  plural
} from './PipelineFooter';

interface AllocationBottomBarProps {
  step: 1 | 2;
  sourceBinCount: number;
  // Distinct products the source selection was built from — 0 when bins were clicked straight off
  // the shelf, where there's no product context to report.
  sourceProductCount: number;
  targetBinCount: number;
  // Distinct products the target bins already hold — nearly always 0, since destinations are usually
  // available bins, which is itself the useful signal when reviewing where things are going.
  targetProductCount: number;
  // Which kind of move this is, so the empty Source counts the unit that kind collects — products in
  // a Product move, bins in a Bin move.
  moveMode?: 'bin' | 'product' | null;
  openPanel: 'source' | 'target' | null;
  onOpenSource: () => void;
  onOpenTarget: () => void;
  onCancel: () => void;
  onBackToSource: () => void;
  onNext: () => void;
  onConfirm: () => void;
}

/**
 * The bin-picking stages' footer (steps 1 and 2), pinned to the bottom of the content column for as
 * long as the mode is open. It replaced a banner above the cabinets: that put the step's actions at the
 * top of a page whose whole job is scrolling through shelves, so the button you needed next scrolled
 * away from the bins you were picking. Down here it stays put, and it carries a running count of both
 * halves of the selection — openable for review before anything is committed.
 *
 * Every piece of it now comes from PipelineFooter, so the later stages' footers are the same bar with
 * different things reported in it.
 */
export default function AllocationBottomBar({
  step,
  sourceBinCount,
  sourceProductCount,
  targetBinCount,
  targetProductCount,
  moveMode,
  openPanel,
  onOpenSource,
  onOpenTarget,
  onCancel,
  onBackToSource,
  onNext,
  onConfirm
}: AllocationBottomBarProps) {
  // The target is always a bin whichever kind of move this is, so it reports bins, filled or empty.
  const summaryValue = (binCount: number, productCount: number) =>
    `${plural(binCount, 'Bin')}, ${plural(productCount, 'Product')}`;
  const targetValue =
    targetBinCount > 0 ? summaryValue(targetBinCount, targetProductCount) : plural(0, 'Bin');

  // Source reports only the unit the operator actually picked — bins in a Bin move, products in a
  // Product move — not both. Showing "1 Bin, 1 Product" together read as if the two figures could
  // ever disagree, when a Bin move's product count and a Product move's bin count are just derived
  // side-effects of the pick, not something the operator chose.
  const sourceValue =
    moveMode === 'product' ? plural(sourceProductCount, 'Product') : plural(sourceBinCount, 'Bin');

  return (
    <PipelineFooterShell>
      <StepCell step={step} moveMode={moveMode} />
      <FooterDivider />

      <SummaryCell
        icon={<LogOut className="w-4 h-4" />}
        label="Source"
        value={sourceValue}
        active={openPanel === 'source'}
        enabled={sourceBinCount > 0}
        onClick={onOpenSource}
      />
      <FooterDivider />
      <SummaryCell
        icon={<LogIn className="w-4 h-4" />}
        label="Target"
        value={targetValue}
        active={openPanel === 'target'}
        enabled={targetBinCount > 0}
        onClick={onOpenTarget}
      />

      <FooterActions>
        <FooterButton label="Cancel" variant="secondary" onClick={onCancel} />
        {step === 2 && (
          <FooterButton
            label="Source Selection"
            variant="secondary"
            onClick={onBackToSource}
            leadingIcon={<ArrowLeft className="w-4 h-4" />}
          />
        )}
        {step === 1 ? (
          // Disabled, the button says what it's waiting for rather than greying out mutely. A bare
          // disabled `Target Selection →` was the app's sharpest flaw — the user could see the control
          // they needed and was told nothing about why it wouldn't work (UX-AUDIT H6-2). The forward
          // arrow is dropped while blocked: it promises a next step that can't happen.
          <FooterButton
            label={sourceBinCount > 0 ? 'Target Selection' : 'Select a source bin'}
            variant="primary"
            enabled={sourceBinCount > 0}
            onClick={onNext}
            trailingIcon={sourceBinCount > 0 ? <ArrowRight className="w-4 h-4" /> : undefined}
          />
        ) : (
          <FooterButton
            label={targetBinCount > 0 ? 'Review Selection' : 'Select a target bin'}
            variant="primary"
            enabled={targetBinCount > 0}
            onClick={onConfirm}
            // Third step in the same sequence as the two beside it, so it takes the same arrow. It was
            // left bare while it said "Confirm", on the grounds that it opens a panel rather than
            // advancing — but that was the misleading part: it does advance, and the commit is two
            // screens further on.
            trailingIcon={targetBinCount > 0 ? <ArrowRight className="w-4 h-4" /> : undefined}
          />
        )}
      </FooterActions>
    </PipelineFooterShell>
  );
}
