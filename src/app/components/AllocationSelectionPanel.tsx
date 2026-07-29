import React from 'react';
import { X, Search } from 'lucide-react';
import { Input } from './ui/input';
import { doesProductMatchSearch, SOURCE_HIGHLIGHT_COLOR, TARGET_HIGHLIGHT_COLOR } from '../utils/textHighlight';
import { consolidateBinProducts, getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

interface AllocationSelectionPanelProps {
  role: 'source' | 'target';
  // Bins already resolved to objects (name, size, products, shelfName, location) by App.
  bins: any[];
  // The `|`-joined query behind a search-driven source selection. Where it exists it says which
  // products are actually being moved, so a source bin holding forty other lots doesn't drown them.
  sourceQuery: string;
  onClose: () => void;
}

const getBinSizeDisplay = (size: string): string => {
  switch (size) {
    case 'double': return '1x2';
    case '2x2': return '2x2';
    case '2x3': return '2x3';
    case '3x3': return '3x3';
    case 'fridge': return 'Fridge';
    case 'floor': return 'Floor';
    default: return '1x1';
  }
};

// "Door 3, Cabinet 1" as App builds it, minus the cabinet — the same trim the unallocated panel uses.
const trimCabinet = (location: string | undefined): string =>
  (location || '').split(',')[0].trim();

export default function AllocationSelectionPanel({
  role,
  bins,
  sourceQuery,
  onClose
}: AllocationSelectionPanelProps) {
  const [panelSearch, setPanelSearch] = React.useState('');

  // Switching between the two halves of the selection starts with a clean filter.
  React.useEffect(() => {
    setPanelSearch('');
  }, [role]);

  const isSource = role === 'source';
  const highlightColor = isSource ? SOURCE_HIGHLIGHT_COLOR : TARGET_HIGHLIGHT_COLOR;
  const query = panelSearch.trim().toLowerCase();

  // One entry per selected bin, carrying the rows worth showing for it. A source bin shows the
  // products being moved out of it; a target bin shows what it already holds, which is the thing
  // worth checking before sending more product into it.
  const groups = React.useMemo(() => {
    return bins.map(bin => {
      const all = consolidateBinProducts(bin);
      const moving = isSource && sourceQuery.trim()
        ? all.filter(product => doesProductMatchSearch(product, sourceQuery))
        : [];
      // Fall back to everything when the query matches nothing in this bin — better to show the
      // bin's contents than an empty group that reads as "this bin is empty".
      const rows = moving.length > 0 ? moving : all;
      const filtered = query
        ? rows.filter(product =>
            [product.name, product.ndc, product.inventoryType, product.description, product.genericName]
              .some(field => (field || '').toLowerCase().includes(query))
          )
        : rows;
      return { bin, rows: filtered, scoped: moving.length > 0, totalInBin: all.length };
    });
  }, [bins, isSource, sourceQuery, query]);

  const visibleGroups = query ? groups.filter(group => group.rows.length > 0) : groups;

  // Distinct products, not rows: one drug spread across three bins is one product listed three
  // times, and counting the rows would contradict the bar that opened this panel.
  const productTotal = new Set(
    groups.flatMap(group =>
      group.rows.map(product => `${product.name}|${product.ndc}|${product.inventoryType}`.toLowerCase())
    )
  ).size;

  return (
    <div className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-[16px] leading-[24px]">
            {isSource ? 'Source' : 'Target'} Selection
          </h2>
          <p className="text-sm text-gray-500">
            {bins.length} bin{bins.length !== 1 ? 's' : ''}
            {productTotal > 0 && ` · ${productTotal} product${productTotal !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div
          className="bg-white relative rounded-[4px] cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
          onClick={onClose}
        >
          <X className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <Input
          type="text"
          placeholder="Search products"
          value={panelSearch}
          onChange={(e) => setPanelSearch(e.target.value)}
          className="w-full text-[14px]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {bins.length === 0 ? (
          <div className="text-center py-8 px-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {isSource ? 'source' : 'target'} bins yet
            </h3>
            <p className="text-gray-600">
              Pick bins on the shelves, or search for a product and select it {isSource ? 'as source' : 'as target'}.
            </p>
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              Try searching for a different product name, NDC code, or keyword.
            </p>
          </div>
        ) : (
          visibleGroups.map(({ bin, rows, scoped, totalInBin }) => (
            <div key={bin.id}>
              {/* Bin header sticks so the rows below it always have an owner while scrolling. */}
              <div className="sticky top-0 z-10 bg-[#F7F8FA] border-y border-gray-200 px-4 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[14px] leading-[20px] font-semibold text-[#020817] truncate">
                    {bin.name} <span className="text-[#7A7D85] font-normal">({getBinSizeDisplay(bin.size)})</span>
                  </p>
                  <p className="text-[12px] leading-[16px] text-[#676b74] shrink-0">
                    {[bin.shelfName, trimCabinet(bin.location)].filter(Boolean).join(', ')}
                  </p>
                </div>
                {/* Says why the list is short, so a scoped bin doesn't look like a partial read. */}
                {scoped && (
                  <p className="text-[12px] leading-[16px] text-[#676b74] mt-0.5">
                    Moving {rows.length} of {totalInBin} product{totalInBin !== 1 ? 's' : ''} in this bin
                  </p>
                )}
              </div>

              {bin.available ? (
                <div className="px-4 py-4 text-[14px] text-gray-500">Available bin — currently empty</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {rows.map(product => (
                    <div key={product.id} className="flex items-start justify-between gap-3 px-4 py-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Same colour this role paints on the shelves, so a row here and the bin it
                            came from are recognisably the same selection. */}
                        <h3 className="font-normal leading-[20px] text-[14px]" style={{ color: highlightColor }}>
                          {product.name}
                        </h3>

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

                        <div className="text-gray-500 text-[14px]">
                          {product.ndc} - {product.inventoryType}
                        </div>
                      </div>

                      <div className="bg-[#f7f7f7] border border-[#e9e9e9] rounded flex flex-col items-center justify-center p-[4px] shrink-0 w-16">
                        <p className="text-[14px] leading-[16px] font-medium text-[#020817]">{product.quantity}</p>
                        <p className="text-[10px] leading-[normal] font-semibold text-[#676b74]">{product.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
