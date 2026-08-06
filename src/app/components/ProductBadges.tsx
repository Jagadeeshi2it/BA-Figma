import React from 'react';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

/**
 * A product's SDV/MDV, CLIMATE and CIV badges.
 *
 * The same three spans were written out in six places — the Review cards, both step-④ screens, the Move
 * List panel and the Review header — which is six chances for one of them to drift in size, colour or
 * order. They all derive from `binProducts`, so the values already agreed; only the markup could disagree,
 * and now it cannot.
 *
 * Layout is the caller's business, which is the point: the move pipeline sits them **beside the display
 * name**, while the bin cards and side panels keep them on their own line under the generic name. Both are
 * deliberate — see the callers in steps ③ and ④.
 */
export default function ProductBadges({ product }: { product: any }) {
  if (!product) return null;
  return (
    <>
      <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
        {getVialType(product)}
      </span>
      {hasClimateBadge(product) && (
        <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">
          CLIMATE
        </span>
      )}
      {hasCivBadge(product) && (
        <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">
          CIV
        </span>
      )}
    </>
  );
}
