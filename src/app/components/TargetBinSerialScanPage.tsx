import React, { useState, useEffect, useMemo } from 'react';
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { ChevronRight, Search, Package, PackagePlus, LogIn, ListChecks, ArrowRight, Check, Minus, CircleMinus } from "lucide-react";
import { DoorUnlockedToast, ValidationToast } from "./ui/sonner-1";
import CabinetPipView from "./CabinetPipView";
import SideSheet from "./SideSheet";
import MoveSummaryPanel, { MoveSummaryRow, moveSummaryProductKey } from "./MoveSummaryPanel";
import UnlockDoorButton from "./UnlockDoorButton";
import {
  PipelineFooterShell,
  FooterDivider,
  FooterActions,
  StepCell,
  SummaryCell,
  FooterButton,
  SHOW_STEP4_POSITION_COUNTERS
} from "./PipelineFooter";
import { ProductTransfer, Bin, DoorShelfConfig } from '../types';
import { formatBinLocation, getDoorName } from '../utils/changeAllocationUtils';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import ProductBadges from './ProductBadges';
import { SkippedProduct, CANNOT_CANCEL_REASON } from './QuantitySelectionPage';
import { CabinetAccess } from '../hooks/useCabinetAccess';
import AddMoveToBinOverlay from './AddMoveToBinOverlay';
import {
  moveToBinCandidates,
  selectableMoveToBins,
  reachableMoveToBins,
  MoveToBinInput
} from '../utils/moveTargetBins';
import { emergencyKitService } from '../services/EmergencyKitService';

interface ScannedItem {
  serial: string;
  lot: string;
  source: string;
  expiration: string;
  quantity: string;
}

interface TargetBinSerialScanPageProps {
  transfers: ProductTransfer[];
  doorShelfConfig: DoorShelfConfig;
  onConfirm: (transfersWithSerials: ProductTransfer[]) => void;
  /**
   * Kept for the footer's shape, but never called: reaching this screen means every quantity has already
   * been taken at the source, so cancelling is refused outright (STEP4-GUIDANCE.md §8).
   */
  onCancel: () => void;
  remainingTransfers?: ProductTransfer[];
  // Products the quantity step was told to skip. Listed in the Move Summary, marked, so the operator
  // can see why a product they picked at Review has no bins or quantities on this screen.
  skippedProducts?: SkippedProduct[];
  // Only for the stepper's step-1 label, which names the unit this kind of move collects.
  moveMode?: 'bin' | 'product' | null;
  // Which single door is open, and how to ask for another (STEP4-GUIDANCE.md §1).
  cabinetAccess: CabinetAccess;
  /** Target bin ids in the order the route says to fill them. Undefined keeps the arrival order. */
  placeBinOrder?: string[];
  /**
   * Give the product currently being placed another Move To bin. Called once per bin when the operator
   * picks several, so the caller need not know how many were chosen.
   *
   * Owned by App rather than this screen: the transfers are App's state, and the route, the footer's
   * counters and the Move List all derive from them, so appending there keeps every one of those in
   * step. A bin added into local state here would show up on this screen and nowhere else.
   */
  onAddTargetBin?: (productId: string, binId: string) => void;
}

interface TransferWithInfo extends ProductTransfer {
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  targetBinName: string;
  targetBinLocation: string;
  targetBinExistingQty: number;
  targetBin: Bin;
  targetDoorName: string;
}

// New structure: Product → Target Bin (with aggregated quantities from all source bins)
interface TargetBinGroup {
  toBinId: string;
  targetBinName: string;
  targetBinLocation: string;
  targetBinExistingQty: number;
  targetBin: Bin;
  targetDoorName: string;
  totalQuantity: number; // Aggregated from all source bins
  sourceBins: Array<{ // List of source bins contributing to this target
    fromBinId: string;
    sourceBinName?: string;
    quantity: number;
  }>;
  transfers: TransferWithInfo[]; // All transfers to this target bin
}

interface ProductGroup {
  productId: string;
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  targetBins: TargetBinGroup[];
}

/**
 * How scannedItems is keyed: by product AND target bin. The product has to be named explicitly
 * rather than assumed to be the one on screen — finalizeAndConfirm walks EVERY product, and reading
 * currentProduct there charged one product's scanned quantity to another.
 *
 * At module scope, not inside the component, because it's a pure function of its arguments and the
 * component reads it from several places — including a useMemo that runs before the component body
 * reaches the point where a `const` inside would have been initialised.
 */
const scanKey = (productId: string, toBinId: string) => `${productId}-${toBinId}`;

/**
 * `n` stand-in scan entries, for the two places a quantity is settled without the operator scanning it
 * one at a time: the last bin of a split, whose share is whatever the earlier bins left, and a bin added
 * mid-move to take a stated remainder.
 *
 * Honest only because no serial value is ever checked against anything (§5) — these are counters wearing
 * serial numbers. If serials ever start meaning something, both callers become real questions rather
 * than arithmetic, and this function should stop existing rather than get a validation argument.
 *
 * Module scope, like `scanKey`, so no caller can be ordered before it.
 */
/**
 * Where a target bin stands in the placement walk: the bin in hand, one that is finished, or one still
 * ahead. Two surfaces ask — the Move Summary's row status and the target-bin side sheet's `Done` badge —
 * so it is one function rather than the same expression written twice.
 *
 * Two ways to be finished, and the second is the one that had to be added:
 *
 * - **Position** — the walk has passed it. This is what covers a bin the operator visited and
 *   deliberately put nothing into, a legitimate outcome (see `canSave`) with no quantity to show for it.
 * - **Stock in it** — something has actually been placed, wherever it sits in the walk. Position alone
 *   was the entire test, and was sound while bins could only be added at step ② in route order, where a
 *   bin further along could not already hold anything. Adding one mid-walk broke that: declare the bin
 *   in front of you full, pick another, and the route re-plans, so the bin you just put 100 vials into
 *   can end up AFTER the new one. The positional test called it `pending`, and a `pending` bin is drawn
 *   carrying nothing — a bin the operator has filled reading as untouched, which is the worst direction
 *   for this to fail in.
 *
 * `current` outranks both, so exactly one bin is ever current and the panel's you-are-here marking is
 * unaffected.
 *
 * Module scope, so no caller can be ordered before it, and so `scripts/verify-placement-walk-status.mjs`
 * can reach it.
 */
export const placementBinStatus = ({
  productIndex,
  targetBinIndex,
  currentProductIndex,
  currentTargetBinIndex,
  placed
}: {
  productIndex: number;
  targetBinIndex: number;
  currentProductIndex: number;
  currentTargetBinIndex: number;
  placed: number;
}): 'current' | 'done' | 'pending' => {
  if (productIndex === currentProductIndex && targetBinIndex === currentTargetBinIndex) {
    return 'current';
  }
  const isBehindInWalk =
    productIndex < currentProductIndex ||
    (productIndex === currentProductIndex && targetBinIndex < currentTargetBinIndex);
  return isBehindInWalk || placed > 0 ? 'done' : 'pending';
};

