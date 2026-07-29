import React from 'react';
import { Card, CardContent } from "./ui/card";
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { emergencyKitService } from '../services/EmergencyKitService';
import { productDataService } from '../services/ProductDataService';
import { Product } from '../types';
import { getVialType } from '../utils/binProducts';

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
  onAllocateProduct: (productId: string) => void;
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
  onAllocateProduct,
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
  
  // Check if product inventory type is allowed for different operations
  const canAllocateToCurrentTarget = !isCurrentTargetEmergencyKit || 
    emergencyKitRules.rules.allowedInventoryTypes.allocation.includes(enhancedProduct.inventoryType);
    
  const canMoveToCurrentTarget = !isCurrentTargetEmergencyKit || 
    emergencyKitRules.rules.allowedInventoryTypes.move.includes(enhancedProduct.inventoryType);

  // Determine UI behavior
  const showEmergencyKitWarning = isCurrentTargetEmergencyKit && !canMoveToCurrentTarget;
  const hideMoveControls = isCurrentTargetEmergencyKit && !canMoveToCurrentTarget;
  
  // CRITICAL FIX: Allocate button should only be hidden if the product exists in the currently displayed target bin
  // This ensures that when multiple target bins are involved, the allocate button is only hidden for the current target bin
  const showAllocateButton = !(isPendingTransfer || isInTargetBin || isInTargetBins) && canAllocateToCurrentTarget;

  // Debug logging to verify allocate button logic
  console.log('🔍 SourceProductCard Allocate Button Logic:', {
    productId: enhancedProduct.id,
    productName: enhancedProduct.name,
    currentTargetBinId: currentTargetBin?.id,
    currentTargetBinName: currentTargetBin?.name,
    isPendingTransfer,
    isInTargetBin,
    isInTargetBins,
    canAllocateToCurrentTarget,
    showAllocateButton,
    totalTargetBins: targetBins.length
  });

  return (
    <Card className="border border-gray-200 bg-white">
      <CardContent className="p-4 m-[0px]">
        <div className="flex flex-col gap-2 p-[0px]">
          {/* Main content section with product info and quantity */}
          <div className="flex items-start justify-between w-full">
            {/* Left side - Product details with enhanced data */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {/* Product name with badge */}
              <div className="flex items-center gap-2 w-full">
                <h4 className="font-semibold text-[#020817] text-[14px] leading-[20px]">
                  {enhancedProduct.name}
                </h4>
                <div className="bg-black flex items-center justify-center px-[3.5px] py-[1.75px] rounded-[4px] shrink-0">
                  <div className="font-['Inter:Bold',_sans-serif] font-bold text-white text-[10px] leading-[12px]">
                    {getVialType(enhancedProduct)}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {enhancedProduct.description && (
                <p className="font-['Inter:Regular',_sans-serif] font-normal text-[#4a5565] text-[14px] leading-[20px] w-full">
                  {enhancedProduct.description}
                </p>
              )}
            </div>
            
            {/* Right side - Quantity box */}
            <div className="bg-[#f7f7f7] flex flex-col items-center justify-center p-[4px] rounded-[3.5px] w-[60px] shrink-0 relative">
              <div className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[3.5px]" />
              <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold text-[#020817] text-[14px] leading-[18px] text-center">
                {enhancedProduct.remainingQuantity}
              </div>
              <div className="font-['Inter:Regular',_sans-serif] font-normal text-[#676b74] text-[12px] leading-[16px]">
                {pluralizeUnit(enhancedProduct.unit, enhancedProduct.remainingQuantity)}
              </div>
            </div>
          </div>
          
          {/* NDC section with enhanced data */}
          <div className="flex gap-2 items-start font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] w-full">
            <div className="text-[#4a5565]">NDC:</div>
            <div className="text-[#020817]">{enhancedProduct.ndc}</div>
          </div>
          
          {/* Inventory Type section with enhanced data */}
          <div className="flex gap-2 items-start font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] w-full">
            <div className="text-[#4a5565]">Inventory Type:</div>
            <div className="text-[#020817]">{enhancedProduct.inventoryType}</div>
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
          
          {/* Conditional divider and bottom section */}
          {(showAllocateButton || (enhancedProduct.remainingQuantity > 0 && !hideMoveControls && !showAllocateButton && !isMoveDisabled) || hasError) && (
            <>
              {/* Divider */}
              <div className="bg-[#d9d9d9] h-px w-full" />
              
              {/* Bottom section with buttons */}
              <div className="flex items-center w-full">
                {/* Left side - Allocate buttons with 16px gap */}
                <div className="flex-1">
                  {showAllocateButton && (
                    <div className="flex items-center justify-end gap-[16px]">
                      <div className="flex items-center justify-end px-3 py-2 h-8 rounded-[4px] border border-[#095192] border-solid">
                        <div className="font-['Inter:Regular',_sans-serif] font-normal text-[#095192] text-[14px] leading-[20px]">
                          <button onClick={() => onAllocateProduct(enhancedProduct.id)}>
                            Allocate only
                          </button>
                        </div>
                      </div>
                      
                      {/* Only show "Allocate & Move Qty" if inventory is greater than 0 */}
                      {enhancedProduct.remainingQuantity > 0 && (
                        <div className="flex items-center justify-end px-3 py-2 h-8 rounded-[4px] bg-[#095192]">
                          <button
                            onClick={() => onMoveProduct(enhancedProduct.id)}
                            className="font-['Inter:Semi_Bold',_sans-serif] font-semibold text-white text-[14px] leading-[20px]"
                          >
                            Allocate & Move Qty
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Right side - Move qty button (only shown when product exists in target) */}
                {enhancedProduct.remainingQuantity > 0 && !hideMoveControls && !showAllocateButton && (
                  <div className="flex items-center justify-end">
                    {!isMoveDisabled && (
                      <div className="flex items-center justify-end px-3 py-2 h-8 rounded-[4px] bg-[#095192] cursor-pointer">
                        <button
                          onClick={() => onMoveProduct(enhancedProduct.id)}
                          className="font-['Inter:Semi_Bold',_sans-serif] font-semibold text-[14px] leading-[20px] text-white"
                        >
                          Move qty
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {hasError && (
                <p className="text-red-600 text-xs mt-1">{error}</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}