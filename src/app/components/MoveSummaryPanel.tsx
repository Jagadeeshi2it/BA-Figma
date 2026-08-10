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
  // the panel can join them itself ("Door 1 - Bin 1B") — nesting freed the width that forced them
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
 * A row's product identity — `name | ndc | inventoryType`, the triple the whole app groups by (CLAUDE.md
 * §3), never the display name alone. Several catalogue products share a display name and differ only by
 * NDC: the seed has three "CARBOPLATIN 600 MG/60 ML VIAL".
 *
 * Exported because the panel groups its cards by this and three screens count distinct products by it for
 * their footers. They each had their own `new Set(rows.map(r => r.productName))`, which folded those three
 * variants into one — a four-product move reported as two, on both the footer and the panel header, with
 * the surviving card wearing the first variant's NDC above a list of bins belonging to the other two.
 * One function so the count and the cards cannot disagree.
 */
export const moveSummaryProductKey = (row: {
  productName: string;
  ndc?: string;
  inventoryType?: string;
}) => `${row.productName}|${row.ndc ?? ''}|${row.inventoryType ?? ''}`;

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
    // Keyed on the identity triple, never the display name alone (CLAUDE.md §3). Several catalogue
    // products share a display name and differ by NDC or inventory type — the seed has three
    // "CARBOPLATIN 600 MG/60 ML VIAL" — so grouping by name folded them into ONE card: the panel said
    // "2 products" for a four-product move, and the surviving card wore the first variant's NDC above a
    // list of bins that belonged to the other two. Every count and badge in this app keys on the triple
    // for exactly this reason.
    const identity = moveSummaryProductKey(row);
    const existingIndex = indexByProduct.get(identity);
    if (existingIndex !== undefined) {
      groups[existingIndex].rows.push(row);
    } else {
      indexByProduct.set(identity, groups.length);
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

  // "Door 1 - Bin 1B". Joined here rather than by each caller so every row reads the same way, and so
  // a label with no door to name (a summarised end) simply drops the prefix.
  //
  // Door first, bin second — the order every other surface uses (the search dropdown, the review
  // cards' source list, the product-centric card, History). This panel read "Bin 1B - Door 1" until
  // 2026-08-07, which was the same fact in the opposite order on the one surface the operator reads
  // while walking to the bin, and it is also the order they walk in: find the door, then the bin.
  const binLabel = (label: string, door?: string) => (door ? `${door} - ${label}` : label);

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

  /**
   * One destination line, plus which source bins feed it.
   *
   * The `from …` sub-line is the answer to "where goes where", and it is on the TARGET rather than the
   * source for a mechanical reason: the target line is the one carrying a figure (what lands in this
   * bin), the `Moved` badge and the you-are-here bold, so it has to stay one line per target. Sources
   * annotated with their destinations instead would have meant giving all three of those somewhere
   * else to live.
   *
   * Nothing is repeated by saying it here. `sourceQuantity` is one figure per source bin and stays in
   * the sources section above; `quantity` is one figure per target bin and stays on this line. Only
   * bin NAMES appear in the sub-line, and a source feeding two targets is correctly named under both —
   * that is the case the flat list could not express at all, and the reason this exists (Bin 2A into
   * both 3C and 3A reads as an unexplained repeat in a flat list, or as nothing).
   *
   * Not the same thing as nesting the target lines under their sources, which is what was tried and
   * dropped: that repeated one arrival's whole figure once per source, so a bin fed by three sources
   * looked like three times the stock.
   */
  const renderTargetLine = (
    row: MoveSummaryRow,
    key: string,
    sources: Array<{ label: string; door?: string }>
  ) => {
    const targetText = quantityText(row.quantity, row.unit);
    return (
      <div key={key} className="mt-0.5 pl-2">
        <div className="flex items-center justify-between gap-2 text-[12px]">
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
        {/* Withheld when the product has one source: the sources section directly above already names
            it, and "from Bin 4C" under a card whose only source is Bin 4C is a line that answers a
            question nobody could have. It earns its place the moment there is a choice to disambiguate.
            Wraps rather than truncating — a name the operator cannot finish reading is the one thing
            this line must not do, and at 320px two qualified bin names do not fit on one. */}
        {sources.length > 1 && (
          <div className="pl-4 text-[11px] leading-snug text-[#94a3b8] break-words">
            from {sources.map(source => binLabel(source.label, source.door)).join(', ')}
          </div>
        )}
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
            /**
             * This product's destinations, each stated once, WITH the source bins feeding each. Keyed on
             * bin AND door, as everywhere else — the same bin name exists behind every door.
             *
             * The lines stay one-per-target rather than being nested under individual source bins,
             * because the figure on a target line is what lands in THAT BIN — not what came from one
             * source. Nested, a bin fed by three sources printed itself three times, each with the full
             * arriving amount, reading as three times the stock.
             *
             * Be careful with the distinction that mistake rests on. What is NOT divisible per pairing is
             * the QUANTITY: the amount taken from a source is deliberately not split between its targets
             * (§ Transfers) — the operator decides that by scanning into each bin on the placement
             * screen. The ROUTING is a different fact, it is real, and the operator chose it themselves on
             * Review. This panel used to drop it: it received rows that are each one source→target
             * pairing and rendered two independent lists, so "Bin 4C, Bin 2A, Bin 2B into Bin 3C and Bin
             * 3A" never said which fed which — worst where a source feeds both, which no reading of two
             * flat lists can recover. So each target names its own sources (see renderTargetLine), and
             * every figure is still stated exactly once.
             *
             * A target's own state is ORed across the rows that share it: it is the bin in hand if any
             * of them says so, and placed once any of them is done.
             */
            const distinctTargets = Array.from(
              group.rows
                .reduce((map, row) => {
                  const key = `${row.toLabel}|${row.toDoor ?? ''}`;
                  const seen = map.get(key);
                  // The source bins feeding this target, collected as the rows collapse — this is the
                  // pairing, and it exists only in the rows. Each row IS one source→target pairing, so
                  // folding the rows down to one per target used to discard it entirely: the panel had
                  // the routing and printed two independent lists. Deduped on bin AND door, as
                  // everywhere else, since the same bin name sits behind every door.
                  const sourceKey = `${row.fromLabel}|${row.fromDoor ?? ''}`;
                  const sources = seen?.sources ?? new Map<string, { label: string; door?: string }>();
                  if (!sources.has(sourceKey)) {
                    sources.set(sourceKey, { label: row.fromLabel, door: row.fromDoor });
                  }
                  map.set(
                    key,
                    seen
                      ? {
                          ...seen,
                          row: {
                            ...seen.row,
                            isCurrentTarget: seen.row.isCurrentTarget || row.isCurrentTarget,
                            status:
                              seen.row.status === 'done' || row.status === 'done' ? 'done' : seen.row.status
                          },
                          sources
                        }
                      : { row, sources }
                  );
                  return map;
                }, new Map<string, { row: MoveSummaryRow; sources: Map<string, { label: string; door?: string }> }>())
                .values()
            );

            // What the operator ends up holding for this product: every source bin's amount added up,
            // once per bin. Repeated across the rows that share a source, so it is summed over the
            // distinct bins rather than over the rows.
            const collectedTotal = Array.from(
              group.rows
                .reduce((map, row) => {
                  const key = `${row.fromLabel}|${row.fromDoor ?? ''}`;
                  if (!map.has(key)) map.set(key, row.sourceQuantity ?? null);
                  return map;
                }, new Map<string, number | null>())
                .values()
            ).reduce<number | null>(
              (sum, qty) => (qty == null ? sum : (sum ?? 0) + qty),
              null
            );
            const collectedText = quantityText(collectedTotal, group.rows[0]?.unit);
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
                  {/* The name gets the row to itself here — this panel is the one place in steps ③ and ④
                      where the badges do NOT sit beside it. At 320px there is no room for both: badges on
                      the name's line cost the name the characters it needs, so "CARBOPLATIN 600 MG/60 ML
                      VIAL" truncated to "CARBOPLATIN 600 MG/6…" and the operator lost the strength, which
                      is the one part of that name they are checking. Width decides this, not preference —
                      the wider surfaces in the same steps keep badges beside the name. */}
                  <h4 className="font-normal text-[#020817] text-[14px] leading-[20px] truncate">
                    {group.productName}
                  </h4>
                  {/* At product level, beside the name — being skipped is a fact about the product,
                      not about one of its bins, and the bins are exactly what a skipped card has
                      nothing to say about. */}
                  {isSkippedCard && skippedBadge}
                  {/* Everything collected for this product, across all its source bins. A card whose
                      sources read 25, 10 and 5 never said 40 anywhere, leaving the operator to add up
                      what they are carrying — and 40 is the figure they need at the target bin. Not
                      shown on a skipped card, which is carrying nothing. */}
                  {!isSkippedCard && collectedText && (
                    <span className="shrink-0 text-[12px] font-semibold text-[#020817] whitespace-nowrap">
                      {collectedText}
                    </span>
                  )}
                </div>
                {group.productDescription && (
                  <p className="italic text-gray-500 leading-snug text-[14px] truncate">
                    {group.productDescription}
                  </p>
                )}
                {/* Below the generic name, on a line of their own — the layout the rest of the app uses
                    outside the pipeline. Same `ProductBadges` as everywhere else, so only the position
                    differs from the wider step-③/④ surfaces. */}
                <div className="flex items-center gap-1 mt-1.5">
                  <ProductBadges product={badgeIdentity} />
                </div>
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

                      </div>
                    );
                  })}

                  {/* The destinations, once each, beneath the sources they collect — so the arrows point
                      from all of those bins at once, which is what actually happens.

                      Not shown while taking: on that half the operator's whole job is the source bin in
                      front of them, and how the amount divides between the targets is not decided until
                      the placement screen, so the target lines would name bins carrying no figure and no
                      act, competing with the one line that mattered. */}
                  {stage !== 'source' && distinctTargets.length > 0 && (
                    <div className="pt-1 border-t border-dashed border-gray-200">
                      {distinctTargets.map(target =>
                        renderTargetLine(
                          target.row,
                          `target-${target.row.key}`,
                          Array.from(target.sources.values())
                        )
                      )}
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
