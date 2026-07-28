import React, { memo } from 'react';
import { Button } from './ui/button';
import { ProductSearchResult, getBinIdsForProduct } from '../utils/productSearchUtils';

interface SearchDropdownProps {
  searchResults: ProductSearchResult[];
  isVisible: boolean;
  changeAllocationMode?: boolean;
  changeAllocationStep?: 1 | 2;
  // Bins already picked as source/target (whichever step we're on) — matching results are
  // dropped from the list so it only ever shows what's still left to pick.
  excludeBinIds?: string[];
  // View-mode counterpart to excludeBinIds: products already clicked/selected from this same
  // search, so the list shrinks the same way it does in change allocation mode.
  viewedProductKeys?: string[];
  onSelectAllBins: (binIds: string[], productName: string) => void;
  onSelectSourceBins?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  onSelectTargetBins?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  onProductClick?: (productName: string, ndc: string, inventoryType: string) => void;
  onProductsViewed?: (keys: string[]) => void;
  // Jump the main view to wherever the just-picked product actually lives.
  onDoorClick?: (doorName: string) => void;
  onScrollToBin?: (binId: string) => void;
  // Bins already taken as source. During step 2 they can't become targets, so they're skipped
  // when choosing which location to jump to.
  sourceBinIds?: string[];
  onClose: () => void;
}

const getResultKey = (result: ProductSearchResult) => `${result.ndc}-${result.inventoryType}`;

