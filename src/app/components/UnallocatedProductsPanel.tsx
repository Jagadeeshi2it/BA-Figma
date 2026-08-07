import React from 'react';
import { X, Check, Search, Minus, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
// CRITICAL FIX: Remove direct import, will receive as prop
import { DoorShelfConfig } from '../types';
import { getBinLocationDetails } from '../utils/doorUtils';
import { highlightText, highlightNDC, SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';
import ProductBadges from './ProductBadges';
import { BadgeFilter, BADGE_FILTER_OPTIONS, filterUnallocatedProducts } from '../utils/unallocatedFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UnallocatedProductsPanelProps {
  selectedUnallocatedProducts: string[];
  selectedBinsForAssignment: string[];
  unallocatedSearchQuery: string;
  badgeFilter: BadgeFilter;
  doorShelfConfig: DoorShelfConfig;
  unallocatedProducts: any[]; // CRITICAL FIX: Accept unallocated products as prop
  onClose: () => void;
  onProductSelect: (productId: string) => void;
  onSearchChange: (query: string) => void;
  onBadgeFilterChange: (filter: BadgeFilter) => void;
  onConfirmAssignment: () => void;
  onSelectAll: () => void;
}

export default function UnallocatedProductsPanel({
  selectedUnallocatedProducts,
  selectedBinsForAssignment,
  unallocatedSearchQuery,
  badgeFilter,
  doorShelfConfig,
  unallocatedProducts,
  onClose,
  onProductSelect,
  onSearchChange,
  onBadgeFilterChange,
  onConfirmAssignment,
  onSelectAll
}: UnallocatedProductsPanelProps) {

  // Search AND badge filter, from the shared predicate the hook's Select All also calls — see
  // utils/unallocatedFilter.ts for why the two must not each own a copy of "what is visible".
  const filteredProducts = filterUnallocatedProducts(
    unallocatedProducts,
    unallocatedSearchQuery,
    badgeFilter
  );

  // Whether Select All has anything to act on. Named rather than inlined because it decides three
  // things about that control — its handler, its cursor and its aria state — and they must not drift.
  const hasListedProducts = filteredProducts.length > 0;

  const filterIsActive = badgeFilter !== 'all';
  // Named in the empty state, so the message says which narrowing is hiding things rather than leaving
  // the operator to notice the dropdown above it.
  const activeFilterLabel = BADGE_FILTER_OPTIONS.find(option => option.value === badgeFilter)?.label ?? '';

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
        <div className="relative">
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

        {/* Select All on the left, the badge filter opposite it. The pairing is the workflow: narrow to
            a kind, then take all of it. Most climate-sensitive stock goes to a fridge, so "show me the
            Climate products and tick them" is the single most common way this tray gets emptied, and it
            was previously eight rows to read and eight taps.

            The checkbox clears the selection on its own once everything is ticked, so a separate Clear
            Selection control would be redundant.

            **Both controls stay put when the list is empty; Select All dims instead of vanishing.** It
            used to be withheld — the reasoning being that a control which cannot act reads as broken
            rather than unavailable. That holds where the control is alone on its row and the row can go
            with it. It does not hold here: this row also carries the filter, which must stay reachable
            precisely when the list is empty (it is usually what emptied it, so it is the only control
            that can undo it). So the row renders either way, and withholding the checkbox only made it
            appear and disappear beside a control that never moves. Dimmed in place says the same
            "nothing to select" without the layout shifting under the operator mid-task.

            This is the one place the two allocation panels' shared design diverges, and the difference
            is in the rows rather than the panels: AllocateProductsPanel has no filter, so its whole
            control row can leave without anything jumping — and it opens with nothing listed, so an
            always-present Select All there would greet the operator as a dead control. */}
        <div className="flex items-center justify-between gap-3">
          <div
            data-demo="unallocated-select-all"
            role="checkbox"
            aria-checked={allFilteredProductsSelected}
            // Not the `disabled` attribute — this is a div, so it would do nothing. `aria-disabled`
            // carries the state and dropping the handler carries the behaviour, which is the same split
            // FooterButton's blocked state uses (CLAUDE.md §6).
            aria-disabled={!hasListedProducts}
            onClick={hasListedProducts ? onSelectAll : undefined}
            className={`flex items-center gap-2 w-fit ${
              hasListedProducts ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
                someFilteredProductsSelected
                  ? 'bg-[#095192]'
                  : 'border border-gray-300 bg-white'
              }`}
            >
              {allFilteredProductsSelected ? (
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              ) : someFilteredProductsSelected ? (
                <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              ) : null}
            </div>
            <span className="text-[14px] text-gray-900">Select All</span>
          </div>

          <Select value={badgeFilter} onValueChange={value => onBadgeFilterChange(value as BadgeFilter)}>
            <SelectTrigger
              size="sm"
              data-demo="unallocated-badge-filter"
              aria-label="Filter by badge"
              // Green when narrowed, exactly as `Bins Available(n)` goes green when on: this app already
              // has a colour for "a view filter is active", and a second one would make two filters look
              // like two kinds of control. `#15803D` on the text rather than the stroke's own green —
              // #22C55E is 2.3:1 at this size, under the ~4.5:1 the app holds text to.
              className={`w-[150px] shrink-0 text-[14px] ${
                filterIsActive ? 'border-green-500 text-[#15803D]' : ''
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BADGE_FILTER_OPTIONS.map(option => (
                // No count, and never disabled on an empty result — an option that cannot be picked
                // removes the way to ask "is there any CIV stock waiting?". The empty state names the
                // filter, so an empty result cannot be mistaken for an empty tray.
                <SelectItem
                  key={option.value}
                  value={option.value}
                  // Anchored per option rather than by position or label: the Allocate Product
                  // walkthrough picks `Climate` by name, and reordering the list or rewording an option
                  // must not silently send it somewhere else.
                  data-demo={`unallocated-filter-${option.value}`}
                  className="text-[14px]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        )}
      </div>

      {/* Always-present action bar. The status text on the left says what is still missing, and
          Allocate stays disabled until both a product and a bin are chosen. */}
      <div className="py-3 px-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
        {/* Nothing selected yet needs no instruction — the disabled button already says so. */}
        <div className="text-[14px] leading-[20px]">
          {productCount > 0 && (
            <>
              <p className="text-[#095192]">
                {productCount} Product{productCount > 1 ? 's' : ''} selected
              </p>
              {binCount === 0 ? (
                <p className="text-[#8F48D2]">Select bin(s) to allocate</p>
              ) : (
                <p className="text-[#8F48D2]">
                  {binCount} Bin{binCount > 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </div>

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
