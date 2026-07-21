import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronRight, Pencil, X, Unlock } from "lucide-react";
import { DoorUnlockedToast } from "./ui/sonner-1";
import CabinetPipView from "./CabinetPipView";
import SideSheet from "./SideSheet";
import { ProductTransfer, Bin, DoorShelfConfig } from '../types';
import { formatBinLocation, getDoorName } from '../utils/changeAllocationUtils';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import svgPaths from "../imports/svg-hyhz42ush2";

interface QuantitySelectionPageProps {
  transfers: ProductTransfer[];
  doorShelfConfig: DoorShelfConfig;
  onConfirm: (transfersWithQuantities: ProductTransfer[], remainingTransfers: ProductTransfer[]) => void;
  onCancel: () => void;
  // Doors already announced as unlocked (via toast) elsewhere in this change-allocation session —
  // avoids re-announcing a door that was already unlocked for, e.g., this same product's target bin.
  unlockedDoors?: Set<string>;
  onDoorUnlocked?: (doorName: string) => void;
}

interface TransferWithQuantity extends ProductTransfer {
  moveQuantity: number;
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  manufacturer?: string;
  sourceBinName: string;
  sourceBinLocation: string;
  originalQuantity: number;
  sourceBin: Bin;
  sourceDoorName: string;
}

interface GroupedTransfer {
  transfers: TransferWithQuantity[];
  productId: string;
  fromBinId: string;
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  manufacturer?: string;
  sourceBinName: string;
  sourceBinLocation: string;
  originalQuantity: number;
  sourceBin: Bin;
  sourceDoorName: string;
  targetBinNames: string[];
}

