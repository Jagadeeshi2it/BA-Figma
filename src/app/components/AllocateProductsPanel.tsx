import React, { useMemo, useState } from 'react';
import { X, Search, CircleMinus, Check, Minus, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { getBinLocationDetails } from '../utils/doorUtils';
import { listAllProducts, searchProducts, ProductSearchResult } from '../utils/productSearchUtils';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { DoorShelfConfig } from '../types';

interface AllocateProductsPanelProps {
  doorShelfConfig: DoorShelfConfig;
  // Bins tapped on the canvas, owned by the same channel the unallocated-products flow uses.
  selectedBinsForAssignment: string[];
  onConfirmAssignment: (products: ProductSearchResult[], binIds: string[]) => void;
  onUnallocate: (productKey: ProductSearchResult, binId: string) => void;
  onClose: () => void;
}

const productKeyOf = (product: ProductSearchResult) => `${product.ndc}|${product.inventoryType}`;

function ProductBadges({ product }: { product: any }) {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
        {getVialType(product)}
      </span>
      {hasClimateBadge(product) && (
        <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
      )}
      {hasCivBadge(product) && (
        <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
      )}
    </div>
  );
}

/**
 * Allocate / Unallocate, as one list rather than two tabs.
 *
 * Both halves answer the same question — which bins does this product live in? — so splitting them
 * would force the user to declare which one they wanted before they had found the product and seen
 * the answer. Often you don't know until you look: a drug turns out to sit in three bins, one of
 * them empty, and the thing to do becomes obvious only then. A tab would have made that a wrong
 * turn. The menu that opens this panel already names both operations, so nothing is hidden by
 * having one list.
 *
 * Assignment is multi-select, because clearing a delivery into bins is a batch job. Release is
 * per-location, because "unallocate" means one specific bin stops holding one specific product —
 * there is no sensible batch reading of it — and it is only offered where the location is empty.
 */
