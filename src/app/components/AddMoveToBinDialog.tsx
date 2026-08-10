import React, { useMemo, useState } from 'react';
import { Package, Lock } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { MoveToBinCandidate, selectableMoveToBins, reachableMoveToBins } from '../utils/moveTargetBins';
import { pluralizeUnit } from '../utils/pluralizeUnit';

/**
 * "The bin I am filling has run out of room" — the escape from the one state step ④ had no answer for.
 *
 * The trap: every quantity is taken from its source before any is carried (that is the shape of step
 * ④), and on the placement screen `Cancel` is never available because of it. So an operator whose
 * target bin fills up holds stock the pipeline will not let them put down: the primary sits on
 * `Place N more vials` and nothing satisfies it. A short count or a damaged vial reaches the same
 * place — a full bin is only the most obvious way in.
 *
 * Two things this dialog has to collect, and both are asked because the app cannot know them:
 *
 * 1. **Which bin next.** There is no capacity model anywhere in the domain (CLAUDE.md §5), so nothing
 *    can suggest a bin that will fit the rest. The operator is looking at the cabinet; they choose.
 * 2. **How much actually fit in the bin they are at.** Only asked when the move was not already
 *    scanning serials. When it is, the scan list *is* that answer — they scanned what fit, and asking
 *    again would invite it disagreeing with the serials. When it is not (the whole quantity going to
 *    one bin, so the count was filled in for them), nothing on screen has recorded that only some of
 *    it fit, and the remainder cannot be worked out without being told.
 *
 * What it deliberately does NOT do is offer to put the remainder back in its source bin. That was
 * built once and removed (STEP4-GUIDANCE §8): nothing in the app can verify the operator did it, so it
 * records a move that may not have happened. Placing the rest somewhere real is the better answer, and
 * it is the reason this dialog exists rather than a "return to source" one.
 */
