import React, { memo } from 'react';
import { Button } from './ui/button';
import { ProductSearchResult, getBinIdsForProduct } from '../utils/productSearchUtils';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

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
  // View mode only: fill the search box with what was picked and dismiss the list.
  onAutofillSearch?: (text: string) => void;
  // Dismiss the list without touching the query, so a reopened list still matches what's typed.
  onDismissList?: () => void;
  onClose: () => void;
}

export const getResultKey = (result: ProductSearchResult) => `${result.ndc}-${result.inventoryType}`;

// Where the product actually sits, in the same shape getBinLocationDetails produces without the
// cabinet ("Bin A - Shelf 2, Door 6") — built from the result's own locations, which already carry
// the names. Deduped because one bin can hold several lots of the same NDC. No product group spans
// more than four bins in the real data, so every location can be listed without truncating.
const formatBinLocations = (result: ProductSearchResult): string[] => [
  ...new Set(result.binLocations.map(loc => `${loc.binName} - ${loc.shelfName}, ${loc.doorName}`))
];

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
  onAutofillSearch,
  onDismissList,
  onClose
}: SearchDropdownProps) {
  if (!isVisible || searchResults.length === 0) {
    return null;
  }

  // In change allocation mode a result is "done" once every bin it lives in has already been
  // picked — drop it, since there's nothing left to select. View mode keeps every result listed
  // and marks the picked one instead: making a card vanish the moment you click it hides the thing
  // you just asked for and makes the list feel like it's fighting you.
  const visibleResults = changeAllocationMode
    ? searchResults.filter(result => !result.binLocations.every(loc => excludeBinIds.includes(loc.binId)))
    : searchResults;

  const isPicked = (result: ProductSearchResult) => viewedProductKeys.includes(getResultKey(result));

  // Picked cards float to the top. The list can hold dozens of matches and reopens scrolled to the
  // top, so a tick further down is a tick the user has to go hunting for. sort is stable, so the
  // search's own ordering still holds within the picked and unpicked halves.
  const orderedResults = [...visibleResults].sort(
    (a, b) => Number(isPicked(b)) - Number(isPicked(a))
  );

  // Nothing left for "Select All" to do once every card is ticked — or when there's only one card,
  // which the row itself already covers. In change allocation mode fully-used results are dropped
  // from visibleResults instead, and viewedProductKeys is unused there, so this never hides it.
  const showSelectAll = visibleResults.length > 1 && !visibleResults.every(isPicked);

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
      // Replaces (not adds to) the previous pick — only one product is "the" selection at a time
      // in view mode, so exactly one card carries the tick.
      onProductsViewed?.([getResultKey(result)]);
      jumpToProduct(result);
      // The box now names what was picked and the list closes. The card keeps its tick for when
      // the user refocuses the box and the list comes back.
      onAutofillSearch?.(result.name);
    }
  };

  const handleSelectAll = () => {
    if (visibleResults.length === 0) return;

    if (changeAllocationMode) {
      // Actually select every matching bin as source/target, not just preview-highlight it.
      const allBinIds = Array.from(new Set(visibleResults.flatMap(getBinIdsForProduct)));
      const productNames = visibleResults.map(result => result.name).join(', ');
      // Same OR-group query shape as the view-mode branch further down, so every selected
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
    // Unlike a single pick there's no one name to put in the box, and the typed keyword is what
    // describes this selection best — so leave the query alone and just dismiss the list.
    onDismissList?.();
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
      <div>
        {/* No count when there's nothing left to list — the message below says the whole story,
            and a count with an empty list under it just reads as a contradiction. */}
        {visibleResults.length > 0 && (
          <div className="box-border content-stretch flex flex-row gap-3 items-center justify-between relative shrink-0 w-full px-4 py-3">
            <p className="block font-normal leading-[16px] not-italic text-[#020817] text-[14px] text-left">
              <span className="font-semibold">{visibleResults.length}</span> matching product{visibleResults.length !== 1 ? 's' : ''}
            </p>
            {/* Shares the count's row rather than taking a full-width one of its own. In view mode the
                count next to it already says how many, so the label doesn't repeat it — change
                allocation mode keeps its count, which is bins, not products, and so isn't a repeat. */}
            {showSelectAll && (
              <Button
                variant="ghost"
                onClick={handleSelectAll}
                className="bg-transparent hover:bg-transparent text-[#095192] hover:text-[#074080] hover:underline text-[14px] font-medium h-auto p-0 shrink-0"
              >
                {changeAllocationMode
                  ? `Select All as ${changeAllocationStep === 1 ? 'Source' : 'Target'} (${totalBinCount} bin${totalBinCount !== 1 ? 's' : ''})`
                  : 'Select All'
                }
              </Button>
            )}
          </div>
        )}

        {/* Only change allocation mode can empty this list — view mode keeps every match listed,
            and the component returns null when the search itself found nothing. */}
        {visibleResults.length === 0 ? (
          <div className="text-[13px] text-[#64748b] text-center px-4 pb-3">
            {alreadySelectedMessage}
          </div>
        ) : (
        // Divider-separated rows, same as the unallocated list: a list of matches reads as one list,
        // where a stack of bordered cards reads as several unrelated things.
        <div className="divide-y divide-gray-200 border-t border-gray-200">
        {orderedResults.map((result, index) => (
          <div
            key={`${result.ndc}-${result.inventoryType}-${index}`}
            // No tint on the picked row either — same reason as the bins: the highlight colour on
            // the name and locations is the signal, and a filled background only mutes it. Hover
            // still tints, since that's transient rather than a state.
            className="px-4 py-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
            onClick={() => handleProductClick(result)}
          >
            {/* Product Layout - matching BinCard structure. The bottom gap is only there to separate
                this row from the action button below it, which only change allocation mode renders —
                in view mode it would just leave the card padded out with nothing under the text. */}
            <div className={`box-border content-stretch flex flex-row items-start justify-between gap-2 p-0 relative shrink-0 w-full ${changeAllocationMode ? 'mb-4' : ''}`}>
              <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
                <div className="box-border content-stretch flex flex-row items-start justify-start p-0 relative w-full min-w-0">
                  {/* A picked row wears the same highlight colour the bins use for a matched product,
                      rather than a tick of its own — one visual language for "this is the one you
                      asked about", whether you're reading the list or the shelf it points at. */}
                  <div className={`flex-1 flex flex-col font-normal justify-center leading-[0] not-italic relative text-xs text-left min-w-0 ${isPicked(result) ? 'text-[#A16207]' : 'text-[#020817]'}`}>
                    <p className="block leading-[16px] text-[14px] font-medium break-words">{result.name}</p>
                  </div>
                </div>
                {/* Badges sit under the name, not beside it, and come from the same helpers the bin
                    rows use — keyed on name + NDC + inventory type, which is exactly what a search
                    result is grouped by, so a hit and the bin row it points at always agree. */}
                <div className="flex items-center gap-1 my-1">
                  <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                    {getVialType(result)}
                  </span>
                  {hasClimateBadge(result) && (
                    <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
                  )}
                  {hasCivBadge(result) && (
                    <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
                  )}
                </div>
                <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-xs text-left w-full">
                  <p className="block leading-[16px] break-words overflow-hidden text-[14px]">{result.ndc} - {result.inventoryType}</p>
                </div>
                {/* Which bins hold it — a search hit is only actionable once you know where to walk. */}
                {result.binLocations.length > 0 && (
                  <div className="flex flex-col gap-0.5 items-start justify-start mt-1 relative shrink-0 w-full">
                    {formatBinLocations(result).map(location => (
                      <p key={location} className={`block font-normal leading-[16px] not-italic text-[12px] text-left break-words ${isPicked(result) ? 'text-[#A16207]' : 'text-[#020817]'}`}>
                        {location}
                      </p>
                    ))}
                  </div>
                )}
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
        </div>
        )}
      </div>
    </div>
  );
});

export default SearchDropdown;