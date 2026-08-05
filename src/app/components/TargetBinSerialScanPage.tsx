import React, { useState, useEffect, useMemo } from 'react';
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { ChevronRight, Search, Trash2, Unlock, Package, LogIn, ListChecks, ArrowLeft, ArrowRight } from "lucide-react";
import { DoorUnlockedToast } from "./ui/sonner-1";
import CabinetPipView from "./CabinetPipView";
import SideSheet from "./SideSheet";
import MoveSummaryPanel, { MoveSummaryRow } from "./MoveSummaryPanel";
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
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';
import { SkippedProduct } from './QuantitySelectionPage';
import { CabinetAccess } from '../hooks/useCabinetAccess';

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
  onCancel: () => void;
  // Steps back to the quantity stage. Carries the product identity currently on screen so the
  // quantity page resumes on that product rather than restarting the batch (UX-AUDIT H3-2).
  onBack: (productKey?: string) => void;
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

export default function TargetBinSerialScanPage({
  transfers,
  doorShelfConfig,
  onConfirm,
  onCancel,
  onBack,
  remainingTransfers,
  skippedProducts,
  moveMode,
  cabinetAccess,
  placeBinOrder
}: TargetBinSerialScanPageProps) {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentTargetBinIndex, setCurrentTargetBinIndex] = useState(0);
  const [serialInput, setSerialInput] = useState('');
  const [scannedItems, setScannedItems] = useState<{ [key: string]: ScannedItem[] }>({});
  // Right-side overlay opened by tapping the footer's Product / Target Bin counters
  const [activeSheet, setActiveSheet] = useState<null | 'product' | 'targetBin'>(null);
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
        const status: MoveSummaryRow['status'] =
          productIndex < currentProductIndex
            ? 'done'
            : productIndex > currentProductIndex
              ? 'pending'
              : targetBinIndex === currentTargetBinIndex
                ? 'current'
                : targetBinIndex < currentTargetBinIndex
                  ? 'done'
                  : 'pending';

        // What has actually been placed in this bin. A bin the operator hasn't reached yet has no
        // figure at all: its share is decided by scanning into it, so a 0 would look like a decision
        // they'd made rather than one still ahead of them. (When no scanning is required the whole
        // amount is known up front, so it's shown.)
        const placed = (scannedItems[scanKey(product.productId, targetBinGroup.toBinId)] || []).length;
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
    () => new Set(summaryRows.map(row => row.productName)).size,
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

  // Label mirrors what saving actually does next: another target bin for this product,
  // the next product in the queue, or wrapping up the whole move.
  const saveButtonLabel = isFinalSaveStep
    ? 'Save & Finish'
    : currentProduct && currentTargetBinIndex < currentProduct.targetBins.length - 1
      ? 'Save & Next Bin'
      : 'Save & Next Product';

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

  // Auto-fill the LAST target bin for the current product with whatever's still unaccounted
  // for — once every earlier bin has taken its share of a split, the remainder has nowhere
  // else to go, so there's nothing left for the user to decide by scanning it manually.
  useEffect(() => {
    if (!currentProduct || !currentTargetBin) return;
    const isLastTargetBinForProduct = currentTargetBinIndex === currentProduct.targetBins.length - 1;
    if (!isLastTargetBinForProduct || remainingQtyToMove <= 0) return;

    const key = getTargetBinKey(currentTargetBin);
    if ((scannedItems[key] || []).length > 0) return;

    const autoFilledItems: ScannedItem[] = Array.from({ length: remainingQtyToMove }, () => ({
      serial: `SN${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      lot: Math.floor(Math.random() * 10000000).toString(),
      source: 'McKesson Medical',
      expiration: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      quantity: `1 ${currentProduct.unit || 'vial'}`
    }));

    setScannedItems(prev => ({
      ...prev,
      [key]: autoFilledItems
    }));
  }, [currentProduct, currentTargetBin, currentTargetBinIndex, remainingQtyToMove, scannedItems]);

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

  const handleBack = () => {
    // Within a product, Back reviews its earlier target bins. At a product's FIRST target bin, Back
    // becomes a stage step: return to the quantity page resumed ON THIS PRODUCT (its key), rather
    // than paging into a previous product's bins and eventually restarting the whole batch's
    // quantities from product 0 (UX-AUDIT H3-2). The trade: Back no longer walks across products on
    // this page — the footer's Product counter is where the whole batch is reviewed.
    if (currentTargetBinIndex > 0) {
      setCurrentTargetBinIndex(currentTargetBinIndex - 1);
      setSerialInput('');
      return;
    }
    const productKey = currentProduct
      ? `${currentProduct.productName}-${currentProduct.ndc}-${currentProduct.inventoryType}`
      : undefined;
    onBack(productKey);
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

          targetBin.transfers.forEach((sourceTransfer, sourceIndex) => {
            const isLastSource = sourceIndex === targetBin.transfers.length - 1;
            const declaredQuantity = sourceTransfer.quantity || 0;
            // Sources are consumed in the order they were added. The last one absorbs any
            // difference between what the quantity step declared and what actually got
            // scanned here, so the per-source quantities always sum to the real total.
            const assignedQuantity = isLastSource
              ? remainingToAssign
              : Math.min(declaredQuantity, remainingToAssign);

            remainingToAssign -= assignedQuantity;
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

    // Only the final bin carries a requirement: everything taken out of the source has to have been
    // placed somewhere. Individual bins have no minimum of their own — the operator decides each
    // bin's share by scanning into it, and "all of it in the first bin, none in the second" is a
    // legitimate outcome of that. Both branches used to demand qtyMoved > 0 for the bin on screen,
    // which made exactly that choice unfinishable: the emptied last bin could never be saved.
    return isLastTargetBin ? remainingQtyToMove === 0 : true;
  })();

  // Blocked, the button says what it is waiting for rather than greying out mutely — the same rule
  // the bin-picking footer follows. The only thing that can block it is quantity still unplaced.
  const effectiveSaveLabel = canSave
    ? saveButtonLabel
    : `Place ${remainingQtyToMove} more ${pluralizeUnit(currentProduct.unit || 'vial', remainingQtyToMove)}`;

  // Same shaping as the quantity screen opposite: binProducts.ts keys badges on
  // name | ndc | inventoryType, which this screen carries under different field names.
  const badgeIdentity = {
    name: currentProduct.productName,
    ndc: currentProduct.ndc,
    inventoryType: currentProduct.inventoryType
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
              <h2 className="text-[16px] font-semibold text-[#020817]">{currentProduct.productName}</h2>
              {/* The shared badges, as on the quantity screen — these two are the halves of one step,
                  so a product cannot wear a different badge on each. */}
              <div className="flex items-center gap-1">
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
            </div>
            {currentProduct.productDescription && (
              <p className="text-[14px] text-[#4a5565]">{currentProduct.productDescription}</p>
            )}
          </div>
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
              <p className="text-[12px] font-semibold text-[#25282a] opacity-50 mb-3">Target Bin</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[14px] text-[#4a5565]">Door:</span>
                  <span className="text-[14px] text-[#020817]">{currentTargetBin.targetDoorName}</span>
                  {/* Stated only when this door really is the open one. It used to be unconditional,
                      which meant every door the operator ever looked at claimed to be unlocked — and
                      under a one-door-at-a-time station that is a claim about the hardware, not a label.
                      A fridge shows nothing: it has no lock to report (STEP4-GUIDANCE.md §1). */}
                  {cabinetAccess.isOpen(currentTargetBin.targetDoorName) && (
                    <span className="text-[14px] text-[#12805C] ml-2 inline-flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  )}
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
                label="Target Bin"
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
            label="Move Summary"
            value={`${summaryProductCount} ${summaryProductCount === 1 ? 'product' : 'products'}`}
            active={summaryOpen}
            enabled
            onClick={() => setSummaryOpen(prev => !prev)}
          />

          <FooterActions>
            {/* Always visible full-flow exit, distinct from "Back" which only steps back one target bin
                at a time within this screen's own hierarchy. */}
            <FooterButton label="Cancel" variant="secondary" onClick={onCancel} />
            <FooterButton
              label="Back"
              variant="secondary"
              onClick={handleBack}
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
            />
            <FooterButton
              label={effectiveSaveLabel}
              variant="primary"
              enabled={canSave}
              onClick={handleSave}
              trailingIcon={canSave ? <ArrowRight className="w-4 h-4" /> : undefined}
            />
          </FooterActions>
        </PipelineFooterShell>
      </div>

      {/* Product list sheet */}
      <SideSheet
        open={activeSheet === 'product'}
        title="Products in this step"
        subtitle={`${productGroups.length} product${productGroups.length !== 1 ? 's' : ''} being placed into target bins`}
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
                    {p.targetBins.length} target bin{p.targetBins.length !== 1 ? 's' : ''}
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
        title="Target bins"
        subtitle={currentProduct.productName}
        onClose={() => setActiveSheet(null)}
      >
        {currentProduct.targetBins.map((tb, idx) => {
          const isCurrent = idx === currentTargetBinIndex;
          const isDone = idx < currentTargetBinIndex;
          const scannedCount = (scannedItems[`${currentProduct.productId}-${tb.toBinId}`] || []).length;
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
                    From {tb.sourceBins.map(sb => sb.sourceBinName).filter(Boolean).join(', ') || 'source bin'}
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