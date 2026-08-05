import React from 'react';
import { SourcePick, productKeysForBin } from '../utils/sourcePicks';
import BinCard from './BinCard';
import { Shelf, Bin } from '../types';
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
  // Which kind of move is running. In a Bin move's source step the search is a locator rather than a
  // record of what's committed, which changes who the highlight reaches — see resolveSearchQuery.
  moveMode?: 'bin' | 'product' | null;
  // The (bin, product) pairs a Move by Product has picked — each bin card gets its own slice.
  sourceProductPicks?: SourcePick[];
  changeAllocationSourceBins?: string[];
  changeAllocationTargetBins?: string[];
  showUnallocatedProducts?: boolean;
  onBinClick: (binId: string) => void;
  onProductClick?: (product: any, location: any) => void;
  // Move by Product, source step: a tap on a product row picks it out of that bin. ShelfLayout knows
  // the bin, so it supplies the id and BinCard only reports which product was tapped.
  onSelectSourceProduct?: (binId: string, product: any) => void;
  allProductsBinId?: string | null;
  onOpenAllProducts?: (binId: string) => void;
  onCloseAllProducts?: () => void;
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
  moveMode = null,
  sourceProductPicks = [],
  changeAllocationSourceBins = [],
  changeAllocationTargetBins = [],
  showUnallocatedProducts = false,
  onBinClick,
  onProductClick,
  onSelectSourceProduct,
  allProductsBinId = null,
  onOpenAllProducts,
  onCloseAllProducts
}: ShelfLayoutProps) {

  // A Product move gathers products, so the source step turns the product rows into the pickable
  // thing and leaves the bin itself inert. Only step 1: the target is always a whole bin, so once the
  // user is choosing targets the rows go back to being text and the bin becomes the control again.
  const canPickSourceProduct = changeAllocationMode && moveMode === 'product' && changeAllocationStep === 1;

  // What a bin should be highlighted against. A bin already committed as a source or target keeps
  // the real query, so the one product that earned it that status still gets its blue/green text.
  // Any other bin gets none at all — in change allocation mode there is no longer a way to acquire a
  // non-empty query without also being added to one of those two arrays (every commit path adds
  // both together), so a bin here holding a leftover query and no source/target flag can only mean
  // one thing: it used to be selected and was removed from the panel afterwards, while the query
  // itself survives because another bin still needs it. Showing that leftover as "found by search"
  // would read as the opposite of what just happened. Outside change allocation mode this is just
  // the literal typed search, unchanged.
  const resolveSearchQuery = (bin: Bin): string => {
    if (!changeAllocationMode) return searchQuery;
    // A Bin move's source step uses the search as a LOCATOR: "Highlight in Bin" marks where a product
    // lives so the user can find the bin and then tap it. That bin is deliberately not selected yet,
    // so gating the highlight on the selection blanked it entirely — the button claimed to highlight
    // and nothing lit up. Here the query has to reach every matching bin.
    if (moveMode === 'bin' && changeAllocationStep === 1) return searchQuery;
    // Otherwise the highlight is a record of what's already committed, so it only reaches the bins in
    // the selection: a leftover query must not tint a bin that was taken back out.
    const isSource = changeAllocationSourceBins.includes(bin.id);
    const isTarget = changeAllocationTargetBins.includes(bin.id);
    return isSource || isTarget ? searchQuery : '';
  };

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
                  highlightSearch={binMatchesSearch(bin, resolveSearchQuery(bin))}
                  isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
                  isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
                  isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
                  changeAllocationMode={changeAllocationMode}
                  showUnallocatedProducts={showUnallocatedProducts}
                  onClick={onBinClick}
                  onProductClick={onProductClick}
                  canPickSourceProduct={canPickSourceProduct}
                  moveMode={moveMode}
                  pickedProductKeys={productKeysForBin(sourceProductPicks, bin.id)}
                  onSelectSourceProduct={product => onSelectSourceProduct?.(bin.id, product)}
                  allProductsBinId={allProductsBinId}
                  onOpenAllProducts={onOpenAllProducts}
                  onCloseAllProducts={onCloseAllProducts}
                  selectedDoor={selectedDoor}
                  searchQuery={resolveSearchQuery(bin)}
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
            highlightSearch={binMatchesSearch(bin, resolveSearchQuery(bin))}
            isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
            isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
            isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
            changeAllocationMode={changeAllocationMode}
            showUnallocatedProducts={showUnallocatedProducts}
            onClick={onBinClick}
            onProductClick={onProductClick}
                  canPickSourceProduct={canPickSourceProduct}
                  moveMode={moveMode}
                  pickedProductKeys={productKeysForBin(sourceProductPicks, bin.id)}
                  onSelectSourceProduct={product => onSelectSourceProduct?.(bin.id, product)}
            allProductsBinId={allProductsBinId}
            onOpenAllProducts={onOpenAllProducts}
            onCloseAllProducts={onCloseAllProducts}
            selectedDoor={selectedDoor}
            searchQuery={resolveSearchQuery(bin)}
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
            highlightSearch={binMatchesSearch(bin, resolveSearchQuery(bin))}
            isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
            isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
            isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
            changeAllocationMode={changeAllocationMode}
            showUnallocatedProducts={showUnallocatedProducts}
            onClick={onBinClick}
            onProductClick={onProductClick}
                  canPickSourceProduct={canPickSourceProduct}
                  moveMode={moveMode}
                  pickedProductKeys={productKeysForBin(sourceProductPicks, bin.id)}
                  onSelectSourceProduct={product => onSelectSourceProduct?.(bin.id, product)}
            allProductsBinId={allProductsBinId}
            onOpenAllProducts={onOpenAllProducts}
            onCloseAllProducts={onCloseAllProducts}
            selectedDoor={selectedDoor}
            searchQuery={resolveSearchQuery(bin)}
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
          highlightSearch={binMatchesSearch(bin, resolveSearchQuery(bin))}
          isSelectedForAssignment={selectedBinsForAssignment.includes(bin.id)}
          isChangeAllocationSource={changeAllocationSourceBins.includes(bin.id)}
          isChangeAllocationTarget={changeAllocationTargetBins.includes(bin.id)}
          changeAllocationMode={changeAllocationMode}
          showUnallocatedProducts={showUnallocatedProducts}
          onClick={onBinClick}
          onProductClick={onProductClick}
                  canPickSourceProduct={canPickSourceProduct}
                  moveMode={moveMode}
                  pickedProductKeys={productKeysForBin(sourceProductPicks, bin.id)}
                  onSelectSourceProduct={product => onSelectSourceProduct?.(bin.id, product)}
          allProductsBinId={allProductsBinId}
          onOpenAllProducts={onOpenAllProducts}
          onCloseAllProducts={onCloseAllProducts}
          selectedDoor={selectedDoor}
          searchQuery={resolveSearchQuery(bin)}
          className={bin.size === 'double' ? 'col-span-2' : 'col-span-1'}
        />
      ))}
      
      {/* For single doors, show "No Bin" for available slots */}
      {Array.from({ length: calculateAvailableSlots(shelf.bins, getSlotsPerShelf(selectedDoor)) }, (_, i) => (
        <div
          key={`available-${i}`}
          className="min-h-[140px] border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] rounded-[4px] flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500">No Bin</div>
          </div>
        </div>
      ))}
    </div>
  );
}