const synthesizeScannedItems = (count: number, unit?: string): ScannedItem[] =>
  Array.from({ length: count }, () => ({
    serial: `SN${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    lot: Math.floor(Math.random() * 10000000).toString(),
    source: 'McKesson Medical',
    expiration: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
      'en-US',
      { month: '2-digit', day: '2-digit', year: 'numeric' }
    ),
    // Singular: one row is one vial. It read `1 vials` here while a scanned row read
    // `1 vial / 400 mg / 16 ml`, so the two halves of the same table disagreed.
    quantity: `1 ${unit || 'vial'}`.replace(/s$/, '')
  }));

/**
 * One serial table — the placed set or the not-placed set.
 *
 * Module scope, above the component, because it is a pure function of its props (CLAUDE.md §4: a helper
 * defined below something that calls it throws, since a `const` is not hoisted). Shared rather than
 * written twice for the same reason `ProductRow` is: the two tables show the same rows in the same shape,
 * and one drifting would make the pair read as two different kinds of list.
 *
 * Styling follows the screen it sits on rather than the wireframe it came from — the existing table's
 * shell and header, the app's own tick square (`ProductListControls`), `#F1F6FA` for a selected row, and a
 * white/`#095192` secondary for the bulk action. Nothing here is red: moving a serial to the not-placed
 * set is not destruction, which is the rule `Cancel` and `Back` already follow (CLAUDE.md §6).
 */
function SerialTable({
  items,
  selected,
  onToggle,
  onToggleAll,
  onRemoveOne,
  selectable = true,
  caption,
  action
}: {
  items: ScannedItem[];
  selected: Set<string>;
  onToggle: (serial: string) => void;
  onToggleAll: () => void;
  /** Per-row removal. Omitted on the not-placed table, which has nowhere further to remove to. */
  onRemoveOne?: (serial: string) => void;
  /**
   * Whether picking rows can lead anywhere. False on a bin with no later bin to send anything to, where the
   * table is a manifest of what is going in rather than a decision to be made.
   *
   * Rendered-and-dimmed rather than withheld: a checkbox column that appears and disappears between bins is
   * a layout moving under the operator mid-task, and `Add Move To Bin` can turn this on part-way through a
   * product. Same reasoning as `Select All` in the allocation panels (CLAUDE.md §6).
   */
  selectable?: boolean;
  caption: React.ReactNode;
  action?: React.ReactNode;
}) {
  const allSelected = selectable && items.length > 0 && items.every(item => selected.has(item.serial));
  const someSelected = selectable && items.some(item => selected.has(item.serial));
  const canPick = selectable && items.length > 0;

  const tick = (checked: boolean, indeterminate: boolean) => (
    <div
      className={`w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
        checked || indeterminate ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
      }`}
    >
      {checked ? (
        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      ) : indeterminate ? (
        <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      ) : null}
    </div>
  );

  return (
    <div>
      {/* Count and the bulk action on one line above the table, the action right-aligned — the same
          arrangement the allocation panels use for `Select All` and their filter. */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[14px] text-[#4a5565]">{caption}</p>
        {action}
      </div>

      <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="w-12 px-4 py-3">
                {/* Selects every row in THIS table only. The two tables are separate selections because
                    the two bulk actions move rows in opposite directions. */}
                <div
                  role="checkbox"
                  aria-checked={allSelected}
                  aria-disabled={!canPick}
                  aria-label="Select all rows"
                  onClick={canPick ? onToggleAll : undefined}
                  className={canPick ? 'cursor-pointer w-fit' : 'opacity-50 cursor-not-allowed w-fit'}
                >
                  {tick(allSelected, someSelected && !allSelected)}
                </div>
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Serial</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Lot</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Expiration</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Source</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Quantity</th>
              {onRemoveOne && <th className="w-12 px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSelected = selected.has(item.serial);
              return (
                <tr
                  key={item.serial}
                  onClick={canPick ? () => onToggle(item.serial) : undefined}
                  // The whole row is the control, as it is in both allocation panels — aiming at a 20px
                  // box in a table row is the worse target on a tablet. Inert where picking leads nowhere,
                  // and it keeps its plain look there rather than inviting a tap it cannot answer.
                  className={`border-t border-[#e5e7eb] transition-colors ${
                    canPick ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-[#F1F6FA]' : canPick ? 'hover:bg-gray-50' : ''}`}
                >
                  <td className={`px-4 py-3 ${canPick ? '' : 'opacity-50'}`}>{tick(isSelected, false)}</td>
                  <td className="px-4 py-3 text-[14px] text-[#020817]">{item.serial}</td>
                  <td className="px-4 py-3 text-[14px] text-[#020817]">{item.lot}</td>
                  <td className="px-4 py-3 text-[14px] text-[#020817]">{item.expiration}</td>
                  <td className="px-4 py-3 text-[14px] text-[#020817]">{item.source}</td>
                  <td className="px-4 py-3 text-[14px] text-[#020817]">{item.quantity}</td>
                  {onRemoveOne && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Remove ${item.serial} from this bin`}
                        onClick={event => {
                          event.stopPropagation();
                          onRemoveOne(item.serial);
                        }}
                        // `CircleMinus` rather than an X or a trash can. A trash can claims the vial is
                        // deleted and an X reads as dismiss-this-row; a minus says "take it out of this
                        // set", which is exactly what happens — it lands in the not-placed table.
                        //
                        // `#C6362C` is the app's one red (CLAUDE.md §6). Strictly that colour is reserved
                        // for acts that destroy data and this one moves a row, so it overstates slightly;
                        // it is the requested treatment, and a second red would be worse than a strong one.
                        // `red-50` for the hover rather than a new tint — it is what this screen's trash
                        // button already used, so it is a value the palette has instead of one more hex.
                        className="w-8 h-8 inline-flex items-center justify-center rounded-[4px] text-[#C6362C] hover:bg-red-50 cursor-pointer"
                      >
                        <CircleMinus className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TargetBinSerialScanPage({
  transfers,
  doorShelfConfig,
  onConfirm,
  onCancel,
  remainingTransfers,
  skippedProducts,
  moveMode,
  cabinetAccess,
  placeBinOrder,
  onAddTargetBin
}: TargetBinSerialScanPageProps) {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentTargetBinIndex, setCurrentTargetBinIndex] = useState(0);
  const [serialInput, setSerialInput] = useState('');
  const [scannedItems, setScannedItems] = useState<{ [key: string]: ScannedItem[] }>({});

  /**
   * Vials taken out of the source for this product that are not in any bin yet — the pool.
   *
   * Keyed by product, not by bin, because that is what it is: stock in the operator's hands. Together with
   * `scannedItems` it forms one fixed set per product, and every act on this screen moves a row between the
   * two. Nothing is created or destroyed after the set is seeded, which is what makes the figures add up
   * without being policed.
   *
   * **The seeding is the provisional part, not the model.** A bin's contents are `quantity: number`
   * (CLAUDE.md §5), so there is no real serial list to read out of the source and the set is synthesized
   * once per product below. When bins hold serials, that one call is replaced by reading the source bin and
   * nothing else here changes — see STEP4-GUIDANCE.md §12.
   */
  const [unplacedItems, setUnplacedItems] = useState<{ [productId: string]: ScannedItem[] }>({});

  // Which rows are ticked in each of the two tables. Separate sets, because the two bulk actions move rows
  // in opposite directions and a shared selection could not say which way a tap meant.
  const [selectedPlaced, setSelectedPlaced] = useState<Set<string>>(new Set());
  const [selectedUnplaced, setSelectedUnplaced] = useState<Set<string>>(new Set());
  // Right-side overlay opened by tapping the footer's Product / Target Bin counters
  const [activeSheet, setActiveSheet] = useState<null | 'product' | 'targetBin'>(null);
  const [addBinOpen, setAddBinOpen] = useState(false);
  /**
   * The bin the operator was working on when they went off to add more, held by ID so they can be put
   * back on it.
   *
   * `currentTargetBinIndex` is a position in `productGroups[].targetBins`, and that array is sorted into
   * the route's order — so adding bins re-plans the route and the same index can land on a different
   * bin. It did: standing at Bin 3D, adding two bins, and coming back to Bin 1A.
   */
  const [resumeTargetBinId, setResumeTargetBinId] = useState<string | null>(null);
  /**
   * Whether the operator has added bins during this step — the one thing that makes the last bin's
   * auto-fill unsafe, and therefore the only condition under which it is held back.
   *
   * Sticky rather than a comparison against the transfers this screen opened with: once the route has
   * been re-planned, the walk the operator is following is no longer the one they set up at step ②, and
   * that stays true for the rest of the batch.
   */
  /**
   * Target bins added during placement, in the order they were added.
   *
   * A list rather than the boolean this used to be, because it now decides *position*: a bin added mid-move
   * is ranked after every bin the route already planned, so it lands ahead of the operator in the walk
   * rather than behind them. Route rank alone put `Bin 1B` before the `Bin 2C`/`Bin 2D` the operator was
   * already working, which — with no `Back` in step ④ — made it a row that could never be reached and would
   * sit at 0 vials for the rest of the move.
   */
  const [addedMidMoveBinIds, setAddedMidMoveBinIds] = useState<string[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(true);

  // CRITICAL: Determine if serial scanning is needed
  // Serial scanning is ONLY required if:
  // 1. Quantity was changed (partial move), OR
  // 2. Multiple target bins (need to distribute serials)
  const serialScanningRequired = useMemo(() => {
    const needsScanning = transfers.some(transfer => {
      const originalQty = (transfer as any).originalQuantity || 0;
      const movingQty = transfer.quantity || 0;

      // Nothing was ever at the source to begin with — there's nothing to scan or split across
      // target bins regardless of how many target bins this 0-qty allocation is spread across.
      if (originalQty === 0) {
        return false;
      }

      // If moving partial quantity, need serial scanning
      if (movingQty < originalQty) {
        return true;
      }
      
      // Count how many target bins this product is going to from the same source
      const sameSourcTransfers = transfers.filter(t => 
        t.productId === transfer.productId && 
        t.fromBinId === transfer.fromBinId
      );
      
      // If multiple target bins from same source, need serial scanning
      if (sameSourcTransfers.length > 1) {
        return true;
      }
      
      return false;
    });
    
    console.log('🔧 TargetBinSerialScanPage - Serial Scanning Decision:', {
      needsScanning,
      transferDetails: transfers.map(t => ({
        productId: t.productId,
        fromBinId: t.fromBinId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        originalQuantity: (t as any).originalQuantity,
        isPartialMove: t.quantity < (t as any).originalQuantity
      }))
    });
    
    return needsScanning;
  }, [transfers]);

  // Enhance and organize transfers into hierarchical structure
  const productGroups = useMemo(() => {
    // First, enhance all transfers with additional information
    const enhanced: TransferWithInfo[] = [];

    console.log('🔍 TargetBinSerialScanPage - RAW TRANSFERS RECEIVED:', {
      totalTransfers: transfers.length,
      transfers: transfers.map(t => ({
        productId: t.productId,
        fromBinId: t.fromBinId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        productName: (t as any).productName
      }))
    });

    transfers.forEach(transfer => {
      const transferWithData = transfer as any;
      
      let targetBin: Bin | null = null;
      let sourceBin: Bin | null = null;
      let productInfo: any = null;
      let targetDoorName: string = '';
      let sourceBinName: string = '';

      // Search through doorShelfConfig to find bins and product
      Object.keys(doorShelfConfig).forEach(doorKey => {
        const shelves = doorShelfConfig[doorKey];
        shelves?.forEach(shelf => {
          shelf.bins?.forEach(bin => {
            if (bin.id === transfer.toBinId) {
              targetBin = bin;
              targetDoorName = doorKey;
            }
            if (bin.id === transfer.fromBinId) {
              sourceBin = bin;
              sourceBinName = bin.name;
              if (!transferWithData.productName) {
                productInfo = bin.products.find(p => p.id === transfer.productId);
              }
            }
          });
        });
      });

      // Use productInfo from transfer if available, otherwise from lookup
      if (transferWithData.productName) {
        productInfo = {
          name: transferWithData.productName,
          description: transferWithData.productDescription,
          unit: transferWithData.unit,
          ndc: transferWithData.ndc,
          inventoryType: transferWithData.inventoryType,
          manufacturer: transferWithData.manufacturer
        };
      }

      if (targetBin && productInfo) {
        const existingProductInTargetBin = targetBin.products.find(p => p.name === productInfo.name);
        const targetBinExistingQty = existingProductInTargetBin ? existingProductInTargetBin.quantity : 0;
        
        enhanced.push({
          ...transfer,
          productName: productInfo.name,
          productDescription: productInfo.description,
          unit: productInfo.unit,
          ndc: productInfo.ndc,
          inventoryType: productInfo.inventoryType || 'Purchased',
          targetBinName: targetBin.name,
          targetBinLocation: formatBinLocation(targetBin),
          targetBinExistingQty,
          targetBin,
          targetDoorName: targetDoorName || 'N/A',
          sourceBinName
        } as any);
      }
    });

    // NEW STRUCTURE: Organize into Product → Target Bin (aggregated)
    const groups: ProductGroup[] = [];
    
    enhanced.forEach(transfer => {
      // Group by product IDENTITY (name + NDC + inventoryType), NOT by productId with timestamp
      const productKey = `${transfer.productName}-${transfer.ndc}-${transfer.inventoryType}`;
      
      // Find or create product group
      let productGroup = groups.find(g => 
        `${g.productName}-${g.ndc}-${g.inventoryType}` === productKey
      );
      if (!productGroup) {
        productGroup = {
          productId: transfer.productId, // Use first transfer's productId as representative
          productName: transfer.productName,
          productDescription: transfer.productDescription,
          unit: transfer.unit,
          ndc: transfer.ndc,
          inventoryType: transfer.inventoryType,
          targetBins: []
        };
        groups.push(productGroup);
      }

      // Find or create TARGET bin group within this product
      let targetBinGroup = productGroup.targetBins.find(tb => tb.toBinId === transfer.toBinId);
      if (!targetBinGroup) {
        targetBinGroup = {
          toBinId: transfer.toBinId,
          targetBinName: transfer.targetBinName,
          targetBinLocation: transfer.targetBinLocation,
          targetBinExistingQty: transfer.targetBinExistingQty,
          targetBin: transfer.targetBin,
          targetDoorName: transfer.targetDoorName,
          totalQuantity: 0,
          sourceBins: [],
          transfers: []
        };
        productGroup.targetBins.push(targetBinGroup);
      }

      // Add to aggregated quantity
      targetBinGroup.totalQuantity += transfer.quantity;
      
      // Track source bin info
      targetBinGroup.sourceBins.push({
        fromBinId: transfer.fromBinId,
        sourceBinName: (transfer as any).sourceBinName,
        quantity: transfer.quantity
      });
      
      // Add transfer
      targetBinGroup.transfers.push(transfer);
    });

    // Debug: Log the hierarchical structure
    console.log('🔍 TargetBinSerialScanPage - Product Groups Hierarchy (AGGREGATED):', {
      totalProducts: groups.length,
      structure: groups.map((pg, pIndex) => ({
        productIndex: pIndex,
        productName: pg.productName,
        totalTargetBins: pg.targetBins.length,
        targetBins: pg.targetBins.map((tb, tIndex) => ({
          targetBinIndex: tIndex,
          targetBinId: tb.toBinId,
          targetBinName: tb.targetBinName,
          totalQuantity: tb.totalQuantity,
          sourceBinCount: tb.sourceBins.length,
          sourceBins: tb.sourceBins.map(sb => ({
            fromBinId: sb.fromBinId,
            sourceBinName: sb.sourceBinName,
            quantity: sb.quantity
          }))
        }))
      }))
    });

    // Placed in the route's order. The placement walk is product-major (product, then its target bins), so
    // the route's bin order is applied at both levels: each product's target bins are sorted by it, and the
    // products themselves by the earliest-ranked bin they place into. That keeps a door's placements
    // together, which is what stops the operator reopening a door they had finished with
    // (STEP4-GUIDANCE.md §4).
    if (placeBinOrder && placeBinOrder.length > 0) {
      const rank = new Map(placeBinOrder.map((binId, index) => [binId, index]));
      const rankOf = (toBinId: string) => rank.get(toBinId) ?? Number.MAX_SAFE_INTEGER;

      /**
       * Bins added during placement sort after every bin the route planned, and among themselves in the
       * order they were added.
       *
       * Route rank alone is wrong here, and not marginally: the operator adds a bin while standing at one,
       * so the new bin has to be somewhere they are still going to reach. Ranking `Bin 1B` by its natural
       * route position put it ahead of the `Bin 2C`/`Bin 2D` already being worked, and with no `Back` in
       * step ④ that row could never be visited — it stayed at 0 vials for the rest of the move while
       * appearing in the Move List as a destination.
       *
       * Insertion order within the added tier rather than route rank, so a second addition always lands
       * after the first: otherwise adding `Bin 3A` and then `Bin 1B` would put `1B` in front again, and the
       * bin the operator just named would be the one they walk past.
       */
      const addedTier = (toBinId: string) => {
        const index = addedMidMoveBinIds.indexOf(toBinId);
        return index === -1 ? -1 : index;
      };
      const compareBins = (aId: string, bId: string, aName: string, bName: string) => {
        const aAdded = addedTier(aId);
        const bAdded = addedTier(bId);
        if ((aAdded === -1) !== (bAdded === -1)) return aAdded === -1 ? -1 : 1;
        if (aAdded !== -1) return aAdded - bAdded;
        const delta = rankOf(aId) - rankOf(bId);
        return delta !== 0 ? delta : aName.localeCompare(bName);
      };

      groups.forEach(group => {
        group.targetBins.sort((a, b) =>
          compareBins(a.toBinId, b.toBinId, a.targetBinName, b.targetBinName)
        );
      });
      groups.sort((a, b) => {
        // A group's position still comes from the earliest bin it PLANS to place into, so adding a bin to a
        // product does not drag the whole product to the back of the walk.
        const earliest = (group: ProductGroup) =>
          Math.min(...group.targetBins.map(bin => rankOf(bin.toBinId)));
        const delta = earliest(a) - earliest(b);
        return delta !== 0 ? delta : a.productName.localeCompare(b.productName);
      });
    }

    return groups;
  }, [transfers, doorShelfConfig, placeBinOrder, addedMidMoveBinIds]);

  // What the Move Summary panel shows on the placement half of step 4 — one row per source→target
  // pairing, which the panel nests under the source bin each pairing leaves from. A target bin fed by
  // two sources therefore appears once beneath each of them, which is the hierarchy being stated: the
  // stock in the operator's hands came out of a particular bin.
  //
  // Status advances per TARGET BIN rather than per product. Keyed on the product alone, every one of
  // the current product's target bins lit up as "current" at once, so the panel couldn't say which
  // bin was in the operator's hands — the exact thing the marking exists to answer.
  const summaryRows: MoveSummaryRow[] = useMemo(() => {
    const doorByBinId = new Map<string, string>();
    Object.keys(doorShelfConfig).forEach(doorKey => {
      doorShelfConfig[doorKey]?.forEach(shelf => {
        shelf.bins?.forEach(bin => { doorByBinId.set(bin.id, doorKey); });
      });
    });

    const rows: MoveSummaryRow[] = [];
    productGroups.forEach((product, productIndex) => {
      product.targetBins.forEach((targetBinGroup, targetBinIndex) => {
        // What has actually been placed in this bin. Read before the status, because it is one of the
        // two things that can make a bin done.
        const placed = (scannedItems[scanKey(product.productId, targetBinGroup.toBinId)] || []).length;

        const status: MoveSummaryRow['status'] = placementBinStatus({
          productIndex,
          targetBinIndex,
          currentProductIndex,
          currentTargetBinIndex,
          placed
        });

        /**
         * A bin the operator has not reached yet states no figure at all — whichever way this move
         * records quantities.
         *
         * `pending` is now tested FIRST, and that is the fix. The no-scanning branch used to win outright
         * and hand every bin `targetBinGroup.totalQuantity`, so a bin three stops down the walk announced
         * 200 vials before anyone had opened its door. That figure is the transfer's declared amount — a
         * plan, not a record of anything having been placed there — and the panel's figures are supposed
         * to be claims about what has happened.
         *
         * Past that gate the two branches are unchanged: without scanning the whole amount is known up
         * front, so the bin in hand shows it; with scanning, what has actually been scanned in.
         */
        const quantity =
          status === 'pending'
            ? null
            : !serialScanningRequired
              ? targetBinGroup.totalQuantity
              : placed;

        // Source door isn't resolved on targetBinGroup.sourceBins (that structure was built for the
        // target side, which resolves its own door), so it's looked up here rather than reworked
        // into the shared aggregation above. Keyed on bin AND door: the same bin name exists behind
        // every door, so keying on the name alone would merge two genuinely different sources.
        const sources = Array.from(
          new Map(
            targetBinGroup.sourceBins.map(source => {
              const name = source.sourceBinName ?? 'Unknown bin';
              const door = doorByBinId.get(source.fromBinId);
              return [`${name}|${door ?? ''}`, { name, door, quantity: source.quantity }];
            })
          ).values()
        );

        sources.forEach((source, sourceIndex) => {
          rows.push({
            key: `${product.productId}-${source.name}-${targetBinGroup.toBinId}-${productIndex}-${targetBinIndex}-${sourceIndex}`,
            productName: product.productName,
            productDescription: product.productDescription,
            ndc: product.ndc,
            inventoryType: product.inventoryType,
            fromLabel: source.name,
            fromDoor: source.door,
            toLabel: targetBinGroup.targetBinName,
            toDoor: targetBinGroup.targetDoorName,
            // Taken out of this source.
            sourceQuantity: source.quantity,
            quantity,
            unit: product.unit,
            // The bin in hand on this half is a TARGET bin; the source is history by now.
            isCurrentSource: false,
            isCurrentTarget: status === 'current',
            status
          });
        });
      });
    });
    // Skipped products last, after everything actually being placed. They carry no bins — the panel
    // renders a skipped card as a name and a one-line explanation, so fromLabel/toLabel are unused.
    (skippedProducts ?? []).forEach(skippedProduct => {
      rows.push({
        key: `skipped-${skippedProduct.key}`,
        productName: skippedProduct.productName,
        productDescription: skippedProduct.productDescription,
        ndc: skippedProduct.ndc,
        inventoryType: skippedProduct.inventoryType,
        fromLabel: '',
        toLabel: '',
        sourceQuantity: null,
        quantity: null,
        isSkipped: true,
        status: 'done'
      });
    });

    // Left in productGroups' own order — the same order the operator walks through placement —
    // rather than re-sorted alphabetically, matching the quantity page's summary.
    return rows;
  }, [
    productGroups,
    doorShelfConfig,
    currentProductIndex,
    currentTargetBinIndex,
    scannedItems,
    serialScanningRequired,
    skippedProducts
  ]);

  // Distinct products in the summary, for the footer counter — matches the panel's own header count.
  const summaryProductCount = useMemo(
    () => new Set(summaryRows.map(moveSummaryProductKey)).size,
    [summaryRows]
  );

  // Get current items based on navigation
  const currentProduct = productGroups[currentProductIndex];
  const currentTargetBin = currentProduct?.targetBins[currentTargetBinIndex];

  // Whether saving from here finishes the ENTIRE change-allocation flow — the last target bin
  // of the last product in this batch, with no further products queued after it. Distinct from
  // "last target bin within this component's own productGroups", since the parent may still
  // route to another product's Quantity Selection step via `remainingTransfers`.
  const isFinalSaveStep = !!currentProduct &&
    currentTargetBinIndex === currentProduct.targetBins.length - 1 &&
    currentProductIndex === productGroups.length - 1 &&
    (!remainingTransfers || remainingTransfers.length === 0);

  /**
   * The last bin THIS product has to offer — where its own account has to balance.
   *
   * Distinct from `isFinalSaveStep`, and the distinction is load-bearing. `canSave` and the save handler
   * both used to demand "everything taken has been placed" only on the batch's final bin, which ANDed in
   * `currentProductIndex === productGroups.length - 1`. So the check never ran for any product but the
   * last: with five products, BESPONSA could have 25 vials taken, 20 placed, and `Save & Next Product`
   * stayed live — the screen showing `Qty to move 5` while the button ignored that number.
   *
   * Nothing is lost from the ledger when that happens (`finalizeAndConfirm` bills each source by what was
   * actually placed, so quantities still balance), but the books stop describing the shelf: 25 vials came
   * out of the source bin, 20 went away, and the remaining 5 are in the operator's hand while the record
   * says they never moved. And there is no `Back` in step ④, so once the walk advances that product can
   * never be completed — the remainder is stranded by design.
   *
   * A product's requirement therefore belongs to the last bin of that product. `Add Move To Bin` is the
   * intended way out and the blocked-tap toast already names it.
   */
  const isLastTargetBinForProduct = !!currentProduct &&
    currentTargetBinIndex === currentProduct.targetBins.length - 1;


  // Unlock the door this target bin is behind, locking whatever was open. Silent when the door is
  // already the open one — see the matching effect on the quantity screen.
  useEffect(() => {
    const doorName = currentTargetBin?.targetDoorName;
    if (!doorName) return;
    const { locked, unlocked } = cabinetAccess.requestDoor(doorName);
    if (!unlocked) return;
    const toastId = toast.custom(
      (t) => <DoorUnlockedToast doorName={unlocked} lockedDoor={locked} onDismiss={() => toast.dismiss(t)} />,
      { duration: 4000 }
    );
    return () => toast.dismiss(toastId);
  }, [currentTargetBin?.targetDoorName]);

  /**
   * Bins that could take the stock still in the operator's hands. Computed here rather than in the
   * dialog so the button can be withheld when there is genuinely nowhere to put it — offering a
   * control that opens an empty list is the silently-dead control the audit objects to.
   *
   * The three refusals are `moveToBinCandidates`' business; what this does is answer the questions
   * only the cabinet and the E-Kit rule can: which bins exist, what they hold, and which of them
   * restrict their contents.
   */
  const addTargetBinCandidates = useMemo(() => {
    if (!currentProduct) return [];

    const bins: MoveToBinInput[] = [];
    const restrictedBinIds: string[] = [];

    Object.keys(doorShelfConfig).forEach(doorName => {
      doorShelfConfig[doorName]?.forEach(shelf => {
        shelf.bins?.forEach(bin => {
          bins.push({
            binId: bin.id,
            binName: bin.name,
            doorName,
            productCount: bin.products.length,
            // Identity, not product.id — the same drug in another bin is a different row with a
            // different id, so an id comparison would answer no for every bin that stocks it.
            alreadyStocksProduct: bin.products.some(
              product =>
                product.name === currentProduct.productName &&
                (product as any).ndc === currentProduct.ndc &&
                (product as any).inventoryType === currentProduct.inventoryType
            )
          });
          if (emergencyKitService.isBinInEmergencyKit(bin.id, doorShelfConfig)) {
            restrictedBinIds.push(bin.id);
          }
        });
      });
    });

    // Every bin this product is being taken out of, and every bin it is already going to.
    const sourceBinIds = new Set<string>();
    const existingTargetBinIds = new Set<string>();
    currentProduct.targetBins.forEach(targetBin => {
      existingTargetBinIds.add(targetBin.toBinId);
      targetBin.transfers.forEach(transfer => sourceBinIds.add(transfer.fromBinId));
    });

    return moveToBinCandidates(bins, {
      sourceBinIds: Array.from(sourceBinIds),
      existingTargetBinIds: Array.from(existingTargetBinIds),
      restrictedBinIds,
      productAllowedInRestrictedBins: emergencyKitService.isInventoryTypeAllowed(
        currentProduct.inventoryType || '',
        'move'
      ),
      currentDoorName: currentTargetBin?.targetDoorName
    });
  }, [currentProduct, currentTargetBin?.targetDoorName, doorShelfConfig]);

  const getTargetBinKey = (targetBin: TargetBinGroup) =>
    scanKey(currentProduct.productId, targetBin.toBinId);

  const getCurrentScannedItems = () => {
    if (!currentTargetBin) return [];
    const key = getTargetBinKey(currentTargetBin);
    return scannedItems[key] || [];
  };

  const getQtyMoved = () => {
    return getCurrentScannedItems().length;
  };

  // CRITICAL: Calculate TOTAL remaining quantity across ALL target bins for current product
  const remainingQtyToMove = useMemo(() => {
    if (!currentProduct) return 0;
    
    // FIXED: Get total quantity from UNIQUE SOURCE BINS (not sum of all target bins)
    // When splitting one source to multiple targets, we should only count the source quantity once
    const uniqueSourceQuantities = new Map<string, number>();
    
    currentProduct.targetBins.forEach(tb => {
      tb.transfers.forEach(transfer => {
        const sourceKey = `${transfer.fromBinId}-${transfer.productId}`;
        if (!uniqueSourceQuantities.has(sourceKey)) {
          // CRITICAL FIX: Use transfer.quantity (edited value) first, not originalQuantity
          // transfer.quantity contains the edited value from QuantitySelectionPage
          const sourceQty = transfer.quantity || (transfer as any).originalQuantity || 0;
          uniqueSourceQuantities.set(sourceKey, sourceQty);
        }
      });
    });
    
    // Total quantity is sum of unique source bin quantities
    const totalQuantity = Array.from(uniqueSourceQuantities.values()).reduce((sum, qty) => sum + qty, 0);
    
    // Total quantity already scanned across ALL target bins for this product
    const totalScanned = currentProduct.targetBins.reduce((sum, tb) => {
      const key = `${currentProduct.productId}-${tb.toBinId}`;
      const items = scannedItems[key] || [];
      return sum + items.length;
    }, 0);
    
    return totalQuantity - totalScanned;
  }, [currentProduct, scannedItems]);

  // Same unique-source sum as remainingQtyToMove above, without subtracting what's been scanned —
  // used to tell "nothing was ever here" (0) apart from "everything's been scanned" (also 0 via
  // remainingQtyToMove), which canSave needs to treat differently.
  const currentProductTotalQuantity = useMemo(() => {
    if (!currentProduct) return 0;

    const uniqueSourceQuantities = new Map<string, number>();
    currentProduct.targetBins.forEach(tb => {
      tb.transfers.forEach(transfer => {
        const sourceKey = `${transfer.fromBinId}-${transfer.productId}`;
        if (!uniqueSourceQuantities.has(sourceKey)) {
          const sourceQty = transfer.quantity || (transfer as any).originalQuantity || 0;
          uniqueSourceQuantities.set(sourceKey, sourceQty);
        }
      });
    });

    return Array.from(uniqueSourceQuantities.values()).reduce((sum, qty) => sum + qty, 0);
  }, [currentProduct]);

  /**
   * Nothing has gone into the bin in front of the operator, so saving would leave it empty and move on.
   *
   * Worth naming, because leaving a bin empty is legitimate — "all of it in the first bin, none in the
   * second" is a real outcome and `canSave` allows it — but it should be a thing the operator *did*,
   * not a consequence of tapping the same button they tap every other time. It was silent, and combined
   * with a remainder that gets spent elsewhere it left the bin at 0 with no way to give it anything.
   *
   * Only asked when serials are being scanned. Without scanning the bin's figure is its own transfer
   * total, decided before this screen, so there is nothing here to skip.
   *
   * And only when the product has something to place. A zero-quantity move carries nothing — it
   * relocates the allocation itself (§ "Moving a product that has no stock") — so an empty bin is the
   * expected state rather than an unfinished one, and `canSave` already lets it through on that basis.
   */
  const currentBinIsEmpty =
    serialScanningRequired &&
    !!currentProduct &&
    !!currentTargetBin &&
    currentProductTotalQuantity > 0 &&
    (scannedItems[scanKey(currentProduct.productId, currentTargetBin.toBinId)] || []).length === 0;

  /**
   * Label mirrors what saving actually does next: another target bin for this product, the next product
   * in the queue, or wrapping up the whole move. It says nothing about skipping — that is a different
   * act with a button of its own (`showSkipBin` below), rather than the same button changing meaning
   * depending on whether the bin happens to be empty.
   */
  const saveButtonLabel = isFinalSaveStep
    ? 'Save & Finish'
    : currentProduct && currentTargetBinIndex < currentProduct.targetBins.length - 1
      ? 'Save & Next Bin'
      : 'Save & Next Product';

  /**
   * Passing over a bin without putting anything in it — its own control, beside Cancel, in the same slot
   * and the same secondary weight as the quantity screen's `Skip Product`.
   *
   * Two acts, two buttons. Saving an empty bin and skipping it reach the same next screen, which is why
   * one button briefly did both jobs by renaming itself; but they are not the same statement, and a
   * primary that silently becomes a skip is how a bin gets passed over by an operator who thought they
   * were saving. With the skip separate, the primary can go back to meaning exactly one thing and being
   * unavailable when there is nothing to save.
   *
   * Not offered on the final step: getting there means the remainder is 0, so everything is already
   * placed and there is nothing left to skip past.
   *
   * **And not offered when this is the product's only target bin.** Skipping means "the rest goes in the
   * other bins", so it needs other bins to mean anything: with one, it would mean "do not move this
   * product at all", which is a different decision and belongs to `Skip Product` on the quantity screen,
   * before the stock was ever taken off the shelf. The button was offered there anyway, inviting an
   * operator holding stock to pass over the only place the app knows to put it.
   *
   * That leaves the empty single-bin case with a disabled primary and no skip, which is correct rather
   * than a dead end: the scan control is live (the remainder is unspent by definition), so placing is
   * always available, and `Add Move To Bin` is there if the bin will not take it. The blocked toast names
   * both, and mentions the skip only when it is actually on screen.
   */
  const showSkipBin =
    currentBinIsEmpty && !isFinalSaveStep && currentProduct.targetBins.length > 1;


  /**
   * **A bin opens holding everything not yet assigned.**
   *
   * This replaces an auto-fill that put the remainder into a product's LAST bin only, which is what made an
   * 80/20 split cost 80 scans: the first bin opened empty, so the larger share had to be entered by hand
   * while the smaller one arrived free. Which share was free depended on the route's bin order rather than
   * on anything about the stock.
   *
   * Inverted, the effort is always the smaller subset. The bin in front of the operator starts with the lot,
   * they take out what belongs somewhere else, and the next bin opens holding exactly that. Splitting 100 as
   * 80/20 means acting on 20 whichever bin the route reaches first.
   *
   * Two things follow that used to need enforcing:
   *
   *   - **Nothing can be left unaccounted for.** The last bin holds the pool by construction, so
   *     `remainingQtyToMove` is 0 there without anyone checking — the per-product gate in `canSave` becomes
   *     a statement rather than a rule (CLAUDE.md §2 E).
   *   - **The mid-move-addition guard stops mattering to the fill.** It existed because a newly added last
   *     bin would swallow the whole remainder and leave an earlier empty bin unfixable. A bin added now
   *     opens holding the pool, which is what the operator added it for — and `addedMidMoveBinIds` keeps it
   *     ahead of them in the walk so they actually arrive at it.
   *
   * **This is the only rule that fills a target bin**, and it has to be. There used to be a second, for the
   * case where serial scanning is not required: it pushed `transfer.quantity` mock rows into whichever bin
   * was on screen. That reads correctly with one target bin and double-counts with two, because every
   * transfer out of a source carries that source's WHOLE declared amount (CLAUDE.md § Transfers) — so
   * adding a bin mid-move during a full-quantity take filled both bins with all 47, and
   * `remainingQtyToMove`, which sums scans across every target bin against a source-deduplicated total,
   * reported **-47**. A pool cannot hand out more than it holds, so the arithmetic is closed by
   * construction rather than by the two effects agreeing.
   *
   * `serialScanningRequired` therefore no longer gates the fill. It decides whether the operator may
   * *edit* the assignment — the scan box — not whether the bin is loaded.
   *
   * The seeding on first arrival is the provisional half — see `unplacedItems`.
   */
  useEffect(() => {
    if (!currentProduct || !currentTargetBin) return;
    if (currentProductTotalQuantity <= 0) return;

    const key = getTargetBinKey(currentTargetBin);
    if ((scannedItems[key] || []).length > 0) return;

    const pool = unplacedItems[currentProduct.productId];

    // First arrival at this product: seed the whole take at once, and put all of it in the bin in front of
    // the operator. Every later bin opens holding whatever they removed from an earlier one, which is the
    // same rule stated once — a bin opens holding everything not yet assigned.
    if (pool === undefined) {
      setUnplacedItems(prev => ({ ...prev, [currentProduct.productId]: [] }));
      setScannedItems(prev => ({
        ...prev,
        [key]: synthesizeScannedItems(currentProductTotalQuantity, currentProduct.unit)
      }));
      return;
    }

    if (pool.length === 0) return;

    setUnplacedItems(prev => ({ ...prev, [currentProduct.productId]: [] }));
    setScannedItems(prev => ({ ...prev, [key]: pool }));
  }, [
    currentProduct,
    currentTargetBin,
    currentTargetBinIndex,
    currentProductTotalQuantity,
    scannedItems,
    unplacedItems
  ]);

  // A new bin or a new product is a fresh pair of tables, so the ticks do not carry over. Without this a
  // selection made on one bin would silently apply its bulk action to a different bin's rows.
  useEffect(() => {
    setSelectedPlaced(new Set());
    setSelectedUnplaced(new Set());
  }, [currentProductIndex, currentTargetBinIndex]);


  /**
   * Take the operator's word for how much fit in the bin they are at, then ask for the new one.
   *
   * The trim is the whole reason this cannot just append a transfer. When the move was not scanning
   * serials, the count for this bin was filled in for the operator at its full amount — so the app
   * believes everything landed here, `remainingQtyToMove` is 0, and there is no remainder for a new bin
   * to receive. Cutting the list to what actually fit is what creates the remainder. The synthetic
   * entries are interchangeable (nothing is validated against a real serial — §5), so slicing is
   * honest here in a way it would not be if serials meant anything.
   *
   * Nothing is trimmed when the operator was scanning: the scan list already records exactly what went
   * in, and overwriting it with a typed figure would let the two disagree.
   */
  /**
   * Commit every bin picked in the overlay, and leave the operator exactly where they were.
   *
   * **No quantities are asked for here**, which is the point of the detour being a bin pick and nothing
   * else. How much goes into each bin is decided bin by bin on the placement screen afterwards, by
   * scanning into them — which is what the app already holds as the operator's decision to make
   * (§ Transfers). A prompt at this stage asked them to commit to a split before they had seen the bins
   * they were splitting across.
   *
   * **The walk does not jump to a new bin either.** The operator opened the cabinet to record where the
   * rest can go, not to be moved somewhere; they come back to the bin they were working on and carry
   * on. The new bins are in the walk ahead of them, and reachable immediately by tapping them in the
   * Move List.
   *
   * Adding bins flips serial scanning on for the product (one source now feeds several targets), so a
   * move that was not scanning becomes one that is. That is the correct consequence — a split has to be
   * declared somehow — and it is why the current bin keeps whatever it was credited with rather than
   * being cleared: taking that away would discard a figure the operator can now see and adjust.
   */
  const handleOverlayConfirm = (binIds: string[]) => {
    setAddBinOpen(false);
    if (!currentProduct || !onAddTargetBin || !currentTargetBin) return;
    // Held before the transfers change, because the walk is re-planned as soon as they do.
    setResumeTargetBinId(currentTargetBin.toBinId);
    setAddedMidMoveBinIds(prev => [...prev, ...binIds.filter(binId => !prev.includes(binId))]);
    binIds.forEach(binId => onAddTargetBin(currentProduct.productId, binId));
  };

  /**
   * Put the operator back on the bin they were working on, once the added bins have come down through
   * props — App owns the transfers, so there is a render between asking and having.
   *
   * By ID, never by index: the new bins are slotted into the route's order, which can push the bin in
   * hand anywhere in the list.
   */
  useEffect(() => {
    if (!resumeTargetBinId || !currentProduct) return;
    const index = currentProduct.targetBins.findIndex(tb => tb.toBinId === resumeTargetBinId);
    if (index === -1) return;
    if (index !== currentTargetBinIndex) setCurrentTargetBinIndex(index);
    setResumeTargetBinId(null);
  }, [resumeTargetBinId, currentProduct, currentTargetBinIndex]);


  /**
   * A scan **selects** the row it names; it no longer adds one.
   *
   * Adding was the old model's only way to get stock into a bin, and it could not be honest: the value typed
   * was invented on the spot and matched against nothing. Now the vials taken out of the source are a fixed
   * set, so a scanned serial either is or is not one of them — which makes this **the first place in the app
   * where a serial value is actually checked** (`validateSerialNumbers` only ever answered "have enough been
   * picked", CLAUDE.md §5).
   *
   * A miss is reported rather than swallowed. Under the old model an unrecognised scan silently became a new
   * row, so scanning the wrong vial was indistinguishable from scanning the right one.
   */
  const handleScanOrAdd = () => {
    if (!currentProduct || !currentTargetBin) return;

    const serial = serialInput.trim();
    if (!serial) return;

    const key = getTargetBinKey(currentTargetBin);
    const placed = scannedItems[key] || [];
    const pool = unplacedItems[currentProduct.productId] || [];

    const inBin = placed.find(item => item.serial.toLowerCase() === serial.toLowerCase());
    if (inBin) {
      setSelectedPlaced(prev => new Set(prev).add(inBin.serial));
      setSerialInput('');
      return;
    }

    // Already taken out of this bin. Selecting it in the other table is the useful answer — it is how the
    // operator puts one back without hunting for the row.
    const inPool = pool.find(item => item.serial.toLowerCase() === serial.toLowerCase());
    if (inPool) {
      setSelectedUnplaced(prev => new Set(prev).add(inPool.serial));
      setSerialInput('');
      return;
    }

    toast.custom(
      () => <ValidationToast message={`${serial} is not one of the vials taken for this product.`} />,
      { id: 'serial-not-in-move', duration: 5000 }
    );
    setSerialInput('');
  };

  /** Take the ticked rows out of this bin. They become the pool, which the next bin opens holding. */
  const handleRemoveSelected = () => {
    if (!currentProduct || !currentTargetBin || selectedPlaced.size === 0) return;
    const key = getTargetBinKey(currentTargetBin);
    const placed = scannedItems[key] || [];
    const leaving = placed.filter(item => selectedPlaced.has(item.serial));
    if (leaving.length === 0) return;

    setScannedItems(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(item => !selectedPlaced.has(item.serial))
    }));
    setUnplacedItems(prev => ({
      ...prev,
      [currentProduct.productId]: [...(prev[currentProduct.productId] || []), ...leaving]
    }));
    setSelectedPlaced(new Set());
  };

  /** Put ticked rows back into the bin in front of the operator — the inverse, for a mis-tap. */
  const handlePlaceSelected = () => {
    if (!currentProduct || !currentTargetBin || selectedUnplaced.size === 0) return;
    const key = getTargetBinKey(currentTargetBin);
    const pool = unplacedItems[currentProduct.productId] || [];
    const arriving = pool.filter(item => selectedUnplaced.has(item.serial));
    if (arriving.length === 0) return;

    setScannedItems(prev => ({ ...prev, [key]: [...(prev[key] || []), ...arriving] }));
    setUnplacedItems(prev => ({
      ...prev,
      [currentProduct.productId]: pool.filter(item => !selectedUnplaced.has(item.serial))
    }));
    setSelectedUnplaced(new Set());
  };

  /**
   * The per-row control, keyed by serial rather than index.
   *
   * It used to delete the row outright, which is how an operator reached a bin with an outstanding remainder
   * and — before the per-product gate — advanced past it, leaving vials in hand recorded as never moved. It
   * now does exactly what the bulk action does for one row: takes it out of this bin and into the pool, where
   * the next bin will open holding it. Nothing is destroyed, so the control is not red (CLAUDE.md §6).
   */
  const handleRemoveItem = (serial: string) => {
    if (!currentProduct || !currentTargetBin) return;
    const key = getTargetBinKey(currentTargetBin);
    const placed = scannedItems[key] || [];
    const leaving = placed.find(item => item.serial === serial);
    if (!leaving) return;

    setScannedItems(prev => ({ ...prev, [key]: (prev[key] || []).filter(item => item.serial !== serial) }));
    setUnplacedItems(prev => ({
      ...prev,
      [currentProduct.productId]: [...(prev[currentProduct.productId] || []), leaving]
    }));
    setSelectedPlaced(prev => {
      const next = new Set(prev);
      next.delete(serial);
      return next;
    });
  };

  const handleSave = () => {
    if (!currentProduct || !currentTargetBin) return;

    // CRITICAL: If serial scanning is NOT required, allow saving without scanning
    if (!serialScanningRequired) {
      // Skip serial scanning validation - user is just confirming the move
      console.log('🔧 Serial scanning not required - proceeding without validation');
    } else {
      // Mirrors canSave: each product's last bin has to account for everything taken from that
      // product's sources. Reads the same hoisted flag, so the guard and the button cannot disagree.
      if (isLastTargetBinForProduct && remainingQtyToMove !== 0) {
        console.log('❌ Cannot save: the whole quantity taken from the source must be placed');
        return;
      }
    }

    // Move to next target bin or product
    if (currentTargetBinIndex < currentProduct.targetBins.length - 1) {
      // Move to next target bin in same product
      setCurrentTargetBinIndex(currentTargetBinIndex + 1);
      setSerialInput('');
    } else if (currentProductIndex < productGroups.length - 1) {
      // Move to next product
      setCurrentProductIndex(currentProductIndex + 1);
      setCurrentTargetBinIndex(0);
      setSerialInput('');
    } else {
      // Last product, last target bin - finalize
      finalizeAndConfirm();
    }
  };

  const finalizeAndConfirm = () => {
    // Flatten all transfers and distribute serial numbers
    const finalTransfers: ProductTransfer[] = [];
    
    productGroups.forEach(product => {
      // Everything this product has to distribute, de-duplicated by source bin — every transfer out
      // of a given source now carries that source's whole amount, so counting them all would
      // multiply it by the number of target bins.
      const sourceTotals = new Map<string, number>();
      product.targetBins.forEach(tb => {
        tb.transfers.forEach(t => {
          const sourceKey = `${t.fromBinId}-${t.productId}`;
          if (!sourceTotals.has(sourceKey)) sourceTotals.set(sourceKey, t.quantity || 0);
        });
      });
      const productTotalQuantity = Array.from(sourceTotals.values()).reduce((sum, q) => sum + q, 0);

      /**
       * How much each source bin still has left to be credited for, across EVERY target bin — not per
       * bin. This has to be one running budget for the whole product, because a source feeds all of
       * this product's targets and can only be debited for what it actually held.
       *
       * Capping per target bin instead (each bin measuring against the source's original declared
       * amount) over-debited the first source and never touched the rest. It did not need a mid-move
       * bin to go wrong: 200 from Bin 1B and 25 from Bin 1C, placed 120 into one target and 105 into
       * another, debited Bin 1B by 225 and Bin 1C by 0 — because each bin drained 1B up to its full
       * declared 200 independently. Fill the first target completely and it goes negative: 1B debited
       * 212 of the 200 it had. The product's total stayed right, which is why it survived — the
       * conservation invariant holds at the product level while the per-bin ledger is wrong.
       */
      const sourceBudget = new Map(sourceTotals);

      product.targetBins.forEach(targetBin => {
        // THIS product's scanned items, not the one that happens to be on screen. Keyed on
        // currentProduct, every product in the batch read back the same bin's scan list, so a
        // product that had nothing taken from it was still charged whatever the on-screen product
        // had scanned — a 0-quantity ALIMTA came out of the move at -10 because OCTAGAM, sharing its
        // target bin, had 10 scanned against it.
        const key = scanKey(product.productId, targetBin.toBinId);
        const items = scannedItems[key] || [];
        const serialNumbers = items.map(item => item.serial);
        
        // CRITICAL FIX: Calculate actual quantity moved to THIS target bin
        // Instead of using transfer.quantity (which might be the total from source),
        // use the number of scanned items or the totalQuantity for this target bin
        const actualQuantityForThisTargetBin = serialScanningRequired 
          ? items.length  // Use scanned quantity if serial scanning was required
          : targetBin.totalQuantity;  // Use pre-calculated total if no serial scanning
        
        console.log('🔧 TargetBinSerialScanPage - Finalizing Transfer:', {
          productId: product.productId,
          productName: product.productName,
          targetBinId: targetBin.toBinId,
          targetBinName: targetBin.targetBinName,
          originalTransferCount: targetBin.transfers.length,
          scannedItems: items.length,
          actualQuantity: actualQuantityForThisTargetBin,
          serialScanningRequired
        });
        
        // One transfer per SOURCE bin — NOT one consolidated transfer per target bin.
        // Collapsing them onto targetBin.transfers[0] billed the whole target quantity to the
        // first source bin (driving it negative) and left every other source bin untouched, so
        // no source ever landed on exactly 0 and the zero-quantity unallocate prompt never fired.
        // Downstream (doorShelfConfig debit, history sourceBins) needs the per-bin split intact.
        if (targetBin.transfers.length > 0) {
          // Serials are scanned per target bin, not per source, so hand them out in order as
          // each source's share is assigned.
          let serialCursor = 0;
          let remainingToAssign = actualQuantityForThisTargetBin;

          targetBin.transfers.forEach(sourceTransfer => {
            // Sources are consumed in the order they were added, each capped by what it has LEFT
            // rather than by what it originally declared. There is no special case for the last
            // source any more: it used to absorb the whole difference between declared and scanned,
            // which is what let one bin's shortfall be charged to a source that had already been
            // fully spent by an earlier bin. Draining in order does the same job — the shares still
            // sum to what was actually placed — without any source going past what it held.
            const sourceKey = `${sourceTransfer.fromBinId}-${sourceTransfer.productId}`;
            const availableFromSource = sourceBudget.get(sourceKey) ?? 0;
            const assignedQuantity = Math.min(availableFromSource, remainingToAssign);

            remainingToAssign -= assignedQuantity;
            sourceBudget.set(sourceKey, availableFromSource - assignedQuantity);
            // Nothing landed here, so there's nothing to record — unless the product had no stock to
            // begin with, in which case this transfer is the whole point: it relocates the allocation
            // itself. Dropping it then silently cancelled the move, and the target bin never got the
            // product at all.
            if (assignedQuantity <= 0 && productTotalQuantity > 0) return;

            const assignedSerials = serialNumbers.slice(serialCursor, serialCursor + assignedQuantity);
            serialCursor += assignedQuantity;

            finalTransfers.push({
              ...sourceTransfer,
              quantity: assignedQuantity,
              serialNumbers: assignedSerials
            });

            console.log('📦 Final Transfer Created:', {
              productId: sourceTransfer.productId,
              fromBinId: sourceTransfer.fromBinId,
              toBinId: sourceTransfer.toBinId,
              quantity: assignedQuantity,
              serialCount: assignedSerials.length
            });
          });
        }
      });
    });
    
    console.log('✅ All Final Transfers:', {
      totalTransfers: finalTransfers.length,
      transfers: finalTransfers.map(t => ({
        productId: t.productId,
        fromBinId: t.fromBinId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        serialCount: t.serialNumbers?.length || 0
      }))
    });

    onConfirm(finalTransfers);
  };

  if (!currentTargetBin || !currentProduct) return null;

  const qtyMoved = getQtyMoved();
  const currentScannedItems = getCurrentScannedItems();

  /**
   * The pool, for the second table. Declared here — beside the placed list it is the counterpart of — and
   * above the JSX, since a `const` is not hoisted (CLAUDE.md §4).
   */
  const poolItems = currentProduct ? unplacedItems[currentProduct.productId] || [] : [];

  const toggleInSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    serial: string
  ) =>
    setter(prev => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });

  const toggleSelectedPlaced = (serial: string) => toggleInSet(setSelectedPlaced, serial);
  const toggleSelectedUnplaced = (serial: string) => toggleInSet(setSelectedUnplaced, serial);

  // Select-all completes a partial selection rather than clearing it, and clears only once everything is
  // ticked — the rule `ProductListControls` follows, and the reason its label can name its own next act
  // (CLAUDE.md §6).
  const toggleAllIn = (
    items: ScannedItem[],
    selected: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    const all = items.length > 0 && items.every(item => selected.has(item.serial));
    setter(all ? new Set() : new Set(items.map(item => item.serial)));
  };

  const toggleAllPlaced = () => toggleAllIn(currentScannedItems, selectedPlaced, setSelectedPlaced);
  const toggleAllUnplaced = () => toggleAllIn(poolItems, selectedUnplaced, setSelectedUnplaced);

  // There is something for a scan to find. Not "is anything still unplaced" — that is 0 on arrival now.
  const canScanSelect =
    serialScanningRequired && currentScannedItems.length + poolItems.length > 0;

  /**
   * Whether vials can be taken out of the bin in front of the operator — i.e. whether there is a later bin
   * for this product to send them to.
   *
   * `!isLastTargetBinForProduct` covers all three cases in one expression, which is why it is stated this
   * way rather than as "more than one target bin":
   *
   *   - one target bin        → it is the last → off
   *   - the last of several   → off
   *   - an earlier of several → on
   *
   * And it turns on by itself when the operator adds a bin mid-move: `Add Move To Bin` appends to the
   * product's `targetBins`, so the bin they are standing at stops being the last one.
   *
   * Without this, removal on a last bin drops vials into a pool with nowhere to drain to — `canSave` then
   * refuses, correctly, but only after the fact. Better not to offer the act than to undo it.
   */
  const canRemoveFromThisBin = serialScanningRequired && !isLastTargetBinForProduct;

  const canRemoveSelected = canRemoveFromThisBin && selectedPlaced.size > 0;

  // Validation for save button
  // CRITICAL: Different logic for last vs non-last target bins when serial scanning required
  const canSave = (() => {
    // Nothing was ever at the source for this product — there's nothing to scan, and requiring
    // qtyMoved > 0 below would make this unsaveable forever. This is a relocation of the allocation
    // itself, not a quantity transfer, so it's always ready to save.
    if (currentProductTotalQuantity === 0) {
      return true;
    }

    // If serial scanning NOT required (full transfer), always allow save
    if (!serialScanningRequired) {
      return true;
    }

    // Each product's LAST bin carries that product's requirement: everything taken out of its sources
    // has to have been placed somewhere. Scoped per product, not per batch — see
    // `isLastTargetBinForProduct` for what the batch-scoped version let through.
    if (isLastTargetBinForProduct) return remainingQtyToMove === 0;

    // Elsewhere, the only thing that blocks saving is having nothing to save. Leaving a bin empty is
    // still allowed — "all of it in the first bin, none in the second" is a legitimate outcome — but it
    // goes through `Skip This Bin`, which says so. Saving is for a bin that received something.
    //
    // Note this is NOT the old "demand qtyMoved > 0 everywhere", which made the emptied last bin
    // unfinishable: the last bin returns above, on the remainder, before ever reaching this line.
    return !currentBinIsEmpty;
  })();

  /**
   * Whether to offer more Move To bins.
   *
   * Offered on any of the product's bins, not only its last. It was last-bin-only on the reasoning that
   * anywhere earlier the next bin in the walk is already the place for whatever did not fit — true, but
   * it made a general question ("where else can this product go?") answerable only from one position in
   * the walk. Since picking bins here neither asks for quantities nor moves the operator, there is
   * nothing to protect them from by withholding it.
   *
   * Withheld for a zero-quantity move, which carries nothing to run out of room for, and when every bin
   * in the cabinet is refused — a control that opens onto nothing selectable is worse than no control.
   *
   * NOT gated on `remainingQtyToMove > 0`. That is the tempting version and would hide the button in
   * exactly the case it was built for: with the whole quantity going to one bin no serials are scanned,
   * so the count is filled in at the full amount and the remainder reads as 0 while the bin in front of
   * the operator is physically full.
   */
  const canAddTargetBin =
    !!onAddTargetBin &&
    currentProductTotalQuantity > 0 &&
    // Asked of the bins the overlay will actually accept, not of every bin in the cabinet — otherwise
    // the button can be offered on the strength of bins that would all be refused.
    selectableMoveToBins(reachableMoveToBins(addTargetBinCandidates).listed).length > 0;

  /**
   * Why saving is unavailable, said in a toast rather than in the button's label.
   *
   * The bin-picking steps put their requirement IN the label (`Select a source bin`), which works where
   * the label's job is to name what happens next. It reads badly here for the same reason step ④'s
   * `Cancel` keeps its own name: `Place 9 more vials` replaced the button's identity with a sentence
   * about it, so the one control that finishes the move stopped saying what it does — and
   * `Save & Finish` / `Save & Next Bin` also tell the operator where the flow goes next, which they lose
   * entirely while the button is explaining itself.
   *
   * The message names both ways out, and mentions the second only when it is actually on screen:
   * pointing at a control that is not there is worse than saying nothing about it. Declared below
   * `canAddTargetBin` because a `const` is not hoisted (CLAUDE.md §4) — it threw from up there.
   */
  /**
   * Why removal is unavailable, said on tap rather than left to a dimmed control.
   *
   * Two different blocks needing different sentences, and neither is "you did something wrong": no later
   * bin is a fact about the move, and nothing ticked is a step not yet taken. `Add Move To Bin` is named
   * only when it is actually on screen — pointing at a control that is not there is worse than saying
   * nothing about it.
   *
   * **Declared here, below `canAddTargetBin`, for the same reason `cannotSaveReason` is.** A `const` is not
   * hoisted, and from further up this threw `Cannot access 'canAddTargetBin' before initialization`, which
   * the error boundary shows as a blank screen (CLAUDE.md §4). The note on `cannotSaveReason` records the
   * identical mistake being made once already; two in one file is the argument for reading them before
   * adding a third.
   */
  const cannotRemoveReason = !canRemoveFromThisBin
    ? canAddTargetBin
      ? 'This is the only bin left for this product, so there is nowhere to move vials to. Use Add Move To Bin to give it another.'
      : 'This is the only bin left for this product, so everything here has to go in it.'
    : 'Select the vials that belong in another bin first.';

  const cannotSaveReason = (() => {
    // Two different blocks, and they need different sentences. An empty bin is blocked on this bin
    // having received nothing; the final bin is blocked on the batch still having stock unplaced.
    if (showSkipBin) {
      return 'Nothing has been placed in this bin yet. Add what goes here, or use Skip This Bin to pass it over.';
    }
    const amount = `${remainingQtyToMove} ${pluralizeUnit(currentProduct.unit || 'vial', remainingQtyToMove)}`;
    return canAddTargetBin
      ? `${amount} still to place. Put them in this bin, or use Add Move To Bin for whatever will not fit.`
      : `${amount} still to place in this bin.`;
  })();

  // Same shaping as the quantity screen opposite: binProducts.ts keys badges on
  // name | ndc | inventoryType, which this screen carries under different field names.
  const badgeIdentity = {
    name: currentProduct.productName,
    ndc: currentProduct.ndc,
    inventoryType: currentProduct.inventoryType
  };

  /**
   * The bin-picking detour renders in place of this screen's own content, not over the whole viewport.
   *
   * This component stays mounted either way, which is what matters: `scannedItems` is local state, so
   * unmounting would discard every serial scanned in the batch. Returning different children keeps it
   * alive while handing the content area to the cabinet — and because MainLayout is above this in the
   * tree, the side navigation and station bar stay exactly where they were. Covering them made a detour
   * inside step ④ look like leaving the application.
   */
  if (addBinOpen && canAddTargetBin) {
    return (
      <AddMoveToBinOverlay
        open
        doorShelfConfig={doorShelfConfig}
        productName={currentProduct.productName}
        productInventoryType={currentProduct.inventoryType}
        sourceBinIds={Array.from(
          new Set(
            currentProduct.targetBins.flatMap(tb => tb.transfers.map(transfer => transfer.fromBinId))
          )
        )}
        existingTargetBinIds={currentProduct.targetBins.map(tb => tb.toBinId)}
        currentDoorName={currentTargetBin.targetDoorName}
        onCancel={() => setAddBinOpen(false)}
        onConfirm={handleOverlayConfirm}
      />
    );
  }

  return (
    // Anchored for Demo Mode: the place half of step ④ — the operator is at the TARGET bin, putting stock in.
    // Both halves report Step 4/4, so the footer cannot tell a walkthrough which of them is on screen.
    <div className="flex flex-col h-full bg-white" data-demo="step4-placement">
      <div className="flex-1 flex min-h-0">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/* Product Header */}
      <div className="border-b bg-white px-6 py-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[16px] font-semibold text-[#020817]">{currentProduct.productName}</h2>
              {/* The shared badges, as on the quantity screen — these two are the halves of one step,
                  so a product cannot wear a different badge on each. */}
              <div className="flex items-center gap-1">
                <ProductBadges product={badgeIdentity} />
              </div>
            </div>
            {currentProduct.productDescription && (
              <p className="text-[14px] text-[#4a5565]">{currentProduct.productDescription}</p>
            )}
          </div>

          {/* The header's right slot, which justify-between above already leaves empty. A recovery
              control belongs where the operator's eye lands when the door in front of them has not
              opened — on the same line as the product they are stuck on, not buried with the door
              details further down the page. Absent for a fridge, which has no lock. */}
          <UnlockDoorButton doorName={currentTargetBin?.targetDoorName} cabinetAccess={cabinetAccess} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#f9fafb] pb-32">
        {/* Info Sections */}
        <div className="bg-white border-b px-6 py-6">
          <div className="grid grid-cols-3 gap-8">
            {/* Product Details */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Product Details</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">NDC:</span>
                  <span className="text-[14px] text-[#020817]">
                    {currentProduct.ndc || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Inventory Type:</span>
                  <span className="text-[14px] text-[#020817]">
                    {currentProduct.inventoryType}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Bin with Source Bins List */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Move To</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[14px] text-[#4a5565]">Door:</span>
                  <span className="text-[14px] text-[#020817]">{currentTargetBin.targetDoorName}</span>
                  {/* An "Unlocked" badge stood here. It reported a state the operator cannot verify from
                      the screen — the whole reason the Unlock Door button in the header exists is that the
                      app's belief and the hardware can disagree — so a green badge saying the door is open
                      was at best redundant with the door being open and at worst a contradiction of it. */}
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Bin:</span>
                  <span className="text-[14px] text-[#020817]">{currentTargetBin.targetBinName}</span>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Inventory</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Before Move:</span>
                  <span className="text-[14px] text-[#020817]">{currentTargetBin.targetBinExistingQty}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">After Move:</span>
                  <span className="text-[14px] text-[#020817] font-semibold">{currentTargetBin.targetBinExistingQty + qtyMoved}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search/Scan Section */}
        <div className="bg-white border-b px-6 py-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded px-4 py-3">
                <Search className="w-5 h-5 text-[#9fa9b7]" />
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canScanSelect) handleScanOrAdd();
                  }}
                  // A scan selects a row now, so the box is live whenever there is a row to select. It used
                  // to be gated on `remainingQtyToMove > 0` — what was still unplaced — which under the
                  // bin-opens-full model is 0 the moment the operator arrives, so the control would have
                  // been dead exactly when it is wanted.
                  placeholder={serialScanningRequired ? "Scan to select a serial" : "Serial scanning not required"}
                  className="flex-1 text-[16px] text-[#020817] outline-none placeholder:text-[#9fa9b7]"
                  disabled={!canScanSelect}
                />
                <Button
                  onClick={handleScanOrAdd}
                  className="bg-[#095192] text-white hover:bg-[#074171]"
                  size="sm"
                  disabled={!canScanSelect}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-[16px] text-[#64748b] mb-2">Qty to move</p>
                <p className="text-[48px] font-semibold text-[#020817]">{remainingQtyToMove}</p>
              </div>
              
              <div className="h-10 w-px bg-[#d9d9d9]" />
              
              <div className="text-right">
                <p className="text-[16px] text-[#64748b] mb-2">Qty moved ({pluralizeUnit(currentProduct.unit || 'Vial', qtyMoved)})</p>
                <p className="text-[48px] font-semibold text-[#020817]">{qtyMoved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two tables: what is in this bin, and what has been taken out of it and is not in any bin yet.
            The second only appears once there is something in it — a permanently empty table below a full
            one reads as a section that failed to load, and on arrival there is nothing there by
            construction (the bin opens holding everything). */}
        <div className="bg-white px-6 py-6 space-y-6">
          {currentScannedItems.length > 0 || poolItems.length > 0 ? (
            <>
              <SerialTable
                items={currentScannedItems}
                selected={selectedPlaced}
                onToggle={toggleSelectedPlaced}
                onToggleAll={toggleAllPlaced}
                onRemoveOne={canRemoveFromThisBin ? handleRemoveItem : undefined}
                selectable={canRemoveFromThisBin}
                caption={
                  <>
                    <span className="font-semibold text-[#020817]">{currentScannedItems.length}</span>{' '}
                    {currentScannedItems.length === 1 ? 'vial' : 'vials'} moved in this bin
                  </>
                }
                action={
                  serialScanningRequired && (
                    // **The label never changes.** It briefly stated its own count — `Remove 3 from this
                    // bin` — which reads well in a screenshot and badly in the hand: the button re-flowed
                    // and changed width on every tick, moving under the eye of someone mid-selection. Same
                    // objection as the take half's bin cards, where a figure arriving on the name's line
                    // pushed the text. A count that changes belongs in the caption above, which is not a
                    // control and is not being aimed at.
                    //
                    // Dimmed rather than withheld in both blocked states: a control that comes and goes is
                    // a layout shifting mid-task, and `Add Move To Bin` can turn this one on part-way
                    // through a product.
                    //
                    // `aria-disabled` without the `disabled` attribute, so the tap still lands and can
                    // explain itself — a disabled button swallows the click and reads as broken.
                    <button
                      type="button"
                      aria-disabled={!canRemoveSelected}
                      onClick={
                        canRemoveSelected
                          ? handleRemoveSelected
                          : () =>
                              toast.custom(
                                () => <ValidationToast message={cannotRemoveReason} />,
                                { id: 'cannot-remove-serials', duration: 5000 }
                              )
                      }
                      className={`h-9 px-3 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] transition-colors ${
                        canRemoveSelected
                          ? 'hover:bg-[#F1F6FA] cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      Remove selected
                    </button>
                  )
                }
              />

              {poolItems.length > 0 && (
                <SerialTable
                  items={poolItems}
                  selected={selectedUnplaced}
                  onToggle={toggleSelectedUnplaced}
                  onToggleAll={toggleAllUnplaced}
                  caption={
                    <>
                      <span className="font-semibold text-[#020817]">{poolItems.length}</span>{' '}
                      {poolItems.length === 1 ? 'vial' : 'vials'} not placed in this bin
                    </>
                  }
                  action={
                    // The inverse of Remove, for a mis-tap. `Move selected` rather than "undo", because by
                    // the time the operator is looking at this table it is a placement decision like any
                    // other — and it pairs with `Remove selected` as the same kind of act in the other
                    // direction. Fixed label for the same reason, and it explains itself on a blocked tap.
                    <button
                      type="button"
                      aria-disabled={selectedUnplaced.size === 0}
                      onClick={
                        selectedUnplaced.size > 0
                          ? handlePlaceSelected
                          : () =>
                              toast.custom(
                                () => (
                                  <ValidationToast message="Select the vials that go in this bin first." />
                                ),
                                { id: 'cannot-move-serials', duration: 5000 }
                              )
                      }
                      className={`h-9 px-3 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] transition-colors ${
                        selectedUnplaced.size > 0
                          ? 'hover:bg-[#F1F6FA] cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      Move selected
                    </button>
                  }
                />
              )}
            </>
          ) : (
            <div className="text-center py-20 text-[#9fa9b7]">
              <p className="text-[16px]">Nothing to place for this product.</p>
            </div>
          )}
        </div>
      </div>
      </div>

      <MoveSummaryPanel
        rows={summaryRows}
        isOpen={summaryOpen}
        onToggle={() => setSummaryOpen(prev => !prev)}
        // This half puts stock IN, so the target end of the current pairing is the bin in hand.
        stage="target"
      />
      </div>

      {/* PIP: real-world cabinet interaction for the current target bin */}
      <CabinetPipView
        doorName={currentTargetBin.targetDoorName}
        binName={currentTargetBin.targetBinName}
        binId={currentTargetBin.toBinId}
        doorShelfConfig={doorShelfConfig}
        mode="target"
        // What has actually been placed in this bin so far, not the source's whole amount — with
        // several target bins the operator decides the split by scanning, so this bin's share only
        // exists once they've scanned it.
        quantity={qtyMoved}
        unit={currentProduct.unit}
      />

      {/* Footer. fixed left-[60px] clears the nav rail: this page is full-bleed, unlike the cabinet
          page whose bar sits inside the content column. Always right-0, matching the quantity page —
          the bar runs the full width including under the Move Summary panel rather than stopping at
          its edge, same as Review. */}
      <div className="fixed bottom-0 left-[60px] right-0 z-10">
        <PipelineFooterShell>
          {/* Still step 4: taking the quantity at the source and placing it here are two halves of one
              move, so the number does not advance between them. */}
          <StepCell step={4} moveMode={moveMode} />
          <FooterDivider />

          {/* Hidden for now — see SHOW_STEP4_POSITION_COUNTERS. */}
          {SHOW_STEP4_POSITION_COUNTERS && (
            <>
              <SummaryCell
                icon={<Package className="w-4 h-4" />}
                label="Product"
                value={(() => {
                  // Total is what this page holds plus whatever is still queued behind it, so the
                  // position counts against the whole move rather than just this batch.
                  const currentUniqueProducts = new Set(
                    productGroups.map(g => `${g.productName}-${g.ndc}-${g.inventoryType}`)
                  );
                  const remainingUniqueProducts = new Set<string>();
                  (remainingTransfers ?? []).forEach(transfer => {
                    const t = transfer as any;
                    if (t.productName) {
                      remainingUniqueProducts.add(`${t.productName}-${t.ndc}-${t.inventoryType}`);
                    }
                  });
                  const total = new Set([...currentUniqueProducts, ...remainingUniqueProducts]).size;
                  return `${total - remainingUniqueProducts.size} of ${total}`;
                })()}
                active={activeSheet === 'product'}
                enabled
                onClick={() => setActiveSheet('product')}
              />
              <FooterDivider />
              <SummaryCell
                icon={<LogIn className="w-4 h-4" />}
                label="Move To"
                value={`${currentTargetBinIndex + 1} of ${currentProduct.targetBins.length}`}
                active={activeSheet === 'targetBin'}
                enabled
                onClick={() => setActiveSheet('targetBin')}
              />
              <FooterDivider />
            </>
          )}
          {/* Same Move Summary counter the other two stages use, always enabled for the same reason. */}
          <SummaryCell
            icon={<ListChecks className="w-4 h-4" />}
            label="Move List"
            value={`${summaryProductCount} ${summaryProductCount === 1 ? 'product' : 'products'}`}
            active={summaryOpen}
            enabled
            onClick={() => setSummaryOpen(prev => !prev)}
          />

          <FooterActions>
            {/* Never available on this screen. Every quantity was taken at the source before anything was
                carried here, so a cancel would rest entirely on the operator putting stock back in the
                right bins — which nothing in the app can verify (STEP4-GUIDANCE.md §8). Shown rather than
                removed, keeping its own name, and explaining on tap. */}
            <FooterButton
              label="Cancel"
              variant="secondary"
              enabled={false}
              onClick={onCancel}
              onBlockedClick={() =>
                toast.custom(() => <ValidationToast message={CANNOT_CANCEL_REASON} />, { duration: 6000 })
              }
            />
            {/* The way out of the state this screen could not finish: the bin in front of the operator
                has no room left for stock that has already left its source. */}
            {canAddTargetBin && (
              <FooterButton
                label="Add Move To Bin"
                variant="secondary"
                onClick={() => setAddBinOpen(true)}
                leadingIcon={<PackagePlus className="w-4 h-4" />}
                demoId="pipeline-add-target-bin"
              />
            )}
            {/* Passing over a bin is its own act, so it gets its own button rather than the primary
                renaming itself — same slot and weight as the quantity screen's Skip Product. Only while
                the bin is empty: once something is in it, saving is what happens next. */}
            {showSkipBin && (
              <FooterButton
                label="Skip This Bin"
                variant="secondary"
                onClick={handleSave}
                demoId="pipeline-skip-bin"
              />
            )}
            <FooterButton
              label={saveButtonLabel}
              variant="primary"
              enabled={canSave}
              onClick={handleSave}
              onBlockedClick={() =>
                toast.custom(() => <ValidationToast message={cannotSaveReason} />, { duration: 6000 })
              }
              trailingIcon={<ArrowRight className="w-4 h-4" />}
              demoId="pipeline-primary"
            />
          </FooterActions>
        </PipelineFooterShell>
      </div>

      {/* Product list sheet */}
      <SideSheet
        open={activeSheet === 'product'}
        title="Products in this step"
        subtitle={`${productGroups.length} product${productGroups.length !== 1 ? 's' : ''} being placed`}
        onClose={() => setActiveSheet(null)}
      >
        {productGroups.map((p, idx) => {
          const isCurrent = idx === currentProductIndex;
          const isDone = idx < currentProductIndex;
          const totalQty = p.targetBins.reduce((sum, tb) => sum + tb.totalQuantity, 0);
          return (
            <div
              key={`${p.productName}-${p.ndc}-${idx}`}
              className={`border rounded-[6px] p-3 mb-2 ${
                isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#020817]">{p.productName}</p>
                  {p.productDescription && <p className="text-[12px] text-[#64748b]">{p.productDescription}</p>}
                  <p className="text-[12px] text-[#64748b] mt-1">
                    NDC: {p.ndc || 'N/A'} · {p.inventoryType || 'Purchased'}
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    {p.targetBins.length} bin{p.targetBins.length !== 1 ? 's' : ''} to move to
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isDone && (
                    <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                  )}
                  <span className="text-[13px] font-semibold text-[#020817]">
                    {totalQty} {pluralizeUnit(p.unit || 'vial', totalQty)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {remainingTransfers && remainingTransfers.length > 0 && (
          <p className="text-[12px] text-[#64748b] mt-2 px-1">
            More products from this allocation will follow after this step.
          </p>
        )}
      </SideSheet>

      {/* Target bin list sheet — bins for the CURRENT product */}
      <SideSheet
        open={activeSheet === 'targetBin'}
        title="Bins to move to"
        subtitle={currentProduct.productName}
        onClose={() => setActiveSheet(null)}
      >
        {currentProduct.targetBins.map((tb, idx) => {
          const scannedCount = (scannedItems[scanKey(currentProduct.productId, tb.toBinId)] || []).length;
          // The same function the Move Summary's row status comes from, so this badge and that panel
          // cannot disagree about which bins are finished. This sheet only ever lists the current
          // product's bins, so the product indices are equal by construction.
          const walkStatus = placementBinStatus({
            productIndex: currentProductIndex,
            targetBinIndex: idx,
            currentProductIndex,
            currentTargetBinIndex,
            placed: scannedCount
          });
          const isCurrent = walkStatus === 'current';
          const isDone = walkStatus === 'done';
          return (
            <div
              key={tb.toBinId}
              className={`border rounded-[6px] p-3 mb-2 ${
                isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#020817]">{tb.targetBinName}</p>
                  <p className="text-[12px] text-[#64748b]">{tb.targetDoorName}</p>
                  <p className="text-[12px] text-[#64748b] mt-1">
                    From {tb.sourceBins.map(sb => sb.sourceBinName).filter(Boolean).join(', ') || 'the bin you moved from'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isDone && (
                    <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                  )}
                  {/* Placed in this bin, full stop. It used to read "n/total", but with several
                      target bins there is no per-bin total to divide by — the operator is deciding
                      each bin's share as they scan, so a denominator would be inventing a target
                      they never set. */}
                  <span className="text-[13px] font-semibold text-[#020817]">
                    {serialScanningRequired ? scannedCount : tb.totalQuantity}{' '}
                    {pluralizeUnit(
                      currentProduct.unit || 'vial',
                      serialScanningRequired ? scannedCount : tb.totalQuantity
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </SideSheet>


    </div>
  );
}