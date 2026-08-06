import React from 'react';
import { Card, CardContent } from "./ui/card";
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { emergencyKitService } from '../services/EmergencyKitService';
import { productDataService } from '../services/ProductDataService';
import { Product } from '../types';
import ProductBadges from './ProductBadges';

interface SourceProductCardProps {
  product: Product & { remainingQuantity: number };
  moveQuantity: { quantity: number } | undefined;
  hasError: boolean;
  error: string | undefined;
  isPendingTransfer: boolean;
  isInTargetBin: boolean;
  isInTargetBins?: boolean;
  movedQuantityToTarget?: number;
  targetBins?: any[];
  currentTargetBin?: any;
  doorShelfConfig?: any;
  isMoveDisabled?: boolean; // New prop to disable Move qty button
  onUpdateMoveQuantity: (productId: string, quantity: number) => void;
  onMoveProduct: (productId: string) => void;
  onMoveBack?: (productId: string) => void;
}

export default function SourceProductCard({
  product,
  moveQuantity,
  hasError,
  error,
  isPendingTransfer,
  isInTargetBin,
  isInTargetBins = false,
  movedQuantityToTarget = 0,
  targetBins = [],
  currentTargetBin = null,
  doorShelfConfig = {},
  isMoveDisabled = false, // Default to false if not provided
  onUpdateMoveQuantity,
  onMoveProduct,
  onMoveBack
}: SourceProductCardProps) {
  
  // Enhance product with proper display information using Product Data Service
  const enhancedProduct = productDataService.enhanceProduct(product);
  
  // Use Emergency Kit Service to determine restrictions for current target bin
  const currentTargetBinId = currentTargetBin?.id;
  const emergencyKitRules = currentTargetBinId 
    ? emergencyKitService.getBusinessRulesForBin(currentTargetBinId, doorShelfConfig)
    : null;

  // Determine if current target is Emergency Kit
  const isCurrentTargetEmergencyKit = emergencyKitRules?.isEmergencyKit || false;
  
  // Only the move rule matters here now — nothing in this flow allocates without moving.
  const canMoveToCurrentTarget = !isCurrentTargetEmergencyKit || 
    emergencyKitRules.rules.allowedInventoryTypes.move.includes(enhancedProduct.inventoryType);

  // Determine UI behavior
  const showEmergencyKitWarning = isCurrentTargetEmergencyKit && !canMoveToCurrentTarget;
  const hideMoveControls = isCurrentTargetEmergencyKit && !canMoveToCurrentTarget;
  
  // Two separate questions, deliberately. Whether an action belongs on this card at all — the
  // target will take it (hideMoveControls already carries the E-Kit rule) — and whether it has
  // already been used. Collapsing them into one condition made the button disappear the moment it
  // was clicked, which reads as the control breaking rather than as work completed.
  //
  // A product already at 0 quantity is still offered Select: the operator may want to relocate the
  // allocation itself (empty this bin, keep the product record) even though there's nothing to
  // physically move. QuantitySelectionPage already handles a 0-quantity source correctly.
  const canOfferSelect = !hideMoveControls;
  const alreadySelected = isMoveDisabled;

  // Debug logging to verify allocate button logic
  console.log('🔍 SourceProductCard Allocate Button Logic:', {
    productId: enhancedProduct.id,
    productName: enhancedProduct.name,
    currentTargetBinId: currentTargetBin?.id,
    currentTargetBinName: currentTargetBin?.name,
    isPendingTransfer,
    isInTargetBin,
    isInTargetBins,
    canOfferSelect,
    alreadySelected,
    totalTargetBins: targetBins.length
  });

  return (
    <Card className="border border-gray-200 bg-white">
      {/* !pb-4: CardContent's own [&:last-child]:pb-6 outranks a plain p-4, so the card was padded
          16px on three sides and 24px at the bottom. */}
      <CardContent className="p-4 !pb-4 m-[0px]">
        <div className="flex flex-col gap-2 p-[0px]">
          {/* Main content section with product info and quantity */}
          <div className="flex items-start justify-between w-full">
            {/* Left side - Product details with enhanced data */}
            <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
              {/* Name and generic name are one block, with the badges below both — the same shape the
                  search list and the side panels use, so a product reads the same wherever it turns
                  up. The badge markup and colours are the shared set too; the black pill this used
                  to carry appeared nowhere else. */}
              <div>
                {/* Badges beside the display name, not on a line of their own below the generic name.
                    In the move pipeline the name and what kind of vial it is are read together — which
                    product, and what handling it needs — and a row of their own pushed the NDC a line
                    further from the name it belongs to. flex-wrap so a long name still keeps them. */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-normal text-[#020817] text-[14px] leading-[20px]">
                    {enhancedProduct.name}
                  </h4>
                  <span className="flex items-center gap-1 shrink-0">
                    <ProductBadges product={enhancedProduct} />
                  </span>
                </div>
                {enhancedProduct.description && (
                  <p className="italic text-gray-500 leading-snug text-[14px]">
                    {enhancedProduct.description}
                  </p>
                )}
              </div>


              {/* One line for both, as everywhere else. The "NDC:" and "Inventory Type:" labels cost
                  two rows to say what the values already say — an NDC is recognisable as an NDC. */}
              <div className="text-gray-500 text-[14px] break-words">
                {enhancedProduct.ndc} - {enhancedProduct.inventoryType}
              </div>
            </div>
            
            {/* Right-hand column: the quantity, and the action for it directly beneath. The action
                used to sit in its own bar under a divider, which read as a footer belonging to the
                whole card rather than as this product's control. justify-between pins it to the
                bottom of whatever height the details on the left come to. */}
            <div className="flex flex-col items-end justify-between gap-3 shrink-0 self-stretch">
            <div className="bg-[#f7f7f7] flex flex-col items-center justify-center p-[4px] rounded-[3.5px] w-[60px] shrink-0 relative">
              <div className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
              <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold text-[#020817] text-[14px] leading-[18px] text-center">
                {enhancedProduct.remainingQuantity}
              </div>
              <div className="font-['Inter:Regular',_sans-serif] font-normal text-[#676b74] text-[12px] leading-[16px]">
                {pluralizeUnit(enhancedProduct.unit, enhancedProduct.remainingQuantity)}
              </div>
            </div>

            {canOfferSelect && (
              <button
                // Demo Mode's handle on "choose this product to leave this bin" — the act that makes a
                // Bin move a Bin move. Only the un-spent ones answer to it, so a walkthrough asking for
                // the first match gets a product it can still select rather than one already taken.
                data-demo={alreadySelected ? undefined : 'review-select-product'}
                onClick={alreadySelected ? undefined : () => onMoveProduct(enhancedProduct.id)}
                disabled={alreadySelected}
                // Secondary, not primary. There is one of these per product row, so as filled blue
                // buttons they were the loudest thing on the page and competed with Move Qty — the
                // one control that actually advances the flow. Outlined, they still read as the
                // row's action while leaving a single primary on the screen.
                // Still a secondary button when it's spent: same white fill, same blue, just dimmed.
                // Recolouring it grey made "Selected" look like a different kind of control from the
                // "Select" beside it, when it is the same button reporting that its work is done — and
                // the footer's own disabled buttons dim rather than recolour, so grey was the odd one.
                className={`h-8 px-3 rounded-[4px] font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] whitespace-nowrap border transition-colors bg-white text-[#095192] border-[#095192] ${
                  alreadySelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F1F6FA]'
                }`}
              >
                {alreadySelected ? 'Selected' : 'Select'}
              </button>
            )}
            </div>
          </div>
          
          {/* Emergency Kit Restriction Message - only for move operations */}
          {showEmergencyKitWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-orange-700 text-[14px] font-medium">
                  Only "{emergencyKitRules?.rules.allowedInventoryTypes.move.join('", "')}" inventory type(s) can be moved to E-Kit
                </p>
              </div>
            </div>
          )}
          
          {hasError && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}