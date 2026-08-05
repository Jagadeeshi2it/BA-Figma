import React, { memo, useState, useEffect, useRef } from 'react';
import { SourcePick } from '../utils/sourcePicks';
import { Button } from './ui/button';
import { Clock, X, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import SearchDropdown, { getResultKey } from './SearchDropdown';
import { searchProducts, getBinIdsForProduct } from '../utils/productSearchUtils';
import { DoorShelfConfig } from '../types';

// Shortest query that gets searched. Anything shorter matches so much of the catalogue that the
// list is noise rather than an answer.
const MIN_SEARCH_LENGTH = 3;

interface HeaderSectionProps {
  searchQuery: string;
  highlightAvailableBins: boolean;
  allAvailableBins: number;
  showUnallocatedProducts: boolean;
  showUnallocatedButton: boolean;
  changeAllocationMode: boolean;
  changeAllocationStep: 1 | 2;
  changeAllocationSourceBins: string[];
  // The (bin, product) pairs already picked, so the dropdown can judge availability per pair.
  sourceProductPicks?: SourcePick[];
  changeAllocationTargetBins: string[];
  unallocatedProductsCount: number; // CRITICAL FIX: Pass unallocated products count as prop
  doorShelfConfig: DoorShelfConfig;
  selectedBinsForAssignment?: string[];
  handleSearchQueryChange: (query: string) => void;
  handleSearchAutofill?: (query: string) => void;
  // True while the Allocate Product panel is open. Like changeAllocationMode it hides the workflow
  // entry buttons and History: once you're inside a workflow, starting another one (or wandering off
  // to History) would abandon a half-built selection with no warning.
  showAllocateProducts?: boolean;
  handleAvailableBinsClick: () => void;
  handleChangeAllocationClick: () => void;
  // The two kinds of move, split out of the old single Change Allocation entry.
  handleMoveBinClick?: () => void;
  handleMoveProductClick?: () => void;
  // Which kind of move is in progress (null outside a move). Passed to the search dropdown so it can
  // offer "Select as Source" for products only in the Product kind.
  moveMode?: 'bin' | 'product' | null;
  // One-shot: true right after a Product move is started, asking for the search box to take the
  // cursor. Cleared as soon as it's used, so it fires once per flow rather than on every step change.
  handleAllocateProductsClick: () => void;
  handleUnallocatedProductsClick: () => void;
  handleHistoryClick: () => void;
  handleSelectBinsForAssignment?: (binIds: string[]) => void;
  handleSelectSourceBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  handleSelectTargetBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  handleSearchProductClick?: (productName: string, ndc: string, inventoryType: string) => void;
  handleDoorClick?: (doorName: string) => void;
  handleScrollToBin?: (binId: string) => void;
}

// One row of the Allocate/Move menu. The description is the point: the three workflows are close
// enough in name that a bare set of labels would leave the choice to guesswork.
function WorkflowOption({
  title,
  description,
  onSelect
}: {
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-[4px] pl-3 pr-4 py-2.5 hover:bg-[#F1F6FA] transition-colors cursor-pointer"
    >
      <span className="block text-[14px] leading-[20px] font-medium text-[#020817]">{title}</span>
      <span className="block text-[13px] leading-[18px] text-[#676b74] mt-0.5">{description}</span>
    </button>
  );
}

const HeaderSection = memo(function HeaderSection({
  searchQuery,
  highlightAvailableBins,
  allAvailableBins,
  showUnallocatedProducts,
  showUnallocatedButton,
  changeAllocationMode,
  changeAllocationStep,
  changeAllocationSourceBins,
  sourceProductPicks = [],
  changeAllocationTargetBins,
  unallocatedProductsCount,
  doorShelfConfig,
  selectedBinsForAssignment = [],
  showAllocateProducts = false,
  handleSearchQueryChange,
  handleSearchAutofill,
  handleAvailableBinsClick,
  handleChangeAllocationClick,
  handleMoveBinClick,
  handleMoveProductClick,
  moveMode,
  handleAllocateProductsClick,
  handleUnallocatedProductsClick,
  handleHistoryClick,
  handleSelectBinsForAssignment,
  handleSelectSourceBinsFromSearch,
  handleSelectTargetBinsFromSearch,
  handleSearchProductClick,
  handleDoorClick,
  handleScrollToBin
}: HeaderSectionProps) {
  
  // Search dropdown state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [workflowMenuOpen, setWorkflowMenuOpen] = useState(false);
  // View-mode products already clicked/selected from the current search — mirrors
  // changeAllocationSourceBins/TargetBins so the dropdown list shrinks the same way.
  const [viewedProductKeys, setViewedProductKeys] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // A query the app wrote itself — the product name written into the box after a pick — must not
  // count as a new search. It changes searchQuery like typing does, and the prune below would then
  // be free to drop the very pick the autofill was announcing, leaving the box naming a product
  // whose card showed as unselected.
  const autofilledQuery = useRef<string | null>(null);

  // Refining a query keeps the picks it still applies to. Typing "carbop" after picking all four
  // "carbo" results leaves those four on screen, so clearing them would silently untick cards the
  // user can still see; only keys whose product dropped out of the results are forgotten.
  const prunePicksToResults = (results: any[]) => {
    if (autofilledQuery.current === searchQuery) {
      autofilledQuery.current = null;
      return;
    }
    const liveKeys = new Set(results.map(getResultKey));
    setViewedProductKeys(previous => {
      const kept = previous.filter(key => liveKeys.has(key));
      // Same array back when nothing went stale, so re-running on focus changes is a no-op
      // instead of a fresh array that forces another render on every keystroke.
      return kept.length === previous.length ? previous : kept;
    });
  };

  // Update search results when query changes
  useEffect(() => {
    // One or two characters match too much of the catalogue to be worth reading, so the list stays
    // quiet until the query is specific enough.
    if (searchQuery.trim().length >= MIN_SEARCH_LENGTH && doorShelfConfig) {
      const results = searchProducts(doorShelfConfig, searchQuery);
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0 && isSearchFocused);
      prunePicksToResults(results);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setViewedProductKeys([]);
    }
  }, [searchQuery, doorShelfConfig, isSearchFocused]);

  const handleProductsViewed = (keys: string[]) => {
    // Replaces, not accumulates: switching to a new product un-hides whatever was
    // previously picked, since only one selection's worth stays hidden at a time.
    setViewedProductKeys(keys);
  };

  // A pick belongs to the mode and step it was made in. The keys otherwise only reset when the typed
  // query changes, and switching modes leaves the query alone, so a query carried across a mode
  // change would show browsing picks marked as though they were sources, or step 1's sources marked
  // as targets: "already handled" for work that hasn't been done.
  useEffect(() => {
    setViewedProductKeys([]);
  }, [changeAllocationMode, changeAllocationStep]);

  // Handle taps/clicks outside search container to close dropdown.
  // Uses pointerdown (fires immediately for touch, mouse, and pen alike) instead of
  // relying on input blur timing, which races against touch tap/click event ordering.
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  // Handle selecting all bins for a product
  const handleSelectAllBins = (binIds: string[], productName: string) => {
    if (handleSelectBinsForAssignment) {
      // Get currently selected bins and add new ones (avoid duplicates)
      const newSelection = [...new Set([...selectedBinsForAssignment, ...binIds])];
      handleSelectBinsForAssignment(newSelection);
      
      // Show success message
      console.log(`Selected ${binIds.length} bins containing ${productName}`);
    }
    setShowSearchDropdown(false);
    setIsSearchFocused(false);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  // Blurring is the load-bearing part, not just closing: the effect above reopens the dropdown
  // whenever the query changes while the box still counts as focused, and a box that never lost
  // focus won't fire onFocus again — so the list could never be brought back by clicking it.
  const dismissSearchList = () => {
    setIsSearchFocused(false);
    setShowSearchDropdown(false);
    searchInputRef.current?.blur();
  };

  // A single view-mode pick fills the box with what was picked and dismisses the list.
  const handleSelectionAutofill = (text: string) => {
    autofilledQuery.current = text;
    handleSearchAutofill?.(text);
    dismissSearchList();
  };


  return (
    <>
      {/* Page header row — rendered by MainLayout as `topBar`, a sibling of the scrollable shelf area
          rather than a child inside it, so it's exempt from scrolling by construction instead of by
          sticky positioning racing a scroll container. White to read as a continuation of TopNav
          above it (this bar plus TopNav together read as one nav chrome); its own border-b marks the
          seam into the gray, scrollable page below. It needs its own horizontal padding now — it no
          longer sits inside the content column's p-6, so px-6 reproduces that inset to keep the
          title and search aligned with the shelf cards underneath. */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-[24px]">Allocation</h1>

          {/* A filter on the view, not an action — it tints the empty bins and stays on until turned
              off. A checkbox says "this is a state you're holding"; the outlined button it replaced
              looked like the workflow entries beside it and read as something that would navigate.
              Beside the title because it describes what the page is showing. */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={highlightAvailableBins}
              onCheckedChange={handleAvailableBinsClick}
              className="border-[#095192] data-[state=checked]:bg-[#095192] data-[state=checked]:border-[#095192] data-[state=checked]:text-white"
            />
            <span className="text-[14px] leading-[20px] text-[#095192] whitespace-nowrap">
              Bins Available({allAvailableBins})
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2 h-full">
          {/* Always visible search bar with dropdown */}
          <div className="relative flex items-center" ref={searchContainerRef}>
            {/* The dropdown below is pinned to this box's edges, so its width comes from here —
                widening the box widens the result rows and gives long product names a line to
                themselves instead of wrapping onto three. */}
            <div className="bg-white relative rounded-[4px] w-[350px] h-[36px] border border-[#bcc3cd] focus-within:border-[#666666] focus-within:ring-[3px] focus-within:ring-[#666666]/50">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, bins, NDC codes... (use commas for multiple terms)"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-full h-full px-[12px] py-[10px] bg-transparent border-none outline-none font-['Inter:Regular',_sans-serif] font-normal leading-[21px] not-italic text-[#25282a] text-[14px] placeholder:text-[#9fa9b7] focus:outline-none rounded-[4px]"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 h-6 w-6 p-0 font-normal z-10"
                onClick={() => {
                  handleSearchQueryChange("");
                  setShowSearchDropdown(false);
                  setIsSearchFocused(false);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            
            {/* Search Results Dropdown */}
            <SearchDropdown
              searchResults={searchResults}
              isVisible={showSearchDropdown}
              changeAllocationMode={changeAllocationMode}
              changeAllocationStep={changeAllocationStep}
              moveMode={moveMode}
              excludeBinIds={changeAllocationStep === 1 ? changeAllocationSourceBins : changeAllocationTargetBins}
              sourceProductPicks={sourceProductPicks}
              viewedProductKeys={viewedProductKeys}
              onSelectAllBins={handleSelectAllBins}
              onSelectSourceBins={handleSelectSourceBinsFromSearch}
              onSelectTargetBins={handleSelectTargetBinsFromSearch}
              onProductClick={handleSearchProductClick}
              onProductsViewed={handleProductsViewed}
              onDoorClick={handleDoorClick}
              onScrollToBin={handleScrollToBin}
              sourceBinIds={changeAllocationSourceBins}
              onAutofillSearch={handleSelectionAutofill}
              onDismissList={dismissSearchList}
              onClose={() => setShowSearchDropdown(false)}
            />
          </div>
          {/* Hidden inside any workflow — the unallocated tray, a move, or an allocate. While one is
              open its own controls own the screen, and offering a second entry point invites
              abandoning a half-built selection. */}
          {!showUnallocatedProducts && !changeAllocationMode && !showAllocateProducts && (
            <>
              {/* One entry point for all three jobs. They were a plain Allocate button beside a Move
                  picker, which put two of the three choices at different depths — you could start an
                  allocate in one tap but had to open a menu to move. Behind one trigger the first
                  decision is always the same: which of the three am I doing. */}
              <Popover open={workflowMenuOpen} onOpenChange={setWorkflowMenuOpen}>
                <PopoverTrigger asChild>
                  <div className="bg-white relative rounded-[4px] cursor-pointer">
                    <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="flex flex-row items-center justify-end relative size-full">
                      <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                        <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                          <p className="leading-[20px] whitespace-pre text-[14px]">Allocate/Move</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[#095192] shrink-0" />
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>

                {/* collisionPadding: the trigger sits near the right of the header, so Radix shifts
                    the panel left to fit — and with the default padding of 0 it shifts until it is
                    flush against the window edge. This keeps a margin there instead. */}
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  collisionPadding={16}
                  className="w-[300px] p-1"
                >
                  {/* One line each: what unit you pick, and where you pick it. Anything longer stops
                      being read at the moment the user just wants to get going.

                      The two Move entries share a shape and differ only in the unit — "Select Bin" /
                      "Select Product" — because they are one workflow with two doors, not two
                      workflows. "Move by Bin" / "Move by Product" read as separate jobs. Singular,
                      matching "Allocate Product" above, even though you can pick several. */}
                  <WorkflowOption
                    title="Allocate Product"
                    // "No stock moves" is the fact that distinguishes this from the two below, and the one
                    // most easily assumed wrong: a new location opens at 0 and is filled by a move later.
                    description="Give a product another bin. No stock moves."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleAllocateProductsClick();
                    }}
                  />
                  <WorkflowOption
                    title="Select Bin to move"
                    // NOT "tap whole bins": picking a bin does not commit its whole contents — Review still
                    // asks which of its products are leaving. Saying "whole bins" promised something the
                    // flow then walks back. What it really offers is a starting point.
                    description="Start from a bin, then pick what leaves it."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleMoveBinClick?.();
                    }}
                  />
                  <WorkflowOption
                    title="Select Product to move"
                    // Parallel with the entry above — both say where you start, which is the only real
                    // difference between them. "Wherever it's stored" is the actual advantage: you do not
                    // need to know which bin the drug is in.
                    description="Start from a product, wherever it's stored."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleMoveProductClick?.();
                    }}
                  />
                </PopoverContent>
              </Popover>
              {/* Only show Unallocated Products button if there are products to allocate and keyboard shortcut was pressed */}
              {unallocatedProductsCount > 0 && showUnallocatedButton && (
                <div
                  className="bg-white relative rounded-[4px] cursor-pointer"
                  onClick={handleUnallocatedProductsClick}
                >
                  <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Unallocated ({unallocatedProductsCount})</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Leaving the mode lives on the bottom bar's Cancel, which calls the same handler — two
              buttons for one action, at opposite ends of the screen, only raised the question of
              whether they did different things. */}

          {/* Show active state when in unallocated products mode */}
          {showUnallocatedProducts && (
            <div
              className="bg-[#095192]/5 relative rounded-[4px] cursor-pointer"
              onClick={handleUnallocatedProductsClick}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-end relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                  <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre text-[14px]">
                      Unallocated{unallocatedProductsCount > 0 ? ` (${unallocatedProductsCount})` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History hides with the workflow buttons above, for the same reason: leaving for a
              full-page history mid-selection would discard it. */}
          {!showUnallocatedProducts && !changeAllocationMode && !showAllocateProducts && (
            <div 
              className="bg-white relative rounded-[4px] cursor-pointer h-[36px]"
              onClick={handleHistoryClick}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-end relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                  <Clock className="w-4 h-4 text-[#095192]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
});

export default HeaderSection;