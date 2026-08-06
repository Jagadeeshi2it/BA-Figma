import React from 'react';
import { X, ArrowRight, LogOut, LogIn, Lock, Unlock, Package, Check, Route as RouteIcon } from 'lucide-react';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import ProductBadges from './ProductBadges';
import { DoorVisit, RouteStop } from '../utils/moveRoute';

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
  // A row is one source→target pairing. The panel doesn't render them as flat pairs, though: it
  // nests them, grouping a product's rows under their shared source bin, so a bin feeding three
  // targets states itself once with its destinations beneath it. Bin and door are kept apart only so
  // the panel can join them itself ("Bin 1B - Door 1") — nesting freed the width that forced them
  // onto two lines, since each label now gets a row of its own rather than sharing one.
  fromLabel: string;
  fromDoor?: string;
  toLabel: string;
  toDoor?: string;
  // What leaves this SOURCE bin. Repeated across every row sharing that source (it's one figure for
  // the bin, not per destination), so the panel takes it from the first and states it once.
  sourceQuantity?: number | null;
  // What lands in THIS target bin. null means not yet decided — while taking at the source, how the
  // amount divides between the targets is still the operator's call, and a 0 would read as a
  // decision already made.
  quantity: number | null;
  unit?: string;
  // Which bin the operator is physically at. Exactly one of these is true across the whole panel:
  // the source bin while taking, the target bin while placing. Drives the bold.
  isCurrentSource?: boolean;
  isCurrentTarget?: boolean;
  // The operator chose not to move this product (Skip Product on the quantity page). It stays in the
  // panel rather than disappearing from it: a product that was on the list at Review and is simply
  // absent by the placement half reads as the app having lost it. Its bins and quantities are dropped,
  // though — there is no move left to describe, and a from → to line under a skipped product would
  // state a move that isn't happening.
  isSkipped?: boolean;
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
export type MoveSummaryStage = 'review' | 'source' | 'target' | 'route';

/**
 * What the panel needs to draw the itinerary (STEP4-GUIDANCE.md §6). The route itself comes straight from
 * planMoveRoute; everything else here is progress through it.
 */
export interface MoveSummaryRouteView {
  visits: DoorVisit[];
  /** The stop in the operator's hands. Bold, and its door visit is the expanded one. */
  currentStopKey: string | null;
  /** Stops already worked. Their door visits collapse to one line — 320px does not fit five expanded. */
  doneStopKeys: string[];
  /** 1-based position of the current stop across the whole route, for "stop n of N". */
  stopNumber: number;
  stopCount: number;
  /** The one unlocked door, from useCabinetAccess. Never more than one (§1). */
  openDoor: string | null;
  /**
   * Taken but not yet placed. New state the route introduces: between a take and its place the stock is
   * in neither bin, and without stating it the panel cannot account for it (§6).
   */
  staged: Array<{ productKey: string; productName: string; quantity: number; unit?: string }>;
}

interface MoveSummaryPanelProps {
  rows: MoveSummaryRow[];
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  stage?: MoveSummaryStage;
  /**
   * Required when stage is 'route'. The route is the panel's primary structure in step ④ — it answers
   * "where am I and where next", which is the whole reason the panel exists there — while `rows` still
   * supplies the per-product totals beneath it, because the product view never disappears (§6).
   */
  route?: MoveSummaryRouteView;
}

const STAGE_COPY: Record<Exclude<MoveSummaryStage, 'review' | 'route'>, { label: string; icon: typeof LogOut }> = {
  source: { label: 'Take qty from the bin you are moving from', icon: LogOut },
  target: { label: 'Place qty in the bin you are moving to', icon: LogIn }
};

