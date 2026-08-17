import React from 'react';
import { SourcePick, productKeysForBin } from '../utils/sourcePicks';
import { Search } from 'lucide-react';
import ShelfLayout from './ShelfLayout';
import { isFridgeDoor } from '../utils/doorUtils';
import { selectionBadge } from '../utils/binProducts';

interface ShelvesSectionProps {
  currentShelves: any[];
  searchQuery: string;
  // Bins lit because the operator asked for those bins by name. Held as ids, not as a query — a bin
  // name is only unique within its door, so a query would light every namesake. See useInventoryState.
  binHighlight?: { binIds: string[]; query: string } | null;
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
  // Optional: only `Add Move To Bin`'s overlay has committed targets to name.
  committedChangeAllocationTargetBins?: string[];
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

/**
 * A shelf's name, and — for a fridge only — its selection badge opposite it.
 *
 * The badge sits out here because a fridge card has no bin header for it to sit under: one pooled bin has
 * nothing to be told apart from, so BinCard omits the header, and a badge pinned to the card's top-right
 * landed over the first product in the right-hand column and read as that product's label rather than the
 * bin's. Every other bin keeps its badge on the card, where its own header anchors it.
 *
 * The text comes from `selectionBadge`, the same helper BinCard reads, so the two placements cannot drift
 * into saying different things. Extracted because the two shelf lists below (filtered and unfiltered)
 * would otherwise each need their own copy of this.
 */
function ShelfHeading({
  shelf,
  selectedDoor,
  changeAllocationSourceBins,
  changeAllocationTargetBins,
  committedChangeAllocationTargetBins = [],
  moveMode,
  sourceProductPicks
}: {
  shelf: any;
  selectedDoor: string | null;
  changeAllocationSourceBins: string[];
  changeAllocationTargetBins: string[];
  committedChangeAllocationTargetBins?: string[];
  moveMode?: 'bin' | 'product' | null;
  sourceProductPicks: SourcePick[];
}) {
  // One pooled bin per fridge shelf, so that bin is what the badge describes.
  const bin = isFridgeDoor(selectedDoor || '') ? shelf.bins?.[0] : undefined;
  const badge = bin
    ? selectionBadge({
        isSource: changeAllocationSourceBins.includes(bin.id),
        isTarget: changeAllocationTargetBins.includes(bin.id),
        isCommittedTarget: committedChangeAllocationTargetBins.includes(bin.id),
        moveMode,
        pickedCount: productKeysForBin(sourceProductPicks, bin.id).length
      })
    : null;

  return (
    <div className="px-3 mb-3 flex items-baseline justify-between gap-3">
      <h3 className="font-semibold">{shelf.name}</h3>
      {badge && (
        <span className={`${badge.className} text-[14px] leading-[16px] text-nowrap`}>{badge.text}</span>
      )}
    </div>
  );
}

export default function ShelvesSection({
  currentShelves,
  searchQuery,
  binHighlight = null,
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
  committedChangeAllocationTargetBins = [],
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
            <ShelfHeading
              shelf={shelf}
              selectedDoor={selectedDoor}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              committedChangeAllocationTargetBins={committedChangeAllocationTargetBins}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
            />

            <ShelfLayout
              shelf={shelf}
              selectedDoor={selectedDoor}
              selectedBin={selectedBin}
              showBinInventory={showBinInventory}
              highlightAvailableBins={highlightAvailableBins}
              searchQuery={searchQuery}
              binHighlight={binHighlight}
              selectedBinsForAssignment={selectedBinsForAssignment}
              changeAllocationMode={changeAllocationMode}
              changeAllocationStep={changeAllocationStep}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
              onSelectSourceProduct={onSelectSourceProduct}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              committedChangeAllocationTargetBins={committedChangeAllocationTargetBins}
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
            <ShelfHeading
              shelf={shelf}
              selectedDoor={selectedDoor}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              committedChangeAllocationTargetBins={committedChangeAllocationTargetBins}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
            />

            <ShelfLayout
              shelf={shelf}
              selectedDoor={selectedDoor}
              selectedBin={selectedBin}
              showBinInventory={showBinInventory}
              highlightAvailableBins={highlightAvailableBins}
              searchQuery={searchQuery}
              binHighlight={binHighlight}
              selectedBinsForAssignment={selectedBinsForAssignment}
              changeAllocationMode={changeAllocationMode}
              changeAllocationStep={changeAllocationStep}
              moveMode={moveMode}
              sourceProductPicks={sourceProductPicks}
              onSelectSourceProduct={onSelectSourceProduct}
              changeAllocationSourceBins={changeAllocationSourceBins}
              changeAllocationTargetBins={changeAllocationTargetBins}
              committedChangeAllocationTargetBins={committedChangeAllocationTargetBins}
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