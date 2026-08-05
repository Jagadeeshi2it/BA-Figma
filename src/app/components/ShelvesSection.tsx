import React from 'react';
import { SourcePick } from '../utils/sourcePicks';
import { Search } from 'lucide-react';
import ShelfLayout from './ShelfLayout';

interface ShelvesSectionProps {
  currentShelves: any[];
  searchQuery: string;
  searchMatchCount: number;
  selectedDoor: string | null;
  selectedBin: string | null;
  showBinInventory: boolean;
  highlightAvailableBins: boolean;
  selectedBinsForAssignment: string[];
  changeAllocationMode: boolean;
  changeAllocationStep: 1 | 2;
  // Passed straight through to ShelfLayout, which needs it to decide whether the search highlight is
  // a locator (Bin move, source step) or a record of the committed selection.
  moveMode?: 'bin' | 'product' | null;
  // The (bin, product) pairs a Move by Product has picked; each bin card counts its own slice.
  sourceProductPicks?: SourcePick[];
  changeAllocationSourceBins: string[];
  changeAllocationTargetBins: string[];
  showUnallocatedProducts: boolean;
  onBinClick: (binId: string, doorKey: string) => void;
  onProductClick: (product: any, location: any) => void;
  // Move by Product, source step: picks a product out of a specific bin from the canvas.
  onSelectSourceProduct?: (binId: string, product: any) => void;
  // "All products" modal state is owned by App so it outlives the product detail page.
  allProductsBinId?: string | null;
  onOpenAllProducts?: (binId: string) => void;
  onCloseAllProducts?: () => void;
}

export default function ShelvesSection({
  currentShelves,
  searchQuery,
  searchMatchCount,
  selectedDoor,
  selectedBin,
  showBinInventory,
  highlightAvailableBins,
  selectedBinsForAssignment,
  changeAllocationMode,
  changeAllocationStep,
  moveMode,
  sourceProductPicks = [],
  changeAllocationSourceBins,
  changeAllocationTargetBins,
  showUnallocatedProducts,
  onBinClick,
  onProductClick,
  onSelectSourceProduct,
  allProductsBinId = null,
  onOpenAllProducts,
  onCloseAllProducts,
}: ShelvesSectionProps) {
  return (
    <div className="space-y-6">
      {currentShelves.length > 0 ? (
        currentShelves.map((shelf) => (
          <div key={shelf.id}>
            <div className="px-3 mb-3">
              <h3 className="font-semibold">{shelf.name}</h3>
            </div>

            <ShelfLayout
              shelf={shelf}
              selectedDoor={selectedDoor}
              selectedBin={selectedBin}
              showBinInventory={showBinInventory}
              highlightAvailableBins={highlightAvailableBins}
              searchQuery={searchQuery}
              selectedBinsForAssignment={selectedBinsForAssignment}
              changeAllocationMode={changeAllocationMode}
              changeAllocationStep={changeAllocationStep}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
              onSelectSourceProduct={onSelectSourceProduct}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              showUnallocatedProducts={showUnallocatedProducts}
              onBinClick={onBinClick}
              onProductClick={onProductClick}
              allProductsBinId={allProductsBinId}
              onOpenAllProducts={onOpenAllProducts}
              onCloseAllProducts={onCloseAllProducts}
            />
          </div>
        ))
      ) : searchQuery.trim() && searchMatchCount === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600">
            Try searching for a different product name, bin, or NDC code.
          </p>
        </div>
      ) : (
        currentShelves.map((shelf) => (
          <div key={shelf.id}>
            <div className="px-3 mb-3">
              <h3 className="font-semibold">{shelf.name}</h3>
            </div>

            <ShelfLayout
              shelf={shelf}
              selectedDoor={selectedDoor}
              selectedBin={selectedBin}
              showBinInventory={showBinInventory}
              highlightAvailableBins={highlightAvailableBins}
              searchQuery={searchQuery}
              selectedBinsForAssignment={selectedBinsForAssignment}
              changeAllocationMode={changeAllocationMode}
              changeAllocationStep={changeAllocationStep}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
              onSelectSourceProduct={onSelectSourceProduct}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              showUnallocatedProducts={showUnallocatedProducts}
              onBinClick={onBinClick}
              onProductClick={onProductClick}
              allProductsBinId={allProductsBinId}
              onOpenAllProducts={onOpenAllProducts}
              onCloseAllProducts={onCloseAllProducts}
            />
          </div>
        ))
      )}
    </div>
  );
}