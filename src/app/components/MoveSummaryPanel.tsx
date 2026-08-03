import React from 'react';
import { X, ArrowRight, LogOut, LogIn } from 'lucide-react';
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

/**
 * Which half of the move the operator is physically doing right now.
 *
 * A pairing line reads the same on both halves of step 4 — "Bin B · Door 1 → Bin C · Door 1" — but
 * the operator's job is the opposite one on each: taking stock out of Bin B, then putting it into
 * Bin C. Once a product spans several source bins AND several target bins, the line alone can't say
 * which of those bins is the one in their hands. So the stage is stated in the header and the bin
 * that's actually in play is marked on the current line, rather than leaving both ends looking equal.
 *
 * 'review' is step 3, where nothing is being handled yet and there is no active end to point at.
 */
export type MoveSummaryStage = 'review' | 'source' | 'target';

interface MoveSummaryPanelProps {
  rows: MoveSummaryRow[];
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  stage?: MoveSummaryStage;
}

const STAGE_COPY: Record<Exclude<MoveSummaryStage, 'review'>, { label: string; icon: typeof LogOut }> = {
  source: { label: 'Taking from source bin', icon: LogOut },
  target: { label: 'Placing in target bin', icon: LogIn }
};

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

export default function MoveSummaryPanel({
  rows,
  isOpen,
  onToggle,
  title = 'Move Summary',
  stage = 'review'
}: MoveSummaryPanelProps) {
  // No collapsed rail: the footer's own Move Summary counter is what reopens this now, so a second,
  // always-present toggle sitting in the corner just to say "closed" would be a redundant control.
  if (!isOpen) return null;

  const groups = groupByProduct(rows);
  const stageCopy = stage === 'review' ? null : STAGE_COPY[stage];
  const StageIcon = stageCopy?.icon;

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

      {/* Which half of the move is in the operator's hands right now. Carries the same icon the
          footer's own Source/Target cells use, so the two chrome surfaces name this the same way.
          Absent on Review, where nothing is being handled yet. */}
      {stageCopy && StageIcon && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 bg-[#F1F6FA] shrink-0">
          <StageIcon className="w-3.5 h-3.5 text-[#095192] shrink-0" />
          <span className="text-[12px] font-medium text-[#095192]">{stageCopy.label}</span>
        </div>
      )}

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
                  {group.rows.map(row => {
                    // On the current line, the end the operator is actually at is filled in; the
                    // other end stays plain, so a product spread over several bins still shows
                    // WHICH bin is in play rather than two ends that look equally active.
                    const activeEnd = row.status === 'current' ? stage : 'review';
                    const endClass = (isActive: boolean) =>
                      isActive
                        ? 'truncate bg-[#095192] text-white rounded-[3px] px-1 py-0.5'
                        : 'truncate';
                    return (
                    <div
                      key={row.key}
                      className={`flex items-center justify-between gap-2 rounded-[4px] px-1.5 py-1 text-[12px] ${
                        row.status === 'current' ? 'bg-white text-[#095192] font-medium' : 'text-[#4a5565]'
                      }`}
                    >
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <span className={endClass(activeEnd === 'source')}>{row.fromLabel}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className={endClass(activeEnd === 'target')}>{row.toLabel}</span>
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
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