export default function AddMoveToBinDialog({
  open,
  onOpenChange,
  productName,
  unit,
  currentBinLabel,
  /** What the current bin is credited with right now — the figure the operator is correcting. */
  currentBinQuantity,
  /** Total taken for this product, so "fit here" can be bounded and the remainder stated. */
  totalQuantity,
  /** False when the scan list already says what fit, in which case no quantity is asked for. */
  askHowMuchFit,
  candidates,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  unit: string;
  currentBinLabel: string;
  currentBinQuantity: number;
  totalQuantity: number;
  askHowMuchFit: boolean;
  candidates: MoveToBinCandidate[];
  onConfirm: (binId: string, placedInCurrentBin: number) => void;
}) {
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  /**
   * Empty until the operator types it, and deliberately not seeded with a figure. Anything the app put
   * here would be a guess at how much fit in a bin it cannot see, and a number already in the field is
   * a number that gets accepted — the one thing that must not happen to the figure the whole split is
   * derived from. `null` is "not yet said", which is also what blocks the confirm.
   */
  const [fitHere, setFitHere] = useState<number | null>(null);

  const { listed, hiddenCount } = useMemo(() => reachableMoveToBins(candidates), [candidates]);
  const selectable = useMemo(() => selectableMoveToBins(listed), [listed]);

  // Reset every time it opens. A stale bin choice from a previous visit is the kind of thing that
  // quietly commits stock to the wrong place.
  React.useEffect(() => {
    if (open) {
      setSelectedBinId(null);
      setFitHere(null);
    }
  }, [open]);

  const placedInCurrentBin = askHowMuchFit ? fitHere : currentBinQuantity;
  const remainder =
    placedInCurrentBin == null ? null : Math.max(0, totalQuantity - placedInCurrentBin);
  const canConfirm = !!selectedBinId && remainder != null && remainder > 0;
  const units = (qty: number) => pluralizeUnit(unit, qty);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add another Move To bin"
      dismissLabel="Cancel"
      onDismiss={() => onOpenChange(false)}
      // States its own requirement rather than greying mutely, and there are two of them — the figure
      // first, because it is what the remainder is computed from and the bin list is the longer job.
      confirmLabel={
        remainder == null
          ? 'Enter how many fit'
          : remainder === 0
            ? 'All of it fit — nothing to add'
            : selectedBinId
              ? `Add Bin · ${remainder} ${units(remainder)} to place`
              : 'Pick a bin'
      }
      onConfirm={() => {
        if (!canConfirm || !selectedBinId || placedInCurrentBin == null) return;
        onConfirm(selectedBinId, placedInCurrentBin);
      }}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-[14px] text-[#4a5565]">
          {productName} — {totalQuantity} {units(totalQuantity)} were taken from the source. Choose
          where the rest goes.
        </p>

        {askHowMuchFit && (
          <div>
            {/* Asked as "how many fit", not "how many are left": the operator is looking at the bin
                they just filled, so the figure they have is the one that went in. The remainder is
                arithmetic and is shown rather than typed. */}
            <label className="block text-[13px] font-medium text-[#020817] mb-1.5" htmlFor="fit-here">
              How many fit in {currentBinLabel}?
            </label>
            <div className="flex items-center gap-3">
              <input
                id="fit-here"
                type="number"
                min={0}
                max={totalQuantity}
                value={fitHere ?? ''}
                placeholder="0"
                onChange={event => {
                  const raw = event.target.value;
                  if (raw === '') {
                    setFitHere(null);
                    return;
                  }
                  const next = Number(raw);
                  if (Number.isNaN(next)) return;
                  setFitHere(Math.max(0, Math.min(totalQuantity, Math.floor(next))));
                }}
                className="w-24 h-9 px-3 border border-gray-300 rounded-[4px] text-[14px] text-[#020817]"
              />
              <span className="text-[13px] text-[#4a5565]">
                {remainder == null
                  ? `of ${totalQuantity} ${units(totalQuantity)}`
                  : remainder === 0
                    ? 'nothing left over'
                    : `${remainder} ${units(remainder)} still to place`}
              </span>
            </div>
          </div>
        )}

        <div>
          <div className="text-[13px] font-medium text-[#020817] mb-1.5">
            {selectable.length} {selectable.length === 1 ? 'bin' : 'bins'} to choose from
          </div>

          {/* Blocked bins are listed, not hidden, and say why — a bin the operator can see in the
              cabinet and cannot find in this list reads as the list being wrong. Same rule as the
              search dropdown's spent rows. */}
          <div className="max-h-[280px] overflow-y-auto border border-gray-200 rounded-[4px] divide-y divide-gray-100">
            {listed.length === 0 && (
              <p className="text-[14px] text-[#4a5565] p-3">No other bins in this cabinet.</p>
            )}
            {listed.map(candidate => {
              const blocked = !!candidate.blockedReason;
              const selected = candidate.binId === selectedBinId;
              return (
                <button
                  key={candidate.binId}
                  type="button"
                  aria-disabled={blocked}
                  onClick={blocked ? undefined : () => setSelectedBinId(candidate.binId)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2 ${
                    blocked
                      ? 'opacity-50 cursor-not-allowed'
                      : selected
                        ? 'bg-[#F1F6FA] cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {blocked ? (
                      <Lock className="w-4 h-4 text-[#94a3b8]" />
                    ) : (
                      <Package
                        className={`w-4 h-4 ${candidate.isAvailable ? 'text-[#22C55E]' : 'text-[#94a3b8]'}`}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[14px] ${
                          selected ? 'text-[#095192] font-medium' : 'text-[#020817]'
                        }`}
                      >
                        {candidate.doorName} - {candidate.binName}
                      </span>
                      {/* Green is the app's word for "this bin is free", the same stroke BinCard puts
                          on an available bin. */}
                      {candidate.isAvailable && !blocked && (
                        <span className="text-[11px] font-medium text-[#15803D]">Available</span>
                      )}
                      {candidate.isCurrentDoor && (
                        <span className="text-[11px] text-[#095192]">Door already open</span>
                      )}
                    </span>
                    <span className="block text-[13px] text-[#4a5565]">
                      {candidate.blockedReason
                        ? candidate.blockedReason
                        : candidate.alreadyStocksProduct
                          ? 'Already stocks this product — the arrival merges into that row.'
                          : candidate.productCount === 0
                            ? 'Empty'
                            : `Holds ${candidate.productCount} ${
                                candidate.productCount === 1 ? 'product' : 'products'
                              }`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Never a silent narrowing. The operator can see these bins in the cabinet, so a list that
              simply omitted them would read as the list being broken rather than as being scoped. */}
          {hiddenCount > 0 && (
            <p className="text-[12px] text-[#94a3b8] mt-1.5">
              {hiddenCount} further {hiddenCount === 1 ? 'bin' : 'bins'} behind other doors already hold
              stock and are not listed — this shows the open door, plus empty bins elsewhere.
            </p>
          )}
        </div>
      </div>
    </ConfirmDialog>
  );
}
