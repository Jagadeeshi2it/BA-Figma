import React from 'react';
import ConfirmDialog, { ConfirmDialogText } from "./ConfirmDialog";

/**
 * "Cancel this move?" — the one confirmation step ④ needs.
 *
 * It briefly also carried a return checklist, for cancelling with stock already in hand. That is gone:
 * cancelling is now offered ONLY before the first quantity leaves a source bin (STEP4-GUIDANCE.md §8), so
 * there is never anything to put back and the dialog has one thing to say. The checklist design is
 * recorded in the spec rather than left here behind a condition nothing can satisfy.
 *
 * It wrote its own dialog until 2026-08-10, which is how it came to sit two spacing steps and one primary
 * colour away from the Unallocate confirmation. `ConfirmDialog` owns both now.
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel this move?"
      /* Staying is the safe option, so it reads as continuing the work. */
      dismissLabel="Keep Moving"
      onDismiss={onDismiss}
      confirmLabel="Discard Move"
      onConfirm={onConfirm}
      /* Not destructive, despite the word "discard": the selection was never committed, and the dialog's
         own second sentence is that the cabinet is unchanged. `#C6362C` is for things that destroy data,
         which is the rule the pipeline's Cancel and Back buttons already follow (CLAUDE.md §6). */
      tone="primary"
    >
      {/* Both halves matter: the selection is being lost, and it took work to build — but nothing has
          been touched in the cabinet, which is the reassurance that makes the choice easy. */}
      <ConfirmDialogText>
        The bins and products you selected will be discarded. Nothing has been moved, so the cabinet
        is unchanged.
      </ConfirmDialogText>
    </ConfirmDialog>
  );
}
