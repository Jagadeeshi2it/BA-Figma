import React from 'react';
import BinCard from './BinCard';
import { Shelf, Bin } from '../types';
import { 
  isDoubleDoor, 
  isUniqueDoor, 
  isFridgeDoor,
  isFloorDoor,
  splitBinsIntoRows, 
  calculateAvailableSlots, 
  getSlotsPerShelf,
  binMatchesSearch
} from '../utils/doorUtils';

interface ShelfLayoutProps {
  shelf: Shelf;
  selectedDoor: string;
  selectedBin: string | null;
  showBinInventory: boolean;
  highlightAvailableBins: boolean;
  searchQuery?: string;
  selectedBinsForAssignment?: string[];
  changeAllocationMode?: boolean;
  changeAllocationStep?: 1 | 2;
  changeAllocationSourceBins?: string[];
  changeAllocationTargetBins?: string[];
  showUnallocatedProducts?: boolean;
  onBinClick: (binId: string) => void;
  onProductClick?: (product: any, location: any) => void;
}

export default function ShelfLayout({
  shelf,
  selectedDoor,
  selectedBin,
  showBinInventory,
  highlightAvailableBins,
  searchQuery = "",
  selectedBinsForAssignment = [],
  changeAllocationMode = false,
  changeAllocationStep = 1,
  changeAllocationSourceBins = [],
  changeAllocationTargetBins = [],
  showUnallocatedProducts = false,
  onBinClick,
  onProductClick
}: ShelfLayoutProps) {

  // Render unique door layout (5x5 grid) - only show actual bins, no placeholders
  const renderUniqueLayout = (shelf: Shelf) => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(null));
    
    shelf.bins.forEach(bin => {
      if (bin.gridPosition) {
        const { x, y, width, height } = bin.gridPosition;
        for (let row = y; row < y + height; row++) {
          for (let col = x; col < x + width; col++) {
            if (row < 5 && col < 5) {
              grid[row][col] = bin;
            }
          }
        }
      }
    });

    return (
      <div className="grid grid-cols-5 gap-2">
        {grid.flat().map((bin, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          
          if (bin && bin.gridPosition) {
            if (bin.gridPosition.x === col && bin.gridPosition.y === row) {
              const { width, height } = bin.gridPosition;
              return (
                <BinCard
                  key={bin.id}
                  bin={bin}
                  isSelected={selectedBin === bin.id && showBinInventory}
                  highlightAvailable={highlightAvailableBins}
                  highlightSearch={binMatchesSearch(bin, searchQuery)}
                  isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
                  isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
                  isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
                  changeAllocationMode={changeAllocationMode}
                  showUnallocatedProducts={showUnallocatedProducts}
                  onClick={onBinClick}
                  onProductClick={onProductClick}
                  selectedDoor={selectedDoor}
                  searchQuery={searchQuery}
                  style={{
                    gridColumn: `span ${width}`,
                    gridRow: `span ${height}`,
                    minHeight: `${height * 140 + (height - 1) * 8}px`
                  }}
                />
              );
            }
            return null;
          }
          
          // For unique doors, don't show "No Bin" placeholders - just return empty div to maintain grid
          return <div key={`empty-${index}`} className="min-h-[140px]" />;
        })}
      </div>
    );
  };

  const renderRowBins = (bins: Bin[], rowName: string) => (
    <div className="grid grid-cols-5 gap-2">
      {bins.map((bin) => (
        <BinCard
          key={bin.id}
          bin={bin}
          isSelected={selectedBin === bin.id && showBinInventory}
          highlightAvailable={highlightAvailableBins}
          highlightSearch={binMatchesSearch(bin, searchQuery)}
          isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
          isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
          isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
          changeAllocationMode={changeAllocationMode}
          showUnallocatedProducts={showUnallocatedProducts}
          onClick={onBinClick}
          onProductClick={onProductClick}
          selectedDoor={selectedDoor}
          searchQuery={searchQuery}
          className={bin.size === 'double' ? 'col-span-2' : 'col-span-1'}
        />
      ))}
      
      {/* For double doors, show "No Bin" for empty slot positions in this row */}
      {Array.from({ length: calculateAvailableSlots(bins, 5) }, (_, i) => (
        <div
          key={`${rowName}-available-${i}`}
          className="min-h-[140px] border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] rounded-lg flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500">No Bin</div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render fridge layout (single large bin spanning full width)
  if (isFridgeDoor(selectedDoor)) {
    return (
      <div className="w-full">
        {shelf.bins.map((bin) => (
          <BinCard
            key={bin.id}
            bin={bin}
            isSelected={selectedBin === bin.id && showBinInventory}
            highlightAvailable={highlightAvailableBins}
            highlightSearch={binMatchesSearch(bin, searchQuery)}
            isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
            isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
            isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
            changeAllocationMode={changeAllocationMode}
            showUnallocatedProducts={showUnallocatedProducts}
            onClick={onBinClick}
            onProductClick={onProductClick}
            selectedDoor={selectedDoor}
            searchQuery={searchQuery}
            style={{
              width: bin.style?.width || '100%',
              height: bin.style?.height || '800px'
            }}
          />
        ))}
      </div>
    );
  }

  // Render floor layout (single large bin spanning full width) - Emergency Kit
  if (isFloorDoor(selectedDoor)) {
    return (
      <div className="w-full">
        {shelf.bins.map((bin) => (
          <BinCard
            key={bin.id}
            bin={bin}
            isSelected={selectedBin === bin.id && showBinInventory}
            highlightAvailable={highlightAvailableBins}
            highlightSearch={binMatchesSearch(bin, searchQuery)}
            isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
            isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
            isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
            changeAllocationMode={changeAllocationMode}
            showUnallocatedProducts={showUnallocatedProducts}
            onClick={onBinClick}
            onProductClick={onProductClick}
            selectedDoor={selectedDoor}
            searchQuery={searchQuery}
            style={{
              width: bin.style?.width || '100%',
              height: bin.style?.height || '800px'
            }}
          />
        ))}
      </div>
    );
  }

  if (isUniqueDoor(selectedDoor)) {
    return renderUniqueLayout(shelf);
  } 
  
  if (isDoubleDoor(selectedDoor)) {
    const [row1Bins, row2Bins] = splitBinsIntoRows(shelf.bins, 5);
    return (
      <div className="space-y-2">
        {renderRowBins(row1Bins, 'row1')}
        {renderRowBins(row2Bins, 'row2')}
      </div>
    );
  }

  // Single door layout
  return (
    <div className="grid grid-cols-5 gap-2">
      {shelf.bins.map((bin) => (
        <BinCard
          key={bin.id}
          bin={bin}
          isSelected={selectedBin === bin.id && showBinInventory}
          highlightAvailable={highlightAvailableBins}
          highlightSearch={binMatchesSearch(bin, searchQuery)}
          isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
          isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
          isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
          changeAllocationMode={changeAllocationMode}
          showUnallocatedProducts={showUnallocatedProducts}
          onClick={onBinClick}
          onProductClick={onProductClick}
          selectedDoor={selectedDoor}
          searchQuery={searchQuery}
          className={bin.size === 'double' ? 'col-span-2' : 'col-span-1'}
        />
      ))}
      
      {/* For single doors, show "No Bin" for available slots */}
      {Array.from({ length: calculateAvailableSlots(shelf.bins, getSlotsPerShelf(selectedDoor)) }, (_, i) => (
        <div
          key={`available-${i}`}
          className="min-h-[140px] border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] rounded-lg flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500">No Bin</div>
          </div>
        </div>
      ))}
    </div>
  );
}