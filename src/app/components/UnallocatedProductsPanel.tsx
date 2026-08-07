import React from 'react';
import { X, Check, Search, CheckCircle2, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
// CRITICAL FIX: Remove direct import, will receive as prop
import { DoorShelfConfig } from '../types';
import { getBinLocationDetails } from '../utils/doorUtils';
import { highlightText, highlightNDC, SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';
import ProductBadges from './ProductBadges';
import { SelectAllToggle, BadgeFilterSelect } from './ProductListControls';
import { BadgeFilter, badgeFilterLabel } from '../utils/badgeFilter';
import { filterUnallocatedProducts } from '../utils/unallocatedFilter';

interface UnallocatedProductsPanelProps {
  selectedUnallocatedProducts: string[];
  selectedBinsForAssignment: string[];
  unallocatedSearchQuery: string;
  badgeFilter: BadgeFilter;
  /** Whether the list is scoped to the ticked products. Already ANDed with the selection by the hook. */
  reviewingSelection: boolean;
  doorShelfConfig: DoorShelfConfig;
  unallocatedProducts: any[]; // CRITICAL FIX: Accept unallocated products as prop
  onClose: () => void;
  onProductSelect: (productId: string) => void;
  onSearchChange: (query: string) => void;
  onBadgeFilterChange: (filter: BadgeFilter) => void;
  onReviewSelection: () => void;
  onConfirmAssignment: () => void;
  onSelectAll: () => void;
}

export default function UnallocatedProductsPanel({
  selectedUnallocatedProducts,
  selectedBinsForAssignment,
  unallocatedSearchQuery,
  badgeFilter,
  reviewingSelection,
  doorShelfConfig,
  onClose,
  unallocatedProducts,
  onProductSelect,
  onSearchChange,
  onBadgeFilterChange,
  onReviewSelection,
  onConfirmAssignment,
  onSelectAll
}: UnallocatedProductsPanelProps) {

  // Search AND badge filter AND, while the operator is reviewing, the selection — from the shared
  // predicate the hook's Select All also calls. See utils/unallocatedFilter.ts for why the two must not
  // each own a copy of "what is visible".
  const filteredProducts = filterUnallocatedProducts(
    unallocatedProducts,
    unallocatedSearchQuery,
    badgeFilter,
    reviewingSelection ? selectedUnallocatedProducts : null
  );

  // Whether Select All has anything to act on. Named rather than inlined because it decides three
  // things about that control — its handler, its cursor and its aria state — and they must not drift.
  const hasListedProducts = filteredProducts.length > 0;

  const filterIsActive = badgeFilter !== 'all';
  // Named in the empty state, so the message says which narrowing is hiding things rather than leaving
  // the operator to notice the dropdown above it.
  const activeFilterLabel = badgeFilterLabel(badgeFilter);

  // Check if all filtered products are selected
  const allFilteredProductsSelected = hasListedProducts &&
    filteredProducts.every(product => selectedUnallocatedProducts.includes(product.id));

  // Partial selection drives the checkbox's indeterminate (minus) state.
  const someFilteredProductsSelected = filteredProducts.some(product =>
    selectedUnallocatedProducts.includes(product.id)
  );

  const isSelected = (productId: string) => selectedUnallocatedProducts.includes(productId);

  const productCount = selectedUnallocatedProducts.length;
  const binCount = selectedBinsForAssignment.length;

  // Products alone aren't enough — a target bin has to be picked before anything can be allocated.
  const canAllocate = productCount > 0 && binCount > 0;

  return (
    <div className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header, identical to AllocateProductsPanel's — the two panels are the menu's two allocation
          entries, so they should not look like two different kinds of surface. The padding always matched
          at px-4 py-3; what made this bar 8px taller was the close control being a 32px box where the
          other panel uses a 24px one, and the title being an unsized font-semibold against a specified
          16px medium.

          The close control is also a real <button> with an accessible name now, rather than a div with an
          onClick: it was reachable by neither keyboard nor screen reader. */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* The whole tray, not the filtered view. The title names what this panel IS — everything
              still waiting for a bin — and that total does not change because someone typed in the
              search box. Counting the filter made it read as a result count, so searching a product
              with eight instances left showed "(1)" and looked like seven had gone somewhere. The
              filtered figure is not lost: the list underneath is the filtered view, and its own empty
              state says when a query matches nothing. */}
          <h2 className="text-[16px] font-medium text-[#020817]">
            Unallocated Products ({unallocatedProducts.length})
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[#676b74] hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search, then a Select All checkbox row. */}
      {/* py-3, matching the header above it: 12px is the panel's vertical rhythm throughout. */}
      <div className="py-3 px-4 border-b border-gray-200 space-y-3">
        {/* Same search control as AllocateProductsPanel's, down to the leading magnifier this one was
            missing: the two panels are the menu's two allocation entries, so a search box that looks
            different in each says the two searches work differently. */}
        <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#676b74]" />
          <Input
            type="text"
            data-demo="unallocated-search"
            placeholder="Search products"
            value={unallocatedSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-[14px] pl-9 pr-9"
          />
          {/* Only once there is something to clear — an always-present X on an empty box is a control
              that does nothing. */}
          {unallocatedSearchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#676b74] hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

          {/* In the search row, matching the other allocation panel — the two are the menu's two
              allocation entries, so a control that sits somewhere different in each says the two flows
              work differently. It does more here than there (it produces this list rather than refining
              a search, §6), but it is the same kind of narrowing and belongs beside the other one. */}
          <BadgeFilterSelect
            badgeFilter={badgeFilter}
            onBadgeFilterChange={onBadgeFilterChange}
            demoId="unallocated-badge-filter"
          />
        </div>

        {/* Alone above the rows it acts on — see ProductListControls for why it stays visible and dims,
            and why these are shared components rather than the same markup in both allocation panels.

            The checkbox clears the selection on its own once everything is ticked, so a separate Clear
            Selection control would be redundant. */}
        <SelectAllToggle
          allSelected={allFilteredProductsSelected}
          someSelected={someFilteredProductsSelected}
          canSelectAll={hasListedProducts}
          onSelectAll={onSelectAll}
          demoId="unallocated-select-all"
        />
      </div>

      {/* Product list: plain rows split by dividers rather than individual cards. The checkbox and
          a light tint carry the selected state, so no border is needed. */}
      <div className="flex-1 overflow-y-auto">
        {!hasListedProducts ? (
          /* One quiet line, the same as AllocateProductsPanel's. A 48px icon over a heading over a
             sentence of advice made an ordinary non-result look like an error state — three elements and
             a page of vertical space to say what the panel beside it says in six words. The advice went
             too: "try a different name, NDC code, or keyword" only restates what the box already
             accepts.

             Three different nothings, though, and they are not interchangeable: a badge filter that
             matched nothing, a query that matched nothing, and a tray with nothing left in it because
             every product now has a bin.

             The filter comes first because it is the narrowing the operator is least likely to be
             holding in mind — they typed the query a second ago, but a filter set at the top of the
             panel silently outlives whatever they do in the search box. It names itself, so the message
             is also the instruction for undoing it. */
          <div className="p-8 text-center text-[14px] text-[#676b74]">
            {filterIsActive
              ? unallocatedSearchQuery.trim()
                ? `No ${activeFilterLabel} products match that search.`
                : `No ${activeFilterLabel} products are waiting for a bin.`
              : unallocatedSearchQuery.trim()
                ? 'No products match that search.'
                : 'Nothing to allocate — every product already has a bin.'}
          </div>
        ) : (
          <div>
            {/* The same band, wording and type as AllocateProductsPanel's — the two panels are the
                menu's two allocation entries, and this is the same act on both. No count on it: the
                footer's counter is both the number and the control that got you here, and a second
                figure invites checking whether they agree. */}
            {reviewingSelection && (
              <div className="px-4 py-2 border-b border-gray-200 bg-[#f7f7f7] text-[12px] leading-[16px] font-medium text-[#676b74]">
                Selected products
              </div>
            )}
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                data-demo="unallocated-product"
                data-product-id={product.id}
                onClick={() => onProductSelect(product.id)}
                className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-200 ${
                  isSelected(product.id) ? 'bg-[#F1F6FA]' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
                    isSelected(product.id) ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
                  }`}
                >
                  {isSelected(product.id) && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Name and badge follow BinCard's treatment: normal weight on #020817, and the
                      grey vial chip rather than a black one. */}
                  {/* Name and generic name are one block: the row's space-y separates it from the
                      badges below, but the generic name should sit directly under the name it
                      describes rather than float halfway between the two. */}
                  <div>
                    <h3 className="font-normal text-[#020817] leading-[20px] text-[14px]">
                      {highlightText(product.name, unallocatedSearchQuery, SEARCH_HIGHLIGHT_COLOR, product)}
                    </h3>

                    <p className="italic text-gray-500 leading-snug text-[14px]">
                      {product.description}
                    </p>
                  </div>

                  {/* Badges sit under the generic name, matching AllProductsPanel and the other
                      allocation panel — outside the move pipeline they get their own line (CLAUDE.md §6).

                      The shared `ProductBadges`, not a hand-written span. This row used to draw the vial
                      chip alone, so CLIMATE and CIV — which two and three of the eight tray products
                      respectively carry — were invisible in the one place the operator decides where a
                      product should go. A climate-sensitive product belongs in a fridge, and the tray was
                      the only surface not saying which ones those were. All three are derived from
                      `binProducts`, not from `product.badge`, which is 'SDV' for every tray product. */}
                  <div className="flex items-center gap-1">
                    <ProductBadges product={product} />
                  </div>

                  <div className="text-gray-500 text-[14px]">
                    {highlightNDC(product.ndc, unallocatedSearchQuery, SEARCH_HIGHLIGHT_COLOR, product)}
                    {' - '}
                    {highlightText(product.inventoryType, unallocatedSearchQuery, SEARCH_HIGHLIGHT_COLOR, product)}
                  </div>

                  {/* Show bin assignments if this product is selected and bins are assigned. Purple,
                      matching BinCard's assignment-selected ring/border (#8F48D2) and the same
                      treatment AllocateProductsPanel gives this list — one colour for "bin picked
                      for assignment" wherever it shows up. */}
                  {isSelected(product.id) && binCount > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        {selectedBinsForAssignment.map((binId) => {
                          const binLocation = getBinLocationDetails(binId, doorShelfConfig, false);
                          return binLocation ? (
                            <div key={binId} className="text-xs text-[#8F48D2] font-medium">
                              {binLocation}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Always-present action bar. The status text on the left says what is still missing, and
          Allocate stays disabled until both a product and a bin are chosen. */}
      <div className="py-3 px-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
        {/* The two counters are one button — the way to see what has been ticked, exactly as in
            AllocateProductsPanel. It is a toggle here, which that one does not need: there, typing
            returns you to the search results, but the tray's default list is the unfiltered eight and no
            keystroke asks for it, so the way back has to be the same control.

            Nothing selected yet needs no instruction — and no control, since there is nothing to look
            at — so the whole block is withheld at zero, the same as the other panel's. */}
        {productCount > 0 ? (
          <button
            type="button"
            data-demo="unallocated-review-selection"
            onClick={onReviewSelection}
            aria-expanded={reviewingSelection}
            aria-label={
              reviewingSelection
                ? 'Show all unallocated products'
                : `Review the ${productCount} selected product${productCount > 1 ? 's' : ''}`
            }
            // Negative margin so the hover tint has room without the counters shifting when the block
            // becomes a button.
            className="-mx-2 px-2 py-1 rounded-[4px] flex items-center gap-2 text-left text-[14px] leading-[20px] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-[#095192]">
                {productCount} Product{productCount > 1 ? 's' : ''} selected
              </span>
              <span className="block text-[#8F48D2]">
                {binCount === 0
                  ? 'Select bin(s) to allocate'
                  : `${binCount} Bin${binCount > 1 ? 's' : ''} selected`}
              </span>
            </span>
            {/* Rotated rather than swapped for a different glyph: it is one control in two states, and
                the turn is what says the second tap undoes the first. */}
            <ChevronRight
              className={`w-4 h-4 text-[#095192] shrink-0 transition-transform ${
                reviewingSelection ? 'rotate-90' : ''
              }`}
            />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* A way out that doesn't involve hunting for the X in the header, and the same pairing the
              allocate/unallocate panel uses — leave without allocating, or allocate. */}
          <button
            type="button"
            data-demo="unallocated-cancel"
            onClick={onClose}
            className="h-9 px-3 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div
            data-demo="unallocated-allocate"
            className={`relative rounded-[4px] shrink-0 bg-[#095192] ${
              canAllocate ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={canAllocate ? onConfirmAssignment : undefined}
          >
            <div className="box-border flex gap-2 items-center justify-center h-9 px-4">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic shrink-0 text-[14px] text-nowrap text-white">
                <p className="leading-[20px] whitespace-pre text-[14px]">Allocate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
