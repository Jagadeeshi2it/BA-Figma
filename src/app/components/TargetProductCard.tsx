import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { Product, Bin } from '../types';
import { getVialType } from '../utils/binProducts';

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
  transferActionType?: 'allocate' | 'move'; // New prop to indicate the action type
  sourceBins?: SourceBinInfo[]; // Array of source bins this product was moved from
}

export default function TargetProductCard({
  product,
  targetBin,
  onMoveBack,
  onRemove,
  hasPendingTransfer,
  transferActionType,
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
      <CardContent className="p-[16px] m-[0px]">
        <div className="flex flex-col gap-2 p-[0px]">
          {/* Top row - Product name, badge, and quantity */}
          <div className="flex items-start justify-between w-full">
            {/* Left side - Product name and badge */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {/* Product name with badge */}
              <div className="flex items-center gap-2 w-full">
                <h4 className="font-semibold text-[#020817] text-[14px] leading-[20px]">
                  {product.name}
                </h4>
                <div className="bg-black flex items-center justify-center px-[3.5px] py-[1.75px] rounded-[4px] shrink-0">
                  <div className="font-['Inter:Bold',_sans-serif] font-bold text-white text-[8px] leading-[12px]">
                    {getVialType(product)}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {product.description && (
                <p className="font-['Inter:Regular',_sans-serif] font-normal text-[#4a5565] text-[14px] leading-[20px] w-full">
                  {product.description}
                </p>
              )}
            </div>
            
            {/* Right side - Quantity box */}
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
          </div>
          
          {/* NDC section */}
          <div className="flex gap-2 items-start font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] w-full">
            <div className="text-[#4a5565]">NDC:</div>
            <div className="text-[#020817]">{product.ndc}</div>
          </div>
          
          {/* Inventory Type section */}
          <div className="flex gap-2 items-start font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] w-full">
            <div className="text-[#4a5565]">Inventory Type:</div>
            <div className="text-[#020817]">{product.inventoryType}</div>
          </div>
          
          
          {/* Move Back/Remove button (only show when needed) */}
          {((actualMovedQuantity ?? 0) > 0 || (isNewlyAllocated ?? false) || shouldShowRemoveButton) && (
            <>
              {/* Divider */}
              <div className="bg-[#d9d9d9] h-px w-full" />
              
              {/* If multiple source bins, show list of source bins */}
              {sourceBins && sourceBins.length > 1 ? (
                <div className="flex flex-col gap-2">
                  {/* Common header message */}
                  {transferActionType === 'move' && (
                    <div className="text-[#4a5565] text-[12px] leading-[16px] font-['Inter:Regular',_sans-serif]">
                      Mention the quantity during the actual move in next step
                    </div>
                  )}
                  
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
                            Undo Move
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single source bin or no source bins - show original layout */
                <div className="flex items-center w-full">
                  {/* Left side - Quantity breakdown (only for consolidated products) - WITH 16PX SPACING */}
                  <div className="flex-1">
                    {isNewlyMoved && originallyInTarget && (
                      <div className="flex items-center font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
                        <div className="relative shrink-0">
                          <p className="leading-[20px] text-nowrap whitespace-pre">
                            <span className="text-[#4a5565]">Existing qty:</span> 
                            <span className="font-['Inter:Semi_Bold',_sans-serif] font-bold not-italic">
                              {` ${product.quantity - actualMovedQuantity} `}
                            </span>
                            <span className="font-['Inter:Regular',_sans-serif] font-normal">
                              {`${pluralizeUnit(product?.unit || 'unit', product.quantity - actualMovedQuantity)}`}
                            </span>
                            <span className="text-[#4a5565]" style={{ marginLeft: '16px' }}>Moved qty:</span> 
                            <span className="font-['Inter:Semi_Bold',_sans-serif] font-bold not-italic">
                              {` ${actualMovedQuantity} `}
                            </span>
                            <span className="font-['Inter:Regular',_sans-serif] font-normal">
                              {`${pluralizeUnit(product?.unit || 'unit', actualMovedQuantity)}`}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {transferActionType === 'move' && !(isNewlyMoved && originallyInTarget) && (
                      <div className="text-[#4a5565] text-[12px] leading-[16px] font-['Inter:Regular',_sans-serif]">
                        Mention the quantity during the actual move in next step
                      </div>
                    )}
                  </div>
                  
                  {/* Right side - Remove/Move Back button - Always positioned on the right */}
                  <div className="flex items-center justify-end">
                    <div className="flex items-center justify-end px-3 py-2 h-8 rounded-[4px] border border-[#e7000b] border-solid">
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
                        {transferActionType === 'move' || shouldShowRemoveButton || ((actualMovedQuantity ?? 0) > 0) ? 'Undo Move' : 'Undo Allocate'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}