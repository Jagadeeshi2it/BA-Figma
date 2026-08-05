import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { pluralizeUnit } from '../utils/pluralizeUnit';

/**
 * How far into step ④ the operator is, which is what decides whether cancelling is merely wasteful or
 * actually leaves stock somewhere it should not be. See STEP4-GUIDANCE.md §8.
 *
 * `nothing-collected` — no source bin has been worked yet, so there is nothing in the operator's hands
 * and cancelling costs only the selection.
 *
 * `stock-in-hand` — quantities have been taken. Leaving means putting them back, and this dialog becomes
 * the checklist for doing so.
 *
 * There is deliberately no third value for "collected from several doors". Whether the stock came from one
 * door or four changes only the length of the list below, not what the operator has to do — the
 * distinction bought a branch and nothing else (§8).
 */
export type CancelMoveStage = 'nothing-collected' | 'stock-in-hand';

/**
 * What a step-④ screen reports as being on the counter. Only the bin id — App resolves it to a bin name
 * and door, because it already holds the resolved index the route planner uses and the screens do not.
 */
export interface StagedStock {
  binId: string;
  productName: string;
  quantity: number;
  unit?: string;
  // The identity triple and generic name, carried so a recorded cancellation names the product the way
  // every other surface does — badges are derived from this triple (CLAUDE.md §3), so without it the
  // history row shows a different drug's badges.
  ndc?: string;
  inventoryType?: string;
  description?: string;
}

/** One thing to put back, and where. */
export interface ReturnItem {
  binId: string;
  binName: string;
  doorName: string;
  productName: string;
  quantity: number;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  description?: string;
}

interface CancelMoveConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: CancelMoveStage;
  /**
   * What is on the counter, already ordered by the caller so the walk back costs the fewest door
   * openings. Grouped here for display only — the order is not this component's to decide.
   */
  returnItems?: ReturnItem[];
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Door, then bin, preserving the caller's order at both levels. */
const groupByDoorAndBin = (items: ReturnItem[]) => {
  const doors: Array<{ doorName: string; bins: Array<{ binName: string; items: ReturnItem[] }> }> = [];
  items.forEach(item => {
    let door = doors.find(d => d.doorName === item.doorName);
    if (!door) {
      door = { doorName: item.doorName, bins: [] };
      doors.push(door);
    }
    let bin = door.bins.find(b => b.binName === item.binName);
    if (!bin) {
      bin = { binName: item.binName, items: [] };
      door.bins.push(bin);
    }
    bin.items.push(item);
  });
  return doors;
};

export default function CancelMoveConfirmModal({
  open,
  onOpenChange,
  stage,
  returnItems = [],
  onConfirm,
  onDismiss
}: CancelMoveConfirmModalProps) {
  const hasStock = stage === 'stock-in-hand' && returnItems.length > 0;
  const doors = hasStock ? groupByDoorAndBin(returnItems) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {/* Named for the act, not the button that opened it. With stock in hand this is not a cancel —
                it is putting things back and then leaving, and the title should say the bigger half. */}
            {hasStock ? 'Return the stock, then confirm' : 'Cancel this move?'}
          </DialogTitle>
        </DialogHeader>

        {hasStock ? (
          <div className="my-2 space-y-3">
            <p className="text-[14px] text-[#4a5565]">
              Put these back where they came from. Confirming below records that you have.
            </p>

            {/* The dialog IS the checklist, which is why it lists everything rather than summarising a
                count: it is on screen exactly while the operator is walking back, and confirming is the
                acknowledgement that they did. No separate screen, and nothing to remember. */}
            <div className="max-h-[280px] overflow-y-auto rounded-[4px] border border-gray-200">
              {doors.map(door => (
                <div key={door.doorName} className="border-b border-gray-200 last:border-b-0">
                  {/* Grouped by door because that is what the walk costs — one heading is one door to
                      open. Door order comes from the caller (ascending, §8). */}
                  <div className="bg-[#f8fafc] px-3 py-1.5 text-[12px] font-semibold text-[#475569]">
                    {door.doorName}
                  </div>
                  {door.bins.map(bin => (
                    <div key={bin.binName} className="px-3 py-2">
                      <p className="text-[13px] font-semibold text-[#020817]">{bin.binName}</p>
                      <div className="mt-1 space-y-1">
                        {bin.items.map((item, index) => (
                          <div
                            key={`${item.binId}-${item.productName}-${index}`}
                            className="flex items-start justify-between gap-3 text-[13px]"
                          >
                            <span className="min-w-0 text-[#4a5565]">{item.productName}</span>
                            <span className="shrink-0 font-medium text-[#020817] whitespace-nowrap">
                              {item.quantity} {pluralizeUnit(item.unit || 'vial', item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Said plainly because the app cannot check it. Phase 1 takes the operator's word, and the
                history entry is what makes that word auditable rather than invisible (§8). */}
            <p className="text-[12px] text-[#B45309]">
              The cabinet cannot verify this — confirm only once the stock is actually back.
            </p>
          </div>
        ) : (
          <div className="my-2">
            <p className="text-[14px] text-[#4a5565]">
              The bins and products you selected will be discarded. Nothing has been moved, so the cabinet
              is unchanged.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          {/* Staying is the safe option, so it reads as continuing the work. */}
          <Button onClick={onDismiss} variant="outline" className="px-6">
            Keep Moving
          </Button>
          {/* Destructive red: this genuinely discards work, unlike the pipeline's Cancel/Back buttons,
              which only step out of an uncommitted selection. */}
          <Button
            onClick={onConfirm}
            className="bg-[#C6362C] hover:bg-[#A82C24] text-white px-6"
          >
            {hasStock ? 'Returned — Exit' : 'Discard Move'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