export default function QuantitySelectionPage({
  transfers,
  doorShelfConfig,
  onConfirm,
  onCancel,
  unlockedDoors,
  onDoorUnlocked
}: QuantitySelectionPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transferQuantities, setTransferQuantities] = useState<{ [key: string]: number }>({});
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Right-side overlay opened by tapping the footer's Product / Source Bin counters
  const [activeSheet, setActiveSheet] = useState<null | 'product' | 'sourceBin'>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhance transfers with additional information
  const enhancedTransfers = useMemo(() => {
    const enhanced: TransferWithQuantity[] = [];

    transfers.forEach(transfer => {
      // Find source bin
      let sourceBin: Bin | null = null;
      let productInfo: any = null;
      let doorName: string = '';

      // Search through doorShelfConfig to find the source bin and product
      Object.keys(doorShelfConfig).forEach(doorKey => {
        const shelves = doorShelfConfig[doorKey];
        shelves?.forEach(shelf => {
          shelf.bins?.forEach(bin => {
            if (bin.id === transfer.fromBinId) {
              sourceBin = bin;
              productInfo = bin.products.find(p => p.id === transfer.productId);
              doorName = doorKey;
            }
          });
        });
      });

      if (sourceBin && productInfo) {
        enhanced.push({
          ...transfer,
          moveQuantity: transfer.quantity || productInfo.quantity,
          productName: productInfo.name,
          productDescription: productInfo.description,
          unit: productInfo.unit,
          ndc: productInfo.ndc,
          inventoryType: productInfo.inventoryType,
          manufacturer: productInfo.manufacturer,
          sourceBinName: sourceBin.name,
          sourceBinLocation: formatBinLocation(sourceBin),
          originalQuantity: productInfo.quantity,
          sourceBin: sourceBin,
          sourceDoorName: doorName || 'N/A'
        });
      }
    });

    return enhanced;
  }, [transfers, doorShelfConfig]);

  // Group transfers by source (productId + fromBinId) - ONE PAGE PER SOURCE BIN
  const groupedTransfers = useMemo(() => {
    const groups: GroupedTransfer[] = [];
    const groupMap = new Map<string, TransferWithQuantity[]>();

    // Group by productId + fromBinId (one page per source bin)
    enhancedTransfers.forEach(transfer => {
      const key = `${transfer.productId}-${transfer.fromBinId}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(transfer);
    });

    // Convert to GroupedTransfer array
    groupMap.forEach((transfers, key) => {
      const firstTransfer = transfers[0];
      
      // Get target bin names
      const targetBinNames = transfers.map(t => {
        let targetBinName = 'Unknown';
        Object.keys(doorShelfConfig).forEach(doorKey => {
          const shelves = doorShelfConfig[doorKey];
          shelves?.forEach(shelf => {
            shelf.bins?.forEach(bin => {
              if (bin.id === t.toBinId) {
                targetBinName = bin.name;
              }
            });
          });
        });
        return targetBinName;
      });

      groups.push({
        transfers,
        productId: firstTransfer.productId,
        fromBinId: firstTransfer.fromBinId,
        productName: firstTransfer.productName,
        productDescription: firstTransfer.productDescription,
        unit: firstTransfer.unit,
        ndc: firstTransfer.ndc,
        inventoryType: firstTransfer.inventoryType,
        manufacturer: firstTransfer.manufacturer,
        sourceBinName: firstTransfer.sourceBinName,
        sourceBinLocation: firstTransfer.sourceBinLocation,
        originalQuantity: firstTransfer.originalQuantity,
        sourceBin: firstTransfer.sourceBin,
        sourceDoorName: firstTransfer.sourceDoorName,
        targetBinNames
      });
    });

    return groups;
  }, [enhancedTransfers, doorShelfConfig]);

  const currentGroup = groupedTransfers[currentIndex];

  // Notify the user the source door has been unlocked for them — once per door for the whole
  // change-allocation session, not on every bin-to-bin navigation, and not again if this same
  // door was already announced (e.g. as a target door) elsewhere in the flow.
  useEffect(() => {
    const doorName = currentGroup?.sourceDoorName;
    if (!doorName || unlockedDoors?.has(doorName)) return;
    onDoorUnlocked?.(doorName);
    const toastId = toast.custom(
      (t) => <DoorUnlockedToast doorName={doorName} onDismiss={() => toast.dismiss(t)} />,
      { duration: 4000 }
    );
    return () => toast.dismiss(toastId);
  }, [currentGroup?.sourceDoorName]);

  // Initialize quantities when component mounts
  useEffect(() => {
    if (groupedTransfers.length > 0) {
      const initialQuantities: { [key: string]: number } = {};
      groupedTransfers.forEach((group) => {
        group.transfers.forEach((transfer) => {
          const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
          initialQuantities[key] = transfer.moveQuantity;
        });
      });
      setTransferQuantities(initialQuantities);
      setCurrentIndex(0);
      setEditingQuantity(false);
    }
  }, [groupedTransfers]);

  const getCurrentQuantity = () => {
    if (!currentGroup) return 0;
    const key = `${currentGroup.productId}-${currentGroup.fromBinId}-group`;
    return transferQuantities[key] !== undefined 
      ? transferQuantities[key] 
      : currentGroup.transfers[0].moveQuantity;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!currentGroup) return;
    const groupKey = `${currentGroup.productId}-${currentGroup.fromBinId}-group`;
    const clampedQuantity = Math.max(0, Math.min(newQuantity, currentGroup.originalQuantity));
    
    // Store the group's total quantity to move
    const updates: { [key: string]: number } = {
      [groupKey]: clampedQuantity
    };
    
    // If there's only one target bin, set the quantity directly
    // If there are multiple target bins, the user will distribute in the target bin screen
    if (currentGroup.transfers.length === 1) {
      const key = `${currentGroup.transfers[0].productId}-${currentGroup.transfers[0].fromBinId}-${currentGroup.transfers[0].toBinId}`;
      updates[key] = clampedQuantity;
    } else {
      // For multiple targets, split evenly as initial allocation
      const qtyPerTarget = Math.floor(clampedQuantity / currentGroup.transfers.length);
      const remainder = clampedQuantity % currentGroup.transfers.length;
      
      currentGroup.transfers.forEach((transfer, index) => {
        const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
        // Give first bins the remainder
        updates[key] = qtyPerTarget + (index < remainder ? 1 : 0);
      });
    }
    
    setTransferQuantities(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleEditQuantity = () => {
    setEditingQuantity(true);
    setTempQuantity(getCurrentQuantity().toString());
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSaveQuantity = () => {
    const newQuantity = parseInt(tempQuantity) || 0;
    handleQuantityChange(newQuantity);
    setEditingQuantity(false);
  };

  const handleCancelEdit = () => {
    setEditingQuantity(false);
    setTempQuantity('');
  };

  const handleSkip = () => {
    // CRITICAL FIX: Skip the entire current product and move to the next product
    // Get the current product identifier
    const currentProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
    
    // Find the next group with a different productId
    const nextProductIndex = groupedTransfers.findIndex((g, idx) => {
      const groupProductKey = `${g.productName}-${g.ndc}-${g.inventoryType}`;
      return idx > currentIndex && groupProductKey !== currentProductKey;
    });
    
    if (nextProductIndex !== -1) {
      // Move to next product
      console.log('🔧 Skip & Continue - Moving to next product:', {
        currentProduct: currentGroup.productName,
        currentIndex,
        nextIndex: nextProductIndex,
        nextProduct: groupedTransfers[nextProductIndex].productName
      });
      setCurrentIndex(nextProductIndex);
      setEditingQuantity(false);
    } else {
      // No more products left - skip this product and complete with no transfers for it
      console.log('🔧 Skip & Continue - No more products, completing with skipped product');
      
      // Return empty array for current product transfers and all remaining as skipped
      onConfirm([], []);
    }
  };

  const handleSave = () => {
    if (isSaving) return;
    
    // Get the current product identifier
    const currentProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
    
    // Check if there are more source bins for the current product
    const nextSourceBinIndex = groupedTransfers.findIndex((g, idx) => 
      idx > currentIndex && 
      `${g.productName}-${g.ndc}-${g.inventoryType}` === currentProductKey
    );
    
    // If there's another source bin for this product, advance to it
    if (nextSourceBinIndex !== -1) {
      console.log('🔧 QuantitySelectionPage - Advancing to next source bin:', {
        currentIndex,
        nextSourceBinIndex,
        currentSourceBin: currentGroup.sourceBinName,
        nextSourceBin: groupedTransfers[nextSourceBinIndex].sourceBinName
      });
      setCurrentIndex(nextSourceBinIndex);
      setEditingQuantity(false);
      return;
    }
    
    // No more source bins for this product, proceed to target bin scanning
    setIsSaving(true);
    
    console.log('🔧 QuantitySelectionPage - No more source bins, preparing transfers for target bin scanning');
    
    // Get all transfers for the current product (all source bins we've visited)
    const currentProductTransfers: TransferWithQuantity[] = [];
    
    groupedTransfers.forEach((group, idx) => {
      const groupProductKey = `${group.productName}-${group.ndc}-${group.inventoryType}`;
      if (groupProductKey === currentProductKey && idx <= currentIndex) {
        group.transfers.forEach(transfer => {
          const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
          const updatedQuantity = transferQuantities[key] || transfer.moveQuantity;
          
          console.log('🔧 QuantitySelectionPage - Creating Final Transfer:', {
            productId: transfer.productId,
            productName: transfer.productName,
            fromBinId: transfer.fromBinId,
            toBinId: transfer.toBinId,
            sourceBinName: group.sourceBinName,
            key,
            originalQuantity: transfer.originalQuantity,
            moveQuantity: transfer.moveQuantity,
            transferQuantitiesValue: transferQuantities[key],
            updatedQuantity: updatedQuantity
          });
          
          currentProductTransfers.push({
            ...transfer,
            quantity: updatedQuantity,
            moveQuantity: updatedQuantity
          });
        });
      }
    });
    
    // Get remaining groups (products not yet processed)
    const remainingGroups = groupedTransfers.filter((g, idx) => {
      const groupProductKey = `${g.productName}-${g.ndc}-${g.inventoryType}`;
      return idx > currentIndex && groupProductKey !== currentProductKey;
    });
    
    const remainingTransfers = remainingGroups.flatMap(group => 
      group.transfers.map(transfer => ({
        ...transfer,
        quantity: transfer.moveQuantity,
        moveQuantity: transfer.moveQuantity
      }))
    );
    
    console.log('🔧 QuantitySelectionPage - Final Transfers Summary:', {
      currentProductTransfers: currentProductTransfers.length,
      remainingProductTransfers: remainingTransfers.length,
      totalTransfers: currentProductTransfers.length + remainingTransfers.length,
      currentProduct: {
        name: currentGroup.productName,
        transfers: currentProductTransfers.map(t => ({
          productName: (t as any).productName,
          quantity: t.quantity,
          toBinId: t.toBinId
        }))
      },
      hasMoreProducts: remainingTransfers.length > 0
    });
    
    onConfirm(currentProductTransfers, remainingTransfers);
  };

  if (!currentGroup) return null;

  const beforeMove = currentGroup.originalQuantity;
  const qtyToMove = getCurrentQuantity();
  const afterMove = beforeMove - qtyToMove;

  // CRITICAL: Determine if Skip button should be shown
  // Skip is ONLY available on the FIRST source bin of a product
  // Once user moves to another source bin of the same product, they cannot skip
  const isFirstSourceBinOfProduct = useMemo(() => {
    const currentProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
    
    // Check if any previous source bins (lower index) have the same product
    for (let i = 0; i < currentIndex; i++) {
      const prevGroup = groupedTransfers[i];
      const prevProductKey = `${prevGroup.productName}-${prevGroup.ndc}-${prevGroup.inventoryType}`;
      if (prevProductKey === currentProductKey) {
        // Found a previous source bin of the same product - NOT the first!
        return false;
      }
    }
    
    // No previous source bins of this product found - this IS the first!
    return true;
  }, [currentIndex, currentGroup, groupedTransfers]);

  // Count unique products to determine if there are other products to skip to
  const uniqueProductKeys = new Set(groupedTransfers.map(g => `${g.productName}-${g.ndc}-${g.inventoryType}`));
  const hasMultipleProducts = uniqueProductKeys.size > 1;

  // Does this product still have another source bin to pull from after this one?
  // If so, the primary button just advances to that bin (still "taking out"); otherwise it
  // hands off to the target-bin placement screen. The label/instructions reflect which.
  const currentProductKeyForNav = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
  const hasMoreSourceBinsForProduct = groupedTransfers.some((g, idx) =>
    idx > currentIndex &&
    `${g.productName}-${g.ndc}-${g.inventoryType}` === currentProductKeyForNav
  );
  const primaryActionLabel = hasMoreSourceBinsForProduct ? 'Next Source Bin' : 'Proceed to Target Bin';
  
  // Show Skip button ONLY if:
  // 1. This is the first source bin of the product AND
  // 2. There are multiple products (something to skip to)
  const showSkipButton = isFirstSourceBinOfProduct && hasMultipleProducts;

  // --- Data for the footer's Product / Source Bin side sheets (plain derivations, tiny arrays) ---
  const activeProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
  const getGroupMoveQty = (g: GroupedTransfer) =>
    transferQuantities[`${g.productId}-${g.fromBinId}-group`] ?? g.transfers[0].moveQuantity;

  const productSummaries = (() => {
    const byKey = new Map<string, {
      key: string; name: string; description?: string; ndc?: string;
      inventoryType?: string; unit?: string; binCount: number; moveQty: number;
      firstIndex: number; lastIndex: number;
    }>();
    groupedTransfers.forEach((g, idx) => {
      const key = `${g.productName}-${g.ndc}-${g.inventoryType}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.binCount += 1;
        existing.moveQty += getGroupMoveQty(g);
        existing.lastIndex = idx;
      } else {
        byKey.set(key, {
          key, name: g.productName, description: g.productDescription, ndc: g.ndc,
          inventoryType: g.inventoryType, unit: g.unit, binCount: 1,
          moveQty: getGroupMoveQty(g), firstIndex: idx, lastIndex: idx
        });
      }
    });
    return Array.from(byKey.values());
  })();

  const sourceBinSummaries = groupedTransfers
    .map((g, idx) => ({ group: g, idx }))
    .filter(({ group }) => `${group.productName}-${group.ndc}-${group.inventoryType}` === activeProductKey)
    .map(({ group, idx }) => ({
      binName: group.sourceBinName,
      doorName: group.sourceDoorName,
      originalQty: group.originalQuantity,
      moveQty: getGroupMoveQty(group),
      unit: group.unit,
      targetBinNames: group.targetBinNames,
      isCurrent: idx === currentIndex,
      isDone: idx < currentIndex
    }));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Product Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[16px] font-semibold text-[#020817]">{currentGroup.productName}</h2>
              {currentGroup.unit && (
                <Badge className="bg-black text-white text-[12px] font-bold px-2 py-0.5 rounded">
                  {currentGroup.unit}
                </Badge>
              )}
            </div>
            {currentGroup.productDescription && (
              <p className="text-[14px] text-[#4a5565]">{currentGroup.productDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#f9fafb] pb-32">
        {/* Info Sections */}
        <div className="bg-white border-b px-6 py-6">
          <div className="grid grid-cols-3 gap-8">
            {/* Product Details */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Product Details</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">NDC:</span>
                  <span className="text-[14px] text-[#020817]">
                    {currentGroup.ndc || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Inventory Type:</span>
                  <span className="text-[14px] text-[#020817]">
                    {currentGroup.inventoryType || 'Purchased'}
                  </span>
                </div>
              </div>
            </div>

            {/* Source Bin */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Source Bin</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[14px] text-[#4a5565]">Door:</span>
                  <span className="text-[14px] text-[#020817]">{currentGroup.sourceDoorName}</span>
                  <span className="text-[14px] text-[#12805C] ml-2 inline-flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Unlocked
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Bin:</span>
                  <span className="text-[14px] text-[#020817]">{currentGroup.sourceBinName}</span>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Inventory</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Before Move:</span>
                  <span className="text-[14px] text-[#020817]">{beforeMove}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">After Move:</span>
                  <span className="text-[14px] text-[#020817] font-semibold">{afterMove}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="bg-white border-b px-6 py-8">
          <div className="flex items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-[16px] text-[#64748b] mb-2">Inventory ({pluralizeUnit(currentGroup.unit || 'Vial', beforeMove)})</p>
              <p className="text-[48px] font-semibold text-[#020817]">{beforeMove}</p>
            </div>
            
            <div className="h-10 w-px bg-[#d9d9d9]" />
            
            <div className="text-right relative">
              <p className="text-[16px] text-[#64748b] mb-2">Qty to move</p>
              <div className="flex items-center gap-3 justify-end">
                <Pencil 
                  className="w-6 h-6 text-[#095192] cursor-pointer" 
                  onClick={handleEditQuantity}
                />
                <p className="text-[48px] font-semibold text-[#020817]">{qtyToMove}</p>
              </div>

              {/* Quantity Edit Popover */}
              {editingQuantity && (
                <div className="absolute right-0 top-[85px] bg-white rounded-[4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3)] w-[300px] h-[120px] z-10">
                  <p className="absolute left-[16px] top-[16px] text-[14px] text-[#25282a]">Change Qty to move</p>

                  {/* Input and Dropdown */}
                  <div className="absolute left-[16px] top-[41px] w-[154px] h-[44px] flex">
                    {/* Input */}
                    <div className="bg-white h-full rounded-bl-[4px] rounded-tl-[4px] w-[72px] relative">
                      <div className="flex items-center p-[12px] h-full">
                        <input
                          type="number"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveQuantity();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-full text-[14px] text-[#25282a] text-right focus:outline-none"
                          ref={inputRef}
                          max={beforeMove}
                          min={0}
                        />
                      </div>
                      <div className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
                    </div>
                    
                    {/* Dropdown */}
                    <div className="bg-[#f7f8f9] h-full rounded-br-[4px] rounded-tr-[4px] w-[82px] flex items-center justify-center relative">
                      <div className="absolute border-[#bcc3cd] border-[1px_1px_1px_0px] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
                      <p className="text-[14px] text-[#767676] text-center">{currentGroup.unit || 'each'}</p>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div
                    className="absolute left-[178px] top-[41px] w-[44px] h-[44px] bg-white border border-[#bcc3cd] rounded-[4px] cursor-pointer flex items-center justify-center"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                  >
                    <X className="w-[20px] h-[20px] text-[#25282a]" />
                  </div>

                  {/* Check Circle Button */}
                  <div
                    className="absolute left-[230px] top-[41px] w-[44px] h-[44px] bg-[#095192] rounded-[4px] cursor-pointer flex items-center justify-center"
                    onClick={handleSaveQuantity}
                    aria-label="Save"
                  >
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 19 18">
                      <g>
                        <path d={svgPaths.p8ac0680} fill="white" />
                        <path d={svgPaths.p34ca1100} fill="white" />
                      </g>
                    </svg>
                  </div>

                  {/* Max Text */}
                  <p className="absolute left-[16px] top-[89px] text-[12px] text-[#25282a]">
                    Max: {beforeMove} {currentGroup.unit || 'each'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border-b px-6 py-10">
          <div className="text-center text-[14px] text-[#020817]">
            <p className="mb-0">Remove the quantity shown from this bin, then</p>
            <p>tap "{primaryActionLabel}" to continue.</p>
          </div>
        </div>
      </div>

      {/* PIP: real-world cabinet interaction for the current source bin */}
      <CabinetPipView
        doorName={currentGroup.sourceDoorName}
        binName={currentGroup.sourceBinName}
        binId={currentGroup.fromBinId}
        doorShelfConfig={doorShelfConfig}
        mode="source"
        quantity={qtyToMove}
        unit={currentGroup.unit}
      />

      {/* Footer */}
      <div className="fixed bottom-0 left-[60px] right-0 border-t bg-white px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Product Navigation — tap to list every product in this move */}
            <button
              type="button"
              onClick={() => setActiveSheet('product')}
              className="flex flex-col gap-2 items-start min-h-[44px] bg-transparent border-none p-0 cursor-pointer text-left"
            >
              <p className="text-[14px] text-[#64748b]">Product</p>
              <div className="flex items-center gap-2">
                <p className="text-[18px] font-semibold text-[#095192] underline decoration-solid">
                  {productSummaries.findIndex(p => p.key === activeProductKey) + 1}/{productSummaries.length}
                </p>
                <ChevronRight className="w-6 h-6 text-[#095192]" />
              </div>
            </button>

            <div className="h-10 w-px bg-[#d9d9d9]" />

            {/* Source Bin Navigation — tap to list this product's source bins */}
            <button
              type="button"
              onClick={() => setActiveSheet('sourceBin')}
              className="flex flex-col gap-2 items-start min-h-[44px] bg-transparent border-none p-0 cursor-pointer text-left"
            >
              <p className="text-[14px] text-[#64748b]">Source Bin</p>
              <div className="flex items-center gap-2">
                <p className="text-[18px] font-semibold text-[#095192] underline decoration-solid">
                  {sourceBinSummaries.filter(s => s.isDone).length + 1}/{sourceBinSummaries.length}
                </p>
                <ChevronRight className="w-6 h-6 text-[#095192]" />
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Always visible, regardless of which product/source bin is active — unlike Skip,
                which only makes sense when there's another product to jump to. */}
            <div
              className="bg-white relative rounded-[4px] cursor-pointer"
              onClick={onCancel}
            >
              <div aria-hidden="true" className="absolute border border-[rgba(184,59,59,1)] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-end relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                  <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[rgba(184,59,59,1)] text-[14px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre text-[14px]">Cancel</p>
                  </div>
                </div>
              </div>
            </div>
            {showSkipButton && (
              <div 
                className="bg-white relative rounded-[4px] cursor-pointer"
                onClick={handleSkip}
              >
                <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                <div className="flex flex-row items-center justify-end relative size-full">
                  <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                    <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                      <p className="leading-[20px] whitespace-pre text-[14px]">Skip & Continue</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div 
              className={`relative rounded-[4px] ${
                isSaving 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-[#095192] cursor-pointer'
              }`}
              onClick={isSaving ? undefined : handleSave}
            >
              <div className="flex flex-row items-center justify-end relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                  <div className={`font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap ${
                    isSaving ? 'text-gray-500' : 'text-white'
                  }`}>
                    <p className="leading-[20px] whitespace-pre text-[14px]">{primaryActionLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product list sheet */}
      <SideSheet
        open={activeSheet === 'product'}
        title="Products in this move"
        subtitle={`${productSummaries.length} product${productSummaries.length !== 1 ? 's' : ''} selected for allocation`}
        onClose={() => setActiveSheet(null)}
      >
        {productSummaries.map(p => {
          const isCurrent = p.key === activeProductKey;
          const isDone = p.lastIndex < currentIndex;
          return (
            <div
              key={p.key}
              className={`border rounded-[6px] p-3 mb-2 ${
                isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#020817]">{p.name}</p>
                  {p.description && <p className="text-[12px] text-[#64748b]">{p.description}</p>}
                  <p className="text-[12px] text-[#64748b] mt-1">
                    NDC: {p.ndc || 'N/A'} · {p.inventoryType || 'Purchased'}
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    {p.binCount} source bin{p.binCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-white bg-[#095192] rounded-full px-2 py-0.5">Current</span>
                  )}
                  {isDone && !isCurrent && (
                    <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                  )}
                  <span className="text-[13px] font-semibold text-[#020817]">
                    {p.moveQty} {pluralizeUnit(p.unit || 'vial', p.moveQty)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </SideSheet>

      {/* Source bin list sheet — bins for the CURRENT product */}
      <SideSheet
        open={activeSheet === 'sourceBin'}
        title="Source bins"
        subtitle={currentGroup.productName}
        onClose={() => setActiveSheet(null)}
      >
        {sourceBinSummaries.map((s, idx) => (
          <div
            key={`${s.binName}-${idx}`}
            className={`border rounded-[6px] p-3 mb-2 ${
              s.isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#020817]">{s.binName}</p>
                <p className="text-[12px] text-[#64748b]">{s.doorName}</p>
                <p className="text-[12px] text-[#64748b] mt-1">
                  → {s.targetBinNames.join(', ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {s.isCurrent && (
                  <span className="text-[10px] font-semibold text-white bg-[#095192] rounded-full px-2 py-0.5">Current</span>
                )}
                {s.isDone && (
                  <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                )}
                <span className="text-[13px] font-semibold text-[#020817]">
                  {s.moveQty}/{s.originalQty} {pluralizeUnit(s.unit || 'vial', s.originalQty)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </SideSheet>
    </div>
  );
}