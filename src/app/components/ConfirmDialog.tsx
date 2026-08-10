import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

/**
 * The app's one alert/confirmation dialog.
 *
 * The two confirmations (Unallocate, Cancel move) were written independently and drifted: different body
 * spacing, different footer offsets, and one of them a red primary. This holds the language in code the
 * same way `PipelineFooter` and `ProductListControls` do for their surfaces — a stage chooses *what* to
 * say, never how it looks.
 *
 * The language is the Unallocate dialog's, which the operator picked as the reference:
 *   title at 20px semibold · body at 14px `#4a5565` · footer right-aligned, gap-3, mt-6
 *   dismiss as a white outline button, confirm as the blue primary
 *
 * Two details are deliberate:
 * - **The body slot carries no padding of its own.** Content sits flush against the dialog's own `p-6`,
 *   so a paragraph and a scrolling list of products start on the same left edge. A padded wrapper made
 *   the list look like a card inset inside the dialog, which is a second surface where there is only one.
 * - **Buttons are `rounded-[4px]`**, the app's radius (`PipelineFooter`, both allocation panels), not the
 *   `Button` primitive's `rounded-md`. Set here rather than on the primitive, which every button in the
 *   app shares and which is not this change's business.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  dismissLabel,
  onDismiss,
  confirmLabel,
  onConfirm,
  tone = 'primary',
  className = 'max-w-md'
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  /** `destructive` is for a confirm that actually destroys data — see CLAUDE.md §6 on `#C6362C`. */
  tone?: 'primary' | 'destructive';
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="my-4">{children}</div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onDismiss} variant="outline" className="px-6 rounded-[4px]">
            {dismissLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={
              tone === 'destructive'
                ? 'bg-[#C6362C] hover:bg-[#A82C24] text-white px-6 rounded-[4px]'
                : 'bg-[#095192] hover:bg-[#074080] text-white px-6 rounded-[4px]'
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The body copy every confirmation uses — 14px, `#4a5565`. */
export function ConfirmDialogText({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-[20px] text-[#4a5565]">{children}</p>;
}
