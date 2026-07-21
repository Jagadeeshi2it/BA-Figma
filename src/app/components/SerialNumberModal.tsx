import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Search, ArrowLeft, Check } from "lucide-react";
import { ProductTransfer } from '../types';
import { isFloorDoor } from '../utils/doorUtils';
import svgPaths from "../imports/svg-9crqj6fi1p";


// NEW: Checkbox component for serial item selection
interface SerialItemCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

const SerialItemCheckbox: React.FC<SerialItemCheckboxProps> = ({ checked, disabled, onChange }) => {
  return (
    <div 
      className={`w-4 h-4 mr-6 flex-shrink-0 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onChange}
    >
      {checked ? (
        <div className="w-full h-full bg-[#095192] border-2 border-[#095192] rounded flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className={`w-full h-full border-2 rounded ${disabled ? 'border-gray-300 bg-gray-100' : 'border-[#bcc3cd] bg-white'}`}></div>
      )}
    </div>
  );
};


interface SerialNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfers: ProductTransfer[];
  onConfirm: (transfers: ProductTransfer[], serialNumbers: { [transferId: string]: string[] }) => void;
  onBack: () => void;
  doorShelfConfig: any;
  currentIndex?: number;
  totalCount?: number;
}

interface SerialEntry {
  serial: string;
  lot: string;
  source: string;
  expiration: string;
  quantity: string;
}

// STABLE: Seeded random number generator for stable serial numbers
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// STABLE: Function to generate stable serial number based on seed
const generateSerialNumber = (seed: number): string => {
  const randomNum = Math.floor(seededRandom(seed) * 90000000000000) + 10000000000000;
  return randomNum.toString();
};

// STABLE: Function to generate stable lot number based on seed
const generateLotNumber = (seed: number): string => {
  const randomNum = Math.floor(seededRandom(seed + 1000) * 9000000) + 1000000;
  return randomNum.toString();
};

// STABLE: Function to generate stable expiration date based on seed
const generateExpirationDate = (seed: number): string => {
  const now = new Date();
  const minDays = 180; // 6 months
  const maxDays = 1095; // 3 years
  const randomDays = Math.floor(seededRandom(seed + 2000) * (maxDays - minDays + 1)) + minDays;
  const expirationDate = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);
  
  return expirationDate.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

// STABLE: Function to get stable random source based on seed
const getRandomSource = (seed: number): string => {
  const sources = [
    'CuraScript SD',
    'Danaher Corporation', 
    'McKesson Medical',
    'Cardinal Health',
    'AmerisourceBergen',
    'Henry Schein',
    'Medline Industries'
  ];
  return sources[Math.floor(seededRandom(seed + 3000) * sources.length)];
};

// STABLE: Generate serial entries function (moved outside component)
const generateSerialEntries = (quantity: number, productId: string): SerialEntry[] => {
  const entries: SerialEntry[] = [];
  // Create a stable seed based on product ID
  const baseSeed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < quantity; i++) {
    const entrySeed = baseSeed + i; // Unique seed for each entry
    entries.push({
      serial: generateSerialNumber(entrySeed),
      lot: generateLotNumber(entrySeed),
      source: getRandomSource(entrySeed),
      expiration: generateExpirationDate(entrySeed),
      quantity: '1 vial / 400 mg / 16 ml'
    });
  }
  
  return entries;
};

export default function SerialNumberModal({
  open,
  onOpenChange,
  transfers,
  onConfirm,
  onBack,
  doorShelfConfig,
  currentIndex = 0,
  totalCount = 1
}: SerialNumberModalProps) {
  const [serialNumbers, setSerialNumbers] = useState<{ [transferId: string]: string[] }>({});
  const [errors, setErrors] = useState<{ [transferId: string]: string[] }>({});
  const [searchValue, setSearchValue] = useState('');
  const [serialEntries, setSerialEntries] = useState<SerialEntry[]>([]);
  // CRITICAL ADDITION: Track current product index for product-by-product workflow
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  
  // NEW: Selection state management
  const [selectedSerialIndices, setSelectedSerialIndices] = useState<Set<number>>(new Set());

  // UPDATED: Accept ALL transfers with quantity > 0 (not just Emergency Kit transfers)
  // Serial number selection is now required for any product movement between bins
  const serialRequiredTransfers = transfers.filter(transfer => transfer.quantity > 0);

  // Get product and bin details for the current transfer
  const getTransferDetails = (transfer: ProductTransfer) => {
    // Find the source product
    let product = null;
    let sourceBin = null;
    let targetBin = null;
    let targetDoor = null;
    let totalProductQuantity = 0;

    // Find source bin and product
    for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
      for (const shelf of shelves as any[]) {
        const foundSourceBin = shelf.bins.find((bin: any) => bin.id === transfer.fromBinId);
        if (foundSourceBin) {
          sourceBin = foundSourceBin;
          product = foundSourceBin.products.find((p: any) => p.id === transfer.productId);
          if (product) {
            totalProductQuantity = product.quantity || 0;
          }
          break;
        }
      }
      if (sourceBin && product) break;
    }

    // Find target bin and door
    for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
      for (const shelf of shelves as any[]) {
        const foundTargetBin = shelf.bins.find((bin: any) => bin.id === transfer.toBinId);
        if (foundTargetBin) {
          targetBin = foundTargetBin;
          targetDoor = doorKey;
          break;
        }
      }
      if (targetBin) break;
    }

    return {
      product,
      sourceBin,
      targetBin,
      targetDoor,
      quantity: transfer.quantity,
      totalProductQuantity: totalProductQuantity
    };
  };

  // CRITICAL FIX: Handle multiple transfers for serial number selection
  // Get details for all transfers requiring serial numbers
  const allTransferDetails = useMemo(() => 
    serialRequiredTransfers.map(transfer => ({
      transfer,
      details: getTransferDetails(transfer)
    })).filter(item => item.details !== null),
    [serialRequiredTransfers, doorShelfConfig]
  );

  // STABLE: Create a stable key for the current product to prevent unnecessary re-renders
  const currentProductKey = useMemo(() => {
    if (allTransferDetails.length === 0 || currentProductIndex >= allTransferDetails.length) {
      return null;
    }
    const currentTransferDetail = allTransferDetails[currentProductIndex];
    return currentTransferDetail ? `${currentTransferDetail.transfer.productId}-${currentTransferDetail.details.totalProductQuantity}` : null;
  }, [allTransferDetails, currentProductIndex]);

  // CRITICAL ADDITION: Get current transfer based on product index for product-by-product workflow
  const currentTransfer = allTransferDetails[currentProductIndex]?.transfer || serialRequiredTransfers[0];
  const transferDetails = useMemo(() => 
    currentTransfer ? getTransferDetails(currentTransfer) : null, 
    [currentTransfer, doorShelfConfig]
  );




  // CRITICAL FIX: Reset state when modal opens and when product changes
  useEffect(() => {
    if (open && allTransferDetails.length > 0) {
      setSerialNumbers({});
      setErrors({});
      setSearchValue('');
      setCurrentProductIndex(0); // Reset to first product when modal opens
    }
  }, [open, allTransferDetails.length]);

  // CRITICAL FIX: Initialize serial entries and reset selection only when product actually changes
  useEffect(() => {
    console.log('🔍 useEffect triggered - open:', open, 'currentProductKey:', currentProductKey);
    if (open && currentProductKey) {
      const currentTransferDetail = allTransferDetails[currentProductIndex];
      if (currentTransferDetail && currentTransferDetail.details.totalProductQuantity > 0) {
        console.log('🔍 Generating new serial entries and resetting selection');
        const newEntries = generateSerialEntries(
          currentTransferDetail.details.totalProductQuantity, 
          currentTransferDetail.transfer.productId
        );
        setSerialEntries(newEntries);
        setSelectedSerialIndices(new Set()); // Reset selection state
        setSearchValue('');
      }
    }
  }, [open, currentProductKey]); // Use stable key instead of allTransferDetails

  const handleSearchInput = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchClick = () => {
    if (searchValue.trim()) {
      // Filter or highlight entries based on search
      console.log('Searching for:', searchValue);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchClick();
    }
  };

  // NEW: Selection logic
  const requiredQuantity = allTransferDetails[currentProductIndex]?.details.quantity || 0;
  const selectedCount = selectedSerialIndices.size;
  const isSelectionComplete = selectedCount === requiredQuantity && requiredQuantity > 0;
  const isSelectAllChecked = selectedCount === requiredQuantity && selectedCount > 0;
  const isSelectAllIndeterminate = selectedCount > 0 && selectedCount < requiredQuantity;

  // NEW: Handle individual serial item selection (memoized to prevent re-creation)
  const handleSerialItemSelect = useCallback((index: number) => {
    console.log('🔍 handleSerialItemSelect called with index:', index);
    console.log('🔍 Required quantity:', requiredQuantity);
    
    setSelectedSerialIndices(prev => {
      console.log('🔍 Current selectedSerialIndices:', Array.from(prev));
      const newSet = new Set(prev);
      
      if (newSet.has(index)) {
        // Deselect
        console.log('🔍 Deselecting index:', index);
        newSet.delete(index);
      } else {
        // Select (only if under limit)
        if (newSet.size < requiredQuantity) {
          console.log('🔍 Selecting index:', index);
          newSet.add(index);
        } else {
          console.log('🔍 Cannot select - limit reached');
        }
      }
      
      console.log('🔍 New selectedSerialIndices:', Array.from(newSet));
      return newSet;
    });
  }, [requiredQuantity]);

  // NEW: Handle select all functionality (memoized to prevent re-creation)
  const handleSelectAll = useCallback(() => {
    console.log('🔍 handleSelectAll called - isSelectAllChecked:', isSelectAllChecked);
    if (isSelectAllChecked) {
      // Deselect all
      console.log('🔍 Deselecting all');
      setSelectedSerialIndices(new Set());
    } else {
      // Select up to the required quantity
      console.log('🔍 Selecting all up to required quantity:', requiredQuantity);
      const newSet = new Set<number>();
      for (let i = 0; i < Math.min(requiredQuantity, serialEntries.length); i++) {
        newSet.add(i);
      }
      setSelectedSerialIndices(newSet);
    }
  }, [isSelectAllChecked, requiredQuantity, serialEntries.length]);

  // NEW: Validate that the correct number of serial items are selected
  const validateSerialNumbers = (): boolean => {
    return isSelectionComplete;
  };

  // NEW: Handle confirmation with selected serials
  const handleConfirm = () => {
    if (!validateSerialNumbers() || allTransferDetails.length === 0) {
      return;
    }

    // Use only the selected serials
    const selectedSerials = Array.from(selectedSerialIndices)
      .map(index => serialEntries[index]?.serial)
      .filter(Boolean);
    
    const currentTransferDetail = allTransferDetails[currentProductIndex];
    if (!currentTransferDetail) return;

    // Store serial numbers for current product
    const transferId = `${currentTransferDetail.transfer.productId}-${currentTransferDetail.transfer.toBinId}`;
    const updatedSerialNumbers = {
      ...serialNumbers,
      [transferId]: selectedSerials
    };
    setSerialNumbers(updatedSerialNumbers);

    console.log('🔧 Product-by-Product Serial Collection:', {
      currentProduct: currentProductIndex + 1,
      totalProducts: allTransferDetails.length,
      currentProductId: currentTransferDetail.transfer.productId,
      serialsForCurrentProduct: selectedSerials.length,
      isLastProduct: currentProductIndex === allTransferDetails.length - 1
    });

    // Check if this is the last product
    if (currentProductIndex === allTransferDetails.length - 1) {
      // Last product - complete the workflow
      console.log('🔧 Completing Multi-Product Serial Workflow:', {
        totalProducts: allTransferDetails.length,
        allSerialNumbers: updatedSerialNumbers
      });

      // Call the onConfirm with ALL transfers and collected serial numbers
      onConfirm(transfers, updatedSerialNumbers);
      
      // Close the modal
      onOpenChange(false);
      
      // Clean up global state
      if (typeof window !== 'undefined') {
        delete (window as any).serialNumberModalEnabled;
        delete (window as any).serialNumberModalHandleConfirm;
      }
    } else {
      // Move to next product
      setCurrentProductIndex(prev => prev + 1);
    }
  };

  // NEW: Handle Next button with selected serials
  const handleNext = () => {
    if (!validateSerialNumbers() || allTransferDetails.length === 0) {
      return;
    }

    // Use only the selected serials
    const selectedSerials = Array.from(selectedSerialIndices)
      .map(index => serialEntries[index]?.serial)
      .filter(Boolean);
    
    const currentTransferDetail = allTransferDetails[currentProductIndex];
    if (!currentTransferDetail) return;

    // Store serial numbers for current product
    const transferId = `${currentTransferDetail.transfer.productId}-${currentTransferDetail.transfer.toBinId}`;
    const updatedSerialNumbers = {
      ...serialNumbers,
      [transferId]: selectedSerials
    };
    setSerialNumbers(updatedSerialNumbers);

    console.log('🔧 Moving to Next Product:', {
      currentProduct: currentProductIndex + 1,
      totalProducts: allTransferDetails.length,
      currentProductId: currentTransferDetail.transfer.productId,
      serialsForCurrentProduct: selectedSerials.length
    });

    // Move to next product
    setCurrentProductIndex(prev => prev + 1);
  };


  // CRITICAL FIX: Debug helper for multi-transfer testing
  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      (window as any).debugSerialModal = {
        transfers,
        serialRequiredTransfers,
        allTransferDetails,
        selectedCount: serialEntries.filter(entry => entry.selected).length,
        maxSelectable: allTransferDetails.reduce((total, item) => total + item.details.quantity, 0),
        isValid: validateSerialNumbers()
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).debugSerialModal;
      }
    };
  }, [open, transfers, serialRequiredTransfers, allTransferDetails, serialEntries]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (serialRequiredTransfers.length === 0 || allTransferDetails.length === 0) {
    return null;
  }

  // CRITICAL FIX: Calculate statistics for current product only
  const inventoryCount = allTransferDetails[currentProductIndex]?.details.totalProductQuantity || 0; // Total available in current product's source bin
  const moveCount = allTransferDetails[currentProductIndex]?.details.quantity || 0; // Amount to move for current product only

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[1100px] !max-w-[1100px] !min-w-[1100px] !h-[800px] !max-h-[800px] !min-h-[800px] p-0 gap-0 overflow-hidden" style={{ width: '1100px', maxWidth: '1100px', minWidth: '1100px', height: '800px', maxHeight: '800px', minHeight: '800px' }}>
        <DialogTitle className="sr-only">Select serial items to move</DialogTitle>
        <DialogDescription className="sr-only">
          Select serial items to move between bins
        </DialogDescription>
        
        <div className="flex flex-col h-full min-h-0">
          {/* Fixed Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-1">
              <div className="text-[21px] font-normal text-neutral-950">
                Select serial items to move {allTransferDetails.length > 1 ? `(${currentProductIndex + 1}/${allTransferDetails.length})` : ''}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* CRITICAL FIX: Fixed Product Information for Multiple Transfers */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
            {allTransferDetails.length === 1 ? (
              // Single product
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex gap-2 items-center">
                    <div className="font-semibold text-[#020817] text-[16px]">
                      {transferDetails?.product?.name?.toUpperCase() || 'POTASSIUM CL 20 MEQ/10 ML CONC'}
                    </div>
                    <div className="bg-black flex items-center justify-center px-[3.5px] py-[1.75px] rounded-[4px]">
                      <div className="font-bold text-white text-[12px]">
                        SDV
                      </div>
                    </div>
                  </div>
                  <div className="font-normal text-[#4a5565] text-[14px]">
                    {transferDetails?.product?.description || 'potassium chloride 2 mEq/mL intravenous solution'}
                  </div>
                </div>
              </div>
            ) : (
              // Multiple products - Show current product only
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex gap-2 items-center">
                    <div className="font-semibold text-[#020817] text-[16px]">
                      {transferDetails?.product?.name?.toUpperCase() || 'POTASSIUM CL 20 MEQ/10 ML CONC'}
                    </div>
                    {transferDetails?.targetDoor && isFloorDoor(transferDetails.targetDoor) && (
                      <div className="bg-black flex items-center justify-center px-[3.5px] py-[1.75px] rounded-[4px]">
                        <div className="font-bold text-white text-[12px]">
                          E-KIT
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="font-normal text-[#4a5565] text-[14px]">
                    {transferDetails?.product?.description || 'Select serial numbers to move'}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Fixed Information Grid */}
          <div className="flex-shrink-0 bg-[#e9eef4] px-6 py-4 border-b border-gray-200">
            <div className="flex gap-[60px] items-start">
              {/* Product Details */}
              <div className="flex flex-col gap-2 w-60">
                <div className="font-semibold opacity-50 text-[#25282a] text-[12px]">
                  Product Details
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">NDC:</div>
                  <div className="text-[#020817]">{transferDetails.product?.ndc || '63323096510'}</div>
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">Inventory Type:</div>
                  <div className="text-[#020817]">{transferDetails.product?.inventoryType || 'Purchased'}</div>
                </div>
              </div>

              {/* Product Location */}
              <div className="flex flex-col gap-2 w-40">
                <div className="font-semibold opacity-50 text-[#25282a] text-[12px]">
                  Product Location
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">Bin:</div>
                  <div className="text-[#020817]">{transferDetails.sourceBin?.name || '1'}</div>
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">Door:</div>
                  <div className="text-[#020817]">{transferDetails.sourceBin ? (() => {
                    for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
                      for (const shelf of shelves as any[]) {
                        if (shelf.bins.some((bin: any) => bin.id === transferDetails.sourceBin?.id)) {
                          return doorKey;
                        }
                      }
                    }
                    return 'Unknown';
                  })() : '2'}</div>
                </div>
              </div>

              {/* Allocation Details */}
              <div className="flex flex-col gap-2 w-[200px]">
                <div className="font-semibold opacity-50 text-[#25282a] text-[12px]">
                  Allocation Details
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">Move Qty:</div>
                  <div className="text-[#020817]">{transferDetails.quantity}</div>
                </div>
                <div className="flex gap-2 font-normal text-[14px]">
                  <div className="text-[#4a5565]">{(() => {
                    const isToEKit = transferDetails.targetDoor && isFloorDoor(transferDetails.targetDoor);
                    const isFromEKit = (() => {
                      for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
                        for (const shelf of shelves as any[]) {
                          if (shelf.bins.some((bin: any) => bin.id === transferDetails.sourceBin?.id)) {
                            return isFloorDoor(doorKey);
                          }
                        }
                      }
                      return false;
                    })();
                    
                    // Always show "Move To:" for clarity
                    if (isToEKit) return 'Move To:';
                    if (isFromEKit) return 'Move From:';
                    return 'Move To:';
                  })()}</div>
                  <div className="text-[#020817]">{(() => {
                    const isToEKit = transferDetails.targetDoor && isFloorDoor(transferDetails.targetDoor);
                    const targetBinName = transferDetails.targetBin?.name || 'Unknown Bin';
                    
                    // Show door and bin name, with E-Kit label if applicable
                    if (isToEKit) return `${transferDetails.targetDoor} - Bin ${targetBinName} (E-Kit)`;
                    return `${transferDetails.targetDoor || 'Unknown Door'} - Bin ${targetBinName}`;
                  })()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Statistics and Search */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-[386px]">
              <div className="flex items-center flex-1 bg-white border border-[#bcc3cd] rounded-[4px] h-12">
                <div className="flex items-center px-3 gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-4 h-4">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <g>
                          <path d={svgPaths.p389ab880} fill="#64748B" />
                          <path d={svgPaths.p96bed80} fill="#64748B" />
                          <path d={svgPaths.p53260f0} fill="#64748B" />
                          <path d={svgPaths.p38490800} fill="#64748B" />
                          <path d={svgPaths.p16b2fb80} fill="#64748B" />
                          <path d="M12 10.25H10.25V12H12V10.25Z" fill="#64748B" />
                          <path d={svgPaths.p20f5a800} fill="#64748B" />
                          <path d={svgPaths.p2833b9b2} fill="#64748B" />
                          <path d="M13.75 12H12V13.75H13.75V12Z" fill="#64748B" />
                          <path d={svgPaths.p6989f00} fill="#64748B" />
                          <path d={svgPaths.p539e380} fill="#64748B" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Scan or type serial number"
                    value={searchValue}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="flex-1 font-normal text-[#9fa9b7] text-[16px] border-0 bg-transparent outline-none placeholder:text-[#9fa9b7]"
                  />
                </div>
              </div>
              <Button
                onClick={handleSearchClick}
                className="bg-[#095192] hover:bg-[#074080] text-white px-4 h-12 rounded-[4px]"
                disabled={!searchValue.trim()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Statistics */}
            <div className="flex gap-6 items-center">
              {/* Inventory */}
              <div className="flex flex-col gap-2 items-center">
                <div className="font-medium text-[#767676] text-[16px]">
                  Inventory(Vials)
                </div>
                <div className="font-semibold text-[#25282a] text-[35px]">
                  {inventoryCount}
                </div>
              </div>

              <div className="bg-[#eeeeee] h-[66px] w-px" />

              {/* Move */}
              <div className="flex flex-col gap-2 items-center">
                <div className="font-medium text-[#767676] text-[16px]">
                  Move(Vials)
                </div>
                <div className="font-semibold text-[#25282a] text-[35px]">
                  {transferDetails?.quantity || 0}
                </div>
              </div>

              <div className="bg-[#eeeeee] h-[66px] w-px" />

              {/* Selected */}
              <div className="flex flex-col gap-2 items-center">
                <div className="font-medium text-[#767676] text-[16px]">
                  Selected(Vials)
                </div>
                <div className="font-semibold text-[#25282a] text-[35px]">
                  {selectedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area - Flexible height that expands to fill available space */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Fixed Table Header - Always visible at top of scrollable content */}
            <div className="flex-shrink-0 bg-slate-50 border-b border-gray-200">
              <div className="flex items-center px-6 py-4">
                <div className="w-4 h-4 mr-6 flex-shrink-0">
                  <div 
                    className="border-2 border-[#bcc3cd] rounded w-full h-full cursor-pointer"
                    onClick={handleSelectAll}
                  >
                    {isSelectAllChecked ? (
                      <div className="w-full h-full bg-[#095192] border-2 border-[#095192] rounded flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : isSelectAllIndeterminate ? (
                      <div className="w-full h-full bg-[#095192] border-2 border-[#095192] rounded flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-white rounded"></div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="font-medium text-[#25282a] text-[14px] flex-1 min-w-0">Serial</div>
                <div className="font-medium text-[#25282a] text-[14px] flex-1 min-w-0">Lot</div>
                <div className="font-medium text-[#25282a] text-[14px] flex-1 min-w-0">Source</div>
                <div className="font-medium text-[#25282a] text-[14px] flex-1 min-w-0">Expiration</div>
                <div className="font-medium text-[#25282a] text-[14px] flex-1 min-w-0">Quantity</div>
              </div>
            </div>

            {/* Scrollable Table Content - This area will scroll when content overflows */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-[64px]"> {/* pb-[64px] ensures content isn't hidden behind footer */}
              {serialEntries.map((entry, index) => {
                const isSelected = selectedSerialIndices.has(index);
                const isDisabled = !isSelected && selectedCount >= requiredQuantity;
                return (
                  <div key={`${entry.serial}-${index}`} className="bg-white border-b border-gray-100">
                    <div 
                      className={`flex items-center px-6 py-4 cursor-pointer ${!isDisabled ? 'hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
                      onClick={() => {
                        if (!isDisabled) {
                          handleSerialItemSelect(index);
                        }
                      }}
                    >
                      <SerialItemCheckbox 
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleSerialItemSelect(index)}
                      />
                      <div className={`font-normal text-[14px] flex-1 min-w-0 ${isDisabled ? 'text-[#9ca3af]' : 'text-[#25282a]'}`}>
                        {entry.serial}
                      </div>
                      <div className={`font-normal text-[14px] flex-1 min-w-0 ${isDisabled ? 'text-[#9ca3af]' : 'text-[#25282a]'}`}>{entry.lot}</div>
                      <div className={`font-normal text-[14px] flex-1 min-w-0 ${isDisabled ? 'text-[#9ca3af]' : 'text-[#25282a]'}`}>{entry.source}</div>
                      <div className={`font-normal text-[14px] flex-1 min-w-0 ${isDisabled ? 'text-[#9ca3af]' : 'text-[#25282a]'}`}>{entry.expiration}</div>
                      <div className={`font-normal text-[14px] flex-1 min-w-0 ${isDisabled ? 'text-[#9ca3af]' : 'text-[#25282a]'}`}>{entry.quantity}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixed Footer with Action Bar - Always visible at bottom */}
          <div className="flex-shrink-0 absolute bottom-0 left-0 right-0 h-[64px] min-h-[64px] max-h-[64px] z-40 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between h-full px-6">
              {/* Back Button */}
              <div 
                className="bg-white relative rounded-[4px] cursor-pointer"
                onClick={onBack}
              >
                <div aria-hidden="true" className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-[4px]" />
                <div className="flex flex-row items-center justify-end relative size-full">
                  <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                    <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#4a5565] text-[12px] text-nowrap">
                      <p className="leading-[20px] whitespace-pre text-[14px]">Back</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-3">
                {/* Cancel Button */}
                <div 
                  className="bg-white relative rounded-[4px] cursor-pointer"
                  onClick={handleCancel}
                >
                  <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[12px] text-nowrap">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Cancel</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next/Save Button */}
                {currentProductIndex === allTransferDetails.length - 1 ? (
                  // Last product - Show Save button
                  <div 
                    className={`bg-[#095192] relative rounded-[4px] ${!validateSerialNumbers() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onClick={!validateSerialNumbers() ? undefined : handleConfirm}
                  >
                    <div className="flex flex-row items-center justify-end relative size-full">
                      <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                        <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-white">
                          <p className="leading-[20px] whitespace-pre text-[14px]">Save</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Not last product - Show Next button
                  <div 
                    className={`bg-[#095192] relative rounded-[4px] ${!validateSerialNumbers() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onClick={!validateSerialNumbers() ? undefined : handleNext}
                  >
                    <div className="flex flex-row items-center justify-end relative size-full">
                      <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                        <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-white">
                          <p className="leading-[20px] whitespace-pre text-[14px]">Next</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}