export default function AllocateProductsPanel({
  doorShelfConfig,
  selectedBinsForAssignment,
  onConfirmAssignment,
  onUnallocate,
  onClose
}: AllocateProductsPanelProps) {
  const [query, setQuery] = useState('');
  const [emptyOnly, setEmptyOnly] = useState(false);
  // The picked products themselves, not their keys. Keys plus a lookup in `results` looked
  // equivalent, but `results` changes with every search — so a product picked under one query
  // silently vanished from the selection as soon as the query moved on, which is the reset. Holding
  // the objects makes the selection independent of what happens to be listed, the way the
  // unallocated tray's own selection is independent of its filter.
  const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);

  const hasQuery = query.trim().length > 0;

  const results = useMemo(() => {
    // Nothing until asked for. Opening straight onto all 262 products made this a catalogue to
    // scroll rather than a tool — you arrive already knowing which product you mean. The filter is
    // the one exception: it IS a way of asking, and its whole point is finding products you could
    // not have named in advance.
    if (!hasQuery && !emptyOnly) return [];

    const base = hasQuery
      ? searchProducts(doorShelfConfig, query)
      : listAllProducts(doorShelfConfig);

    // Products holding nothing anywhere. Every bin such a product occupies is empty by definition,
    // so the whole row is releasable — which is what makes this the shortlist for unallocating
    // rather than just a way of narrowing the catalogue.
    return emptyOnly ? base.filter(product => product.totalQuantity === 0) : base;
  }, [doorShelfConfig, query, emptyOnly, hasQuery]);

  const selectedKeys = useMemo(() => new Set(selectedProducts.map(productKeyOf)), [selectedProducts]);

  const toggleProduct = (product: ProductSearchResult) => {
    const key = productKeyOf(product);
    setSelectedProducts(previous =>
      previous.some(candidate => productKeyOf(candidate) === key)
        ? previous.filter(candidate => productKeyOf(candidate) !== key)
        : [...previous, product]
    );
  };

  // Select All acts on what is listed, not on the catalogue — the filter and the search are how the
  // user says which products they mean, so ticking "all" of something they cannot see would be a
  // different act than the one the label describes. Its box therefore reflects the visible rows,
  // while the footer counts everything picked across every search.
  const allVisibleSelected = results.length > 0 && results.every(product => selectedKeys.has(productKeyOf(product)));
  const someVisibleSelected = results.some(product => selectedKeys.has(productKeyOf(product)));

  const toggleAll = () => {
    const visible = new Set(results.map(productKeyOf));
    setSelectedProducts(previous =>
      // Ticking everything and clearing it are the same tap, so there is no separate Clear. Only the
      // visible rows are touched; picks made under an earlier search stay put.
      someVisibleSelected
        ? previous.filter(candidate => !visible.has(productKeyOf(candidate)))
        : [
            ...previous,
            ...results.filter(product => !previous.some(c => productKeyOf(c) === productKeyOf(product)))
          ]
    );
  };

  const canConfirm = selectedProducts.length > 0 && selectedBinsForAssignment.length > 0;

  const productCount = selectedProducts.length;
  const binCount = selectedBinsForAssignment.length;

  return (
    <div className="fixed inset-y-0 right-0 w-[440px] bg-white border-l border-gray-200 shadow-lg z-[70] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-medium text-[#020817]">Allocate / Unallocate</h2>
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

      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#676b74]" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search products in this cabinet"
            className="pl-9"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Same control as the unallocated list: ticking everything and clearing it are the same
              tap, so no separate Clear. Withheld when the list is empty — there is nothing to
              select, and a control that cannot act reads as broken rather than as unavailable. */}
          {results.length > 0 ? (
            <div className="flex items-center gap-2 cursor-pointer w-fit" onClick={toggleAll}>
              <div
                className={`w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
                  someVisibleSelected ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
                }`}
              >
                {allVisibleSelected ? (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                ) : someVisibleSelected ? (
                  <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                ) : null}
              </div>
              <span className="text-[14px] text-gray-900">Select All</span>
            </div>
          ) : (
            <span />
          )}

          {/* A view of the same list, not a mode — which is the whole reason this panel doesn't need
              tabs. It narrows to what can actually be released, without reading every product. */}
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={emptyOnly}
              onChange={event => setEmptyOnly(event.target.checked)}
              className="w-4 h-4 accent-[#095192] cursor-pointer"
            />
            <span className="text-[13px] text-[#020817]">Only products with 0 inventory</span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-[#676b74]">
            {!hasQuery && !emptyOnly
              ? 'Search for a product, or filter to the ones sitting at 0 inventory.'
              : emptyOnly
                ? 'No products are sitting at 0 inventory.'
                : 'No products match that search.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map(product => {
              const key = productKeyOf(product);
              const isSelected = selectedKeys.has(key);

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select ${product.name} for assignment`}
                  onClick={() => toggleProduct(product)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleProduct(product);
                    }
                  }}
                  className={`px-4 py-4 cursor-pointer transition-colors duration-200 ${
                    isSelected ? 'bg-[#F1F6FA]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Same square as the unallocated list rather than a native checkbox — the whole
                        row is the control here too, and a real checkbox invites aiming at the box. */}
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
                        isSelected ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Display name and generic name are one block, badges below both — the shape
                          the bin rows and the other side panels use. */}
                      <div>
                        <h3 className="font-normal leading-[20px] text-[14px] text-[#020817]">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="italic text-gray-500 leading-snug text-[14px]">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <ProductBadges product={product} />
                      <div className="text-gray-500 text-[14px] break-words">
                        {product.ndc} - {product.inventoryType}
                      </div>

                    </div>

                    {/* Total across every location, in the same figure box the other side panels
                        use — so the number answers "how much of this is in the cabinet?" rather than
                        repeating one bin's share. */}
                    <div className="bg-[#f7f7f7] box-border flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-12">
                      <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
                      <div className="font-medium text-[#020817] text-[14px] leading-[16px]">
                        {product.totalQuantity}
                      </div>
                      <div className="font-semibold text-[#676b74] text-[9px] leading-[normal]">
                        {pluralizeUnit('vial', product.totalQuantity)}
                      </div>
                    </div>
                  </div>

                  {/* Where it lives today, spanning the row's full width so each bin's quantity
                      lines up under the total above it — they were boxed into the text column and
                      stopped short of it. Indented to the product name: the tick box belongs to the
                      row, not to the locations. An empty location can be released from here; a
                      stocked one shows what stands in the way rather than offering a dead control,
                      since the quantity has to be moved out first. */}
                  <div className="pt-2 ml-8 space-y-1">
                        {product.binLocations.map(location => {
                          const isEmpty = location.quantity === 0;
                          return (
                            <div
                              key={location.binId}
                              className="flex items-center justify-between gap-2 text-[13px]"
                            >
                              <span className="text-[#020817] min-w-0 truncate">
                                {location.binName} - {location.shelfName}, {location.doorName}
                              </span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span className={isEmpty ? 'text-[#676b74]' : 'text-[#020817]'}>
                                  {location.quantity} {pluralizeUnit('vial', location.quantity)}
                                </span>
                                {isEmpty ? (
                                  <button
                                    type="button"
                                    aria-label={`Unallocate ${product.name} from ${location.binName}`}
                                    title={`Unallocate ${product.name} from ${location.binName}`}
                                    onClick={event => {
                                      // The row itself toggles selection; releasing a bin is a
                                      // different act and must not also tick the product.
                                      event.stopPropagation();
                                      onUnallocate(product, location.binId);
                                    }}
                                    className="w-6 h-6 rounded flex items-center justify-center text-[#C6362C] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                                  >
                                    <CircleMinus className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="w-6 h-6" aria-hidden="true" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                  </div>

                  {/* Where it is about to go, once bins have been tapped — same treatment as the
                      unallocated tray, blue and below the product, so a picked row shows the whole
                      pending act: what it holds now, and what it is being given. Only on picked
                      rows: the bins belong to the selection, not to every product on screen. */}
                  {isSelected && selectedBinsForAssignment.length > 0 && (
                    <div className="ml-8">
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        {selectedBinsForAssignment.map(binId => {
                          const location = getBinLocationDetails(binId, doorShelfConfig, false);
                          return location ? (
                            <div key={binId} className="text-xs text-[#095192] font-medium">
                              {location}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Same action bar as the unallocated tray: the counters on the left say what has been
          gathered and what is still missing, and Allocate stays disabled until both halves exist.
          The two halves are collected on different surfaces — products in here, bins out on the
          shelves — so a single disabled button could not say which one was outstanding.
          Cancel sits beside Allocate rather than across the bar, so the counters own the left. */}
      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
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
                <p className="text-[#095192]">
                  {binCount} Bin{binCount > 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div
            className={`relative rounded-[4px] shrink-0 bg-[#095192] ${
              canConfirm ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={
              canConfirm
                ? () => {
                    onConfirmAssignment(selectedProducts, selectedBinsForAssignment);
                    setSelectedProducts([]);
                  }
                : undefined
            }
          >
            <div className="box-border flex gap-2 items-center justify-center px-4 py-2">
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
