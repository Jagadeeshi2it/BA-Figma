import React, { memo, useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, X } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { searchProducts, getBinIdsForProduct } from '../utils/productSearchUtils';
import { DoorShelfConfig } from '../types';
interface HeaderSectionProps {
  searchQuery: string;
  highlightAvailableBins: boolean;
  allAvailableBins: number;
  showUnallocatedProducts: boolean;
  showUnallocatedButton: boolean;
  changeAllocationMode: boolean;
  changeAllocationStep: 1 | 2;
  changeAllocationSourceBins: string[];
  changeAllocationTargetBins: string[];
  unallocatedProductsCount: number; // CRITICAL FIX: Pass unallocated products count as prop
  doorShelfConfig: DoorShelfConfig;
  selectedBinsForAssignment?: string[];
  handleSearchQueryChange: (query: string) => void;
  handleSearchAutofill?: (query: string) => void;
  handleAvailableBinsClick: () => void;
  handleChangeAllocationClick: () => void;
  handleUnallocatedProductsClick: () => void;
  handleExitChangeAllocation: () => void;
  handleHistoryClick: () => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  handleClearChangeAllocationSelection: () => void;
  handleOpenChangeAllocationModal: () => void;
  handleClearSourceBins?: () => void;
  handleClearTargetBins?: () => void;
  handleSelectBinsForAssignment?: (binIds: string[]) => void;
  handleSelectSourceBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  handleSelectTargetBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  handleSearchProductClick?: (productName: string, ndc: string, inventoryType: string) => void;
  handleDoorClick?: (doorName: string) => void;
  handleScrollToBin?: (binId: string) => void;
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
  changeAllocationTargetBins,
  unallocatedProductsCount,
  doorShelfConfig,
  selectedBinsForAssignment = [],
  handleSearchQueryChange,
  handleSearchAutofill,
  handleAvailableBinsClick,
  handleChangeAllocationClick,
  handleUnallocatedProductsClick,
  handleExitChangeAllocation,
  handleHistoryClick,
  handleNextStep,
  handlePreviousStep,
  handleClearChangeAllocationSelection,
  handleOpenChangeAllocationModal,
  handleClearSourceBins,
  handleClearTargetBins,
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
  // View-mode products already clicked/selected from the current search — mirrors
  // changeAllocationSourceBins/TargetBins so the dropdown list shrinks the same way.
  const [viewedProductKeys, setViewedProductKeys] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim() && doorShelfConfig) {
      const results = searchProducts(doorShelfConfig, searchQuery);
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0 && isSearchFocused);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, doorShelfConfig, isSearchFocused]);

  // A query the app wrote itself — the product name after a pick, or the keyword restored on
  // refocus — must not count as a new search. Both change searchQuery, and without this exemption
  // the effect below would clear the pick the autofill was announcing: the box would name a product
  // while its card showed as unselected.
  const autofilledQuery = useRef<string | null>(null);

  // A genuinely new typed query starts the "already viewed" tracking over.
  useEffect(() => {
    if (autofilledQuery.current === searchQuery) {
      autofilledQuery.current = null;
      return;
    }
    setViewedProductKeys([]);
  }, [searchQuery]);

  const handleProductsViewed = (keys: string[]) => {
    // Replaces, not accumulates: switching to a new product un-hides whatever was
    // previously picked, since only one selection's worth stays hidden at a time.
    setViewedProductKeys(keys);
  };

  // Entering (or returning to) Step 1 of Change Allocation: put the cursor straight into the
  // existing search bar so the product-first flow (search → "Select as Source") is ready to
  // go immediately, keyboard included, without an extra tap to focus it.
  useEffect(() => {
    if (changeAllocationMode && changeAllocationStep === 1) {
      searchInputRef.current?.focus();
    }
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
  // "4 products selected" is a summary, not a query — searching for it finds nothing. So the
  // keyword that produced the selection is kept here, and clicking back into the box swaps the
  // summary out for it, bringing the results back with the picked cards still ticked.
  const summarySearch = useRef<{ summary: string; keyword: string } | null>(null);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (summarySearch.current && searchQuery === summarySearch.current.summary) {
      // Exempt from the reset above, so the restored results keep their ticks.
      autofilledQuery.current = summarySearch.current.keyword;
      handleSearchAutofill?.(summarySearch.current.keyword);
      summarySearch.current = null;
      // The effect above reopens the dropdown once the restored keyword produces results.
      return;
    }
    if (searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  // A view-mode pick fills the box with what was picked and dismisses the list. Dropping the focus
  // flag is the load-bearing part: the effect above reopens the dropdown whenever the query changes
  // while the box still counts as focused, so closing alone would flicker straight back open.
  // restoreOnFocus marks the text as a summary to be swapped back for the keyword on refocus.
  const handleSelectionAutofill = (text: string, restoreOnFocus = false) => {
    summarySearch.current = restoreOnFocus ? { summary: text, keyword: searchQuery } : null;
    autofilledQuery.current = text;
    handleSearchAutofill?.(text);
    setIsSearchFocused(false);
    setShowSearchDropdown(false);
    searchInputRef.current?.blur();
  };

  // Step-specific clear handler
  const handleStepSpecificClear = () => {
    if (changeAllocationStep === 1) {
      // Clear only source bins on step 1
      if (handleClearSourceBins) {
        handleClearSourceBins();
      }
    } else if (changeAllocationStep === 2) {
      // Clear only target bins on step 2
      if (handleClearTargetBins) {
        handleClearTargetBins();
      }
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-[24px]">Allocation</h1>
        </div>
        <div className="flex items-center gap-2 h-full">
          {/* Always visible search bar with dropdown */}
          <div className="relative flex items-center" ref={searchContainerRef}>
            <div className="bg-white relative rounded-[4px] w-[320px] h-[36px] border border-[#bcc3cd] focus-within:border-[#666666] focus-within:ring-[3px] focus-within:ring-[#666666]/50">
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
              excludeBinIds={changeAllocationStep === 1 ? changeAllocationSourceBins : changeAllocationTargetBins}
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
              onClose={() => setShowSearchDropdown(false)}
            />
          </div>
          <div 
            className={`bg-white relative rounded-[4px] cursor-pointer ${highlightAvailableBins ? "bg-green-50" : ""}`}
            onClick={handleAvailableBinsClick}
          >
            <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[4px] ${highlightAvailableBins ? "border-green-500" : "border-[#095192]"}`} />
            <div className="flex flex-row items-center justify-end relative size-full">
              <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                  <p className="leading-[20px] whitespace-pre text-[14px]">{allAvailableBins} Available Bins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditionally show buttons based on unallocated products mode */}
          {!showUnallocatedProducts && !changeAllocationMode && (
            <>
              <div 
                className="bg-white relative rounded-[4px] cursor-pointer"
                onClick={handleChangeAllocationClick}
              >
                <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                <div className="flex flex-row items-center justify-end relative size-full">
                  <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                    <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                      <p className="leading-[20px] whitespace-pre text-[14px]">Change Allocation</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Only show Unallocated Products button if there are products to allocate and keyboard shortcut was pressed */}
              {unallocatedProductsCount > 0 && showUnallocatedButton && (
                <div className="relative">
                  <div 
                    className="bg-white relative rounded-[4px] cursor-pointer"
                    onClick={handleUnallocatedProductsClick}
                  >
                    <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="flex flex-row items-center justify-end relative size-full">
                      <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                        <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                          <p className="leading-[20px] whitespace-pre text-[14px]">Unallocated Products</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#095192] text-white border-2 border-white text-[10px]"
                  >
                    {unallocatedProductsCount}
                  </Badge>
                </div>
              )}
            </>
          )}

          {/* Show change allocation mode buttons */}
          {changeAllocationMode && (
            <div 
              className="bg-white relative rounded-[4px] cursor-pointer"
              onClick={handleExitChangeAllocation}
            >
              <div aria-hidden="true" className="absolute border border-[rgba(184,59,59,1)] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-end relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                  <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[rgba(184,59,59,1)] text-[14px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre text-[14px]">Exit Change Allocation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show active state when in unallocated products mode */}
          {showUnallocatedProducts && (
            <div className="relative">
              <div 
                className="bg-[#095192]/5 relative rounded-[4px] cursor-pointer"
                onClick={handleUnallocatedProductsClick}
              >
                <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                <div className="flex flex-row items-center justify-end relative size-full">
                  <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                    <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                      <p className="leading-[20px] whitespace-pre text-[14px]">Unallocated Products</p>
                    </div>
                  </div>
                </div>
              </div>
              {unallocatedProductsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#095192] text-white border-2 border-white"
                >
                  {unallocatedProductsCount}
                </Badge>
              )}
            </div>
          )}

          {/* Conditionally show history button */}
          {!showUnallocatedProducts && !changeAllocationMode && (
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

      {/* Change Allocation Instructions */}
      {changeAllocationMode && (
        <div className={`mb-6 p-4 bg-[#edf1f5] border border-[rgba(9,81,146,0.2)] rounded-[10px] ${
          changeAllocationMode 
            ? 'sticky top-0 z-50 shadow-sm' 
            : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {changeAllocationStep === 1 ? (
                <div className="space-y-1">
                  <p className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
                    Step 1. Select source bins containing products to move
                  </p>
                  {changeAllocationSourceBins.length > 0 && (
                    <p className="text-xs text-[#095192] text-[12px]">
                      Selected: {changeAllocationSourceBins.length} source bin{changeAllocationSourceBins.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ) : changeAllocationStep === 2 && changeAllocationTargetBins.length === 0 ? (
                <div className="space-y-1">
                  <p className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
                    <span className="text-[14px]">Step 2.</span>{" "}
                    <span className="text-[14px]">Select one or more target bins for the products</span>
                  </p>
                  <p className="text-xs text-[#095192] text-[12px]">
                    Note: Target bins can be from any cabinet or door
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-[rgba(0,0,0,1)]">
                    <span className="text-[14px]">Step 2.</span>{" "}
                    <span className="text-[14px]">Review your selections and confirm the allocation change</span>
                  </p>
                  <p className="text-xs text-[#095192]">
                    <span className="text-[12px]">Selected: {changeAllocationSourceBins.length} source bin{changeAllocationSourceBins.length !== 1 ? "s" : ""}, {changeAllocationTargetBins.length} target bin{changeAllocationTargetBins.length !== 1 ? "s" : ""}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {changeAllocationStep === 2 && (
                <div 
                  className="bg-white relative rounded-[4px] cursor-pointer"
                  onClick={handlePreviousStep}
                >
                  <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Change Source Bin</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {changeAllocationStep === 1 && changeAllocationSourceBins.length > 0 && (
                <div 
                  className="bg-white relative rounded-[4px] cursor-pointer"
                  onClick={handleStepSpecificClear}
                >
                  <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Clear</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {changeAllocationStep === 2 && changeAllocationTargetBins.length > 0 && (
                <div 
                  className="bg-white relative rounded-[4px] cursor-pointer"
                  onClick={handleStepSpecificClear}
                >
                  <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Clear</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {changeAllocationStep === 1 && changeAllocationSourceBins.length > 0 && (
                <div 
                  className="bg-[#095192] relative rounded-[4px] cursor-pointer"
                  onClick={handleNextStep}
                >
                  <div className="flex flex-row items-center justify-end relative size-full">
                    <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                      <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
                        <p className="leading-[20px] whitespace-pre text-[14px]">Select Target</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {changeAllocationStep === 2 && (
                <>
                  {changeAllocationTargetBins.length > 0 && (
                    <div 
                      className="bg-[#095192] relative rounded-[4px] cursor-pointer"
                      onClick={handleOpenChangeAllocationModal}
                    >
                      <div className="flex flex-row items-center justify-end relative size-full">
                        <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                          <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
                            <p className="leading-[20px] whitespace-pre text-[14px]">Confirm Selection</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default HeaderSection;