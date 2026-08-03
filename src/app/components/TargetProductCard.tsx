import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { Product, Bin } from '../types';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

interface SourceBinInfo {
  binId: string;
  binName: string;
  doorName: string;
  quantity: number;
  productId: string; // The original product ID from this source bin
}

interface TargetProductCardProps {
  product: Product & { movedQuantity: number };
  targetBin: Bin;
  onMoveBack: (productId: string, quantity: number, fromBinId?: string) => void;
  onRemove?: (productId: string) => void; // New prop for removing allocation
  hasPendingTransfer?: boolean; // New prop to indicate if product has pending transfer
  // This row is stock ARRIVING in this move, as opposed to what the bin already held. The two are
  // separate rows of the same product identity, so the card can't work it out for itself — asking the
  // bin whether it stocks this product answers yes for both.
  isArrival?: boolean;
  sourceBins?: SourceBinInfo[]; // Array of source bins this product was moved from
}

export default function TargetProductCard({
  product,
  targetBin,
  onMoveBack,
  onRemove,
  hasPendingTransfer,
  isArrival = false,
  sourceBins
}: TargetProductCardProps) {
  // Calculate the actual total moved quantity for display
  const actualMovedQuantity = product.movedQuantity;

  // Whether the bin ALREADY stocked this identity. Only meaningful for choosing which handler Remove
  // calls; it no longer decides how the card looks, because both rows of a topped-up product answer
  // yes to it and the arrival is the one that has to stand out.
  const originallyInTarget = targetBin && targetBin.products.some(p =>
    p.name === product.name &&
    p.ndc === product.ndc &&
    p.inventoryType === product.inventoryType
  );

  // A pending transfer against a product the bin already held is undone by Remove; a brand-new
  // location is undone by Move Back.
  const shouldShowRemoveButton = originallyInTarget && hasPendingTransfer;

  // Everything about the card's appearance now follows from one question — is this the arrival?
  // It used to be inferred from movedQuantity and originallyInTarget, and both inferences failed on
  // Review: every transfer is staged at quantity 0 there, so "moved in" could never be true, and a
  // product the bin already stocked was excluded from "newly allocated" — leaving the arrival plain
  // while a product new to the bin was tinted, though both were equally part of the move.
  const isNewToTargetBin = isArrival;
  const showRemoveAction = isArrival;
  // Several source bins each need their own Remove, so those stay in a list below rather than
  // collapsing into the one control beside the quantity.
  const hasMultipleSourceBins = !!sourceBins && sourceBins.length > 1;
  
  return (
    // No tint on an arrival. Its Remove button already tells it apart from the bin's own stock, and
    // the two now sit under separate headings besides — so a highlight was a third way of saying the
    // same thing, and the one most easily misread as "selected" rather than "arriving".
    <Card className="border border-gray-200 bg-white">
      {/* !pb-[16px]: CardContent's own [&:last-child]:pb-6 outranks a plain p-[16px], so the card was
          padded 16px on three sides and 24px at the bottom. */}
      <CardContent className="p-[16px] !pb-[16px] m-[0px]">
        <div className="flex flex-col gap-2 p-[0px]">
          {/* Top row - Product name, badge, and quantity */}
          <div className="flex items-start justify-between w-full">
            {/* Left side - Product name and badge */}
            <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
              {/* Same block as the source card: name, generic name directly beneath it, shared badges
                  below both. The two cards sit side by side in this modal, so any difference in how
                  they present the same product reads as a difference in the product. */}
              <div>
                <h4 className="font-normal text-[#020817] text-[14px] leading-[20px]">
                  {product.name}
                </h4>
                {product.description && (
                  <p className="italic text-gray-500 leading-snug text-[14px]">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                  {getVialType(product)}
                </span>
                {hasClimateBadge(product) && (
                  <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
                )}
                {hasCivBadge(product) && (
                  <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
                )}
              </div>

              {/* One line for both, as everywhere else — same block as the source card. */}
              <div className="text-gray-500 text-[14px] break-words">
                {product.ndc} - {product.inventoryType}
              </div>
            </div>
            
            {/* Right-hand column, same shape as the source card: the quantity, and the action for it
                directly beneath. Remove sat in a bar under a divider before, next to a line of
                instructions about a later step — a footer for the card rather than this product's
                own control. */}
            <div className="flex flex-col items-end justify-between gap-3 shrink-0 self-stretch">
              {!isNewToTargetBin && (
                <div className="bg-[#f7f7f7] flex flex-col items-center justify-center p-[4px] rounded-[3.5px] w-[60px] shrink-0 relative">
                  <div className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
                  <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold text-[#020817] text-[14px] leading-[18px] text-center">
                    {product?.quantity || 0}
                  </div>
                  <div className="font-['Inter:Regular',_sans-serif] font-normal text-[#676b74] text-[12px] leading-[16px]">
                    {pluralizeUnit(product?.unit || 'unit', product?.quantity || 0)}
                  </div>
                </div>
              )}

              {/* mt-auto keeps the action on the card's bottom edge even when the quantity chip above
                  is absent. A product arriving new to this bin has no existing quantity to show, so
                  justify-between had a single child to place and left it at the top — the button
                  drifted to a different height depending on whether the bin already stocked the
                  product. Bottom-aligned always, matching Select on the source card opposite. */}
              {showRemoveAction && !hasMultipleSourceBins && (
                <div className="mt-auto flex items-center justify-end px-3 py-2 h-8 rounded-[4px] border border-[#e7000b] border-solid">
                  <button
                    onClick={() => {
                      if (shouldShowRemoveButton && onRemove) {
                        // For existing products with pending transfer, use Remove handler
                        const productIdToUse = (product as any).sourceProductId || product.id;
                        onRemove(productIdToUse);
                      } else {
                        // For newly moved products, use Move Back handler
                        const quantityToMoveBack = actualMovedQuantity ?? 0;
                        const productIdToUse = (product as any).sourceProductId || product.id;
                        const fromBinId = sourceBins?.length ? sourceBins[0].binId : undefined;
                        onMoveBack?.(productIdToUse, quantityToMoveBack, fromBinId);
                      }
                    }}
                    className="font-['Inter:Regular',_sans-serif] font-normal text-[#e7000b] text-[14px] leading-[20px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* The "Existing qty / Moved qty" breakdown that sat here is gone with the merged card it
              explained. It existed because one row had to report two quantities at once; the bin's
              own stock and the arrival are now separate rows, each reporting its own. */}

          {/* A product gathered from several source bins keeps a row per bin, each with its own
              Remove — that cannot collapse into a single control. */}
          {showRemoveAction && hasMultipleSourceBins && (
            <>
              <div className="bg-[#d9d9d9] h-px w-full" />
              <div className="flex flex-col gap-2">
                  {sourceBins.map((sourceBin, index) => (
                    <div key={`${sourceBin.binId}-${sourceBin.productId}-${index}`} className="flex items-center justify-between w-full">
                      {/* Left side - Source bin info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
                          <span className="text-[#4a5565]">From:</span>
                          <span className="font-['Inter:Semi_Bold',_sans-serif] font-semibold">{sourceBin.doorName} - {sourceBin.binName}</span>
                        </div>
                      </div>
                      
                      {/* Right side - Individual Undo button */}
                      <div className="flex items-center justify-end">
                        <div className="flex items-center justify-end px-3 py-2 h-8 rounded-[4px] border border-[#e7000b] border-solid">
                          <button 
                            onClick={() => {
                              // Use the specific product ID from this source bin
                              onMoveBack?.(sourceBin.productId, sourceBin.quantity, sourceBin.binId);
                            }}
                            className="font-['Inter:Regular',_sans-serif] font-normal text-[#e7000b] text-[14px] leading-[20px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}