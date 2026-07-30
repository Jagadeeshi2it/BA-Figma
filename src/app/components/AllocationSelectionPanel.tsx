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
  // Empty this half of the selection outright — source bins and their product scope, or target bins.
  onRemoveAll: () => void;
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

// The identifying block of a row — shared so a product listed on its own and the same product listed
// inside an expanded bin are visibly the same thing, and so a bin row can borrow the exact treatment.
function RowDetails({
  title,
  titleSuffix,
  subtitle,
  subtitleItalic = false,
  children
}: {
  title: string;
  titleSuffix?: React.ReactNode;
  subtitle?: string;
  subtitleItalic?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      {/* Title and subtitle are one block: the row's space-y separates it from whatever follows, but
          the subtitle should sit directly under the line it describes rather than float between. */}
      <div>
        <h3 className="font-normal leading-[20px] text-[14px] text-[#020817]">
          {title}
          {titleSuffix}
        </h3>
        {subtitle && (
          <p className={`text-gray-500 leading-snug text-[14px] ${subtitleItalic ? 'italic' : ''}`}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// The boxed figure on the right of a row: a quantity for a product, a product count for a bin.
function RowFigure({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-[#f7f7f7] border border-[#e9e9e9] rounded flex flex-col items-center justify-center p-[4px] shrink-0 w-16">
      <p className="text-[14px] leading-[16px] font-medium text-[#020817]">{value}</p>
      <p className="text-[10px] leading-[normal] font-semibold text-[#676b74]">{label}</p>
    </div>
  );
}

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
  onRemoveAll,
  onClose
}: AllocationSelectionPanelProps) {
  const [panelSearch, setPanelSearch] = React.useState('');
  // Bins whose contents the user has asked to see. Collapsed by default: a bin picked off the shelf
  // was picked as a unit, so its name, place and how much is in it is the whole answer most of the
  // time — the products are detail to reach for, not detail to wade through.
  const [expandedBins, setExpandedBins] = React.useState<string[]>([]);

  const toggleBin = (binId: string) =>
    setExpandedBins(previous =>
      previous.includes(binId) ? previous.filter(id => id !== binId) : [...previous, binId]
    );

  // Switching between the two halves of the selection starts with a clean filter, and nothing
  // held open from the other half.
  React.useEffect(() => {
    setPanelSearch('');
    setExpandedBins([]);
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

  // Two ways a bin ends up in this selection, and each gets the nesting that answers the question it
  // actually poses. Search for a product and commit it as source, and `scoped` is true — the bin was
  // picked *because of* that product, so "what am I moving, and where is it?" is what matters, and
  // the product belongs on top with its bins underneath. Click a bin directly on the shelf and
  // nothing scopes it — the bin itself was the decision, so it stays bin-first with everything it
  // holds listed inside it, same as target bins always are (a destination is picked for itself, not
  // for a product, so target rows never carry a scoped flag at all). A single source selection can
  // freely mix both — some products searched for, other bins grabbed by hand — so this splits on
  // `scoped` rather than picking one nesting for the whole panel.
  const scopedGroups = visibleGroups.filter(group => group.scoped);
  const unscopedGroups = visibleGroups.filter(group => !group.scoped);

  // The selection turned inside out: one entry per product, carrying the bins it sits in. This is the
  // shape the unallocated list uses — the product first, its bins listed under it — and it answers
  // the question a source selection poses: what am I moving, and where is it? Built only from scoped
  // groups — a hand-picked bin gets its own entry in the list instead, not folded into these.
  const productGroups = React.useMemo(() => {
    // No trackedByQuery flag needed here any more: every row reaching this map already came from a
    // scoped bin, meaning it already passed doesProductMatchSearch to be in `rows` at all — removal
    // is unconditionally representable for anything that shows up as a product entry. It's the
    // hand-picked bins where a product might have no per-product state to remove, and those never
    // build this map in the first place.
    const byIdentity = new Map<string, { product: any; totalQuantity: number; locations: { bin: any; quantity: number }[] }>();
    scopedGroups.forEach(({ bin, rows }) => {
      rows.forEach(product => {
        const key = productIdentity(product);
        const entry = byIdentity.get(key) ?? { product, totalQuantity: 0, locations: [] };
        entry.totalQuantity += product.quantity ?? 0;
        entry.locations.push({ bin, quantity: product.quantity ?? 0 });
        byIdentity.set(key, entry);
      });
    });
    return [...byIdentity.values()];
  }, [scopedGroups]);

  // Distinct products, not rows: one drug spread across three bins is one product listed three
  // times, and counting the rows would contradict the bar that opened this panel.
  const productTotal = productGroups.length;

  // One list, newest first. `bins` arrives in the order bins were added to the selection, which makes
  // that array the record of what happened when — so a product's recency is the latest bin its own
  // selection contributed (all of them land together on one "Select as Source"), and a hand-picked
  // bin's is simply its own position. Sorting both by that interleaves the two kinds correctly
  // without needing to timestamp anything, and it's why no grouping labels are needed: the newest
  // thing you did is at the top whichever kind it was.
  const entries = React.useMemo(() => {
    const positionOf = new Map(bins.map((bin, index) => [bin.id, index]));
    const productEntries = productGroups.map(entry => ({
      kind: 'product' as const,
      key: `product:${productIdentity(entry.product)}`,
      recency: Math.max(...entry.locations.map(location => positionOf.get(location.bin.id) ?? -1)),
      entry
    }));
    const binEntries = unscopedGroups.map(group => ({
      kind: 'bin' as const,
      key: `bin:${group.bin.id}`,
      recency: positionOf.get(group.bin.id) ?? -1,
      group
    }));
    return [...productEntries, ...binEntries].sort((a, b) => b.recency - a.recency);
  }, [bins, productGroups, unscopedGroups]);

  return (
    <>
      {/* Dims everything behind the panel, and closes on click — with the scrim covering the bottom
          bar, the Source/Target button that opened this can't be used to toggle it shut again, so the
          scrim and the X are the two ways out. Sits just under the panel's own layer.
          z-[70]/z-[65] clear every other fixed layer in the app: the search dropdown at z-[60] and
          the toast container at z-50. */}
      <div
        className="fixed inset-0 bg-black/50 z-[65]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 w-[440px] bg-white border-l border-gray-200 shadow-lg z-[70] flex flex-col">
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
            <div className="divide-y divide-gray-200">
              {entries.map(item =>
                item.kind === 'product' ? (
                  <div key={item.key} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <RowDetails
                        title={item.entry.product.name}
                        subtitle={item.entry.product.genericName || item.entry.product.description}
                        subtitleItalic
                      >
                        <ProductBadges product={item.entry.product} />
                        <div className="text-gray-500 text-[14px]">
                          {item.entry.product.ndc} - {item.entry.product.inventoryType}
                        </div>
                      </RowDetails>

                      {/* The total across every bin below, so the number answers "how much of this am I
                          moving?" rather than repeating one bin's share. */}
                      <RowFigure value={item.entry.totalQuantity} label={item.entry.product.unit} />

                      {onRemoveProduct && (
                        <RemoveButton
                          label={`Remove ${item.entry.product.name} from the selection`}
                          onClick={() => onRemoveProduct(item.entry.product)}
                        />
                      )}
                    </div>

                    {/* Its bins listed underneath, the same treatment the unallocated list gives a
                        product's assigned bins — with each bin's own share, since that's the part the
                        total above can't tell you. */}
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      {item.entry.locations.map(({ bin, quantity }) => (
                        <div
                          key={bin.id}
                          className="flex items-baseline justify-between gap-2 text-[12px] leading-[16px] font-medium text-[#020817]"
                        >
                          <span className="truncate">{binLabel(bin)}</span>
                          <span className="ml-auto shrink-0 text-[#676b74] font-normal">
                            {quantity} {item.entry.product.unit}
                          </span>
                          <RemoveButton
                            label={`Remove ${bin.name} from the selection`}
                            onClick={() => onRemoveBin(bin.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={item.key} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Same shape as a product row above — a bin picked as a unit is one entry in the
                          selection just as a product is, so it reads as a peer rather than as a
                          differently-shaped container. */}
                      <RowDetails
                        title={item.group.bin.name}
                        titleSuffix={
                          <span className="text-[#7A7D85]"> ({getBinSizeDisplay(item.group.bin.size)})</span>
                        }
                        subtitle={[item.group.bin.shelfName, trimCabinet(item.group.bin.location)]
                          .filter(Boolean)
                          .join(', ')}
                      />

                      <RowFigure
                        value={item.group.totalInBin}
                        label={item.group.totalInBin === 1 ? 'product' : 'products'}
                      />

                      <RemoveButton
                        label={`Remove ${item.group.bin.name} from the selection`}
                        onClick={() => onRemoveBin(item.group.bin.id)}
                      />
                    </div>

                    {item.group.bin.available ? (
                      <>
                        <Separator className="my-2" />
                        <p className="text-[12px] leading-[16px] text-[#676b74]">
                          Available bin — currently empty
                        </p>
                      </>
                    ) : (
                      <>
                        <Separator className="my-2" />
                        {/* An active panel search forces the contents open: the match it found is in
                            here, and reporting a hit while hiding it would be worse than not filtering
                            at all. Otherwise it's the user's toggle. */}
                        {query ? (
                          <p className="text-[12px] leading-[16px] text-[#676b74]">
                            {item.group.rows.length} matching product
                            {item.group.rows.length !== 1 ? 's' : ''} in this bin
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleBin(item.group.bin.id)}
                            className="text-[12px] leading-[16px] font-medium text-[#095192] hover:underline cursor-pointer"
                          >
                            {expandedBins.includes(item.group.bin.id)
                              ? 'Hide products'
                              : `View ${item.group.totalInBin} product${item.group.totalInBin !== 1 ? 's' : ''}`}
                          </button>
                        )}

                        {(query || expandedBins.includes(item.group.bin.id)) && (
                          <div className="mt-2 space-y-3">
                            {item.group.rows.map(product => (
                              <div key={product.id} className="flex items-start justify-between gap-3">
                                <RowDetails
                                  title={product.name}
                                  subtitle={product.genericName || product.description}
                                  subtitleItalic
                                >
                                  <ProductBadges product={product} />
                                  <div className="text-gray-500 text-[14px]">
                                    {product.ndc} - {product.inventoryType}
                                  </div>
                                </RowDetails>
                                <RowFigure value={product.quantity} label={product.unit} />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Always present, like the unallocated panel's footer: a panel you can act in shouldn't make
            you hunt for the way out, and "how do I undo all of this" is the question a review screen
            invites. Remove all empties this half — App's effect then closes the panel, since a panel
            reviewing nothing has nothing to review. */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRemoveAll}
            disabled={bins.length === 0}
            className={`rounded-[4px] text-[14px] leading-[20px] px-3 py-2 whitespace-nowrap transition-colors border border-[#C6362C] text-[#C6362C] ${
              bins.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FDF2F2] cursor-pointer'
            }`}
          >
            Remove all
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] text-[14px] leading-[20px] px-4 py-2 whitespace-nowrap bg-[#095192] text-white hover:bg-[#074080] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
