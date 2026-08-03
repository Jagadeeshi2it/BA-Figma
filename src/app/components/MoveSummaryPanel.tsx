import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';

/**
 * One line of "what's moving from where to where" — Review (step 3) and both halves of Move
 * (step 4) each derive their own MoveSummaryRow[] from whatever transfer state they already hold
 * locally (pendingTransfers, groupedTransfers, productGroups). There is deliberately no lifted
 * "the move" state behind this: each screen already has everything it needs, and reaching for a
 * single shared transfer object would touch the exact quantity/serial handoff the rest of the
 * pipeline treats as fragile. This panel only ever renders what it's handed.
 */
export interface MoveSummaryRow {
  key: string;
  productName: string;
  productDescription?: string;
  // Carried so the badges below can be derived the one shared way (binProducts.ts) instead of the
  // panel guessing SDV/MDV/CLIMATE/CIV itself — a product has to show the same badges here as it
  // does in the source/target cards it came from.
  ndc?: string;
  inventoryType?: string;
  fromLabel: string;
  toLabel: string;
  // null means not yet decided — step 3 stages transfers at quantity 0 before the quantity step
  // sets a real amount. Rendered as no quantity at all rather than a placeholder string: the bin
  // pairing is the news at that stage, and a repeated "not decided yet" on every line was noise.
  quantity: number | null;
  unit?: string;
  status: 'pending' | 'current' | 'done';
}

interface MoveSummaryPanelProps {
  rows: MoveSummaryRow[];
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
}

// A real group-by, not a consecutive-run merge: a product's rows can arrive interleaved with
// another product's (the operator picks things in whatever order, and step 4's own walk can visit
// the same product's several source bins non-contiguously), so grouping only ever by "does this
// row match the row right before it" silently split one product into two cards whenever something
// else came between its rows. Order is still caller-controlled — a product's group lands at the
// position of its FIRST row, so the caller's own ordering (the page's walk order) decides which
// card comes first without this function re-sorting anything.
const groupByProduct = (rows: MoveSummaryRow[]) => {
  const groups: {
    productName: string;
    productDescription?: string;
    ndc?: string;
    inventoryType?: string;
    rows: MoveSummaryRow[];
  }[] = [];
  const indexByProduct = new Map<string, number>();
  rows.forEach(row => {
    const existingIndex = indexByProduct.get(row.productName);
    if (existingIndex !== undefined) {
      groups[existingIndex].rows.push(row);
    } else {
      indexByProduct.set(row.productName, groups.length);
      groups.push({
        productName: row.productName,
        productDescription: row.productDescription,
        ndc: row.ndc,
        inventoryType: row.inventoryType,
        rows: [row]
      });
    }
  });
  return groups;
};

export default function MoveSummaryPanel({ rows, isOpen, onToggle, title = 'Move Summary' }: MoveSummaryPanelProps) {
  // No collapsed rail: the footer's own Move Summary counter is what reopens this now, so a second,
  // always-present toggle sitting in the corner just to say "closed" would be a redundant control.
  if (!isOpen) return null;

  const groups = groupByProduct(rows);

  return (
    <div className="shrink-0 w-[320px] h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[#020817]">{title}</h3>
          <p className="text-[12px] text-[#64748b]">
            {groups.length} {groups.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Close ${title}`}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[4px] hover:bg-gray-100 cursor-pointer bg-transparent border-none"
        >
          <X className="w-4 h-4 text-[#4a5565]" />
        </button>
      </div>

      {/* pb-20: on step 4, this panel sits beside a page whose own footer is fixed and runs the full
          width (including under this panel) rather than making room for it — so without this, the
          last card would scroll in behind the bar rather than above it. Harmless extra whitespace on
          Review, whose footer isn't fixed. */}
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        {groups.length === 0 ? (
          <p className="text-[13px] text-[#64748b] text-center mt-6">Nothing selected yet.</p>
        ) : (
          groups.map((group, groupIndex) => {
            const badgeIdentity = { name: group.productName, ndc: group.ndc, inventoryType: group.inventoryType };
            // The whole card gets the "current" treatment, not just the one row inside it — the row
            // highlight alone read as "displayed but not highlighted" once a product had several
            // pairings and the current one wasn't the first line the eye landed on.
            const isCurrentCard = group.rows.some(row => row.status === 'current');
            return (
              <div
                key={`${group.productName}-${groupIndex}`}
                className={`rounded-[6px] border p-3 mb-3 ${
                  isCurrentCard ? 'border-[#095192] bg-[#f0f6fc]' : 'border-gray-200'
                }`}
              >
                {/* Identity block — same shape as SourceProductCard/TargetProductCard: name, italic
                    generic name, badges, then NDC - inventory type on one line. */}
                <h4 className="font-normal text-[#020817] text-[14px] leading-[20px] truncate">
                  {group.productName}
                </h4>
                {group.productDescription && (
                  <p className="italic text-gray-500 leading-snug text-[14px] truncate">
                    {group.productDescription}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                    {getVialType(badgeIdentity)}
                  </span>
                  {hasClimateBadge(badgeIdentity) && (
                    <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
                  )}
                  {hasCivBadge(badgeIdentity) && (
                    <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
                  )}
                </div>
                <div className="text-gray-500 text-[13px] break-words mt-1">
                  {group.ndc} - {group.inventoryType}
                </div>

                {/* Merged bin pairings — one compact line per source/target pair, instead of the
                    separate full card each used to get. */}
                <div className={`mt-2 pt-2 border-t space-y-1 ${isCurrentCard ? 'border-[#dbe9f6]' : 'border-gray-100'}`}>
                  {group.rows.map(row => (
                    <div
                      key={row.key}
                      className={`flex items-center justify-between gap-2 rounded-[4px] px-1.5 py-1 text-[12px] ${
                        row.status === 'current' ? 'bg-white text-[#095192] font-medium' : 'text-[#4a5565]'
                      }`}
                    >
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <span className="truncate">{row.fromLabel}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{row.toLabel}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-1.5">
                        {row.quantity !== null && (
                          <span className="font-medium text-[#020817]">
                            {row.quantity} {pluralizeUnit(row.unit || 'vial', row.quantity)}
                          </span>
                        )}
                        {row.status === 'done' && (
                          <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">
                            Done
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