/** What the operator does at a stop, in the words the stop's own screen uses. */
const stopVerb = (stop: RouteStop): string => {
  const kinds = new Set(stop.actions.map(action => action.kind));
  if (kinds.has('take') && kinds.has('place')) return 'Take, then place';
  return kinds.has('take') ? 'Take' : 'Place';
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

/**
 * The itinerary: door visits, each holding its bin stops, in route order (STEP4-GUIDANCE.md §6).
 *
 * Door VISITS are the grouping key, not doors. A door caught in a precedence cycle is legitimately
 * visited twice (§5), and merging those two into one group would tell the operator they can do both while
 * it is open — the one thing the constraint forbids.
 */
function RouteItinerary({ route }: { route: MoveSummaryRouteView }) {
  const done = new Set(route.doneStopKeys);

  return (
    <>
      {route.visits.map((visit, visitIndex) => {
        const stopsDone = visit.stops.every(stop => done.has(stop.key));
        const holdsCurrent = visit.stops.some(stop => stop.key === route.currentStopKey);
        const isFridge = visit.storage === 'fridge';
        const isOpen = !isFridge && route.openDoor === visit.doorName && holdsCurrent;

        // A finished visit collapses to one line. At 320px a five-door route does not fit expanded, and
        // the visit being worked is the only one whose stops the operator needs.
        const collapsed = stopsDone && !holdsCurrent;

        return (
          <div key={visit.key}>
            {/* The boundary between visits IS the lock — an instruction the operator performs, not
                bookkeeping (§6). Given its own line rather than left to whitespace. */}
            {visitIndex > 0 && !isFridge && (
              <div className="flex items-center gap-1.5 py-1.5 text-[11px] text-[#94a3b8]">
                <Lock className="w-3 h-3 shrink-0" />
                <span>lock the previous door first</span>
              </div>
            )}

            <div
              className={`rounded-[6px] border px-3 py-2 mb-2 ${
                holdsCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  {isFridge ? (
                    <Package className="w-3.5 h-3.5 shrink-0 text-[#64748b]" />
                  ) : isOpen ? (
                    <Unlock className="w-3.5 h-3.5 shrink-0 text-[#12805C]" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0 text-[#94a3b8]" />
                  )}
                  <span
                    className={`truncate text-[13px] ${
                      holdsCurrent ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
                    }`}
                  >
                    {visit.doorName}
                    {/* Named as a return, so a door appearing twice cannot read as one long visit. */}
                    {visit.visitIndex > 1 && (
                      <span className="font-normal text-[#64748b]"> · return</span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-[#64748b] whitespace-nowrap">
                  {/* A fridge says so instead of reporting a lock state it does not have (§1). */}
                  {isFridge
                    ? 'fridge · no lock'
                    : isOpen
                      ? 'open now'
                      : collapsed
                        ? `done · ${visit.stops.length} stop${visit.stops.length === 1 ? '' : 's'}`
                        : 'locked'}
                </span>
              </div>

              {!collapsed && (
                <div className="mt-1.5 space-y-1">
                  {visit.stops.map(stop => {
                    const isCurrent = stop.key === route.currentStopKey;
                    const isDone = done.has(stop.key);
                    return (
                      <div key={stop.key} className="flex items-start justify-between gap-2 text-[12px]">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {/* Exactly one bin is lit, which is what the bold says — the same
                              "you are here" the product view uses, so the two agree. */}
                          {isCurrent ? (
                            <span className="w-3 shrink-0 text-[#095192] text-center leading-none">▸</span>
                          ) : isDone ? (
                            <Check className="w-3 h-3 shrink-0 text-[#12805C]" />
                          ) : (
                            <span className="w-3 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              isCurrent ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
                            }`}
                          >
                            {stop.binName}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-[#64748b] whitespace-nowrap">
                          {stopVerb(stop)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function MoveSummaryPanel({
  rows,
  isOpen,
  onToggle,
  title = 'Move List',
  stage = 'review',
  route
}: MoveSummaryPanelProps) {
  // No collapsed rail: the footer's own Move Summary counter is what reopens this now, so a second,
  // always-present toggle sitting in the corner just to say "closed" would be a redundant control.
  if (!isOpen) return null;

  const groups = groupByProduct(rows);

  // A product's rows, gathered under the source bin they leave from. Same first-occurrence ordering
  // as groupByProduct, so the caller's walk order still decides what reads first.
  const groupBySourceBin = (productRows: MoveSummaryRow[]) => {
    const bins: { label: string; door?: string; rows: MoveSummaryRow[] }[] = [];
    const indexByBin = new Map<string, number>();
    productRows.forEach(row => {
      // Keyed on bin AND door — the same bin name exists behind every door.
      const key = `${row.fromLabel}|${row.fromDoor ?? ''}`;
      const existing = indexByBin.get(key);
      if (existing !== undefined) {
        bins[existing].rows.push(row);
      } else {
        indexByBin.set(key, bins.length);
        bins.push({ label: row.fromLabel, door: row.fromDoor, rows: [row] });
      }
    });
    return bins;
  };

  // "Bin 1B - Door 1". Joined here rather than by each caller so every row reads the same way, and so
  // a label with no door to name (a summarised end) simply drops the suffix.
  const binLabel = (label: string, door?: string) => (door ? `${label} - ${door}` : label);

  // Just the amount being moved. This carried the History page's "-20 → 180" shape for a while, but
  // what the bin held before and what it ends up holding aren't the operator's business on this
  // panel — they're mid-move, and the figure they need is how much to pick up or put down. The +/-
  // went with it: the sign only earned its place as part of that arithmetic, and the stage banner
  // and the source→target nesting already say which way the stock is going.
  //
  // null stays null — an undecided amount renders as nothing at all, rather than a 0 that would read
  // as a decision already made.
  const quantityText = (qty: number | null | undefined, unit?: string) =>
    qty == null ? null : `${qty} ${pluralizeUnit(unit || 'vial', qty)}`;

  const isRouteStage = stage === 'route' && !!route;
  const stageCopy =
    stage === 'review' || stage === 'route' ? null : STAGE_COPY[stage as 'source' | 'target'];
  const StageIcon = stageCopy?.icon;

  // Each line gets the badge for ITS OWN act: stock is TAKEN out of a source bin and MOVED once it's
  // in a target bin. One badge used to be chosen per stage and hung on the target lines regardless,
  // so on the taking half a target bin read "Taken" — announcing, against a bin nothing had reached
  // yet, an act belonging to its parent.
  //
  // A source bin's "Taken" persists onto the placement half rather than being dropped there. Every
  // quantity in the move is taken at the source before any of it is carried (that's the shape of step
  // ④), so by the time the operator is placing, every source line is genuinely done — and keeping the
  // badge lets the panel read the same across both halves instead of appearing to forget.
  const sourceTakenBadge = (row: MoveSummaryRow) =>
    stage === 'target' || (stage === 'source' && row.status === 'done') ? 'Taken' : null;
  const targetMovedBadge = (row: MoveSummaryRow) =>
    stage === 'target' && row.status === 'done' ? 'Moved' : null;

  const doneBadge = (label: string) => (
    <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">
      {label}
    </span>
  );

  // One destination line. Extracted because it renders in two places now — indented under its source
  // bin when a product feeds several targets, and once at the foot of the card when every source
  // feeds the same one — and the two must not be able to drift apart.
  const renderTargetLine = (row: MoveSummaryRow, key: string) => {
    const targetText = quantityText(row.quantity, row.unit);
    return (
      <div key={key} className="flex items-center justify-between gap-2 text-[12px] mt-0.5 pl-2">
        <span className="flex items-center gap-1 min-w-0">
          <ArrowRight className="w-3 h-3 shrink-0 text-[#94a3b8]" />
          <span
            className={`truncate ${
              row.isCurrentTarget ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
            }`}
          >
            {binLabel(row.toLabel, row.toDoor)}
          </span>
        </span>
        {/* Quantity placed, and "Moved" only once it actually has been — this bin's own act, so
            nothing appears here while the operator is still taking stock out at the source. */}
        <span className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
          {targetText && <span className="font-medium text-[#020817]">{targetText}</span>}
          {targetMovedBadge(row) && doneBadge(targetMovedBadge(row)!)}
        </span>
      </div>
    );
  };

  // Grey, not green: nothing was accomplished here, so it can't wear the same badge as Taken/Moved.
  const skippedBadge = (
    <span className="text-[10px] font-semibold text-[#64748b] bg-[#F1F5F9] rounded-full px-2 py-0.5 shrink-0">
      Skipped
    </span>
  );

  return (
    <div className="shrink-0 w-[320px] h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[#020817]">{title}</h3>
          {/* In step ④ the walk is stops, so that is what the count reports — the footer cell that opens
              this panel says the same. Products are counted in their own section below. */}
          <p className="text-[12px] text-[#64748b]">
            {isRouteStage
              ? `${route!.visits.filter(v => v.storage === 'cabinet').length} door${
                  route!.visits.filter(v => v.storage === 'cabinet').length === 1 ? '' : 's'
                } · stop ${route!.stopNumber} of ${route!.stopCount}`
              : `${groups.length} ${groups.length === 1 ? 'product' : 'products'}`}
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

      {/* No "taking" / "placing" banner under a route: those were phases, and a route has none — a stop
          can place before a later stop takes (§2). What the operator is doing is a property of the stop
          they are at, and the itinerary says it on that stop's own line. */}
      {isRouteStage && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 bg-[#F1F6FA] shrink-0">
          <RouteIcon className="w-3.5 h-3.5 text-[#095192] shrink-0" />
          <span className="text-[12px] font-medium text-[#095192]">
            {route!.openDoor ? `${route!.openDoor} is open` : 'All doors locked'}
          </span>
        </div>
      )}

      {/* pb-20: on step 4, this panel sits beside a page whose own footer is fixed and runs the full
          width (including under this panel) rather than making room for it — so without this, the
          last card would scroll in behind the bar rather than above it. Harmless extra whitespace on
          Review, whose footer isn't fixed. */}
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        {isRouteStage ? (
          <>
            <RouteItinerary route={route!} />

            {/* Taken but not yet placed. Stock in neither bin is otherwise unaccounted for on screen —
                and this line is also the panel's proof that interleaving is safe, since the operator can
                see exactly what they are carrying (§6). */}
            {route!.staged.length > 0 && (
              <div className="mt-3 rounded-[6px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569] uppercase tracking-wide">
                  <Package className="w-3 h-3 shrink-0" />
                  On the counter
                </div>
                <div className="mt-1.5 space-y-1">
                  {route!.staged.map(item => (
                    <div key={item.productKey} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate text-[#4a5565]">{item.productName}</span>
                      <span className="shrink-0 font-medium text-[#020817] whitespace-nowrap">
                        {item.quantity} {pluralizeUnit(item.unit || 'vial', item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The product view NEVER disappears (§6). The route answers "where am I"; it cannot answer
                "where is all my ALIMTA going", and that question does not stop being asked mid-move. One
                compact progress row each — not a repeat of the route's detail, since the route already
                names products on every stop line. */}
            {groups.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
                  Products
                </p>
                <div className="space-y-1.5">
                  {groups.map((group, groupIndex) => {
                    const skipped = group.rows.length > 0 && group.rows.every(row => row.isSkipped);
                    // Taken is per source bin, so it is summed once per bin rather than per pairing —
                    // the same reason the nested view states a source's figure once (§3).
                    const takenByBin = new Map<string, number>();
                    group.rows.forEach(row => {
                      if (row.status === 'done' && row.sourceQuantity != null) {
                        takenByBin.set(`${row.fromLabel}|${row.fromDoor ?? ''}`, row.sourceQuantity);
                      }
                    });
                    const totalByBin = new Map<string, number>();
                    group.rows.forEach(row => {
                      if (row.sourceQuantity != null) {
                        totalByBin.set(`${row.fromLabel}|${row.fromDoor ?? ''}`, row.sourceQuantity);
                      }
                    });
                    const taken = Array.from(takenByBin.values()).reduce((sum, n) => sum + n, 0);
                    const total = Array.from(totalByBin.values()).reduce((sum, n) => sum + n, 0);
                    const placed = group.rows
                      .filter(row => row.status === 'done' && row.quantity != null)
                      .reduce((sum, row) => sum + (row.quantity ?? 0), 0);

                    return (
                      <div key={`${group.productName}-${groupIndex}`} className="text-[12px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[#020817]">{group.productName}</span>
                          {skipped && (
                            <span className="shrink-0 text-[10px] font-semibold text-[#64748b] bg-[#F1F5F9] rounded-full px-2 py-0.5">
                              Skipped
                            </span>
                          )}
                        </div>
                        {!skipped && (
                          <div className="text-[11px] text-[#64748b]">
                            {taken} of {total} taken · {placed} placed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : groups.length === 0 ? (
          <p className="text-[13px] text-[#64748b] text-center mt-6">Nothing selected yet.</p>
        ) : (
          groups.map((group, groupIndex) => {
            const badgeIdentity = { name: group.productName, ndc: group.ndc, inventoryType: group.inventoryType };
            // The whole card gets the "current" treatment, not just the one row inside it — the row
            // highlight alone read as "displayed but not highlighted" once a product had several
            // pairings and the current one wasn't the first line the eye landed on.
            const isCurrentCard = group.rows.some(row => row.status === 'current');
            // A skipped product's rows are all skipped — it is skipped as a product, not per bin.
            const isSkippedCard = group.rows.length > 0 && group.rows.every(row => row.isSkipped);
            // Every source of this product feeding one and the same bin. Keyed on bin AND door, as
            // everywhere else — the same bin name exists behind every door. The row is kept, not just
            // the label: the destination's own quantity, badge and "you are here" bold all come off
            // it, and they're identical across the sources that share it.
            const distinctTargets = new Map(
              group.rows.map(row => [`${row.toLabel}|${row.toDoor ?? ''}`, row])
            );
            // Only worth collecting when there is more than one source to collect: a lone source with
            // a lone target has nothing repeated, and pulling its destination out from under it would
            // add a separator between two lines that belong together.
            const sourceBinCount = new Set(
              group.rows.map(row => `${row.fromLabel}|${row.fromDoor ?? ''}`)
            ).size;
            const singleTarget = distinctTargets.size === 1 && sourceBinCount > 1
              ? Array.from(distinctTargets.values())[0]
              : null;
            return (
              <div
                key={`${group.productName}-${groupIndex}`}
                className={`rounded-[6px] border p-3 mb-3 ${
                  isSkippedCard
                    ? 'border-gray-200 bg-[#f8fafc]'
                    : isCurrentCard
                      ? 'border-[#095192] bg-[#f0f6fc]'
                      : 'border-gray-200'
                }`}
              >
                {/* Identity block — same shape as SourceProductCard/TargetProductCard: name, italic
                    generic name, badges, then NDC - inventory type on one line. */}
                <div className="flex items-start justify-between gap-2">
                  {/* Name and badges together, as on both step-④ screens this panel sits beside — the
                      badges were on their own line under the generic name, which put two rows between the
                      product and its NDC. */}
                  {/* No flex-wrap here, unlike the wider surfaces: this panel is 320px and product names
                      are long, so wrapping put the badges on their own line again — the very thing this
                      is meant to avoid. The name already truncates in this panel by design, so it gives
                      up the few characters instead. */}
                  <div className="flex items-baseline gap-2 min-w-0">
                    <h4 className="font-normal text-[#020817] text-[14px] leading-[20px] truncate">
                      {group.productName}
                    </h4>
                    <span className="flex items-center gap-1 shrink-0">
                      <ProductBadges product={badgeIdentity} />
                    </span>
                  </div>
                  {/* At product level, beside the name — being skipped is a fact about the product,
                      not about one of its bins, and the bins are exactly what a skipped card has
                      nothing to say about. */}
                  {isSkippedCard && skippedBadge}
                </div>
                {group.productDescription && (
                  <p className="italic text-gray-500 leading-snug text-[14px] truncate">
                    {group.productDescription}
                  </p>
                )}
                <div className="text-gray-500 text-[13px] break-words mt-1">
                  {group.ndc} - {group.inventoryType}
                </div>

                {/* Each source bin states itself once, with the target bins it feeds indented beneath.
                    The pairings were flat "from → to" lines before, which repeated the source bin —
                    and its quantity — once per destination, so a bin split three ways read as three
                    separate departures of the same stock. Nested, the bin is the parent it actually is.

                    No total line: the source line IS the total for everything under it. */}
                {isSkippedCard ? (
                  // Nothing below the identity block: the Skipped badge beside the product name already
                  // says it, and a sentence restating it was the second telling.
                  null
                ) : (
                <div className={`mt-2 pt-2 border-t space-y-2 ${isCurrentCard ? 'border-[#dbe9f6]' : 'border-gray-100'}`}>
                  {groupBySourceBin(group.rows).map(sourceBin => {
                    // One figure for the bin, not per destination, so it comes off the first row.
                    const head = sourceBin.rows[0];
                    const sourceText = quantityText(head.sourceQuantity, head.unit);
                    return (
                      <div key={`${sourceBin.label}-${sourceBin.door ?? ''}`}>
                        {/* The source bin. Bold only when the operator is standing at it — the whole
                            marking the redesign asks for, replacing the filled chip that read as a
                            selected state rather than a "you are here". */}
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <span
                            className={`truncate ${
                              head.isCurrentSource ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
                            }`}
                          >
                            {binLabel(sourceBin.label, sourceBin.door)}
                          </span>
                          {/* Quantity taken, with this bin's own "Taken" beside it — the act belongs
                              to the source, so the badge sits with the figure it refers to. */}
                          <span className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
                            {sourceText && (
                              <span className="font-medium text-[#020817]">{sourceText}</span>
                            )}
                            {sourceTakenBadge(head) && doneBadge(sourceTakenBadge(head)!)}
                          </span>
                        </div>

                        {/* No destinations while taking. On this half the operator's whole job is the
                            source bin in front of them, and how the amount divides between the target
                            bins isn't decided until the placement screen — so the indented target
                            lines named bins that carried no figure and no act, competing with the one
                            line that mattered. They appear on the placement half, where they are the
                            work.

                            Nor when every source feeds the same single target: it is stated once at
                            the foot of the card instead (below). */}
                        {stage !== 'source' &&
                          !singleTarget &&
                          sourceBin.rows.map(row => renderTargetLine(row, row.key))}
                      </div>
                    );
                  })}

                  {/* Three sources emptying into one bin is one arrival, not three. Repeated under
                      each source it printed the same destination three times — and, because the
                      figure on a target line is what lands in THAT BIN rather than what came from
                      one source, the same "40 vials" three times over, reading as 120. Stated once,
                      below the sources it collects, the arrow points from all of them at once. */}
                  {stage !== 'source' && singleTarget && (
                    <div className="pt-1 border-t border-dashed border-gray-200">
                      {renderTargetLine(singleTarget, `single-${singleTarget.key}`)}
                    </div>
                  )}
                </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
