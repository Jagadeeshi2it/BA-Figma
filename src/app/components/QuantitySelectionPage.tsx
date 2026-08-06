import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { ChevronRight, Pencil, X, Package, LogOut, ListChecks, ArrowRight } from "lucide-react";
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
import { CabinetAccess } from '../hooks/useCabinetAccess';
import svgPaths from "../imports/svg-hyhz42ush2";

/**
 * A product the operator chose not to move. Only its identity — there is no move left to describe, so
 * no bins and no quantity. Exported because the placement screen lists these too (see finalizeAll).
 */
export interface SkippedProduct {
  key: string;
  productName: string;
  productDescription?: string;
  ndc?: string;
  inventoryType?: string;
}

interface QuantitySelectionPageProps {
  transfers: ProductTransfer[];
  doorShelfConfig: DoorShelfConfig;
  onConfirm: (transfersWithQuantities: ProductTransfer[], skippedProducts: SkippedProduct[]) => void;
  /** Leaving step ④, offered only before any quantity has been taken. See the footer's Cancel below. */
  onCancel: () => void;
  // Only for the stepper's step-1 label, which names the unit this kind of move collects.
  moveMode?: 'bin' | 'product' | null;
  // Which single door is open, and how to ask for another. Only one door at the station can be unlocked
  // at a time (STEP4-GUIDANCE.md §1), so this is a lock/unlock transition, not a growing set.
  cabinetAccess: CabinetAccess;
  /**
   * Source bin ids in the order the route says to work them. Undefined falls back to the order the
   * transfers arrived in, which is what this screen used to do.
   */
  takeBinOrder?: string[];
}

interface TransferWithQuantity extends ProductTransfer {
  moveQuantity: number;
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  manufacturer?: string;
  sourceBinName: string;
  sourceBinLocation: string;
  originalQuantity: number;
  sourceBin: Bin;
  sourceDoorName: string;
}

interface GroupedTransfer {
  transfers: TransferWithQuantity[];
  productId: string;
  fromBinId: string;
  productName: string;
  productDescription?: string;
  unit?: string;
  ndc?: string;
  inventoryType?: string;
  manufacturer?: string;
  sourceBinName: string;
  sourceBinLocation: string;
  originalQuantity: number;
  sourceBin: Bin;
  sourceDoorName: string;
  targetBinNames: string[];
  // Index-aligned with targetBinNames.
  targetDoorNames: string[];
}

/**
 * The identity a product is skipped and resumed by. At module scope, not inside the component: the
 * summaryRows useMemo calls it during render, which is before a `const` in the body would have been
 * initialised — the same "cannot access before initialization" trap scanKey hit on the placement page.
 */
/**
 * Why cancelling is refused once stock has moved. Shared with the placement screen so the two cannot give
 * different reasons for the same rule.
 */
// Just the reason. The second sentence used to add "Finish it to record where everything went", which
// instructed rather than explained — the footer's primary already says what to do next, and a toast that
// answers a refused tap should stop once it has answered it.
export const CANNOT_CANCEL_REASON =
  'Quantity has already been taken out of a bin, so this move can no longer be cancelled.';

const productKeyOf = (group: GroupedTransfer) =>
  `${group.productName}-${group.ndc}-${group.inventoryType}`;

