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
   * One pairing: a source bin on the left, one of its destinations on the right.
   *
   * This is the panel's whole structure now, and it replaces both the flat "sources, then targets" lists
   * and the `from …` sub-line that was bolted onto them. Each row IS a `MoveSummaryRow`, which is what a
   * row has been all along — the previous shapes took a list of pairings and printed two independent
   * lists of bins, which is exactly the information the operator was missing: three sources and two
   * targets does not say which feeds which, and it is at its worst where one source feeds both.
   *
   * `showSource` is false on a source's second and later rows, so the left column stays blank and the
   * rows read as one block belonging to the bin named above them. That is what keeps a source's own
   * figure stated once while its destinations each get a line.
   *
   * `showTargetFigure` does the same job in the other direction, and it is the subtle one. A target's
   * quantity is what lands in THAT BIN, not what came from one source, so a bin fed by three sources
   * must not print its arriving amount on all three rows — that was the original reason for refusing to
   * nest, and it is still true. The figure appears against the bin's first row and the rest carry the
   * name alone. The bold you-are-here marking is deliberately NOT first-occurrence-only: it is a fact
   * about the bin, so every row naming that bin wears it.
   */
  const renderPairingRow = (
    row: MoveSummaryRow,
    key: string,
    options: { showSource: boolean; showTargetFigure: boolean }
  ) => {
    const sourceText = options.showSource ? quantityText(row.sourceQuantity, row.unit) : null;
    const targetText = options.showTargetFigure ? quantityText(row.quantity, row.unit) : null;
    const takenBadge = options.showSource ? sourceTakenBadge(row) : null;
    const movedBadge = options.showTargetFigure ? targetMovedBadge(row) : null;

    return (
      <div key={key} className="flex items-start gap-1.5 text-[12px] leading-[18px]">
        {/* Equal columns either side of the arrow, so the two ends line up down the card and the eye can
            read either column on its own. `min-w-0` on both or a long door-qualified name pushes the
            arrow out of the middle. */}
        <span className="flex-1 min-w-0">
          <span
            className={`block break-words ${
              row.isCurrentSource ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
            }`}
          >
            {options.showSource ? binLabel(row.fromLabel, row.fromDoor) : ''}
          </span>
          {(sourceText || takenBadge) && (
            <span className="flex items-center gap-1.5 flex-wrap">
              {sourceText && <span className="font-medium text-[#020817]">{sourceText}</span>}
              {takenBadge && doneBadge(takenBadge)}
            </span>
          )}
        </span>

        <ArrowRight className="w-3 h-3 shrink-0 text-[#94a3b8] mt-[3px]" />

        <span className="flex-1 min-w-0">
          <span
            className={`block break-words ${
              row.isCurrentTarget ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
            }`}
          >
            {binLabel(row.toLabel, row.toDoor)}
          </span>
          {(targetText || movedBadge) && (
            <span className="flex items-center gap-1.5 flex-wrap">
              {targetText && <span className="font-medium text-[#020817]">{targetText}</span>}
              {movedBadge && doneBadge(movedBadge)}
            </span>
          )}
        </span>
      </div>
    );
  };

  /**
   * Both ends as two lists side by side, with one arrow between them: every source on the left, every
   * target on the right.
   *
   * Used when each source goes to the same set of targets, which is the common case. There the pairing is
   * fully implied — all of these into all of these — so the per-source rows would print the same
   * destination list once per source and say nothing more for it. One arrow rather than one per row,
   * because there is one relationship here, not several.
   *
   * Every figure is naturally stated once, since each bin appears on exactly one line. No
   * first-occurrence bookkeeping, which is a good sign the shape fits the case.
   */
  const renderColumns = (sources: MoveSummaryRow[], targets: MoveSummaryRow[]) => (
    <div className="flex items-center gap-1.5 text-[12px] leading-[18px]">
      <div className="flex-1 min-w-0 space-y-0.5">
        {sources.map(row => {
          const sourceText = quantityText(row.sourceQuantity, row.unit);
          const takenBadge = sourceTakenBadge(row);
          return (
            <div key={`col-source-${row.key}`}>
              <span
                className={`block break-words ${
                  row.isCurrentSource ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
                }`}
              >
                {binLabel(row.fromLabel, row.fromDoor)}
              </span>
              {(sourceText || takenBadge) && (
                <span className="flex items-center gap-1.5 flex-wrap">
                  {sourceText && <span className="font-medium text-[#020817]">{sourceText}</span>}
                  {takenBadge && doneBadge(takenBadge)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <ArrowRight className="w-3 h-3 shrink-0 text-[#94a3b8]" />

      <div className="flex-1 min-w-0 space-y-0.5">
        {targets.map(row => {
          const targetText = quantityText(row.quantity, row.unit);
          const movedBadge = targetMovedBadge(row);
          return (
            <div key={`col-target-${row.key}`}>
              <span
                className={`block break-words ${
                  row.isCurrentTarget ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
                }`}
              >
                {binLabel(row.toLabel, row.toDoor)}
              </span>
              {(targetText || movedBadge) && (
                <span className="flex items-center gap-1.5 flex-wrap">
                  {targetText && <span className="font-medium text-[#020817]">{targetText}</span>}
                  {movedBadge && doneBadge(movedBadge)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /**
   * A source bin on its own, with no destination beside it — the take half only.
   *
   * On that half the operator's whole job is the bin in front of them, and how the amount will divide
   * between its targets is not decided until the placement screen. Pairing rows there would name
   * destinations carrying no figure and no act, competing with the one line that matters. So the take
   * half keeps the single column it always had, and the pairing grid starts at the point the pairing is
   * something the operator is about to act on.
   */
  const renderSourceOnlyRow = (row: MoveSummaryRow, key: string) => {
    const sourceText = quantityText(row.sourceQuantity, row.unit);
    const takenBadge = sourceTakenBadge(row);
    return (
      <div key={key} className="flex items-center justify-between gap-2 text-[12px]">
        <span
          className={`truncate ${
            row.isCurrentSource ? 'font-semibold text-[#020817]' : 'text-[#4a5565]'
          }`}
        >
          {binLabel(row.fromLabel, row.fromDoor)}
        </span>
        <span className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
          {sourceText && <span className="font-medium text-[#020817]">{sourceText}</span>}
          {takenBadge && doneBadge(takenBadge)}
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
            /**
             * The pairings, grouped by source bin — the panel's structure, and a direct restatement of
             * what a row already is. Keyed on bin AND door throughout, as everywhere else, since the same
             * bin name sits behind every door.
             *
             * Each source keeps its own destinations, deduped, so `Bin 4C → Bin 3C` and
             * `Bin 2A → Bin 3C, Bin 3A` read as themselves. What this replaces is two independent lists —
             * every source, then every target — which is where the routing was being lost: three sources
             * and two targets cannot say which feeds which, and a source feeding both is unrecoverable
             * from it.
             *
             * The distinction the old shape rested on is still respected, and it is worth not
             * re-deriving. What is NOT divisible per pairing is the QUANTITY: the amount taken from a
             * source is deliberately not split between its targets (§ Transfers) — the operator decides
             * that by scanning into each bin. So a figure belongs to a BIN, and each is printed once
             * (`firstRowForTarget` below, and `showSource` on the source side). The ROUTING is a
             * different fact, it is real, and the operator chose it on Review.
             */
            const pairingsBySource = groupBySourceBin(group.rows).map(sourceBin => {
              const targets = new Map<string, MoveSummaryRow>();
              sourceBin.rows.forEach(row => {
                const key = `${row.toLabel}|${row.toDoor ?? ''}`;
                const seen = targets.get(key);
                // A target's state is ORed across the rows that share it: the bin in hand if any of them
                // says so, placed once any of them is done.
                targets.set(
                  key,
                  seen
                    ? {
                        ...seen,
                        isCurrentTarget: seen.isCurrentTarget || row.isCurrentTarget,
                        status: seen.status === 'done' || row.status === 'done' ? 'done' : seen.status
                      }
                    : row
                );
              });
              return { ...sourceBin, targets: Array.from(targets.values()) };
            });

            /**
             * Which row gets to print each target bin's figure: its first, in the order the rows read.
             *
             * A target fed by three sources appears on three rows, and its arriving quantity is one
             * figure for the bin — printing it on each would read as three times the stock, which is the
             * mistake that made an earlier version of this panel refuse to show the pairing at all.
             * Built once for the whole card rather than per source block, because the repeats are across
             * blocks by definition.
             */
            const firstRowForTarget = new Map<string, string>();
            pairingsBySource.forEach(sourceBin => {
              sourceBin.targets.forEach(row => {
                const key = `${row.toLabel}|${row.toDoor ?? ''}`;
                if (!firstRowForTarget.has(key)) firstRowForTarget.set(key, row.key);
              });
            });

            const targetKey = (row: MoveSummaryRow) => `${row.toLabel}|${row.toDoor ?? ''}`;

            /** Every destination this product has, once, with its state ORed across the rows sharing it. */
            const distinctTargets = Array.from(
              pairingsBySource
                .flatMap(sourceBin => sourceBin.targets)
                .reduce((map, row) => {
                  const key = targetKey(row);
                  const seen = map.get(key);
                  map.set(
                    key,
                    seen
                      ? {
                          ...seen,
                          isCurrentTarget: seen.isCurrentTarget || row.isCurrentTarget,
                          status: seen.status === 'done' || row.status === 'done' ? 'done' : seen.status
                        }
                      : row
                  );
                  return map;
                }, new Map<string, MoveSummaryRow>())
                .values()
            );

            /**
             * Whether every source goes to the same set of targets.
             *
             * When they do, the pairing carries no information a reader has to be walked through: "all of
             * these bins, into all of these bins" says it completely, and repeating the destination list
             * under each source is the same two lines three times over. So the panel collapses to one
             * block — sources down the left, targets down the right, one arrow between them.
             *
             * When they differ, the per-source rows are the only thing that can say which feeds which,
             * and that is the case this whole layout exists for. The shape follows the move rather than
             * being fixed: the pairing is spelled out exactly where it varies.
             *
             * Compared as an ordered signature of the target keys. Order is not incidental — the rows
             * arrive in the walk's order, so two sources listing the same bins in a different order are
             * genuinely being visited differently and should not be folded together.
             */
            const targetSignature = (sourceBin: { targets: MoveSummaryRow[] }) =>
              sourceBin.targets.map(targetKey).join('>');
            const everySourceSharesTargets =
              pairingsBySource.length > 0 &&
              pairingsBySource.every(
                sourceBin => targetSignature(sourceBin) === targetSignature(pairingsBySource[0])
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

                {/* Sources on the left, targets on the right. Whether the two columns are one block or one
                    block per source depends on the move itself — see everySourceSharesTargets. */}
                {isSkippedCard ? (
                  // Nothing below the identity block: the Skipped badge beside the product name already
                  // says it, and a sentence restating it was the second telling.
                  null
                ) : (
                <div className={`mt-2 pt-2 border-t space-y-2 ${isCurrentCard ? 'border-[#dbe9f6]' : 'border-gray-100'}`}>
                  {/* The take half keeps a single column of source bins — see renderSourceOnlyRow. */}
                  {stage === 'source' || distinctTargets.length === 0 ? (
                    pairingsBySource.map(sourceBin =>
                      renderSourceOnlyRow(
                        sourceBin.rows[0],
                        `source-${sourceBin.label}-${sourceBin.door ?? ''}`
                      )
                    )
                  ) : everySourceSharesTargets ? (
                    /* Every source into the same bins, so the pairing needs no spelling out: one list
                       either side of one arrow. */
                    renderColumns(
                      pairingsBySource.map(sourceBin => sourceBin.rows[0]),
                      distinctTargets
                    )
                  ) : (
                    pairingsBySource.map(sourceBin => (
                      <div key={`${sourceBin.label}-${sourceBin.door ?? ''}`} className="space-y-0.5">
                        {sourceBin.targets.map((row, targetIndex) =>
                          renderPairingRow(row, `pair-${row.key}`, {
                            showSource: targetIndex === 0,
                            showTargetFigure: firstRowForTarget.get(targetKey(row)) === row.key
                          })
                        )}
                      </div>
                    ))
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
