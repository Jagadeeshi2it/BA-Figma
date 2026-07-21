import React from 'react';
import { Package } from 'lucide-react';
import { Product, Bin, DoorShelfConfig } from '../types';
import { getDoorName } from '../utils/changeAllocationUtils';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import svgPaths from "../imports/svg-jzj424bgss";

interface BinLocationInfo {
  binId: string;
  binName: string;
  doorName: string;
  productId: string;
  quantity: number;
}

interface ProductCentricCardProps {
  product: Product;
  binLocations: Array<{
    binId: string;
    binName: string;
    doorName: string;
    productId: string;
    quantity: number;
  }>;
  onMoveFromBin: (productId: string, binId: string) => void;
  hasMovedFromBin: (productId: string, binId: string) => boolean;
  hasOnlyOneTargetBin?: boolean;
  onMoveAll?: () => void;
}

export default function ProductCentricCard({
  product,
  binLocations,
  onMoveFromBin,
  hasMovedFromBin,
  hasOnlyOneTargetBin,
  onMoveAll
}: ProductCentricCardProps) {
  // Check if all locations have been moved
  const allMoved = binLocations.every(loc => hasMovedFromBin(loc.productId, loc.binId));
  
  return (
    <div className="bg-white rounded-[14px] border border-[#e5e7eb] w-full">
      {/* Bin Locations List */}
      <div className="p-4">
        {/* Move All button - show when there are multiple source bins */}
        {onMoveAll && binLocations.length > 1 && (
          <div className="mb-4 pb-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px]">
                {binLocations.length} {binLocations.length === 1 ? 'Bin' : 'Bins'}
              </span>
            </div>
            <button
              onClick={onMoveAll}
              disabled={allMoved}
              className={`h-[36px] px-6 rounded-[4px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-center ${
                allMoved 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#095192] text-white cursor-pointer hover:bg-[#074070]'
              }`}
            >
              {allMoved ? 'All Moved' : 'Move All'}
            </button>
          </div>
        )}
        
        <div className="space-y-3">
          {binLocations.map((binLocation, index) => {
            const hasMoved = hasMovedFromBin(binLocation.productId, binLocation.binId);
            
            return (
              <div 
                key={`${binLocation.binId}-${index}`}
                className="flex items-center justify-between"
              >
                {/* Left side - Bin info */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#4a5565]">
                      Door:
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
                      {binLocation.doorName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#4a5565]">
                      Bin:
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
                      {binLocation.binName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#4a5565]">
                      {pluralizeUnit(product.unit, binLocation.quantity)}:
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#020817]">
                      {binLocation.quantity}
                    </span>
                  </div>
                </div>
                
                {/* Right side - Move button */}
                <button
                  onClick={() => onMoveFromBin(binLocation.productId, binLocation.binId)}
                  disabled={hasMoved}
                  className={`h-[32px] px-4 rounded-[4px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-center ${
                    hasMoved 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#095192] text-white cursor-pointer hover:bg-[#074070]'
                  }`}
                >
                  {hasMoved ? 'Moved' : 'Move Qty'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}