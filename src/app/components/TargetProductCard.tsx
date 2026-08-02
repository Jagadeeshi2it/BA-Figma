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
  sourceBins?: SourceBinInfo[]; // Array of source bins this product was moved from
}

export default function TargetProductCard({
  product,
  targetBin,
  onMoveBack,
  onRemove,
  hasPendingTransfer,
  sourceBins
}: TargetProductCardProps) {
  // Calculate the actual total moved quantity for display
  const actualMovedQuantity = product.movedQuantity;
  const isNewlyMoved = actualMovedQuantity > 0;
  
  // CRITICAL FIX: Check if product originally existed in target bin using same logic as parent
  // Match by name, NDC, and inventoryType (not just ID) to properly detect consolidated products
  const originallyInTarget = targetBin && targetBin.products.some(p => 
    p.name === product.name && 
    p.ndc === product.ndc && 
    p.inventoryType === product.inventoryType
  );
  
  const isNewlyAllocated = actualMovedQuantity === 0 && !originallyInTarget;
  
  // Check if this is an existing product with a pending transfer (should show Remove button)
  const shouldShowRemoveButton = originallyInTarget && hasPendingTransfer;
  
  // Determine if we should show quantity display (only for products that originally existed in target bin)
  const isNewToTargetBin = isNewlyMoved || isNewlyAllocated;

  const showRemoveAction =
    (actualMovedQuantity ?? 0) > 0 || (isNewlyAllocated ?? false) || shouldShowRemoveButton;
  // Several source bins each need their own Remove, so those stay in a list below rather than
  // collapsing into the one control beside the quantity.
  const hasMultipleSourceBins = !!sourceBins && sourceBins.length > 1;
  
  // Debug logging to verify card display logic
  console.log('🔍 TargetProductCard Display Logic:', {
    productId: product.id,
    productName: product.name,
    totalQuantity: product.quantity,
    movedQuantity: actualMovedQuantity,
    existingQuantity: product.quantity - actualMovedQuantity,
    isNewlyMoved,
    originallyInTarget,
    isNewlyAllocated,
    showQuantityBreakdown: isNewlyMoved && originallyInTarget
  });
  
  return (
    <Card className={`border border-gray-200 bg-white ${
      isNewlyMoved 
        ? 'ring-2 ring-green-200 bg-green-50' 
        : isNewlyAllocated
        ? 'ring-2 ring-blue-200 bg-blue-50'
        : ''
    }`}>
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
          
          {/* How much was already here versus how much is arriving — the one thing in the old footer
              worth keeping, now a plain line rather than a bar. */}
          {isNewlyMoved && originallyInTarget && (
            <div className="flex items-center font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
              <p className="leading-[20px] text-nowrap whitespace-pre">
                <span className="text-[#4a5565]">Existing qty:</span>
                <span className="font-['Inter:Semi_Bold',_sans-serif] font-bold not-italic">
                  {` ${product.quantity - actualMovedQuantity} `}
                </span>
                <span>{`${pluralizeUnit(product?.unit || 'unit', product.quantity - actualMovedQuantity)}`}</span>
                <span className="text-[#4a5565]" style={{ marginLeft: '16px' }}>Moved qty:</span>
                <span className="font-['Inter:Semi_Bold',_sans-serif] font-bold not-italic">
                  {` ${actualMovedQuantity} `}
                </span>
                <span>{`${pluralizeUnit(product?.unit || 'unit', actualMovedQuantity)}`}</span>
              </p>
            </div>
          )}

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