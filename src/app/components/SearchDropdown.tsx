import React, { memo } from 'react';
import { SourcePick, sourcePickKey, hasSourcePick } from '../utils/sourcePicks';
import { Button } from './ui/button';
import { ProductSearchResult, BinSearchResult, getBinIdsForProduct } from '../utils/productSearchUtils';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

interface SearchDropdownProps {
  searchResults: ProductSearchResult[];
  /** Bins whose name matches the query. Listed above the products — see the section comment below. */
  binResults?: BinSearchResult[];
  /** What is typed in the box. Only used to say which text Highlight All should colour. */
  query?: string;
  /** Bins already picked as Move To, so a bin hit can report its own state rather than going dead. */
  targetBinIds?: string[];
  /**
   * Select/release a bin found by name. Only wired where the bin is the unit being picked.
   *
   * Takes the id and nothing else, deliberately: selection is a set of bin identities and touches no
   * query channel. Passing the name invited writing it into the highlight, which lit every namesake.
   */
  onSelectBin?: (binId: string) => void;
  /**
   * Light up bins without selecting them, BY ID. One id from a row's own Highlight Bin, every id from
   * the section's Highlight All — the two are deliberately separate acts, so the wide one has to be
   * asked for. `query` only says which text to colour in the bin's header.
   */
  onHighlightBins?: (binIds: string[], query: string) => void;
  isVisible: boolean;
  changeAllocationMode?: boolean;
  changeAllocationStep?: 1 | 2;
  // The move kind. In 'bin', the source step offers no product "Select as Source" — search only
  // locates a bin (the user then taps it). 'product' keeps it; that's how product moves pick source.
  moveMode?: 'bin' | 'product' | null;
  // Bins already picked as source/target (whichever step we're on) — matching results are
  // dropped from the list so it only ever shows what's still left to pick.
  excludeBinIds?: string[];
  /**
   * The (bin, product) pairs already picked as sources. On step 1 a bin is spent for THIS product only
   * where this product is picked in it — not merely because the bin is in the selection for some other
   * product, which used to hide a product's remaining bins entirely.
   */
  sourceProductPicks?: SourcePick[];
  // View-mode counterpart to excludeBinIds: products already clicked/selected from this same
  // search, so the list shrinks the same way it does in change allocation mode.
  viewedProductKeys?: string[];
  onSelectAllBins: (binIds: string[], productName: string) => void;
  onSelectSourceBins?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  onSelectTargetBins?: (binIds: string[], productName: string, highlightQuery?: string) => void;
  /** Take a product out of the move entirely — every bin. The row's Remove, once all its bins are picked. */
  onRemoveSourceProduct?: (product: { name?: string; ndc?: string; inventoryType?: string }) => void;
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

/**
 * What acting on a bin hit means, which is not the same in every mode — the same rule the shelf tap
 * follows (handleBinClick), stated here so the button can name it and dim itself for the right reason
 * instead of the row going quietly dead.
 *
 * `kind: 'locate'` is the fallback everywhere the bin is not the unit being picked: plain browsing, the
 * two assignment panels, and a Product move's source step. In the assignment panels that is a real
 * decision, not an omission — a bin tap there runs the E-Kit rule, the already-stocks-this-product
 * conflict check and the "pick a product first" toast, and a second route into the selection that
 * skipped all three would be a way to build a selection the panel can't use.
 */
type BinAction =
  | { kind: 'locate' }
  | { kind: 'select'; label: string }
  | { kind: 'blocked'; label: string };

const binActionFor = (
  bin: BinSearchResult,
  changeAllocationMode: boolean,
  changeAllocationStep: 1 | 2,
  moveMode: 'bin' | 'product' | null,
  sourceBinIds: string[],
  targetBinIds: string[]
): BinAction => {
  if (!changeAllocationMode) return { kind: 'locate' };

  if (changeAllocationStep === 1) {
    // The source is a product here, so the bin can only be located — same reason the shelves are inert.
    if (moveMode === 'product') return { kind: 'locate' };
    if (sourceBinIds.includes(bin.binId)) return { kind: 'select', label: 'Remove from Move From' };
    // The shelf tap requires the same, and saying so is the point: an operator sent to a bin that
    // turns out to be empty needs to be told that, not handed a button that does nothing.
    if (bin.available || bin.productCount === 0) return { kind: 'blocked', label: 'Empty — nothing to move from' };
    return { kind: 'select', label: 'Select as Move From' };
  }

  // Step 2 picks the target, which is a bin in either kind of move.
  if (sourceBinIds.includes(bin.binId)) return { kind: 'blocked', label: 'Already in Move From' };
  if (targetBinIds.includes(bin.binId)) return { kind: 'select', label: 'Remove from Move To' };
  return { kind: 'select', label: 'Select as Move To' };
};

const SearchDropdown = memo(function SearchDropdown({
  searchResults,
  binResults = [],
  query = '',
  targetBinIds = [],
  onSelectBin,
  onHighlightBins,
  isVisible,
  changeAllocationMode = false,
  changeAllocationStep = 1,
  moveMode = null,
  excludeBinIds = [],
  sourceProductPicks = [],
  viewedProductKeys = [],
  onSelectAllBins,
  onSelectSourceBins,
  onSelectTargetBins,
  onRemoveSourceProduct,
  onProductClick,
  onProductsViewed,
  onDoorClick,
  onScrollToBin,
  sourceBinIds = [],
  onAutofillSearch,
  onDismissList,
  onClose
}: SearchDropdownProps) {
  if (!isVisible || (searchResults.length === 0 && binResults.length === 0)) {
    return null;
  }

  // Which of a product's bins this step could actually still take. Anything already picked for this
  // step is spent, and on step 2 the source bins are off-limits outright: a bin can't be both where
  // the products come from and where they go. Everything downstream reads this — the list, the
  // button's count and what the click commits — so they can't disagree about what's available.
  const selectableBinIds = (result: ProductSearchResult): string[] => {
    const binIds = [...new Set(getBinIdsForProduct(result))];
    if (!changeAllocationMode) return binIds;

    // Step 2 picks bins wholesale, so what's spent is bin-level: already a target, or a source (a bin
    // can't be both ends of the same move).
    if (changeAllocationStep === 2) {
      const blocked = [...excludeBinIds, ...sourceBinIds];
      return binIds.filter(binId => !blocked.includes(binId));
    }

    // Step 1 is per (bin, product). Blocking every bin in the source selection meant one product picked
    // in a bin hid every OTHER product that bin holds: picking ALIMTA in Bin 1B and PEMETREXED in Bin 1A
    // made both bins "spent", so searching ALIMTA offered nothing even though Bin 1A's ALIMTA was
    // untouched.
    const productKey = sourcePickKey(result);
    return binIds.filter(binId => !hasSourcePick(sourceProductPicks, binId, productKey));
  };

  /**
   * Every match stays listed, always — the same rule the bin section already follows.
   *
   * A spent result used to be dropped, on the grounds that there was nothing left to select. But the
   * operator searched for that product by name; it disappearing from its own search reads as "not
   * stocked" rather than "already chosen", and it takes away the only place they could undo the pick
   * they just made. The row reports its state in its button instead — which is exactly what makes the
   * Bin move's list better to use, as the bin rows there keep offering Remove from Move From.
   */
  const visibleResults = searchResults;

  // Both modes mark what you picked. Picks made in one mode must not leak into the other — the keys
  // outlive a mode switch, since they only reset when the typed query changes and switching modes
  // leaves the query alone — so HeaderSection clears them whenever the mode or step changes.
  const isPicked = (result: ProductSearchResult) => viewedProductKeys.includes(getResultKey(result));

  // Picked cards float to the top. The list can hold dozens of matches and reopens scrolled to the
  // top, so a tick further down is a tick the user has to go hunting for. sort is stable, so the
  // search's own ordering still holds within the picked and unpicked halves.
  const orderedResults = [...visibleResults].sort(
    (a, b) => Number(isPicked(b)) - Number(isPicked(a))
  );

  /**
   * Whether the product rows are offering selection — the same condition their own button uses below.
   *
   * In a Bin move's source step they only locate, because the bin is the unit there. The header used
   * not to know that: it kept saying "Select All" and committing every match as a source, which is
   * something every row beneath it refused to do — and it appended those product groups to the
   * highlight, which that step's locator branch then spread across every bin holding any of them.
   */
  const productsAreSelectable =
    changeAllocationMode && !(moveMode === 'bin' && changeAllocationStep === 1);

  /**
   * What acting on a product hit means — the counterpart of binActionFor, and for the same reason:
   * the row has to be able to say what it is rather than vanish once it is spent.
   *
   * Step ① of a Product move deliberately carries no bin count. Picking a product there means "this
   * drug, wherever it is", so the number of bins is a consequence of the choice rather than part of
   * it — and the operator picked a product, so the button should name a product back.
   *
   * Step ② keeps its count, because there the click really is committing that many bins as targets
   * and they may be a subset: a bin already taken as a source can't also receive.
   */
  const productActionFor = (result: ProductSearchResult): BinAction => {
    if (!productsAreSelectable) return { kind: 'locate' };

    const allBins = [...new Set(getBinIdsForProduct(result))];

    if (changeAllocationStep === 1) {
      const productKey = sourcePickKey(result);
      const fullyPicked =
        allBins.length > 0 && allBins.every(binId => hasSourcePick(sourceProductPicks, binId, productKey));
      // "Remove from Move From" named an end this kind of move doesn't have — the operator picked a
      // product, not a place to take it from (see sourceEndLabel). "Remove Selection" says what it
      // undoes without naming a place, and it is honest about the breadth: the row only reads Remove
      // once the product is picked in every bin, so this takes the whole pick back.
      return fullyPicked
        ? { kind: 'select', label: 'Remove Selection' }
        : { kind: 'select', label: 'Select Product' };
    }

    const selectable = selectableBinIds(result);
    if (selectable.length > 0) {
      return { kind: 'select', label: `Select (${selectable.length} bin${selectable.length !== 1 ? 's' : ''})` };
    }
    // Two different reasons to have nothing left, and saying the wrong one is worse than saying
    // nothing: the product's bins are already targets, or — step ② only — it lives solely in bins this
    // move is taking FROM, which were never chosen as targets at all.
    return allBins.every(binId => sourceBinIds.includes(binId))
      ? { kind: 'blocked', label: 'Only stocked in the bins you are moving from' }
      : { kind: 'blocked', label: 'Already in Move To' };
  };

  // Only the rows a bulk take would actually add — same rule as the bins': never rows that are spent,
  // and never ones whose button reads Remove, or Select All would become a toggle-all.
  const bulkSelectableProducts = visibleResults.filter(result => {
    const action = productActionFor(result);
    return action.kind === 'select' && action.label.startsWith('Select');
  });

  // Only worth offering with more than one row to act on, since a single row's own button covers that
  // case. Selecting counts the rows a take would ADD — rows now stay listed once spent, so counting
  // the whole list would leave Select All offering to select nothing. Highlighting counts the whole
  // list minus what is already marked.
  const showSelectAll = productsAreSelectable
    ? bulkSelectableProducts.length > 1
    : visibleResults.length > 1 && !visibleResults.every(isPicked);

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

  // View mode only — see the row's onClick. Highlight the product, mark the row, go to where it
  // lives, name it in the search box and get the list out of the way.
  const handleProductClick = (result: ProductSearchResult) => {
    if (onProductClick) {
      onProductClick(result.name, result.ndc, result.inventoryType);
      // Replaces (not adds to) the previous pick — one product is "the" selection at a time, so
      // exactly one row carries the highlight.
      onProductsViewed?.([getResultKey(result)]);
      jumpToProduct(result);
      // The box now names what was picked and the list closes. The row keeps its marking for when
      // the user refocuses the box and the list comes back.
      onAutofillSearch?.(result.name);
    }
  };

  const handleSelectAll = () => {
    if (visibleResults.length === 0) return;

    if (productsAreSelectable) {
      // Only the rows a take would actually add. Rows stay listed once spent now, so running this over
      // the whole list would re-commit products already picked and, worse, re-append their identity
      // groups to the highlight.
      if (bulkSelectableProducts.length === 0) return;
      // Actually select every matching bin as source/target, not just preview-highlight it. Only the
      // bins this step can take — on step 2 that skips the source bins these products also live in.
      const allBinIds = Array.from(new Set(bulkSelectableProducts.flatMap(selectableBinIds)));
      const productNames = bulkSelectableProducts.map(result => result.name).join(', ');
      // Same OR-group query shape as the view-mode branch further down, so every selected
      // product's row (not just its bin) gets highlighted.
      const highlightQuery = buildHighlightQuery(bulkSelectableProducts);
      if (changeAllocationStep === 1) {
        onSelectSourceBins?.(allBinIds, productNames, highlightQuery);
      } else {
        onSelectTargetBins?.(allBinIds, productNames, highlightQuery);
      }
      // Several products just got selected across who knows how many doors — land on the first
      // one's bin so the selection isn't left off-screen.
      jumpToProduct(bulkSelectableProducts[0]);
      // Everything visible just got added — nothing left to show. Dismiss rather than merely close:
      // this also drops focus, so clicking the box brings the list back instead of staying dead.
      onDismissList?.();
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

  // A footer sentence used to stand here naming the matches that had nothing left to offer ("Already
  // selected: X, Y"), because the rows themselves had been filtered out and the empty list would
  // otherwise have read as "not stocked". The rows stay now and each states its own reason in its own
  // button, which is both more precise — the two reasons can differ per product, and the sentence had
  // to pick one for the whole list — and actionable, since the row is also where you undo it.

  /**
   * Available bins first, then the door order searchBinsByName produced.
   *
   * The list is most often read to pick a destination, and a free bin is the one that can take stock
   * without a second thought — so scanning past occupied bins to find one is work the sort can do.
   *
   * Two refinements it needs to be right rather than merely as asked:
   *
   * - **A blocked row sinks below everything**, whatever its availability. It is the one row that can't
   *   be acted on at all, so promoting it would put the least useful bin at the top.
   * - **A Bin move's source step inverts the preference**, because there an available bin is precisely
   *   the one with nothing to move — it is blocked, by the rule above, and lands at the bottom on that
   *   count alone. Nothing extra is needed for it; noting it because the two rules look contradictory
   *   until you see they never apply to the same row.
   *
   * Stable, so bins that tie keep their door order and the list still reads as a walk.
   */
  const orderedBinResults = [...binResults].sort((a, b) => {
    const rank = (bin: BinSearchResult) => {
      const action = binActionFor(bin, changeAllocationMode, changeAllocationStep, moveMode, sourceBinIds, targetBinIds);
      if (action.kind === 'blocked') return 2;
      return bin.available ? 0 : 1;
    };
    return rank(a) - rank(b);
  });

  // Locate, or select, or neither — plus the jump, which every acted-on bin gets: a bin hit is only
  // useful once the door holding it is open, and that door is usually not the one on screen.
  const handleBinAction = (bin: BinSearchResult, action: BinAction) => {
    if (action.kind === 'blocked') return;

    if (action.kind === 'select') {
      onSelectBin?.(bin.binId);
    } else {
      // This one bin, by id. Passing its NAME instead lit every bin sharing it — eight of them for
      // "Bin 1A" — which is what Highlight All is for, out of a list that had just distinguished them
      // by door. Picking one row out of eight has to mean the one.
      onHighlightBins?.([bin.binId], bin.binName);
    }

    onDoorClick?.(bin.doorName);
    onScrollToBin?.(bin.binId);

    if (action.kind === 'locate') {
      // Names the bin in the box the way a product pick names the product — and normalises what was
      // typed to the bin's real label, so "bin 1a" comes back as "Bin 1A".
      onAutofillSearch?.(bin.binName);
    } else {
      onDismissList?.();
    }
  };

  /**
   * Whether the bin rows are offering selection at all — the same condition binActionFor branches on.
   *
   * It decides which act the section header carries. Inside a move the operator is building a
   * selection, not browsing, so "highlight all of these" answers a question they are not asking;
   * the useful bulk act there is to take them. Outside one, and in a Product move's source step where
   * the bin is not the unit, there is nothing to take and highlighting is the only thing on offer.
   *
   * Deliberately not derived from how many rows are currently takeable: that number falls as bins are
   * picked, and a header that renamed itself from Select All to Highlight All partway through a
   * selection would look like the flow had changed under the operator. It disappears instead.
   */
  const binsAreSelectable =
    changeAllocationMode && !(changeAllocationStep === 1 && moveMode === 'product');

  // Only the rows a bulk take would actually add. Excludes blocked rows and ones already in the
  // selection — whose button reads Remove, and sweeping those up would make Select All a toggle-all.
  const bulkSelectableBins = orderedBinResults.filter(bin => {
    const action = binActionFor(bin, changeAllocationMode, changeAllocationStep, moveMode, sourceBinIds, targetBinIds);
    return action.kind === 'select' && action.label.startsWith('Select as');
  });

  // Take every match. Loops the single-bin handler rather than adding a bulk path of its own, so the
  // rules can't diverge: each state update is functional, so the batch applies cleanly.
  const handleSelectAllBins = () => {
    if (bulkSelectableBins.length === 0) return;
    bulkSelectableBins.forEach(bin => onSelectBin?.(bin.binId));
    onDoorClick?.(bulkSelectableBins[0].doorName);
    onScrollToBin?.(bulkSelectableBins[0].binId);
    onDismissList?.();
  };

  // Every match at once, and only when asked for. Lands on the first so the result isn't left entirely
  // off-screen, exactly as the products' Select All does. The typed query is what describes this
  // selection — there is no single name to put in the box — so the box is left alone and the list just
  // dismissed, again mirroring Select All.
  const handleHighlightAllBins = () => {
    if (binResults.length === 0) return;
    // The typed query, not any one bin's name: these matches need not share a name ("Bin 1" finds
    // 1A, 1B, 1C), and the card colours whichever part of its own label the query accounts for.
    onHighlightBins?.(orderedBinResults.map(bin => bin.binId), query);
    // The first as LISTED, so the jump lands on the row the operator's eye is already on.
    onDoorClick?.(orderedBinResults[0].doorName);
    onScrollToBin?.(orderedBinResults[0].binId);
    onDismissList?.();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#bcc3cd] rounded-[4px] shadow-lg z-[60] max-h-96 overflow-y-auto">
      <div>
        {/* Bins first. The product list answers "where is this drug"; this one answers "where is the
            bin I was told to go to" — a question with exactly one right answer, so it goes above the
            list of many. Unlike the products below, a bin hit is never dropped for being spent: a bin
            is the singular thing the operator just named, and a named thing vanishing from a search
            reads as "no such bin" rather than "already chosen". It reports its state in its button
            instead. */}
        {binResults.length > 0 && (
          <div>
            <div className="box-border content-stretch flex flex-row gap-3 items-center justify-between relative shrink-0 w-full px-4 py-3">
              <p className="block font-normal leading-[16px] not-italic text-[#020817] text-[14px] text-left">
                <span className="font-semibold">{binResults.length}</span> matching bin{binResults.length !== 1 ? 's' : ''}
              </p>
              {/* The bulk act, sharing the count's row the way the products' Select All does and
                  appearing on the same terms: only with more than one row to act on, since a single
                  row's own button already covers that case. Which act it is follows the rows beneath
                  it — Select All where they select, Highlight All where they only locate — so the
                  header can never offer something the list below it doesn't do. */}
              {(binsAreSelectable ? bulkSelectableBins.length > 1 : binResults.length > 1) && (
                <Button
                  variant="ghost"
                  onClick={binsAreSelectable ? handleSelectAllBins : handleHighlightAllBins}
                  className="bg-transparent hover:bg-transparent text-[#095192] hover:text-[#074080] hover:underline text-[14px] font-medium h-auto p-0 shrink-0"
                >
                  {binsAreSelectable ? 'Select All' : 'Highlight All'}
                </Button>
              )}
            </div>
            <div className="divide-y divide-gray-200 border-t border-gray-200">
              {orderedBinResults.map(bin => {
                const action = binActionFor(
                  bin, changeAllocationMode, changeAllocationStep, moveMode, sourceBinIds, targetBinIds
                );
                return (
                  <div key={bin.binId} className="px-4 py-4">
                    <div className="box-border content-stretch flex flex-row items-start justify-between gap-2 p-0 relative shrink-0 w-full mb-4">
                      <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
                        {/* Door first, then bin — the same one-string form the move panels and the
                            review cards use ("Door 2 - Bin 4C"), so the search names a location the
                            way every other surface names it. It also does the disambiguating: bin
                            names only have to be unique within a door. */}
                        <p className="block leading-[16px] text-[14px] font-medium break-words text-[#020817]">
                          {bin.doorName} - {bin.binName}
                        </p>
                        {/* 13px, the size every "where this lives" line uses across the app. */}
                        <p className="block leading-[16px] text-[13px] text-[#020817] break-words">
                          {bin.shelfName}, {bin.cabinetName}
                        </p>
                        <p className="block leading-[16px] text-[14px] text-[#676b74] break-words mt-1">
                          {bin.productCount === 0
                            ? 'Empty'
                            : `${bin.productCount} product${bin.productCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>

                      <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-16">
                        <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
                        <div className="flex flex-col font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-xs text-nowrap text-right">
                          <p className="block leading-[16px] whitespace-pre text-[14px]">{bin.totalQuantity}</p>
                        </div>
                        <div className="flex flex-col font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[8px] text-left text-nowrap">
                          <p className="block leading-[normal] whitespace-pre text-[10px]">{getUnit(bin.totalQuantity)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dimmed rather than recoloured when blocked — the app's rule for a secondary
                        that has nothing to do (CLAUDE.md conventions). aria-disabled, not disabled:
                        the label already carries the reason, so there's nothing for a click to
                        explain, but the state still has to reach assistive tech. */}
                    <Button
                      size="sm"
                      variant="outline"
                      data-demo="search-bin-action"
                      aria-disabled={action.kind === 'blocked'}
                      onClick={() => handleBinAction(bin, action)}
                      /* Red on `Remove from Move From`, for the reason the product rows above use it: in a
                         column where most rows offer a selection, the one that undoes one has to be
                         distinguishable by more than its label. Both lists are in the same dropdown, so a
                         red undo in one and a blue undo in the other would read as two different acts. */
                      className={`w-full bg-white text-[14px] h-10 rounded-[4px] ${
                        action.label.startsWith('Remove')
                          ? 'border-[#C6362C] text-[#C6362C] hover:bg-[#FDF2F1] hover:text-[#C6362C]'
                          : 'border-[#095192] text-[#095192] hover:bg-[#F1F6FA] hover:text-[#095192]'
                      } ${action.kind === 'blocked' ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
                    >
                      {/* Not the products' "Highlight in Bin": that means "show me this drug inside
                          whichever bins hold it". Here the bin IS the thing being shown, and the row
                          has to read as the narrow act next to Highlight All above it. */}
                      {action.kind === 'locate' ? 'Highlight Bin' : action.label}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No count when there's nothing left to list — the message below says the whole story,
            and a count with an empty list under it just reads as a contradiction. */}
        {visibleResults.length > 0 && (
          <div className={`box-border content-stretch flex flex-row gap-3 items-center justify-between relative shrink-0 w-full px-4 py-3 ${binResults.length > 0 ? 'border-t-4 border-gray-100' : ''}`}>
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
                {productsAreSelectable ? 'Select All' : 'Highlight All'}
              </Button>
            )}
          </div>
        )}

        {/* The guard is what a bins-only query needs: the component no longer returns null when the
            product search finds nothing, so a query matching only bin names must not draw an empty
            product list under the bin section. */}
        {searchResults.length > 0 && (
        // Divider-separated rows, same as the unallocated list: a list of matches reads as one list,
        // where a stack of bordered cards reads as several unrelated things.
        <div className="divide-y divide-gray-200 border-t border-gray-200">
        {orderedResults.map((result, index) => (
          <div
            key={`${result.ndc}-${result.inventoryType}-${index}`}
            // A result has exactly one way to act on it, in either mode: its own button below the
            // text — Select as Source/Target in allocation mode, a plain highlight-and-locate button
            // in view mode. Tapping the row itself used to do the view-mode action, which made the
            // same gesture mean two different things depending on mode. The row is inert everywhere
            // now, and dressed as inert — no cursor, no hover tint.
            //
            // No tint on the picked row either — same reason as the bins: the highlight colour on
            // the name and locations is the signal, and a filled background only mutes it.
            className="px-4 py-4"
          >
            {/* Product Layout - matching BinCard structure. The bottom gap always applies now: every
                row renders its own action button below this block, in both modes. */}
            <div className="box-border content-stretch flex flex-row items-start justify-between gap-2 p-0 relative shrink-0 w-full mb-4">
              <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
                {/* **Badges beside the name**, wrapping with it, rather than on their own line below.
                    Asked for: a hit is read as one thing — which product, and what handling it needs — and
                    on their own line they put a row between the name and the `NDC - inventory type` that
                    identifies it. `items-baseline` and `flex-wrap`, so a long name keeps a full line and
                    the badges drop beneath it rather than truncating it.

                    They come from the same helpers the bin rows use — keyed on name + NDC + inventory
                    type, which is exactly what a search result is grouped by, so a hit and the bin row it
                    points at always agree.

                    A picked row wears the same highlight colour the bins use for a matched product, rather
                    than a tick of its own — one visual language for "this is the one you asked about",
                    whether you're reading the list or the shelf it points at. */}
                <div className="flex items-baseline gap-1.5 flex-wrap w-full min-w-0">
                  <p
                    className={`leading-[16px] text-[14px] font-medium break-words ${
                      isPicked(result) ? 'text-[#A16207]' : 'text-[#020817]'
                    }`}
                  >
                    {result.name}
                  </p>
                  <span className="flex items-center gap-1">
                    <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                      {getVialType(result)}
                    </span>
                    {hasClimateBadge(result) && (
                      <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
                    )}
                    {hasCivBadge(result) && (
                      <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-xs text-left w-full">
                  <p className="block leading-[16px] break-words overflow-hidden text-[14px]">{result.ndc} - {result.inventoryType}</p>
                </div>
                {/* Which bins hold it — a search hit is only actionable once you know where to walk. */}
                {result.binLocations.length > 0 && (
                  <div className="flex flex-col gap-0.5 items-start justify-start mt-1 relative shrink-0 w-full">
                    {/* 13px, the size every other "where this product lives" line uses — both side panels
                        list bin locations at 13px, and this is the same fact on a different surface. It was
                        12px, which made the dropdown's locations read as a footnote to the panels' rather
                        than the same information. */}
                    {formatBinLocations(result).map(location => (
                      <p key={location} className={`block font-normal leading-[16px] not-italic text-[13px] text-left break-words ${isPicked(result) ? 'text-[#A16207]' : 'text-[#020817]'}`}>
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
            
            {/* Action Button — the source/target selector, and the row's own Remove once it is spent.
                Hidden in a Bin move's source step: there, products can't be selected, so search only
                locates the bin (button below). What it says comes from productActionFor, so the label,
                the dimming and what the click does cannot disagree. */}
            {productsAreSelectable && (() => {
              const action = productActionFor(result);
              const isRemove = action.kind === 'select' && action.label.startsWith('Remove');
              return (
                <Button
                  size="sm"
                  aria-disabled={action.kind === 'blocked'}
                  onClick={(e) => {
                    // The row itself is inert in this mode, so nothing to stop — kept so the button
                    // stays self-contained if the row ever becomes clickable again.
                    e.stopPropagation();
                    if (action.kind === 'blocked') return;

                    if (isRemove) {
                      // Takes the product out of EVERY bin, which is what the row is reporting: it only
                      // reads Remove once all of its bins are picked. Same handler the review panel's
                      // per-product Remove uses, so the two cannot drift.
                      onRemoveSourceProduct?.(result);
                      return;
                    }

                    // Only the bins this step can still take — on step 2 the product's source bins
                    // are excluded, so committing a target can't quietly re-use one of them.
                    const binIds = selectableBinIds(result);
                    // Nothing highlights this product until it's committed, so the query the bins will
                    // be highlighted by is built here, precise to this one product variant.
                    const highlightQuery = [result.name, result.ndc, result.inventoryType].filter(Boolean).join(', ');
                    if (changeAllocationStep === 1) {
                      onSelectSourceBins?.(binIds, result.name, highlightQuery);
                    } else {
                      onSelectTargetBins?.(binIds, result.name, highlightQuery);
                    }
                    // Land on the bin that was just selected — the product may well live on a door
                    // the user isn't looking at, and a selection they can't see is easy to lose track of.
                    jumpToProduct(result);
                    // The selection is made, so the list has done its job — get it out of the way
                    // rather than leaving the user to dismiss it. Dismissing (not just closing) drops
                    // focus too, so clicking the box brings it back.
                    onDismissList?.();
                  }}
                  variant="outline"
                  /**
                   * An undo reads red here, and only here.
                   *
                   * Every row in this list carries the same white-and-blue outlined button, so a row
                   * offering `Remove from Move From` / `Remove Selection` looked identical to the twenty
                   * offering `Move From` — the label was the only thing saying it went the other way, on a
                   * list the operator scans rather than reads. Red is the difference they asked for.
                   *
                   * It is a deliberate exception to the rule that `#C6362C` is for things that destroy data
                   * (§6): un-picking a product deletes nothing. What earns it is that this is the one place
                   * a selecting control and its undo sit in one column, alternating row by row — Cancel and
                   * Back, which that rule was written about, are alone in a footer with nothing to be
                   * confused with. The blocked state keeps its own colour and dims, as before.
                   */
                  className={`w-full bg-white text-[14px] h-10 rounded-[4px] ${
                    isRemove
                      ? 'border-[#C6362C] text-[#C6362C] hover:bg-[#FDF2F1] hover:text-[#C6362C]'
                      : 'border-[#095192] text-[#095192] hover:bg-[#F1F6FA] hover:text-[#095192]'
                  } ${action.kind === 'blocked' ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
                >
                  {action.label}
                </Button>
              );
            })()}

            {/* Locate-only button — highlight the product's bins and jump to one, without selecting
                anything. Used in plain view mode, and in a Bin move's source step where the user
                finds a bin by its product but then taps the bin itself to select it. */}
            {!productsAreSelectable && (
              <Button
                size="sm"
                onClick={() => handleProductClick(result)}
                variant="outline"
                className="w-full bg-white border-[#095192] text-[#095192] hover:bg-[#F1F6FA] hover:text-[#095192] text-[14px] h-10 rounded-[4px]"
              >
                Highlight in Bin
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