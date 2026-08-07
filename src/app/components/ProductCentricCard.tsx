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
    <div className="bg-white rounded-[4px] border border-[#e5e7eb] w-full">
      {/* Bin Locations List */}
      <div className="p-4">
        {/* Select All — only worth offering when there is more than one location to pick */}
        {onMoveAll && binLocations.length > 1 && (
          <div className="mb-4 pb-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px]">
                {binLocations.length} {binLocations.length === 1 ? 'Bin' : 'Bins'}
              </span>
            </div>
            <button
              onClick={allMoved ? undefined : onMoveAll}
              disabled={allMoved}
              // Dimmed, not recoloured — same rule as the per-row Select below it.
              className={`h-8 px-3 rounded-[4px] font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] text-center border bg-white border-[#095192] text-[#095192] ${
                allMoved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F1F6FA]'
              }`}
            >
              {allMoved ? 'All selected' : 'Select All'}
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
                  {/* One bolded location, written exactly as the target card writes it — `Door 2 - Bin
                      4C`. The labelled `Door: … Bin: …` pair said in two fields what the rest of the
                      app says in one string, and the two cards face each other in this modal, so a
                      location that reads differently on each side reads as a different location. The
                      quantity keeps its label: it is a figure, and a bare number beside a bin name
                      would be ambiguous. */}
                  <div className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#020817]">
                    {binLocation.doorName} - {binLocation.binName}
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
                
                {/* Stays put once picked, dimmed rather than gone — a row losing its control looks
                    like the control failed, not like the work is done. */}
                <button
                  // The same Demo Mode anchor the bin-centric card's Select carries, for the same
                  // reason those two buttons look alike: they render in the same column and differ
                  // only by which kind of move is running, so a walkthrough asking for "the Select in
                  // Review" must reach whichever one is on screen. Only the un-taken rows carry it.
                  data-demo={hasMoved ? undefined : 'review-select-product'}
                  onClick={hasMoved ? undefined : () => onMoveFromBin(binLocation.productId, binLocation.binId)}
                  disabled={hasMoved}
                  // Secondary, matching Select on the bin-centric card: the two render in the same
                  // column depending on the move kind, so they can't differ in weight.
                  className={`h-8 px-3 rounded-[4px] font-['Inter:Regular',_sans-serif] font-normal text-[14px] leading-[20px] text-center border transition-colors bg-white text-[#095192] border-[#095192] ${
                    hasMoved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F1F6FA]'
                  }`}
                >
                  {hasMoved ? 'Selected' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}