import React from 'react';
import { AlertCircle, Eye, X } from 'lucide-react';

/**
 * "3 products now have zero inventory. Would you like to unallocate them?"
 *
 * Sits above the cabinet blueprint after a move empties a bin. It replaced a modal that opened over the
 * whole screen the instant a move committed — which interrupted the operator at the one moment they had
 * just finished something, to ask about a decision that has no deadline. Nothing depends on answering it:
 * a 0-quantity product still occupies its bin and can be unallocated any time.
 *
 * So this is an acknowledgement, not a question. It states the fact, offers the review, and can be
 * dismissed — and dismissing it is a real answer ("not now"), not a way of avoiding one.
 */
export default function ZeroInventoryBanner({
  productCount,
  onReview,
  onDismiss
}: {
  productCount: number;
  onReview: () => void;
  onDismiss: () => void;
}) {
  if (productCount <= 0) return null;

  return (
    // Purple rather than the amber/red of a problem: nothing is wrong, and a bin holding a product at 0 is
    // a normal state. It matches the assignment purple used elsewhere for "this is about allocation".
    <div className="mb-4 flex items-center gap-3 rounded-[4px] border border-[#E3D3F5] bg-[#F8F2FE] px-4 py-3">
      <AlertCircle className="w-4 h-4 shrink-0 text-[#8F48D2]" />

      <p className="flex-1 min-w-0 text-[14px] leading-[20px] text-[#020817]">
        <span className="font-semibold">{productCount}</span>{' '}
        {productCount === 1 ? 'product now has' : 'products now have'} zero inventory. Would you like to
        unallocate {productCount === 1 ? 'it' : 'them'}?
      </p>

      {/* Named for what it opens, not for what it might do. Tapping this leads to the review, where the
          operator still chooses per product — so it must not promise the unallocation itself. */}
      <button
        type="button"
        onClick={onReview}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-[4px] px-3 h-9 text-[14px] leading-[20px] text-[#8F48D2] hover:bg-[#F1E6FC] transition-colors cursor-pointer bg-transparent border-none"
      >
        <Eye className="w-4 h-4" />
        Review and Unallocate
      </button>

      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-[4px] px-3 h-9 text-[14px] leading-[20px] text-[#4a5565] hover:bg-[#EFE6F7] transition-colors cursor-pointer bg-transparent border-none"
      >
        <X className="w-4 h-4" />
        Dismiss
      </button>
    </div>
  );
}
