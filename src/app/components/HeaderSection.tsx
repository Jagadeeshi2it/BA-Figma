import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { SourcePick } from '../utils/sourcePicks';
import { Button } from './ui/button';
import { Clock, X, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import SearchDropdown, { getResultKey } from './SearchDropdown';
import { searchProducts, searchBinsByName, getBinIdsForProduct } from '../utils/productSearchUtils';
import { DoorShelfConfig } from '../types';

// Shortest query that gets searched. Anything shorter matches so much of the catalogue that the
// list is noise rather than an answer.
const MIN_SEARCH_LENGTH = 3;

interface HeaderSectionProps {
  searchQuery: string;
  highlightAvailableBins: boolean;
  allAvailableBins: number;
  showUnallocatedProducts: boolean;
  changeAllocationMode: boolean;
  changeAllocationStep: 1 | 2;
  changeAllocationSourceBins: string[];
  // The (bin, product) pairs already picked, so the dropdown can judge availability per pair.
  sourceProductPicks?: SourcePick[];
  changeAllocationTargetBins: string[];
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
  handleAllocateProductsClick: () => void;
  handleUnallocatedProductsClick: () => void;
  handleHistoryClick: () => void;
  handleSelectBinsForAssignment?: (binIds: string[]) => void;
  handleSelectSourceBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  handleSelectTargetBinsFromSearch?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  // Drops a product from every bin it was picked in — the search row's Remove.
  handleRemoveSourceProduct?: (product: { name?: string; ndc?: string; inventoryType?: string }) => void;
  // A bin found by NAME, rather than by the product it holds — see searchBinsByName.
  handleSelectBinFromSearch?: (binId: string) => void;
  handleHighlightBins?: (binIds: string[], query: string) => void;
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
  changeAllocationMode,
  changeAllocationStep,
  changeAllocationSourceBins,
  sourceProductPicks = [],
  changeAllocationTargetBins,
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
  handleRemoveSourceProduct,
  handleSelectBinFromSearch,
  handleHighlightBins,
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

  // Bins whose name matches. Derived rather than held in state like the products beside it: there is
  // no equivalent of viewedProductKeys to prune, so there is nothing for an effect to maintain.
  const binResults = useMemo(
    () =>
      searchQuery.trim().length >= MIN_SEARCH_LENGTH && doorShelfConfig
        ? searchBinsByName(doorShelfConfig, searchQuery)
        : [],
    [searchQuery, doorShelfConfig]
  );

  // Update search results when query changes
  useEffect(() => {
    // One or two characters match too much of the catalogue to be worth reading, so the list stays
    // quiet until the query is specific enough.
    if (searchQuery.trim().length >= MIN_SEARCH_LENGTH && doorShelfConfig) {
      const results = searchProducts(doorShelfConfig, searchQuery);
      setSearchResults(results);
      // A bins-only query still opens the list — otherwise typing a bin name would look exactly like
      // typing a nonexistent one, which is the gap this whole section exists to close.
      setShowSearchDropdown((results.length > 0 || binResults.length > 0) && isSearchFocused);
      prunePicksToResults(results);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setViewedProductKeys([]);
    }
  }, [searchQuery, doorShelfConfig, isSearchFocused, binResults]);

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
    if (searchResults.length > 0 || binResults.length > 0) {
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
      {/* Title left, everything else in one right-aligned group. It was a three-column grid centring
          the search, which is fine on the browse screen and wrong inside a workflow: the three controls
          to its right all hide there, so the search stayed pinned mid-row with a wide empty gap after
          it. Grouping it with them means the row's right edge is where the controls are, whichever of
          them are on screen. */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-normal text-[24px]">Allocation</h1>

        <div className="flex items-center gap-2 h-full">
        {/* Always visible search bar with dropdown. First in the group: it is the one control that is
            never hidden, so it anchors the row while the others come and go. */}
        <div className="relative flex items-center" ref={searchContainerRef}>
            {/* The dropdown below is pinned to this box's edges, so its width comes from here —
                widening the box widens the result rows and gives long product names a line to
                themselves instead of wrapping onto three. */}
            <div className="bg-white relative rounded-[4px] w-[400px] h-[36px] border border-[#bcc3cd] focus-within:border-[#666666] focus-within:ring-[3px] focus-within:ring-[#666666]/50">
              <input
                ref={searchInputRef}
                type="text"
                // No comma instruction any more — terms split on whitespace too (utils/searchQuery), so
                // there is no convention left to teach. It was never discoverable advice anyway; it was
                // an apology for a matcher that needed "carbo, 600" to find CARBOPLATIN 600.
                placeholder="Search products, bins, NDC codes..."
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
              binResults={binResults}
              query={searchQuery}
              targetBinIds={changeAllocationTargetBins}
              onSelectBin={handleSelectBinFromSearch}
              onHighlightBins={handleHighlightBins}
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
              onRemoveSourceProduct={handleRemoveSourceProduct}
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
              {/* A filter on the view, not an action — it tints the empty bins and stays on until
                  turned off. It was a checkbox beside the title, which said "a state you are holding"
                  more plainly than a button can; as a button next to the workflow trigger the risk is
                  that it reads as a fourth action, which is what moved it away from here the first
                  time. What has to carry the difference now is that it goes GREEN when on — the same
                  green the bins it turns on are outlined in, so the control and its effect are
                  obviously one thing, and neither can be mistaken for the blue primary beside it.
                  Filled was tried first and read as a pressed button rather than a live filter.
                  aria-pressed carries the state for anyone not reading the colour.

                  The stroke is border-green-500 exactly, matching BinCard's available outline. The
                  label is one step deeper: #22C55E manages 2.3:1 as 14px text on white, well under the
                  ~4.5:1 this app holds text to (see textHighlight.tsx), while #15803D is the same green
                  at 5.02:1 — the codebase already solved this for the target-bin text. */}
              <button
                type="button"
                aria-pressed={highlightAvailableBins}
                onClick={handleAvailableBinsClick}
                className={`h-9 px-3 rounded-[4px] border bg-white text-[14px] leading-[20px] whitespace-nowrap cursor-pointer transition-colors ${
                  highlightAvailableBins
                    ? 'border-green-500 text-[#15803D] hover:bg-[#F0FDF4]'
                    : 'border-[#095192] text-[#095192] hover:bg-[#F1F6FA]'
                }`}
              >
                Bins Available({allAvailableBins})
              </button>

              {/* One entry point for all three jobs. They were a plain Allocate button beside a Move
                  picker, which put two of the three choices at different depths — you could start an
                  allocate in one tap but had to open a menu to move. Behind one trigger the first
                  decision is always the same: which of the three am I doing. */}
              <Popover open={workflowMenuOpen} onOpenChange={setWorkflowMenuOpen}>
                {/* Primary, filled — this is the page's action. It was a white outlined trigger, which
                    made it one of three controls in the row wearing the same weight while being the
                    only one that starts any work. A real <button> now rather than nested divs, so it
                    is focusable and announces itself; h-9 matches the filter beside it. */}
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 h-9 px-3 rounded-[4px] bg-[#095192] text-white text-[14px] leading-[20px] whitespace-nowrap cursor-pointer transition-colors hover:bg-[#074080]"
                  >
                    Allocate/Move
                    {/* Points up while the menu is open — the chevron says which way the panel will
                        go, so leaving it down while the panel is already down states the one thing
                        that is no longer true. Read from workflowMenuOpen, which is what the Popover
                        itself is controlled by, so the arrow cannot fall out of step with the panel. */}
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${workflowMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </PopoverTrigger>

                {/* collisionPadding: the trigger sits near the right of the header, so Radix shifts
                    the panel left to fit — and with the default padding of 0 it shifts until it is
                    flush against the window edge. This keeps a margin there instead. */}
                <PopoverContent
                  // align="end" hangs the panel off the trigger's RIGHT edge, so the two line up on the
                  // side the eye is already on — the trigger sits at the right of the header, so aligning
                  // left threw the panel out under the search box instead.
                  align="end"
                  sideOffset={6}
                  // Radix defaults this to 0, which lets a shifted panel sit flush against the viewport
                  // edge. Only bites if the window is narrow enough to push it, which align="end" makes
                  // less likely but not impossible.
                  collisionPadding={16}
                  className="w-[360px] p-1"
                >
                  {/* One line each: what unit you pick, and where you pick it. Anything longer stops
                      being read at the moment the user just wants to get going.

                      The two Move entries share a shape and differ only in where you start, because they
                      are one workflow with two doors, not two workflows — "Move by Bin" / "Move by
                      Product" read as separate jobs. "Move from …" also echoes the pipeline's own
                      Move From / Move To vocabulary, and avoids colliding with step ②'s disabled
                      primary, which is itself "Select Bin to move". */}
                  {/* The two allocation entries are one verb apart, and the difference is the whole point:
                      a product with NO bin is a different job from a product that wants another one.
                      "Allocate Product" is the first thing in the menu because it is the one that gets
                      stock into the cabinet at all — the tray it opens used to be reachable only by
                      pressing "/" to reveal a button, which is nobody's first guess (UX-AUDIT H7-1). */}
                  <WorkflowOption
                    title="Allocate Product"
                    description="Assign bins to unallocated products."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleUnallocatedProductsClick();
                    }}
                  />
                  <WorkflowOption
                    title="Multi Bin Assignment"
                    // Deliberately parallel to the entry above: same verb, and the two words that change
                    // are the two things that differ — "additional" bins, for products already "allocated".
                    // It was called "Allocate Product" itself, which put the two jobs behind one name.
                    description="Assign additional bins to allocated products."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleAllocateProductsClick();
                    }}
                  />
                  <WorkflowOption
                    title="Move from Bin"
                    // "one or more products" is the correction that matters: picking a bin does not commit
                    // its whole contents — Review still asks which of its products are leaving. The old
                    // "Tap whole bins on the shelves" promised something the flow then walks back.
                    description="Move one or more products starting from a bin."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleMoveBinClick?.();
                    }}
                  />
                  <WorkflowOption
                    title="Move from Product"
                    // Deliberately the same sentence as the entry above bar its last word. The two flows
                    // reach the same place, so the copy differs by exactly what differs: where you start.
                    description="Move one or more products starting from a product."
                    onSelect={() => {
                      setWorkflowMenuOpen(false);
                      handleMoveProductClick?.();
                    }}
                  />
                </PopoverContent>
              </Popover>
              {/* The Unallocated Products button stood here, revealed by pressing "/". The workflow menu's
                  own Allocate Product entry opens that tray now, so the button was a second door to the
                  same room — and the one nobody could find, since the shortcut that revealed it was
                  undocumented and unhinted (UX-AUDIT H7-1). The "/" listener went with it. */}
            </>
          )}

          {/* A tinted "Unallocated (n)" chip used to sit here while the tray was open, doubling as the
              way to close it. No other workflow puts a chip in the header — they leave by their own
              panel's Cancel or X, which this panel has too — so once the tray was entered from the menu
              like the rest, the chip was the only one of its kind and a second close for one panel.
              Removing it retired the last use of unallocatedProductsCount, which went with it. */}

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