import React from 'react';
import { X, Search, CircleMinus } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { doesProductMatchSearch } from '../utils/textHighlight';
import { consolidateBinProducts, getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

interface AllocationSelectionPanelProps {
  role: 'source' | 'target';
  // Bins already resolved to objects (name, size, products, shelfName, location) by App.
  bins: any[];
  // The `|`-joined query behind a search-driven source selection. Where it exists it says which
  // products are actually being moved, so a source bin holding forty other lots doesn't drown them.
  sourceQuery: string;
  // Drop one bin from this half of the selection — under a product in the source view, on the bin
  // header in the target view.
  onRemoveBin: (binId: string) => void;
  // Drop a product from the selection entirely. Source only: the selection tracks products by
  // identity, not per bin, so there is no such thing as removing one "from this bin alone" — and a
  // target bin's rows are its existing contents, which aren't part of the selection to begin with.
  onRemoveProduct?: (product: { name?: string; ndc?: string; inventoryType?: string }) => void;
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

const binLabel = (bin: any): string =>
  [bin.name, [bin.shelfName, trimCabinet(bin.location)].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' - ');

// One product identity, wherever it lives in the selection.
const productIdentity = (product: any): string =>
  `${product.name}|${product.ndc}|${product.inventoryType}`.toLowerCase();

// Takes something out of the selection. A circled minus rather than a cross: a cross is what closes
// this panel (top right), and the same glyph doing two different jobs on one surface is worth
// avoiding. Red from the start, since removal is the one destructive thing in here.
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[#C6362C] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
    >
      <CircleMinus className="w-4 h-4" />
    </button>
  );
}

export default function AllocationSelectionPanel({
  role,
  bins,
  sourceQuery,
  onRemoveBin,
  onRemoveProduct,
  onClose
}: AllocationSelectionPanelProps) {
  const [panelSearch, setPanelSearch] = React.useState('');

  // Switching between the two halves of the selection starts with a clean filter.
  React.useEffect(() => {
    setPanelSearch('');
  }, [role]);

  const isSource = role === 'source';
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

  // The selection turned inside out: one entry per product, carrying the bins it sits in. This is the
  // shape the unallocated list uses — the product first, its bins listed under it — and it answers
  // the question a source selection poses: what am I moving, and where is it?
  const productGroups = React.useMemo(() => {
    const byIdentity = new Map<string, { product: any; totalQuantity: number; locations: { bin: any; quantity: number }[]; trackedByQuery: boolean }>();
    groups.forEach(({ bin, rows }) => {
      rows.forEach(product => {
        const key = productIdentity(product);
        const entry = byIdentity.get(key) ?? {
          product,
          totalQuantity: 0,
          locations: [],
          // Whether removing this product is a real, representable action: the source query has an
          // OR-group naming this exact identity. Products that only show up because they happen to
          // share a hand-picked bin with something else were never tracked at that level — there is
          // no "remove just this one" for them, only "remove the bin" — so offering the button would
          // promise an action that silently does nothing.
          trackedByQuery: isSource && sourceQuery.trim() ? doesProductMatchSearch(product, sourceQuery) : false
        };
        entry.totalQuantity += product.quantity ?? 0;
        entry.locations.push({ bin, quantity: product.quantity ?? 0 });
        byIdentity.set(key, entry);
      });
    });
    return [...byIdentity.values()];
  }, [groups, isSource, sourceQuery]);

  // Distinct products, not rows: one drug spread across three bins is one product listed three
  // times, and counting the rows would contradict the bar that opened this panel.
  const productTotal = productGroups.length;

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
        ) : isSource ? (
          /* Source is always product-first: it's the half where the products *are* the selection, so
             "what am I moving, and where is it?" is the only question worth answering. Target stays
             bin-first below — its rows are the bins' existing contents rather than a selection, and
             a target selection is usually several empty bins, which a product-first list can't show
             at all. One fixed view each, so there's nothing to choose. */
          <div className="divide-y divide-gray-200">
            {productGroups.map(({ product, totalQuantity, locations, trackedByQuery }) => (
              <div key={productIdentity(product)} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Name and generic name are one block: the row's space-y separates it from the
                        badges below, but the generic name should sit directly under the name it
                        describes rather than float halfway between the two. */}
                    <div>
                      <h3 className="font-normal leading-[20px] text-[14px] text-[#020817]">
                        {product.name}
                      </h3>
                      {/* The generic name, same italic treatment the unallocated list and the history
                          table give it — the display name alone doesn't say what the drug is. */}
                      {(product.genericName || product.description) && (
                        <p className="italic text-gray-500 leading-snug text-[14px]">
                          {product.genericName || product.description}
                        </p>
                      )}
                    </div>

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

                  {/* The total across every bin below, so the number answers "how much of this am I
                      moving?" rather than repeating one bin's share. */}
                  <div className="bg-[#f7f7f7] border border-[#e9e9e9] rounded flex flex-col items-center justify-center p-[4px] shrink-0 w-16">
                    <p className="text-[14px] leading-[16px] font-medium text-[#020817]">{totalQuantity}</p>
                    <p className="text-[10px] leading-[normal] font-semibold text-[#676b74]">{product.unit}</p>
                  </div>

                  {/* Only where removal is a real, representable action — see trackedByQuery. A
                      product that merely shares a hand-picked bin with something else has no
                      per-product state to remove; its bin-level control below is the one that
                      actually does something. */}
                  {onRemoveProduct && trackedByQuery && (
                    <RemoveButton
                      label={`Remove ${product.name} from the selection`}
                      onClick={() => onRemoveProduct(product)}
                    />
                  )}
                </div>

                {/* Its bins listed underneath, the same treatment the unallocated list gives a
                    product's assigned bins — with each bin's own share, since that's the part the
                    total above can't tell you. */}
                <Separator className="my-2" />
                <div className="space-y-1">
                  {locations.map(({ bin, quantity }) => (
                    <div
                      key={bin.id}
                      className="flex items-baseline justify-between gap-2 text-[12px] leading-[16px] font-medium text-[#020817]"
                    >
                      <span className="truncate">{binLabel(bin)}</span>
                      <span className="ml-auto shrink-0 text-[#676b74] font-normal">
                        {quantity} {product.unit}
                      </span>
                      <RemoveButton
                        label={`Remove ${bin.name} from the selection`}
                        onClick={() => onRemoveBin(bin.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          visibleGroups.map(({ bin, rows, scoped, totalInBin }) => (
            <div key={bin.id}>
              {/* Bin header sticks so the rows below it always have an owner while scrolling. */}
              <div className="sticky top-0 z-10 bg-[#F7F8FA] border-y border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] leading-[20px] font-semibold text-[#020817] truncate">
                    {bin.name} <span className="text-[#7A7D85] font-normal">({getBinSizeDisplay(bin.size)})</span>
                  </p>
                  <p className="ml-auto text-[12px] leading-[16px] text-[#676b74] shrink-0">
                    {[bin.shelfName, trimCabinet(bin.location)].filter(Boolean).join(', ')}
                  </p>
                  <RemoveButton
                    label={`Remove ${bin.name} from the selection`}
                    onClick={() => onRemoveBin(bin.id)}
                  />
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
                        {/* Name and generic name are one block: the row's space-y separates it from the
                            badges below, but the generic name should sit directly under the name it
                            describes rather than float halfway between the two. */}
                        <div>
                          <h3 className="font-normal leading-[20px] text-[14px] text-[#020817]">
                            {product.name}
                          </h3>
                          {(product.genericName || product.description) && (
                            <p className="italic text-gray-500 leading-snug text-[14px]">
                              {product.genericName || product.description}
                            </p>
                          )}
                        </div>

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
