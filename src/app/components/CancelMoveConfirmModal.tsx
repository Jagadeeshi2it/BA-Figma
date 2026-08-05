import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

/**
 * "Cancel this move?" — the one confirmation step ④ needs.
 *
 * It briefly also carried a return checklist, for cancelling with stock already in hand. That is gone:
 * cancelling is now offered ONLY before the first quantity leaves a source bin (STEP4-GUIDANCE.md §8), so
 * there is never anything to put back and the dialog has one thing to say. The checklist design is
 * recorded in the spec rather than left here behind a condition nothing can satisfy.
 */
export default function CancelMoveConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  onDismiss
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">Cancel this move?</DialogTitle>
        </DialogHeader>

        <div className="my-2">
          {/* Both halves matter: the selection is being lost, and it took work to build — but nothing has
              been touched in the cabinet, which is the reassurance that makes the choice easy. */}
          <p className="text-[14px] text-[#4a5565]">
            The bins and products you selected will be discarded. Nothing has been moved, so the cabinet
            is unchanged.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          {/* Staying is the safe option, so it reads as continuing the work. */}
          <Button onClick={onDismiss} variant="outline" className="px-6">
            Keep Moving
          </Button>
          {/* Destructive red: this discards work, unlike the pipeline's other secondary buttons, which
              only step between stages. */}
          <Button onClick={onConfirm} className="bg-[#C6362C] hover:bg-[#A82C24] text-white px-6">
            Discard Move
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
