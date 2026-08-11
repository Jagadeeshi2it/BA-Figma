import React, { useEffect, useState } from 'react';
import ConfirmDialog from "./ConfirmDialog";
import ProductBadges from "./ProductBadges";

interface ProductToUnallocate {
  productId: string;
  productName: string;
  /** The generic name — `product.description` holds it, despite the field name (§1). */
  description?: string;
  ndc?: string;
  inventoryType?: string;
  unit?: string;
  binId: string;
  binName: string;
  doorName?: string;
  location: string;
}

interface UnallocateConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productsToUnallocate: ProductToUnallocate[];
  onConfirm: (productIds: string[], binIds: string[]) => void;
  onCancel: () => void;
}

/** One row is one (product, bin) pair — the same product can be at 0 in two bins. */
const rowKey = (product: ProductToUnallocate, index: number) =>
  `${product.productId}-${product.binId}-${index}`;

/**
 * The confirmation raised from `ZeroInventoryBanner` when a move leaves a product at 0.
 *
 * **It is per row, not all-or-nothing.** A move that drains three bins raises three rows, and the answer
 * is not always the same for all of them: a product may be about to be restocked in one bin and finished
 * with in another. It used to unallocate everything listed on one press, so an operator who wanted one of
 * three had to take all three and re-allocate the other two through a different flow.
 *
 * Nothing happens until the primary. `Unallocate` on a row **marks** it, and flips to `Keep` so the
 * control names its next act the way every other toggle in the app does. The primary reports the count it
 * will commit, so what the marks add up to is stated where the decision is made.
 *
 * With a single row there is nothing to choose: the per-row control is dropped, the row is marked by
 * definition, and the primary drops `Confirm` for `Unallocate` — the word for what the one button left
 * actually does.
 */
