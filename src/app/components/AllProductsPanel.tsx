import React from 'react';
import { X, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Bin } from '../types';
import { highlightText, highlightNDC, SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';
import { consolidateBinProducts, getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

interface AllProductsPanelProps {
  bin: Bin | undefined;
  selectedDoor: string | null;
  // Highlight query from the main search, so a searched-for product still stands out in here.
  searchQuery: string;
  onProductClick?: (product: any, location: any) => void;
  // Move by Product, source step: a row here picks the product out of this bin, exactly as a row on the
  // bin card does. Without it, opening "+N more" to reach a product further down the bin dropped the
  // user on the product detail page instead — the one route out of the flow, from inside the flow.
  canPickSourceProduct?: boolean;
  onSelectSourceProduct?: (product: any) => void;
  onClose: () => void;
}

const getBinSizeDisplay = (size: string): string => {
  switch (size) {
    case 'double': return '1x2';
    case '2x2': return '2x2';
    case '2x3': return '2x3';
    case '3x3': return '3x3';
    case 'fridge': return 'Fridge';
    default: return '1x1';
  }
};

export default function AllProductsPanel({
  bin,
  selectedDoor,
  searchQuery,
  onProductClick,
  canPickSourceProduct = false,
  onSelectSourceProduct,
  onClose
}: AllProductsPanelProps) {
  // Selecting wins over navigating, same precedence as BinCard: mid-selection, a tap on a product is
  // the operator naming it, not asking to read about it.
  const picksSourceProduct = canPickSourceProduct && !!onSelectSourceProduct;
  const [panelSearch, setPanelSearch] = React.useState('');

  // A fresh bin starts with a clean filter — the previous bin's query shouldn't carry over.
  React.useEffect(() => {
    setPanelSearch('');
  }, [bin?.id]);

  if (!bin) return null;

  const products = consolidateBinProducts(bin);

  const query = panelSearch.trim().toLowerCase();
  const filteredProducts = query
    ? products.filter(product =>
        [product.name, product.ndc, product.inventoryType, product.description, product.genericName]
          .some(field => (field || '').toLowerCase().includes(query))
      )
    : products;

  return (
    <div className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">
            {bin.name} ({getBinSizeDisplay(bin.size)}) - All Products ({products.length})
          </h2>
          {selectedDoor && (
            <p className="text-sm text-gray-500">{selectedDoor}{bin.shelfName ? `, ${bin.shelfName}` : ''}</p>
          )}
        </div>
        <div
          className="bg-white relative rounded-[4px] cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
          onClick={onClose}
        >
          <X className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* A bin can hold hundreds of rows (Door 13's Main Storage holds 242), so this list needs
          its own filter — that was the real problem with showing them all in a modal. */}
      <div className="p-4 border-b border-gray-200">
        <Input
          type="text"
          placeholder="Search products"
          value={panelSearch}
          onChange={(e) => setPanelSearch(e.target.value)}
          className="w-full text-[14px]"
        />
      </div>

      {/* Product list: rows split by dividers, same treatment as the unallocated panel */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              Try searching for a different product name, NDC code, or keyword.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-start justify-between gap-3 px-4 py-4 ${
                  picksSourceProduct || onProductClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                }`}
                onClick={picksSourceProduct ? () => onSelectSourceProduct!(product) : onProductClick ? () => {
                  const location = {
                    cabinet: 'Cabinet',
                    door: selectedDoor || '',
                    bin: bin.name,
                    shelf: bin.shelfName || 'Shelf'
                  };
                  // The panel is deliberately left open: the detail page unmounts it, and App
                  // still holds the open-bin id, so Back returns the user here.
                  onProductClick(product, location);
                } : undefined}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Name and generic name are one block: the row's space-y separates it from the
                      badges below, but the generic name should sit directly under the name it
                      describes rather than float halfway between the two. */}
                  <div>
                    <h3 className="font-normal text-[#020817] leading-[20px] text-[14px]">
                      {highlightText(product.name, searchQuery, SEARCH_HIGHLIGHT_COLOR, product)}
                    </h3>

                    <p className="italic text-gray-500 leading-snug text-[14px]">
                      {product.description}
                    </p>
                  </div>

                  {/* Badges sit under the generic name, not between it and the product name */}
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

                  <div className="text-gray-500 text-[14px] break-words">
                    {highlightNDC(`${product.ndc} - ${product.inventoryType}`, searchQuery, SEARCH_HIGHLIGHT_COLOR, product)}
                  </div>
                </div>

                <div className="bg-[#f7f7f7] box-border flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-12">
                  <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
                  <div className="font-medium text-[#020817] text-[14px] leading-[16px]">{product.quantity}</div>
                  <div className="font-semibold text-[#676b74] text-[9px] leading-[normal]">{product.unit}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
