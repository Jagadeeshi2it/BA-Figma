import React from 'react';
import { X, Check, Search, Minus, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
// CRITICAL FIX: Remove direct import, will receive as prop
import { DoorShelfConfig } from '../types';
import { getBinLocationDetails } from '../utils/doorUtils';
import { highlightText, highlightNDC, SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';
import { getVialType } from '../utils/binProducts';

interface UnallocatedProductsPanelProps {
  selectedUnallocatedProducts: string[];
  selectedBinsForAssignment: string[];
  unallocatedSearchQuery: string;
  doorShelfConfig: DoorShelfConfig;
  unallocatedProducts: any[]; // CRITICAL FIX: Accept unallocated products as prop
  onClose: () => void;
  onProductSelect: (productId: string) => void;
  onSearchChange: (query: string) => void;
  onConfirmAssignment: () => void;
  onSelectAll: () => void;
}

export default function UnallocatedProductsPanel({
  selectedUnallocatedProducts,
  selectedBinsForAssignment,
  unallocatedSearchQuery,
  doorShelfConfig,
  unallocatedProducts,
  onClose,
  onProductSelect,
  onSearchChange,
  onConfirmAssignment,
  onSelectAll
}: UnallocatedProductsPanelProps) {

  // Filter products based on search query
  const filteredProducts = unallocatedProducts.filter(product => {
    if (!unallocatedSearchQuery.trim()) return true;

    const query = unallocatedSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.ndc.toLowerCase().includes(query) ||
      product.source.toLowerCase().includes(query)
    );
  });

  // Check if all filtered products are selected
  const allFilteredProductsSelected = filteredProducts.length > 0 &&
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
          <h2 className="text-[16px] font-medium text-[#020817]">
            Unallocated Products ({filteredProducts.length})
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

        {/* The checkbox clears the selection on its own once everything is ticked, so a separate
            Clear Selection control would be redundant.

            Withheld when nothing is listed, matching AllocateProductsPanel: "Select All" over an empty
            list has nothing to select, and a control that cannot act reads as broken rather than as
            unavailable. It sat above the no-results message before, offering to tick nothing. */}
        {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2 cursor-pointer w-fit" onClick={onSelectAll}>
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
        )}
      </div>

      {/* Product list: plain rows split by dividers rather than individual cards. The checkbox and
          a light tint carry the selected state, so no border is needed. */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          /* One quiet line, the same as AllocateProductsPanel's. A 48px icon over a heading over a
             sentence of advice made an ordinary non-result look like an error state — three elements and
             a page of vertical space to say what the panel beside it says in six words. The advice went
             too: "try a different name, NDC code, or keyword" only restates what the box already
             accepts.

             Two different nothings, though, and they are not interchangeable: a query that matched
             nothing, versus a tray with nothing left in it because every product now has a bin. */
          <div className="p-8 text-center text-[14px] text-[#676b74]">
            {unallocatedSearchQuery.trim()
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

                  {/* Badge sits under the generic name, matching AllProductsPanel. Derived rather
                      than read from product.badge, which is 'SDV' for all eight tray products. */}
                  <div className="flex items-center gap-1">
                    <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                      {getVialType(product)}
                    </span>
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
