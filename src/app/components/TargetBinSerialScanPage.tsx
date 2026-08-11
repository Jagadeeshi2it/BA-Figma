import React, { useState, useEffect, useMemo } from 'react';
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { ChevronRight, Search, Trash2, Package, PackagePlus, LogIn, ListChecks, ArrowRight } from "lucide-react";
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
    quantity: `1 ${unit || 'vial'}`
  }));

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
  const [binsAddedMidMove, setBinsAddedMidMove] = useState(false);
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
      groups.forEach(group => {
        group.targetBins.sort((a, b) => {
          const delta = rankOf(a.toBinId) - rankOf(b.toBinId);
          return delta !== 0 ? delta : a.targetBinName.localeCompare(b.targetBinName);
        });
      });
      groups.sort((a, b) => {
        const earliest = (group: ProductGroup) =>
          Math.min(...group.targetBins.map(bin => rankOf(bin.toBinId)));
        const delta = earliest(a) - earliest(b);
        return delta !== 0 ? delta : a.productName.localeCompare(b.productName);
      });
    }

    return groups;
  }, [transfers, doorShelfConfig, placeBinOrder]);

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

        // A bin the operator hasn't reached yet has no figure at all: its share is decided by scanning
        // into it, so a 0 would look like a decision they'd made rather than one still ahead of them.
        // (When no scanning is required the whole amount is known up front, so it's shown.)
        const quantity = !serialScanningRequired
          ? targetBinGroup.totalQuantity
          : status === 'pending' ? null : placed;

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
            // Only so the panel can hand it back when the operator taps a bin to walk to it. This half
            // is the only stage with a position to move within, so it is the only one that sends it.
            toBinId: targetBinGroup.toBinId,
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

  // AUTO-POPULATE serial numbers when serial scanning is NOT required
  // This happens when moving entire quantity to single target bin
  useEffect(() => {
    if (!serialScanningRequired && currentTargetBin && currentProduct) {
      const key = getTargetBinKey(currentTargetBin);
      
      // Check if already populated for this target bin
      if (scannedItems[key] && scannedItems[key].length > 0) {
        console.log('🔧 Serial numbers already populated for this target bin');
        return;
      }
      
      console.log('🔧 Auto-populating serial numbers from source bin(s)');
      
      // Collect all serial numbers from source bins
      const autoPopulatedItems: ScannedItem[] = [];
      
      currentTargetBin.transfers.forEach(transfer => {
        // Find the source bin in doorShelfConfig
        Object.keys(doorShelfConfig).forEach(doorKey => {
          const shelves = doorShelfConfig[doorKey];
          shelves?.forEach(shelf => {
            shelf.bins?.forEach(bin => {
              if (bin.id === transfer.fromBinId) {
                // Find the product in the source bin
                const product = bin.products.find(p => p.id === transfer.productId);
                
                if (product && product.serialNumbers && product.serialNumbers.length > 0) {
                  // Add all serial numbers from this source bin
                  product.serialNumbers.forEach(serial => {
                    autoPopulatedItems.push({
                      serial: serial,
                      lot: product.lot || Math.floor(Math.random() * 10000000).toString(),
                      source: product.manufacturer || 'McKesson Medical',
                      expiration: product.expiration || new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                      quantity: `1 ${product.unit || 'vial'}`
                    });
                  });
                } else {
                  // If no serial numbers exist, generate mock ones based on quantity
                  for (let i = 0; i < transfer.quantity; i++) {
                    autoPopulatedItems.push({
                      serial: `SN${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
                      lot: product?.lot || Math.floor(Math.random() * 10000000).toString(),
                      source: product?.manufacturer || 'McKesson Medical',
                      expiration: product?.expiration || new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                      quantity: `1 ${product?.unit || 'vial'}`
                    });
                  }
                }
              }
            });
          });
        });
      });
      
      // Set the auto-populated items
      if (autoPopulatedItems.length > 0) {
        setScannedItems(prev => ({
          ...prev,
          [key]: autoPopulatedItems
        }));
        
        console.log('✅ Auto-populated', autoPopulatedItems.length, 'serial numbers');
      }
    }
  }, [serialScanningRequired, currentTargetBin, currentProduct, doorShelfConfig]);

  /**
   * Auto-fill the LAST target bin with whatever is still unaccounted for.
   *
   * The convenience rests on an assumption: once the earlier bins have had their share, the remainder has
   * nowhere else to go, so there is nothing left for the operator to decide by scanning it. For a split
   * planned at step ② that holds — the bins and their order are what the operator set up, and the last one
   * taking the rest is the behaviour they expect. **That flow is left exactly as it was.**
   *
   * `binsAddedMidMove` is the one case where the assumption breaks. Adding bins here re-plans the route,
   * so the bin that is now last may be one the operator has only just named, and handing it the whole
   * remainder defeats the reason they added it — worse, it makes the decision unrecoverable, because
   * `remainingQtyToMove` hits 0 and that disables the scan control on *every* bin. With no Back in step ④
   * the bin they meant to fill would sit at 0 with the one control that could fix it greyed out.
   *
   * So the extra precondition applies only after bins have been added mid-move: while any earlier bin is
   * still empty, the fill holds off, the input stays live with a real remainder, and the operator can put
   * the rest here or jump back to the bin they missed (the Move List's target lines).
   */
  useEffect(() => {
    if (!currentProduct || !currentTargetBin) return;
    const isLastTargetBinForProduct = currentTargetBinIndex === currentProduct.targetBins.length - 1;
    if (!isLastTargetBinForProduct || remainingQtyToMove <= 0) return;

    if (binsAddedMidMove) {
      const everyEarlierBinHasStock = currentProduct.targetBins
        .slice(0, currentTargetBinIndex)
        .every(tb => (scannedItems[scanKey(currentProduct.productId, tb.toBinId)] || []).length > 0);
      if (!everyEarlierBinHasStock) return;
    }

    const key = getTargetBinKey(currentTargetBin);
    if ((scannedItems[key] || []).length > 0) return;

    setScannedItems(prev => ({
      ...prev,
      [key]: synthesizeScannedItems(remainingQtyToMove, currentProduct.unit)
    }));
  }, [
    currentProduct,
    currentTargetBin,
    currentTargetBinIndex,
    remainingQtyToMove,
    scannedItems,
    binsAddedMidMove
  ]);


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
    setBinsAddedMidMove(true);
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
   * Walk to one of this product's target bins by tapping it in the Move List.
   *
   * The only route back step ④ has. It is not a `Back` — that was removed at the operator's request and
   * stepped through the pipeline; this stays on the placement screen and changes which bin is in hand,
   * which is a different act. Without it a bin walked past empty was unreachable, and since the scan
   * control dies once the remainder is spent, its 0 was permanent.
   *
   * Scoped to the current product's bins on purpose. Jumping to another product's bin would have to move
   * `currentProductIndex` too, and the walk's product order is the route's (planned door by door) — so
   * that is a different and much larger question than "let me finish the bin I skipped".
   */
  const handleGoToTargetBin = (toBinId: string) => {
    if (!currentProduct) return;
    const index = currentProduct.targetBins.findIndex(tb => tb.toBinId === toBinId);
    if (index === -1 || index === currentTargetBinIndex) return;
    setCurrentTargetBinIndex(index);
    setSerialInput('');
  };

  const handleScanOrAdd = () => {
    if (!currentTargetBin) return;

    const key = getTargetBinKey(currentTargetBin);
    
    // Generate demo serial number
    const serialNumber = serialInput.trim() || `SN${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
    
    // Mock data for demonstration
    const newItem: ScannedItem = {
      serial: serialNumber,
      lot: Math.floor(Math.random() * 10000000).toString(),
      source: 'McKesson Medical',
      expiration: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      quantity: `1 vial / 400 mg / 16 ml`
    };

    setScannedItems(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newItem]
    }));

    setSerialInput('');
  };

  const handleRemoveItem = (index: number) => {
    if (!currentTargetBin) return;
    const key = getTargetBinKey(currentTargetBin);
    setScannedItems(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!currentProduct || !currentTargetBin) return;

    // CRITICAL: If serial scanning is NOT required, allow saving without scanning
    if (!serialScanningRequired) {
      // Skip serial scanning validation - user is just confirming the move
      console.log('🔧 Serial scanning not required - proceeding without validation');
    } else {
      // Check if this is the LAST target bin
      const isLastTargetBin = 
        currentTargetBinIndex === currentProduct.targetBins.length - 1 &&
        currentProductIndex === productGroups.length - 1;
      
      // Mirrors canSave: only the final bin has to account for everything taken from the source.
      if (isLastTargetBin && remainingQtyToMove !== 0) {
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

    // Check if this is the LAST target bin
    const isLastTargetBin =
      currentTargetBinIndex === currentProduct.targetBins.length - 1 &&
      currentProductIndex === productGroups.length - 1;

    // The final bin carries the batch's requirement: everything taken out of the source has to have
    // been placed somewhere.
    if (isLastTargetBin) return remainingQtyToMove === 0;

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
                    if (e.key === 'Enter' && remainingQtyToMove > 0) handleScanOrAdd();
                  }}
                  placeholder={serialScanningRequired ? "Scan or type serial number" : "Serial scanning not required"}
                  className="flex-1 text-[16px] text-[#020817] outline-none placeholder:text-[#9fa9b7]"
                  disabled={!serialScanningRequired || remainingQtyToMove <= 0}
                />
                <Button
                  onClick={handleScanOrAdd}
                  className="bg-[#095192] text-white hover:bg-[#074171]"
                  size="sm"
                  disabled={!serialScanningRequired || remainingQtyToMove <= 0}
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

        {/* Table Section */}
        <div className="bg-white px-6 py-6">
          {currentScannedItems.length > 0 ? (
            <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f9fafb]">
                  <tr>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Serial</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Lot</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Expiration</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Source</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#64748b] uppercase">Quantity</th>
                    {serialScanningRequired && <th className="w-12 px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {currentScannedItems.map((item, index) => (
                    <tr key={index} className="border-t border-[#e5e7eb]">
                      <td className="px-4 py-3 text-[14px] text-[#020817]">{item.serial}</td>
                      <td className="px-4 py-3 text-[14px] text-[#020817]">{item.lot}</td>
                      <td className="px-4 py-3 text-[14px] text-[#020817]">{item.expiration}</td>
                      <td className="px-4 py-3 text-[14px] text-[#020817]">{item.source}</td>
                      <td className="px-4 py-3 text-[14px] text-[#020817]">{item.quantity}</td>
                      {serialScanningRequired && (
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-[#9fa9b7]">
              <p className="text-[16px]">Scan or Manually Add Items</p>
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
        onSelectTargetBin={handleGoToTargetBin}
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