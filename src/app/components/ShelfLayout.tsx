import React from 'react';
import BinCard from './BinCard';
import { Shelf } from '../types';
import {
  isDoubleDoor,
  isUniqueDoor,
  isFridgeDoor,
  isFloorDoor,
  calculateAvailableSlots,
  getSlotsPerShelf,
  binMatchesSearch
} from '../utils/doorUtils';
import { BOTTOM_DOOR_GRID, DOUBLE_DOOR_GRID } from '../utils/shelfLayoutConfig';

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

  // Render a slotted grid shelf: double doors are 2 rows x 5 cols, bottom doors 5x5.
  // Placement comes straight from bin.gridPosition and is applied as explicit start
  // lines rather than relying on grid auto-flow, so a bin can never drift into the
  // wrong cell if the bin array happens not to be in row-major order.
  const renderGridLayout = (shelf: Shelf, rows: number, cols: number) => {
    const placedBins = shelf.bins.filter(bin => bin.gridPosition);

    return (
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // Spanning bins get their height from the rows they cover, so a 3-row
          // bin ends up 3 * 140px plus the gaps between them.
          gridTemplateRows: `repeat(${rows}, minmax(140px, auto))`
        }}
      >
        {placedBins.map((bin) => {
          const { x, y, width, height } = bin.gridPosition!;
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
                    gridColumn: `${x + 1} / span ${width}`,
                    gridRow: `${y + 1} / span ${height}`
                  }}
                />
              );
        })}
      </div>
    );
  };

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
            // Virtual-cabinet bins hug their contents: no height at all, so the card is as tall
            // as the products in it. A fixed height here made the product grid scroll inside the
            // card; BinCard's own min-h-[140px] still keeps an empty bin from collapsing.
            style={{ width: bin.style?.width || '100%' }}
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

  // Both grid door types need per-bin gridPosition. If a shelf somehow arrives
  // without it (an unrecognised bin count that shelfLayoutConfig left alone), fall
  // through to the flat layout below — an unstyled shelf is recoverable, a shelf
  // that silently renders zero bins is not.
  const hasGridPlacement = shelf.bins.some(bin => bin.gridPosition);

  if (isUniqueDoor(selectedDoor) && hasGridPlacement) {
    return renderGridLayout(shelf, BOTTOM_DOOR_GRID.rows, BOTTOM_DOOR_GRID.cols);
  }

  if (isDoubleDoor(selectedDoor) && hasGridPlacement) {
    return renderGridLayout(shelf, DOUBLE_DOOR_GRID.rows, DOUBLE_DOOR_GRID.cols);
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