export default function QuantitySelectionPage({
  transfers,
  doorShelfConfig,
  onConfirm,
  onCancel,
  moveMode,
  cabinetAccess,
  takeBinOrder
}: QuantitySelectionPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Products the operator chose not to move. The walk stays on one list now rather than the parent
  // handing back a shorter one each time, so skips have to be remembered rather than left behind.
  const [skippedProductKeys, setSkippedProductKeys] = useState<Set<string>>(new Set());
  const [transferQuantities, setTransferQuantities] = useState<{ [key: string]: number }>({});
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Right-side overlay opened by tapping the footer's Product / Source Bin counters
  const [activeSheet, setActiveSheet] = useState<null | 'product' | 'sourceBin'>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhance transfers with additional information
  const enhancedTransfers = useMemo(() => {
    const enhanced: TransferWithQuantity[] = [];

    transfers.forEach(transfer => {
      // Find source bin
      let sourceBin: Bin | null = null;
      let productInfo: any = null;
      let doorName: string = '';

      // Search through doorShelfConfig to find the source bin and product
      Object.keys(doorShelfConfig).forEach(doorKey => {
        const shelves = doorShelfConfig[doorKey];
        shelves?.forEach(shelf => {
          shelf.bins?.forEach(bin => {
            if (bin.id === transfer.fromBinId) {
              sourceBin = bin;
              productInfo = bin.products.find(p => p.id === transfer.productId);
              doorName = doorKey;
            }
          });
        });
      });

      if (sourceBin && productInfo) {
        enhanced.push({
          ...transfer,
          moveQuantity: transfer.quantity || productInfo.quantity,
          productName: productInfo.name,
          productDescription: productInfo.description,
          unit: productInfo.unit,
          ndc: productInfo.ndc,
          inventoryType: productInfo.inventoryType,
          manufacturer: productInfo.manufacturer,
          sourceBinName: sourceBin.name,
          sourceBinLocation: formatBinLocation(sourceBin),
          originalQuantity: productInfo.quantity,
          sourceBin: sourceBin,
          sourceDoorName: doorName || 'N/A'
        });
      }
    });

    return enhanced;
  }, [transfers, doorShelfConfig]);

  // Group transfers by source (productId + fromBinId) - ONE PAGE PER SOURCE BIN
  const groupedTransfers = useMemo(() => {
    const groups: GroupedTransfer[] = [];
    const groupMap = new Map<string, TransferWithQuantity[]>();

    // Group by productId + fromBinId (one page per source bin)
    enhancedTransfers.forEach(transfer => {
      const key = `${transfer.productId}-${transfer.fromBinId}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(transfer);
    });

    // Convert to GroupedTransfer array
    groupMap.forEach((transfers, key) => {
      const firstTransfer = transfers[0];
      
      // Get target bin names, and the door each one is behind — the Move Summary shows the two on
      // separate lines, so the door has to be carried alongside the name rather than dropped here.
      const targetBinNames: string[] = [];
      const targetDoorNames: string[] = [];
      transfers.forEach(t => {
        let targetBinName = 'Unknown';
        let targetDoorName = '';
        Object.keys(doorShelfConfig).forEach(doorKey => {
          const shelves = doorShelfConfig[doorKey];
          shelves?.forEach(shelf => {
            shelf.bins?.forEach(bin => {
              if (bin.id === t.toBinId) {
                targetBinName = bin.name;
                targetDoorName = doorKey;
              }
            });
          });
        });
        targetBinNames.push(targetBinName);
        targetDoorNames.push(targetDoorName);
      });

      groups.push({
        transfers,
        productId: firstTransfer.productId,
        fromBinId: firstTransfer.fromBinId,
        productName: firstTransfer.productName,
        productDescription: firstTransfer.productDescription,
        unit: firstTransfer.unit,
        ndc: firstTransfer.ndc,
        inventoryType: firstTransfer.inventoryType,
        manufacturer: firstTransfer.manufacturer,
        sourceBinName: firstTransfer.sourceBinName,
        sourceBinLocation: firstTransfer.sourceBinLocation,
        originalQuantity: firstTransfer.originalQuantity,
        sourceBin: firstTransfer.sourceBin,
        sourceDoorName: firstTransfer.sourceDoorName,
        targetBinNames,
        targetDoorNames
      });
    });

    // Walked in the route's order, not the order the transfers happened to arrive in.
    //
    // This is the whole point of the planner: with sources behind Door 1 and Door 7 and the target behind
    // Door 1, arrival order sends the operator to Door 1, then Door 7, then back to Door 1 — three door
    // interactions for two doors' worth of work. The route puts the door that also holds the target LAST
    // among the sources, so its takes run straight into the placements behind the same door and it never
    // closes in between (STEP4-GUIDANCE.md §4).
    //
    // Groups whose bin the route didn't rank keep their arrival position at the end rather than jumping to
    // the front, so a bin the planner couldn't resolve degrades to the old behaviour instead of
    // reordering everything around it.
    if (takeBinOrder && takeBinOrder.length > 0) {
      const rank = new Map(takeBinOrder.map((binId, index) => [binId, index]));
      const positionOf = (group: GroupedTransfer) => rank.get(group.fromBinId) ?? Number.MAX_SAFE_INTEGER;
      groups.sort((a, b) => {
        const delta = positionOf(a) - positionOf(b);
        if (delta !== 0) return delta;
        // Within one bin the operator works the products in a stated order; name keeps it stable, and
        // matches the order the route lists that stop's actions in.
        return a.productName.localeCompare(b.productName);
      });
    }

    return groups;
  }, [enhancedTransfers, doorShelfConfig, takeBinOrder]);

  // What the Move Summary panel shows on this half of step 4 — one row per source→target pairing.
  // The panel nests them, so a source bin states itself once with its destinations beneath; the
  // quantity taken belongs to the source line and is therefore carried on sourceQuantity, repeated
  // across the pairings that share that bin rather than added up per destination.
  //
  // The target amounts are deliberately null here. How the quantity taken out of a bin divides
  // between its target bins is the operator's decision on the placement screen, made by scanning
  // into each one — so on this half there is nothing yet to put against a destination, and a 0
  // would read as a decision already taken.
  const summaryRows: MoveSummaryRow[] = useMemo(() => {
    const rows: MoveSummaryRow[] = [];
    groupedTransfers.forEach((group, groupIndex) => {
      const groupKey = `${group.productId}-${group.fromBinId}-group`;
      const takenFromThisBin = transferQuantities[groupKey] ?? group.transfers[0].moveQuantity;
      const status: MoveSummaryRow['status'] =
        groupIndex === currentIndex ? 'current' : groupIndex < currentIndex ? 'done' : 'pending';

      // Distinct destinations, keyed on bin AND door so two same-named bins behind different doors
      // (Bin 1A exists in every door) aren't collapsed, and a duplicated transfer doesn't show twice.
      const targets = Array.from(
        new Map(
          group.targetBinNames.map((name, i) => [
            `${name}|${group.targetDoorNames[i] ?? ''}`,
            { name, door: group.targetDoorNames[i] }
          ])
        ).values()
      );

      targets.forEach((target, targetIndex) => {
        rows.push({
          key: `${group.productId}-${group.fromBinId}-${target.name}-${groupIndex}-${targetIndex}`,
          productName: group.productName,
          productDescription: group.productDescription,
          ndc: group.ndc,
          inventoryType: group.inventoryType,
          fromLabel: group.sourceBinName,
          fromDoor: group.sourceDoorName,
          toLabel: target.name,
          toDoor: target.door,
          sourceQuantity: takenFromThisBin,
          quantity: null,
          unit: group.unit,
          // The bin in the operator's hands on this half is a SOURCE bin; no target is being filled
          // yet, so none of them is marked.
          isCurrentSource: status === 'current',
          isCurrentTarget: false,
          // A product the operator has already skipped stays listed, marked, rather than vanishing
          // from the panel as they walk past it.
          isSkipped: skippedProductKeys.has(productKeyOf(group)),
          status
        });
      });
    });
    // Left in groupedTransfers' own order — the same order the operator walks through the batch.
    return rows;
  }, [groupedTransfers, transferQuantities, currentIndex, skippedProductKeys]);

  // Distinct products in the summary, for the footer counter — matches the panel's own header count.
  const summaryProductCount = useMemo(
    () => new Set(summaryRows.map(moveSummaryProductKey)).size,
    [summaryRows]
  );

  const currentGroup = groupedTransfers[currentIndex];

  // Unlock the door this source bin is behind, locking whatever was open. Announced only when a
  // transition actually happened: requestDoor is idempotent, so arriving at a second bin behind the door
  // already open is silent — the door did not change, and saying so again would imply it had.
  useEffect(() => {
    const doorName = currentGroup?.sourceDoorName;
    if (!doorName) return;
    const { locked, unlocked } = cabinetAccess.requestDoor(doorName);
    if (!unlocked) return;
    const toastId = toast.custom(
      (t) => <DoorUnlockedToast doorName={unlocked} lockedDoor={locked} onDismiss={() => toast.dismiss(t)} />,
      { duration: 4000 }
    );
    return () => toast.dismiss(toastId);
  }, [currentGroup?.sourceDoorName]);

  // Initialize quantities when component mounts
  useEffect(() => {
    if (groupedTransfers.length > 0) {
      const initialQuantities: { [key: string]: number } = {};
      groupedTransfers.forEach((group) => {
        group.transfers.forEach((transfer) => {
          const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
          initialQuantities[key] = transfer.moveQuantity;
        });
      });
      setTransferQuantities(initialQuantities);
      setCurrentIndex(0);
      setEditingQuantity(false);
    }
  }, [groupedTransfers]);

  const getCurrentQuantity = () => {
    if (!currentGroup) return 0;
    const key = `${currentGroup.productId}-${currentGroup.fromBinId}-group`;
    return transferQuantities[key] !== undefined 
      ? transferQuantities[key] 
      : currentGroup.transfers[0].moveQuantity;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!currentGroup) return;
    const groupKey = `${currentGroup.productId}-${currentGroup.fromBinId}-group`;
    const clampedQuantity = Math.max(0, Math.min(newQuantity, currentGroup.originalQuantity));
    
    // Store the group's total quantity to move
    const updates: { [key: string]: number } = {
      [groupKey]: clampedQuantity
    };

    // Every transfer out of this source carries the SAME figure: the whole amount taken out of the
    // bin. It is not divided between the target bins here, even when there are several.
    //
    // This used to split the quantity evenly across the targets as a starting guess. Two things were
    // wrong with that. It decided the distribution on the operator's behalf when the target page is
    // where that decision belongs — they scan serials into each bin and the split follows from what
    // physically went where. And it broke the target page's own arithmetic: that page reads the
    // source total by de-duplicating transfers on their source bin, so it saw only the FIRST split
    // share (half of a two-bin split) as the whole amount available. Every bin after the first then
    // had nothing left to account for, which is what left "Save & Next Bin" permanently disabled.
    currentGroup.transfers.forEach(transfer => {
      const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
      updates[key] = clampedQuantity;
    });

    setTransferQuantities(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleEditQuantity = () => {
    setEditingQuantity(true);
    setTempQuantity(getCurrentQuantity().toString());
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSaveQuantity = () => {
    const newQuantity = parseInt(tempQuantity) || 0;
    handleQuantityChange(newQuantity);
    setEditingQuantity(false);
  };

  const handleCancelEdit = () => {
    setEditingQuantity(false);
    setTempQuantity('');
  };

  // The first group belonging to a product other than the one on screen, or -1 if this is the last.
  const findNextProductIndex = () => {
    const currentProductKey = productKeyOf(currentGroup);
    return groupedTransfers.findIndex(
      (group, idx) => idx > currentIndex && productKeyOf(group) !== currentProductKey
    );
  };

  // Hand the whole move over at once, at the quantities the operator set, leaving out any product
  // they skipped. Called only from the last product — quantities for everything are taken here,
  // at the source, before anything is carried to the target bin.
  //
  // Takes the skip set as an argument rather than reading state: a skip on the last product has to
  // finish in the same tick it was recorded, and setState hasn't landed by then.
  const finalizeAll = (skipped: Set<string>) => {
    setIsSaving(true);

    const finalTransfers: TransferWithQuantity[] = [];
    // The skipped products, deduped by identity — a product skipped once is skipped for every source
    // bin it sits in, so several groups can name the same one. Carried over so the placement screen's
    // Move Summary can still list them: a product present at Review and simply absent by placement
    // reads as the app having lost it, not as the operator's own choice.
    const skippedProducts: SkippedProduct[] = [];
    const seenSkipped = new Set<string>();
    groupedTransfers.forEach(group => {
      if (skipped.has(productKeyOf(group))) {
        const key = productKeyOf(group);
        if (!seenSkipped.has(key)) {
          seenSkipped.add(key);
          skippedProducts.push({
            key,
            productName: group.productName,
            productDescription: group.productDescription,
            ndc: group.ndc,
            inventoryType: group.inventoryType
          });
        }
        return;
      }
      group.transfers.forEach(transfer => {
        const key = `${transfer.productId}-${transfer.fromBinId}-${transfer.toBinId}`;
        const updatedQuantity = transferQuantities[key] ?? transfer.moveQuantity;
        finalTransfers.push({
          ...transfer,
          quantity: updatedQuantity,
          moveQuantity: updatedQuantity
        });
      });
    });

    console.log('🔧 QuantitySelectionPage - Handing over the whole move:', {
      products: new Set(groupedTransfers.map(productKeyOf)).size,
      skipped: skipped.size,
      transfers: finalTransfers.length
    });

    onConfirm(finalTransfers, skippedProducts);
  };

  const handleSkip = () => {
    // Skip the entire current product: record it so finalizeAll leaves it out, then move on.
    const skipped = new Set(skippedProductKeys).add(productKeyOf(currentGroup));
    setSkippedProductKeys(skipped);

    const nextProductIndex = findNextProductIndex();

    if (nextProductIndex !== -1) {
      setCurrentIndex(nextProductIndex);
      setEditingQuantity(false);
      return;
    }

    finalizeAll(skipped);
  };

  const handleSave = () => {
    if (isSaving) return;
    
    // Get the current product identifier
    const currentProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
    
    // Check if there are more source bins for the current product
    const nextSourceBinIndex = groupedTransfers.findIndex((g, idx) => 
      idx > currentIndex && 
      `${g.productName}-${g.ndc}-${g.inventoryType}` === currentProductKey
    );
    
    // If there's another source bin for this product, advance to it
    if (nextSourceBinIndex !== -1) {
      console.log('🔧 QuantitySelectionPage - Advancing to next source bin:', {
        currentIndex,
        nextSourceBinIndex,
        currentSourceBin: currentGroup.sourceBinName,
        nextSourceBin: groupedTransfers[nextSourceBinIndex].sourceBinName
      });
      setCurrentIndex(nextSourceBinIndex);
      setEditingQuantity(false);
      return;
    }
    
    // This product is done. Another one still to take from? Stay here and advance to it — the whole
    // move's quantities are taken at the source before anything is carried to the target, so the
    // parent is only told once, at the end. That is also what keeps the footer's "1/4" honest: the
    // list stays the whole move instead of being handed back a shorter one after every product.
    const nextProductIndex = findNextProductIndex();

    if (nextProductIndex !== -1) {
      console.log('🔧 QuantitySelectionPage - Advancing to next product:', {
        from: currentGroup.productName,
        to: groupedTransfers[nextProductIndex].productName
      });
      setCurrentIndex(nextProductIndex);
      setEditingQuantity(false);
      return;
    }

    finalizeAll(skippedProductKeys);
  };

  if (!currentGroup) return null;

  const beforeMove = currentGroup.originalQuantity;
  const qtyToMove = getCurrentQuantity();
  const afterMove = beforeMove - qtyToMove;
  // Already 0 in the source before this move started — there's nothing to take, only an allocation
  // to relocate. min/max both being 0 make the edit popover pointless, so it's hidden rather than
  // offered and immediately rejected.
  const hasNothingToMove = beforeMove === 0;

  // CRITICAL: Determine if Skip button should be shown
  // Skip is ONLY available on the FIRST source bin of a product
  // Once user moves to another source bin of the same product, they cannot skip
  const isFirstSourceBinOfProduct = useMemo(() => {
    const currentProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
    
    // Check if any previous source bins (lower index) have the same product
    for (let i = 0; i < currentIndex; i++) {
      const prevGroup = groupedTransfers[i];
      const prevProductKey = `${prevGroup.productName}-${prevGroup.ndc}-${prevGroup.inventoryType}`;
      if (prevProductKey === currentProductKey) {
        // Found a previous source bin of the same product - NOT the first!
        return false;
      }
    }
    
    // No previous source bins of this product found - this IS the first!
    return true;
  }, [currentIndex, currentGroup, groupedTransfers]);

  // Count unique products to determine if there are other products to skip to
  const uniqueProductKeys = new Set(groupedTransfers.map(g => `${g.productName}-${g.ndc}-${g.inventoryType}`));
  const hasMultipleProducts = uniqueProductKeys.size > 1;

  // Does this product still have another source bin to pull from after this one?
  // If so, the primary button just advances to that bin (still "taking out"); otherwise it
  // hands off to the target-bin placement screen. The label/instructions reflect which.
  const currentProductKeyForNav = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
  const hasMoreSourceBinsForProduct = groupedTransfers.some((g, idx) =>
    idx > currentIndex &&
    `${g.productName}-${g.ndc}-${g.inventoryType}` === currentProductKeyForNav
  );
  // And is there another product still to take quantities for? Every product's quantity is taken at
  // the source before anything is carried anywhere, so exhausting this product's source bins usually
  // means the next product, not the target bin. Promising the target bin three products early was
  // what made the flow feel like it was bouncing between source and target.
  const hasMoreProductsAfterThis = groupedTransfers.some((g, idx) =>
    idx > currentIndex &&
    `${g.productName}-${g.ndc}-${g.inventoryType}` !== currentProductKeyForNav
  );

  const primaryActionLabel = hasMoreSourceBinsForProduct
    ? 'Next Bin to Move From'
    : hasMoreProductsAfterThis
      ? 'Save & Continue'
      : 'Proceed to Move To';
  
  // Show Skip button ONLY if:
  // 1. This is the first source bin of the product AND
  // 2. There are multiple products (something to skip to)
  const showSkipButton = isFirstSourceBinOfProduct && hasMultipleProducts;

  // --- Data for the footer's Product / Source Bin side sheets (plain derivations, tiny arrays) ---
  const activeProductKey = `${currentGroup.productName}-${currentGroup.ndc}-${currentGroup.inventoryType}`;
  const getGroupMoveQty = (g: GroupedTransfer) =>
    transferQuantities[`${g.productId}-${g.fromBinId}-group`] ?? g.transfers[0].moveQuantity;

  const productSummaries = (() => {
    const byKey = new Map<string, {
      key: string; name: string; description?: string; ndc?: string;
      inventoryType?: string; unit?: string; binCount: number; moveQty: number;
      firstIndex: number; lastIndex: number;
    }>();
    groupedTransfers.forEach((g, idx) => {
      const key = `${g.productName}-${g.ndc}-${g.inventoryType}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.binCount += 1;
        existing.moveQty += getGroupMoveQty(g);
        existing.lastIndex = idx;
      } else {
        byKey.set(key, {
          key, name: g.productName, description: g.productDescription, ndc: g.ndc,
          inventoryType: g.inventoryType, unit: g.unit, binCount: 1,
          moveQty: getGroupMoveQty(g), firstIndex: idx, lastIndex: idx
        });
      }
    });
    return Array.from(byKey.values());
  })();

  const sourceBinSummaries = groupedTransfers
    .map((g, idx) => ({ group: g, idx }))
    .filter(({ group }) => `${group.productName}-${group.ndc}-${group.inventoryType}` === activeProductKey)
    .map(({ group, idx }) => ({
      binName: group.sourceBinName,
      doorName: group.sourceDoorName,
      originalQty: group.originalQuantity,
      moveQty: getGroupMoveQty(group),
      unit: group.unit,
      targetBinNames: group.targetBinNames,
      isCurrent: idx === currentIndex,
      isDone: idx < currentIndex
    }));

  /**
   * Whether any quantity has actually left a source bin.
   *
   * Groups before currentIndex are done; the one on screen is still a proposal, since the stock does not
   * leave the bin until the operator moves on from it. A skipped product contributed nothing, and neither
   * does a group whose quantity is 0 — an allocation-only move has nothing to carry.
   */
  const hasTakenStock = useMemo(
    () =>
      groupedTransfers
        .slice(0, currentIndex)
        .filter(group => !skippedProductKeys.has(productKeyOf(group)))
        .some(group => {
          const groupKey = `${group.productId}-${group.fromBinId}-group`;
          return (transferQuantities[groupKey] ?? group.transfers[0].moveQuantity) > 0;
        }),
    [groupedTransfers, currentIndex, transferQuantities, skippedProductKeys]
  );

  // binProducts.ts keys every badge on name | ndc | inventoryType, and this screen carries those three
  // under different field names — so they're shaped into a product-like object rather than each badge
  // call guessing at the group.
  const badgeIdentity = {
    name: currentGroup.productName,
    ndc: currentGroup.ndc,
    inventoryType: currentGroup.inventoryType
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex min-h-0">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/* Product Header */}
      <div className="border-b bg-white px-6 py-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[16px] font-semibold text-[#020817]">{currentGroup.productName}</h2>
              {/* The shared badge vocabulary, derived the one shared way (binProducts.ts) off the
                  identity triple — so this product shows the same badges here as on the source and
                  target cards it came from. It used to be a bold black pill printing the *unit*
                  ("vials"), which was the only badge in the app that meant something different from
                  every other badge while looking louder than all of them. The unit is already stated
                  everywhere a quantity is. */}
              <div className="flex items-center gap-1">
                <ProductBadges product={badgeIdentity} />
              </div>
            </div>
            {currentGroup.productDescription && (
              <p className="text-[14px] text-[#4a5565]">{currentGroup.productDescription}</p>
            )}
          </div>

          {/* The header's right slot, which justify-between above already leaves empty. A recovery
              control belongs where the operator's eye lands when the door in front of them has not
              opened — on the same line as the product they are stuck on, not buried with the door
              details further down the page. Absent for a fridge, which has no lock. */}
          <UnlockDoorButton doorName={currentGroup.sourceDoorName} cabinetAccess={cabinetAccess} />
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
                    {currentGroup.ndc || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Inventory Type:</span>
                  <span className="text-[14px] text-[#020817]">
                    {currentGroup.inventoryType || 'Purchased'}
                  </span>
                </div>
              </div>
            </div>

            {/* Source Bin */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Move From</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[14px] text-[#4a5565]">Door:</span>
                  <span className="text-[14px] text-[#020817]">{currentGroup.sourceDoorName}</span>
                  {/* An "Unlocked" badge stood here. It reported a state the operator cannot verify from
                      the screen — the whole reason the Unlock Door button in the header exists is that the
                      app's belief and the hardware can disagree — so a green badge saying the door is open
                      was at best redundant with the door being open and at worst a contradiction of it. */}
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Bin:</span>
                  <span className="text-[14px] text-[#020817]">{currentGroup.sourceBinName}</span>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div>
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Inventory</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">Before Move:</span>
                  <span className="text-[14px] text-[#020817]">{beforeMove}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[14px] text-[#4a5565]">After Move:</span>
                  <span className="text-[14px] text-[#020817] font-semibold">{afterMove}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="bg-white border-b px-6 py-8">
          <div className="flex items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-[16px] text-[#64748b] mb-2">Inventory ({pluralizeUnit(currentGroup.unit || 'Vial', beforeMove)})</p>
              <p className="text-[48px] font-semibold text-[#020817]">{beforeMove}</p>
            </div>
            
            <div className="h-10 w-px bg-[#d9d9d9]" />
            
            <div className="text-right relative">
              <p className="text-[16px] text-[#64748b] mb-2">Qty to move</p>
              <div className="flex items-center gap-3 justify-end">
                {!hasNothingToMove && (
                  <Pencil
                    className="w-6 h-6 text-[#095192] cursor-pointer"
                    onClick={handleEditQuantity}
                  />
                )}
                <p className="text-[48px] font-semibold text-[#020817]">{qtyToMove}</p>
              </div>

              {/* Quantity Edit Popover */}
              {!hasNothingToMove && editingQuantity && (
                <div className="absolute right-0 top-[85px] bg-white rounded-[4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3)] w-[300px] h-[120px] z-10">
                  <p className="absolute left-[16px] top-[16px] text-[14px] text-[#25282a]">Change Qty to move</p>

                  {/* Input and Dropdown */}
                  <div className="absolute left-[16px] top-[41px] w-[154px] h-[44px] flex">
                    {/* Input */}
                    <div className="bg-white h-full rounded-bl-[4px] rounded-tl-[4px] w-[72px] relative">
                      <div className="flex items-center p-[12px] h-full">
                        <input
                          type="number"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveQuantity();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-full text-[14px] text-[#25282a] text-right focus:outline-none"
                          ref={inputRef}
                          max={beforeMove}
                          min={0}
                        />
                      </div>
                      <div className="absolute border border-[#bcc3cd] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
                    </div>
                    
                    {/* Dropdown */}
                    <div className="bg-[#f7f8f9] h-full rounded-br-[4px] rounded-tr-[4px] w-[82px] flex items-center justify-center relative">
                      <div className="absolute border-[#bcc3cd] border-[1px_1px_1px_0px] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
                      <p className="text-[14px] text-[#767676] text-center">{currentGroup.unit || 'each'}</p>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div
                    className="absolute left-[178px] top-[41px] w-[44px] h-[44px] bg-white border border-[#bcc3cd] rounded-[4px] cursor-pointer flex items-center justify-center"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                  >
                    <X className="w-[20px] h-[20px] text-[#25282a]" />
                  </div>

                  {/* Check Circle Button */}
                  <div
                    className="absolute left-[230px] top-[41px] w-[44px] h-[44px] bg-[#095192] rounded-[4px] cursor-pointer flex items-center justify-center"
                    onClick={handleSaveQuantity}
                    aria-label="Save"
                  >
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 19 18">
                      <g>
                        <path d={svgPaths.p8ac0680} fill="white" />
                        <path d={svgPaths.p34ca1100} fill="white" />
                      </g>
                    </svg>
                  </div>

                  {/* Max Text */}
                  <p className="absolute left-[16px] top-[89px] text-[12px] text-[#25282a]">
                    Max: {beforeMove} {currentGroup.unit || 'each'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border-b px-6 py-10">
          <div className="text-center text-[14px] text-[#020817]">
            {hasNothingToMove ? (
              <>
                <p className="mb-0">This bin has no quantity to remove — the allocation will still move.</p>
                <p>Tap "{primaryActionLabel}" to continue.</p>
              </>
            ) : (
              <>
                <p className="mb-0">Remove the quantity shown from this bin, then</p>
                <p>tap "{primaryActionLabel}".</p>
              </>
            )}
          </div>
        </div>
      </div>
      </div>

      <MoveSummaryPanel
        rows={summaryRows}
        isOpen={summaryOpen}
        onToggle={() => setSummaryOpen(prev => !prev)}
        // This half takes stock OUT, so the source end of the current pairing is the bin in hand.
        stage="source"
      />
      </div>

      {/* PIP: real-world cabinet interaction for the current source bin */}
      <CabinetPipView
        doorName={currentGroup.sourceDoorName}
        binName={currentGroup.sourceBinName}
        binId={currentGroup.fromBinId}
        doorShelfConfig={doorShelfConfig}
        mode="source"
        quantity={qtyToMove}
        unit={currentGroup.unit}
      />

      {/* Footer. fixed left-[60px] clears the nav rail: this page is full-bleed, unlike the cabinet
          page whose bar sits inside the content column. Always right-0, running the full width
          including under the Move Summary panel — same as Review, where the footer sits below both
          columns rather than stopping at the panel's edge. The panel's own bottom padding (below)
          keeps its last card clear of the bar rather than the bar making room for the panel. */}
      <div className="fixed bottom-0 left-[60px] right-0 z-10">
        <PipelineFooterShell>
          <StepCell step={4} moveMode={moveMode} />
          <FooterDivider />

          {/* The same summary cells the bin-picking steps use, rather than the bare underlined "1/1"
              links these were: a label above its value, blue and chevroned because both open a sheet.
              Position-in-a-list is what they report, so the value keeps the n/total shape.
              Hidden for now — see SHOW_STEP4_POSITION_COUNTERS. */}
          {SHOW_STEP4_POSITION_COUNTERS && (
            <>
              <SummaryCell
                icon={<Package className="w-4 h-4" />}
                label="Product"
                value={`${productSummaries.findIndex(p => p.key === activeProductKey) + 1} of ${productSummaries.length}`}
                active={activeSheet === 'product'}
                enabled
                onClick={() => setActiveSheet('product')}
              />
              <FooterDivider />
              <SummaryCell
                icon={<LogOut className="w-4 h-4" />}
                label="Move From"
                value={`${sourceBinSummaries.filter(b => b.isDone).length + 1} of ${sourceBinSummaries.length}`}
                active={activeSheet === 'sourceBin'}
                enabled
                onClick={() => setActiveSheet('sourceBin')}
              />
              <FooterDivider />
            </>
          )}
          {/* Same Move Summary counter Review uses, toggling the same kind of panel rather than a
              SideSheet like the two cells above — it stays open across the whole page instead of
              closing the moment something else is tapped. Always enabled, same reasoning as Review:
              this is the only way to reopen it once someone's closed it. */}
          <SummaryCell
            icon={<ListChecks className="w-4 h-4" />}
            label="Move List"
            value={`${summaryProductCount} ${summaryProductCount === 1 ? 'product' : 'products'}`}
            active={summaryOpen}
            enabled
            onClick={() => setSummaryOpen(prev => !prev)}
          />

          <FooterActions>
            {/* Always visible, regardless of which product/source bin is active — unlike Skip, which
                only makes sense when there's another product to jump to. */}
            {/* Offered only until the first quantity leaves a source bin. Past that, cancelling would rest
                entirely on the operator returning the stock to the right bin — which nothing in the app
                can check, so it is not something to depend on (STEP4-GUIDANCE.md §8). It keeps the label
                "Cancel" and explains on tap rather than renaming itself. */}
            <FooterButton
              label="Cancel"
              variant="secondary"
              enabled={!hasTakenStock}
              onClick={onCancel}
              onBlockedClick={() =>
                toast.custom(
                  () => <ValidationToast message={CANNOT_CANCEL_REASON} />,
                  { duration: 6000 }
                )
              }
            />
            {showSkipButton && (
              <FooterButton label="Skip Product" variant="secondary" onClick={handleSkip} />
            )}
            <FooterButton
              label={primaryActionLabel}
              variant="primary"
              enabled={!isSaving}
              onClick={handleSave}
              trailingIcon={!isSaving ? <ArrowRight className="w-4 h-4" /> : undefined}
            />
          </FooterActions>
        </PipelineFooterShell>
      </div>

      {/* Product list sheet */}
      <SideSheet
        open={activeSheet === 'product'}
        title="Products in this move"
        subtitle={`${productSummaries.length} product${productSummaries.length !== 1 ? 's' : ''} selected for allocation`}
        onClose={() => setActiveSheet(null)}
      >
        {productSummaries.map(p => {
          const isCurrent = p.key === activeProductKey;
          const isDone = p.lastIndex < currentIndex;
          return (
            <div
              key={p.key}
              className={`border rounded-[6px] p-3 mb-2 ${
                isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#020817]">{p.name}</p>
                  {p.description && <p className="text-[12px] text-[#64748b]">{p.description}</p>}
                  <p className="text-[12px] text-[#64748b] mt-1">
                    NDC: {p.ndc || 'N/A'} · {p.inventoryType || 'Purchased'}
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    {p.binCount} bin{p.binCount !== 1 ? 's' : ''} to move from
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isDone && !isCurrent && (
                    <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                  )}
                  <span className="text-[13px] font-semibold text-[#020817]">
                    {p.moveQty} {pluralizeUnit(p.unit || 'vial', p.moveQty)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </SideSheet>

      {/* Source bin list sheet — bins for the CURRENT product */}
      <SideSheet
        open={activeSheet === 'sourceBin'}
        title="Bins to move from"
        subtitle={currentGroup.productName}
        onClose={() => setActiveSheet(null)}
      >
        {sourceBinSummaries.map((s, idx) => (
          <div
            key={`${s.binName}-${idx}`}
            className={`border rounded-[6px] p-3 mb-2 ${
              s.isCurrent ? 'border-[#095192] bg-[#f0f6fc]' : 'border-[#e5e7eb] bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#020817]">{s.binName}</p>
                <p className="text-[12px] text-[#64748b]">{s.doorName}</p>
                <p className="text-[12px] text-[#64748b] mt-1">
                  → {s.targetBinNames.join(', ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {s.isDone && (
                  <span className="text-[10px] font-semibold text-[#12805C] bg-[#E1F5EC] rounded-full px-2 py-0.5">Done</span>
                )}
                <span className="text-[13px] font-semibold text-[#020817]">
                  {s.moveQty}/{s.originalQty} {pluralizeUnit(s.unit || 'vial', s.originalQty)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </SideSheet>
    </div>
  );
}