export default function UnallocateConfirmModal({
  open,
  onOpenChange,
  productsToUnallocate,
  onConfirm,
  onCancel
}: UnallocateConfirmModalProps) {
  const isSingle = productsToUnallocate.length === 1;

  /**
   * Rows marked for unallocation. Empty to begin with, so the dialog opens having decided nothing —
   * this is the one surface in the app that destroys an allocation, and a pre-ticked list would make
   * pressing the primary out of habit the destructive path.
   */
  const [marked, setMarked] = useState<Set<string>>(new Set());

  // Cleared whenever the dialog opens or the batch changes. The banner can raise it again after the next
  // move with a different set of rows, and marks left over from the previous visit would be keyed to
  // products that are no longer listed — invisible, and still counted by the primary.
  useEffect(() => {
    setMarked(new Set());
  }, [open, productsToUnallocate]);

  const toggle = (key: string) => {
    setMarked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // A single row is marked by definition — there is no control to mark it with.
  const selected = isSingle
    ? productsToUnallocate
    : productsToUnallocate.filter((product, index) => marked.has(rowKey(product, index)));

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(
      selected.map(p => p.productId),
      selected.map(p => p.binId)
    );
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isSingle ? 'Unallocate Product?' : 'Unallocate Products?'}
      dismissLabel="Cancel"
      onDismiss={handleCancel}
      /* `Unallocate` in both cases. The rows are the selecting and this is the acting, so the primary can
         name the act plainly however many rows there are — the count belongs to the selection, which the
         ticked rows already show. It read `Confirm (n)` while the rows said `Unallocate`, which put the
         real word on the control that only marked and the vague one on the control that commits. */
      confirmLabel="Unallocate"
      confirmEnabled={selected.length > 0}
      onConfirm={handleConfirm}
      /* Wider than the plain confirmations because the body is a list that can run to several products,
         each carrying a full product name and a bin location. */
      className="max-w-2xl"
    >
      {/* No padding and no card of its own: the rows sit flush against the dialog's `p-6`, on the same
          left edge as the title above them. A padded white box inside a white dialog read as a second
          surface, and the scroll cap is the only thing that has to stay. */}
      <div className="max-h-[300px] overflow-y-auto">
        {/* No standing instruction above the list. It said "Choose which to unallocate — the rest keep
            their bins", which the title, the `Select` on every row and the `Unallocate` primary between
            them already say; the banner that raises this dialog carries the count. What the sentence was
            also doing was giving the dimmed primary its reason — the row buttons are that reason now,
            since a list of `Select` controls with nothing selected is legible on its own. */}
        {productsToUnallocate.map((product, index) => {
          const key = rowKey(product, index);
          const isMarked = isSingle || marked.has(key);

          return (
            <div
              key={key}
              // No tint on a selected row. The button says `Unselect` when the row is in, which is the
              // whole state, and a tinted band behind a product that is about to lose its bin reads as a
              // warning the dialog does not need — the title and the primary already carry that.
              className="py-3 first:pt-0 border-b border-gray-200 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {/* The Review card's product block, verbatim: display name with its badges beside it,
                      the italic generic name, then `ndc - inventoryType`. The name alone named a drug the
                      operator may hold three variants of — CARBOPLATIN 600 exists three times in the
                      catalogue, differing only by NDC — so a dialog that drops one of them has to say
                      which. Badges beside the name is the pipeline's arrangement rather than the bin
                      cards' (§6), since the operator arrives here straight off step ④. */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-normal text-[#020817] text-[14px] leading-[20px]">
                      {product.productName}
                    </h4>
                    <span className="flex items-center gap-1 shrink-0">
                      <ProductBadges
                        product={{
                          name: product.productName,
                          ndc: product.ndc,
                          inventoryType: product.inventoryType
                        }}
                      />
                    </span>
                  </div>
                  {product.description && (
                    <p className="italic text-gray-500 leading-snug text-[14px]">{product.description}</p>
                  )}
                  <p className="text-gray-500 text-[14px] break-words">
                    {product.ndc} - {product.inventoryType}
                  </p>

                  {/* The bin is what this row is really about — the product keeps every other bin it is
                      in — so it is the one line carrying weight.

                      `Door 1 - Bin 1B`, the app's one-string form (§3), not the full
                      `Bin 1B - Shelf 1, Door 1, Cabinet 1`. The shelf and the cabinet are derivable from
                      the door and are not the decision: the operator is answering whether this product
                      keeps this bin, and the door is what tells them which one.

                      The sentence that used to follow it — "The product has 0 inventory qty do you want
                      to unallocate it from the bin?" — is gone. The banner that raises this dialog
                      already says the products have zero inventory, and the title already asks the
                      question; the row restated both and then asked a question the two buttons answer. */}
                </div>

                {/* items-start on the row, or this column stretches to the row's height and the chip
                    grows with it (CLAUDE.md §4). */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="bg-[#f7f7f7] flex flex-col items-center justify-center p-[4px] rounded-[3.5px] w-[60px] shrink-0 relative">
                    <div className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
                    <div className="font-semibold text-[#020817] text-[14px] leading-[18px] text-center">
                      0
                    </div>
                    {/* `unit` arrives already plural in the seed ('vials'), so nothing is appended —
                        pluralizing it produced "vialss". The chip always reads 0 by definition; it is
                        here because it is the unit the rest of the app states a quantity in, and a row
                        about a product with no stock is exactly where that figure is worth seeing. */}
                    <div className="font-normal text-[#676b74] text-[12px] leading-[16px]">
                      {product.unit || 'vials'}
                    </div>
                  </div>
                </div>
              </div>

              {/* The bin and its control on one line, across the row's full width.
                  The button sat under the quantity chip, which put it opposite the product name and made
                  it read as a control over the product — it is not: the same product appears on three
                  rows here, one per bin, and what a tap picks is *this bin*. Opposite the bin name there
                  is nothing else it could be about. */}
              <div className="flex items-center justify-between gap-3 mt-1">
                {/* The bin is what this row is really about — the product keeps every other bin it is in —
                    so it is the one line carrying weight.

                    `Door 1 - Bin 1B`, the app's one-string form (§3), not the full
                    `Bin 1B - Shelf 1, Door 1, Cabinet 1`. The shelf and the cabinet are derivable from
                    the door and are not the decision: the operator is answering whether this product
                    keeps this bin, and the door is what tells them which one.

                    The sentence that used to follow it — "The product has 0 inventory qty do you want to
                    unallocate it from the bin?" — is gone. The banner that raises this dialog already says
                    the products have zero inventory, and the title already asks the question; the row
                    restated both and then asked a question the two buttons answer. */}
                <p className="text-[14px] leading-[20px] text-[#020817] font-medium">
                  {product.doorName ? `${product.doorName} - ${product.binName}` : product.location}
                </p>

                {/* `Select` / `Unselect`, not `Unallocate` / `Keep`. The row commits nothing, so naming it
                    for the act put the destructive word on the control that only marks — and left the
                    primary, which does commit, saying `Confirm`. Both words now sit where they belong, and
                    the primary can read `Unallocate` whether there is one row or five. */}
                {!isSingle && (
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={`h-8 px-3 rounded-[4px] border border-[#095192] bg-white text-[#095192] text-[14px] leading-[20px] whitespace-nowrap transition-colors cursor-pointer hover:bg-[#F1F6FA] shrink-0`}
                  >
                    {isMarked ? 'Unselect' : 'Select'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ConfirmDialog>
  );
}
