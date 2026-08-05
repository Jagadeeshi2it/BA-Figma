import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

/**
 * How far into step ④ the operator is, which is what decides whether cancelling is merely wasteful or
 * actually leaves stock somewhere it should not be. See STEP4-GUIDANCE.md.
 *
 * `nothing-collected` — no source bin has been worked yet, so there is nothing in the operator's hands
 * and cancelling costs only the selection.
 *
 * `stock-in-hand` — quantities have been taken. Cancelling means putting them back, and the dialog has to
 * say so, because the app cannot do it for them.
 */
export type CancelMoveStage = 'nothing-collected' | 'stock-in-hand';

interface CancelMoveConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: CancelMoveStage;
  /** How many source bins have been worked. Only used to name what has to go back. */
  collectedBinCount?: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function CancelMoveConfirmModal({
  open,
  onOpenChange,
  stage,
  collectedBinCount = 0,
  onConfirm,
  onDismiss
}: CancelMoveConfirmModalProps) {
  const hasStock = stage === 'stock-in-hand';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {hasStock ? 'Cancel and return the stock?' : 'Cancel this move?'}
          </DialogTitle>
        </DialogHeader>

        <div className="my-2 space-y-3 text-[14px] text-[#4a5565]">
          {/* Named plainly, because the selection is the thing being lost and it took work to build. The
              source and target bins do NOT survive a cancel — the flow resets to the default view, the
              same as it does after a successful move. */}
          <p>
            The bins and products you selected will be discarded. Nothing has been moved, so the cabinet
            is unchanged.
          </p>

          {hasStock && (
            // The app cannot put stock back for them, so it must not imply that cancelling undoes the
            // physical act. Stating the bin count rather than a vague "what you have collected" gives
            // them something to check against.
            <p className="text-[#B45309]">
              You have already collected stock from{' '}
              <span className="font-semibold">
                {collectedBinCount} source bin{collectedBinCount === 1 ? '' : 's'}
              </span>
              . Return it to those bins before you leave — cancelling here does not put it back.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          {/* Staying is the safe option, so it is the one that reads as continuing the work. */}
          <Button onClick={onDismiss} variant="outline" className="px-6">
            Keep Moving
          </Button>
          {/* Destructive red: this one genuinely discards work, unlike the pipeline's Cancel/Back
              buttons, which only step out of an uncommitted selection. */}
          <Button
            onClick={onConfirm}
            className="bg-[#C6362C] hover:bg-[#A82C24] text-white px-6"
          >
            Discard Move
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