const SearchDropdown = memo(function SearchDropdown({
  searchResults,
  isVisible,
  changeAllocationMode = false,
  changeAllocationStep = 1,
  excludeBinIds = [],
  viewedProductKeys = [],
  onSelectAllBins,
  onSelectSourceBins,
  onSelectTargetBins,
  onProductClick,
  onProductsViewed,
  onDoorClick,
  onScrollToBin,
  sourceBinIds = [],
  onClose
}: SearchDropdownProps) {
  if (!isVisible || searchResults.length === 0) {
    return null;
  }

  // A result is "done" once every bin it lives in has already been picked — drop it so the
  // list only shows products that still have something left to select. In view mode there's
  // no bin selection to check against, so a product is "done" once it's simply been clicked.
  const visibleResults = changeAllocationMode
    ? searchResults.filter(result => !result.binLocations.every(loc => excludeBinIds.includes(loc.binId)))
    : searchResults.filter(result => !viewedProductKeys.includes(getResultKey(result)));

  const buildHighlightQuery = (products: ProductSearchResult[]) =>
    products
      .map(result => [result.name, result.ndc, result.inventoryType].filter(Boolean).join(', '))
      .join(' | ');

  // Take the user to where the picked product actually lives. A product can span several bins and
  // doors, so aim at one of them — the first, matching view mode. Step 2 skips locations already
  // taken as source bins, since those are the ones that can't become targets.
  const jumpToProduct = (result?: ProductSearchResult) => {
    if (!result) return;
    const selectable = changeAllocationMode && changeAllocationStep === 2
      ? result.binLocations.filter(loc => !sourceBinIds.includes(loc.binId))
      : result.binLocations;
    const location = selectable[0] || result.binLocations[0];
    if (!location) return;
    onDoorClick?.(location.doorName);
    onScrollToBin?.(location.binId);
  };

  const handleProductClick = (result: ProductSearchResult) => {
    if (onProductClick) {
      // Don't close in change allocation mode - let user see the highlighted bins
      if (changeAllocationMode) {
        onProductClick(result.name, result.ndc, result.inventoryType);
        jumpToProduct(result);
        return;
      }
      onProductClick(result.name, result.ndc, result.inventoryType);
      // Replaces (not adds to) the previous pick — switching products un-hides whatever
      // was selected before, since only one product is "the" selection at a time now.
      onProductsViewed?.([getResultKey(result)]);
      jumpToProduct(result);
      onClose();
    }
  };

  const handleSelectAll = () => {
    if (visibleResults.length === 0) return;

    if (changeAllocationMode) {
      // Actually select every matching bin as source/target, not just preview-highlight it.
      const allBinIds = Array.from(new Set(visibleResults.flatMap(getBinIdsForProduct)));
      const productNames = visibleResults.map(result => result.name).join(', ');
      // Same OR-group query shape as the view-only "Select All" below, so every selected
      // product's row (not just its bin) gets highlighted.
      const highlightQuery = buildHighlightQuery(visibleResults);
      if (changeAllocationStep === 1) {
        onSelectSourceBins?.(allBinIds, productNames, highlightQuery);
      } else {
        onSelectTargetBins?.(allBinIds, productNames, highlightQuery);
      }
      // Several products just got selected across who knows how many doors — land on the first
      // one's bin so the selection isn't left off-screen.
      jumpToProduct(visibleResults[0]);
      // Everything visible just got added — nothing left to show, so close instead of
      // leaving an empty dropdown hanging open.
      onClose();
      return;
    }

    // Normal mode: highlight every matching product in this batch.
    if (onProductClick) {
      onProductClick(buildHighlightQuery(visibleResults), '', '');
    }
    // Replaces the previous pick, same as a single click — see handleProductClick.
    onProductsViewed?.(visibleResults.map(getResultKey));
    jumpToProduct(visibleResults[0]);
    onClose();
  };

  // Determine unit based on total quantity
  const getUnit = (quantity: number) => {
    return quantity === 1 ? 'vial' : 'vials';
  };

  // Change Allocation selects/moves bins, not products — a product can span several bins,
  // so the "Select All" count should reflect what's actually being selected.
  const totalBinCount = new Set(visibleResults.flatMap(getBinIdsForProduct)).size;

  // Nothing left to offer means every match is already in the selection — name them, so the user
  // can see the product was found rather than reading the empty list as "not stocked".
  const names = [...new Set(searchResults.map(result => result.name))];
  const alreadySelectedMessage = names.length <= 3
    ? `Already selected: ${names.join(', ')}`
    : `Already selected: ${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#bcc3cd] rounded-[4px] shadow-lg z-[60] max-h-96 overflow-y-auto">
      <div className="p-3">
        <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#9fa9b7] text-xs text-left mb-3">
          <p className="block leading-[16px] text-[14px]">
            {/* The product WAS found — every bin holding it is just already picked, so there is
                nothing left to select. Saying "0 matching products" read as "this drug isn't here". */}
            {visibleResults.length === 0 && searchResults.length > 0
              ? `Found ${searchResults.length} matching product${searchResults.length !== 1 ? 's' : ''}, none left to add`
              : `Found ${visibleResults.length} matching product${visibleResults.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {visibleResults.length === 0 ? (
          <div className="text-[13px] text-[#64748b] text-center py-2">
            {changeAllocationMode ? alreadySelectedMessage : "You've viewed all matching products."}
          </div>
        ) : (
        <>
        {/* Select All Button */}
        <Button
          onClick={handleSelectAll}
          className="w-full bg-[#095192] hover:bg-[#074080] text-white text-[14px] h-10 rounded-[4px] mb-3"
        >
          {changeAllocationMode
            ? `Select All as ${changeAllocationStep === 1 ? 'Source' : 'Target'} (${totalBinCount} bin${totalBinCount !== 1 ? 's' : ''})`
            : `Select All (${visibleResults.length} product${visibleResults.length !== 1 ? 's' : ''})`
          }
        </Button>

        {visibleResults.map((result, index) => (
          <div 
            key={`${result.ndc}-${result.inventoryType}-${index}`}
            className={`border border-gray-200 border-solid rounded-lg mb-3 last:mb-0 hover:shadow-md transition-all p-4 bg-white cursor-pointer`}
            onClick={() => handleProductClick(result)}
          >
            {/* Product Layout - matching BinCard structure */}
            <div className="box-border content-stretch flex flex-row items-start justify-between gap-2 p-0 relative shrink-0 w-full mb-4">
              <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
                <div className="box-border content-stretch flex flex-row items-start justify-start p-0 relative w-full min-w-0">
                  <div className="w-fit flex flex-col font-normal justify-center leading-[0] not-italic relative text-[#020817] text-xs text-left pr-1">
                    <p className="block leading-[16px] text-[14px] font-medium">{result.name}</p>
                  </div>
                  <div className="bg-[#000000] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1 py-0.5 relative rounded shrink-0 ml-1">
                    <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[8px] text-left text-nowrap">
                      <p className="block leading-[normal] whitespace-pre">
                        {result.inventoryType === 'Charity Care' ? 'MDV' : 'SDV'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-xs text-left w-full">
                  <p className="block leading-[16px] break-words overflow-hidden text-[14px]">{result.ndc} - {result.inventoryType}</p>
                </div>
              </div>
              
              {/* Quantity Display - matching BinCard structure */}
              <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-16">
                <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
                <div className="flex flex-col font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-xs text-nowrap text-right">
                  <p className="block leading-[16px] whitespace-pre text-[14px]">{result.totalQuantity}</p>
                </div>
                <div className="flex flex-col font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[8px] text-left text-nowrap">
                  <p className="block leading-[normal] whitespace-pre text-[10px]">{getUnit(result.totalQuantity)}</p>
                </div>
              </div>
            </div>
            
            {/* Action Button - Only show in change allocation mode */}
            {changeAllocationMode && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card's onClick
                  const binIds = getBinIdsForProduct(result);
                  // stopPropagation means the card's own highlight-on-click never fires, so
                  // build the same precise query it would have used and pass it through.
                  const highlightQuery = [result.name, result.ndc, result.inventoryType].filter(Boolean).join(', ');
                  if (changeAllocationStep === 1) {
                    onSelectSourceBins?.(binIds, result.name, highlightQuery);
                  } else {
                    onSelectTargetBins?.(binIds, result.name, highlightQuery);
                  }
                  // Land on the bin that was just selected — the product may well live on a door
                  // the user isn't looking at, and a selection they can't see is easy to lose track of.
                  jumpToProduct(result);
                  // That was the last remaining match — nothing left to pick, so close.
                  if (visibleResults.length === 1) {
                    onClose();
                  }
                }}
                className="w-full bg-[#095192] hover:bg-[#074080] text-white text-[14px] h-10 rounded-[4px]"
              >
                {changeAllocationStep === 1 
                  ? `Select as Source (${result.binLocations.length} bin${result.binLocations.length !== 1 ? 's' : ''})`
                  : `Select as Target (${result.binLocations.length} bin${result.binLocations.length !== 1 ? 's' : ''})`
                }
              </Button>
            )}
          </div>
        ))}
        </>
        )}
      </div>
    </div>
  );
});

export default SearchDropdown;