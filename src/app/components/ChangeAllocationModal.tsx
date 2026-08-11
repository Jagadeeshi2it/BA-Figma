import React, { useState, useEffect, useMemo } from 'react';
import {
  PipelineFooterShell,
  FooterActions,
  FooterDivider,
  StepCell,
  SummaryCell,
  FooterButton
} from "./PipelineFooter";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Package, ChevronLeft, ChevronRight, ListChecks, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import SourceProductCard from "./SourceProductCard";
import TargetProductCard from "./TargetProductCard";
import { productKeysForBin, sourcePickKey } from '../utils/sourcePicks';
import ProductCentricCard from "./ProductCentricCard";
import MoveSummaryPanel, { MoveSummaryRow, moveSummaryProductKey } from "./MoveSummaryPanel";
import { formatBinLocation, getDoorName } from '../utils/changeAllocationUtils';
import { doesProductMatchSearch } from '../utils/textHighlight';
import ProductBadges from './ProductBadges';
import { emergencyKitService } from '../services/EmergencyKitService';
import { productDataService } from '../services/ProductDataService';
import { toast } from "sonner@2.0.3";
import { 
  Bin, 
  ProductTransfer, 
  ProductMoveQuantity, 
  MovedProduct, 
  ChangeAllocationModalProps,
  Product
} from '../types';

export default function ChangeAllocationModal({
  open,
  onOpenChange,
  sourceBins,
  targetBins,
  doorShelfConfig,
  sourceProductQuery,
  sourceProductPicks = [],
  moveMode,
  onConfirmAllocation,
  onCancel
}: ChangeAllocationModalProps) {
  const [productMoveQuantities, setProductMoveQuantities] = useState<ProductMoveQuantity[]>([]);
  const [movedProducts, setMovedProducts] = useState<MovedProduct[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<ProductTransfer[]>([]);
  const [errors, setErrors] = useState<{ [productId: string]: string }>({});
  const [currentTargetBinIndex, setCurrentTargetBinIndex] = useState<number>(0);
  const [currentSourceBinIndex, setCurrentSourceBinIndex] = useState<number>(0);
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0);
  // Closed by default on Review — nothing's picked yet the moment this page opens, so a 320px panel
  // announcing "Nothing selected yet" was real estate spent on an empty state. The footer's own Move
  // Summary counter is the way in, same as it would be to close it again once there's something to see.
  const [summaryOpen, setSummaryOpen] = useState(false);

  const targetBin = targetBins[currentTargetBinIndex] || null;

  // Cheap check first — bin products already carry name/ndc/inventoryType; only fall back to the
  // service lookup (which warns on misses) when the raw row doesn't match.
  const productMatchesQuery = (product: any, query: string): boolean =>
    doesProductMatchSearch(product, query) ||
    doesProductMatchSearch(productDataService.enhanceProduct(product), query);

  // Reaching this modal via the search bar's "Select as Source" means the user wants to move THAT
  // product, so the source panel is narrowed to it. Only honour the query when it actually matches
  // something in the source bins — otherwise a stale query would leave the panel empty.
  const focusedQuery = useMemo(() => {
    const query = sourceProductQuery?.trim();
    if (!query) return null;
    const hasMatch = sourceBins.some(bin =>
      bin.products.some(product => productMatchesQuery(product, query))
    );
    return hasMatch ? query : null;
  }, [sourceProductQuery, sourceBins]);

  // Whether this specific bin is scoped by the query. A bin added by searching for a product stocks
  // it and comes out true; a bin hand-picked off the shelf holds whatever it holds and comes out
  // false. Every source bin is in the selection for a reason, so all of them stay in the pager —
  // what differs is how much of each one is in scope, decided per bin just below and in
  // getSourceProducts. Dropping the unscoped ones (which this used to do) meant hand-picking a bin
  // during a product-focused move silently removed it from the only screen that can commit it.
  const isBinScopedByQuery = (bin: any): boolean =>
    !!focusedQuery && bin.products.some((product: any) => productMatchesQuery(product, focusedQuery));

  const visibleSourceBins = sourceBins;

  const sourceBin = visibleSourceBins[currentSourceBinIndex] || null;

  // What the Move Summary panel shows — derived straight from this modal's own pendingTransfers,
  // never lifted. Quantity is always null here: nothing is decided until the quantity step, and
  // showing "0" would read as moving nothing rather than "not yet set". The row for whichever
  // source/target pair is currently on screen is marked current, so the summary and the two columns
  // beside it always agree about what "here" means. Sorted by product so the panel's grouping (which
  // only merges CONSECUTIVE same-product rows) actually groups everything for one product together,
  // even though pendingTransfers itself fills in whatever order the operator picked things.
  const summaryRows: MoveSummaryRow[] = useMemo(() => {
    // Dedupe by the pairing itself. pendingTransfers is meant to hold at most one entry per
    // product/source/target — handleMoveProduct/handleProductCentricMoveFromBin guard against
    // adding a second — but a duplicate slipping through some other path would otherwise show as
    // two identical lines for what's really one pairing.
    const seenPairings = new Set<string>();
    const dedupedTransfers = pendingTransfers.filter(pt => {
      const pairingKey = `${pt.productId}|${pt.fromBinId}|${pt.toBinId}`;
      if (seenPairings.has(pairingKey)) return false;
      seenPairings.add(pairingKey);
      return true;
    });

    const rows = dedupedTransfers.map((pt, index) => {
      const fromBin = sourceBins.find(b => b.id === pt.fromBinId);
      const toBin = targetBins.find(b => b.id === pt.toBinId);
      const product = fromBin?.products.find(p => p.id === pt.productId);
      return {
        key: `${pt.productId}-${pt.fromBinId}-${pt.toBinId}-${index}`,
        productName: product?.name ?? 'Unknown product',
        productDescription: product?.description,
        ndc: (product as any)?.ndc,
        inventoryType: (product as any)?.inventoryType,
        fromLabel: fromBin?.name ?? 'Unknown bin',
        fromDoor: fromBin ? getDoorName(fromBin) : undefined,
        toLabel: toBin?.name ?? 'Unknown bin',
        toDoor: toBin ? getDoorName(toBin) : undefined,
        // Nothing is settled on Review: no quantity has been taken and no bin is being handled, so
        // neither side carries a figure and neither is marked as the one in hand.
        //
        // status is 'pending' for every row, and that includes not marking one 'current'. It used to
        // be "does this row's pair match the two bins the columns are pointed at", which is a VIEW
        // POSITION, not progress — and the panel's blue card / bold bin mean "this is the bin in your
        // hands", which is step ④'s signal and has no meaning here. It also said nothing where it was
        // seen most: with one source and one target every row matched, so the whole panel went blue.
        // Where it did discriminate it only repeated what the column pagers already state in words
        // ("Bin 1 of 3", named), in a colour that means something else one step later.
        sourceQuantity: null as number | null,
        quantity: null as number | null,
        unit: (product as any)?.unit,
        isCurrentSource: false,
        isCurrentTarget: false,
        status: 'pending' as MoveSummaryRow['status']
      };
    });
    // Left in pendingTransfers' own order — the order the operator built the selection in — rather
    // than re-sorted alphabetically: MoveSummaryPanel's group-by no longer needs same-product rows
    // contiguous, so there's nothing left for a sort to fix, and the panel now reads in the same
    // order the operator picked things in.
    return rows;
    // sourceBin/targetBin are deliberately not deps: the rows no longer depend on which bin the
    // columns are pointed at, so paging the columns must not rebuild them.
  }, [pendingTransfers, sourceBins, targetBins]);

  // Distinct products in the summary — the footer's counter reports this, matching the panel's own
  // "N products" header rather than a count of bin pairings (a product spanning two bins is one
  // product, not two, to both).
  //
  // Distinct by the identity triple, not by display name: three catalogue products share the name
  // "CARBOPLATIN 600 MG/60 ML VIAL" in the current seed, so a name-only Set counted a four-product move
  // as two — the same bug the panel's own grouping had, and it has to be fixed in both or the footer and
  // the panel header disagree about the very number they exist to agree on.
  const summaryProductCount = useMemo(
    () =>
      new Set(summaryRows.map(moveSummaryProductKey)).size,
    [summaryRows]
  );

  // Narrowing can leave fewer bins than the page the user was on.
  useEffect(() => {
    if (currentSourceBinIndex > 0 && currentSourceBinIndex >= visibleSourceBins.length) {
      setCurrentSourceBinIndex(0);
    }
  }, [currentSourceBinIndex, visibleSourceBins.length]);

  // Calculate remaining/available quantities for each product (used for validation and display)
  const currentSourceBinAvailableQuantities = useMemo(() => {
    if (!sourceBin) return [];
    
    return sourceBin.products.map(product => {
      // Find all transfers from this source bin for this product
      const transfersFromThisBin = pendingTransfers.filter(
        pt => pt.fromBinId === sourceBin.id && pt.productId === product.id
      );
      const totalMoved = transfersFromThisBin.reduce((sum, transfer) => sum + transfer.quantity, 0);
      
      return {
        productId: product.id,
        availableQuantity: Math.max(0, product.quantity - totalMoved), // Remaining available quantity
        maxQuantity: product.quantity, // Original quantity
        moved: totalMoved // Amount already moved
      };
    });
  }, [sourceBin, pendingTransfers]);

  // Check if current target bin is an Emergency Kit
  const isTargetEmergencyKit = useMemo(() => {
    return targetBin ? emergencyKitService.isBinInEmergencyKit(targetBin.id, doorShelfConfig) : false;
  }, [targetBin, doorShelfConfig]);

  // Detect products that exist across multiple source bins for product-centric view
  const productsAcrossMultipleBins = useMemo(() => {
    // A Bin move is always reviewed bin-by-bin — the product view never applies, whatever the data
    // shape. Returning empty here forces the per-bin render below.
    if (moveMode === 'bin') return [];

    // The old single-bin bail-out only applies to the legacy heuristic. A Product move must show its
    // products even when the whole selection is one bin (search a product that lives in one place).
    if (moveMode !== 'product' && visibleSourceBins.length <= 1) return [];

    // Group products by name, NDC, and inventory type
    const productMap = new Map<string, {
      product: Product;
      binLocations: Array<{
        binId: string;
        binName: string;
        doorName: string;
        productId: string;
        quantity: number;
      }>;
    }>();

    visibleSourceBins.forEach(bin => {
      bin.products.forEach(product => {
        const enhancedProduct = productDataService.enhanceProduct(product);
        const key = `${enhancedProduct.name}|${enhancedProduct.ndc}|${enhancedProduct.inventoryType}`;
        
        if (!productMap.has(key)) {
          productMap.set(key, {
            product: enhancedProduct,
            binLocations: []
          });
        }
        
        const entry = productMap.get(key)!;
        entry.binLocations.push({
          binId: bin.id,
          binName: bin.name,
          doorName: getDoorName(bin),
          productId: product.id,
          quantity: product.quantity
        });
      });
    });
    
    const allEntries = Array.from(productMap.values());

    // A Product move shows EVERY product the user picked, one at a time — no 3-bin threshold, no
    // hand-picked-bin disqualifier. The mode already declared this the product view, so honour it:
    // searching and selecting products must always read as products, however many bins each spans.
    // (The old heuristic below dropped to the bin view whenever a picked product spanned <3 bins,
    // which is the bug this whole split exists to kill.)
    if (moveMode === 'product') {
      const picked = focusedQuery
        ? allEntries.filter(entry => doesProductMatchSearch(entry.product, focusedQuery))
        : allEntries;
      return isTargetEmergencyKit
        ? picked.filter(entry => entry.product.inventoryType === 'Purchased')
        : picked;
    }

    // Search-driven selection: only the products the user picked are in play.
    if (focusedQuery) {
      const picked = allEntries.filter(entry => doesProductMatchSearch(entry.product, focusedQuery));
      // The panel renders EITHER this product view or the per-bin list, never both. So when any
      // picked product falls short of the 3-location bar this view requires, hand the whole
      // selection to the bin view. Two reasons: the short ones would otherwise be invisible and
      // unmovable (pick all four "carboplatin" variants — three have one location each), and the
      // bin view is the only one with a target-aware Select button, since ProductCentricCard is
      // never told which target bin is showing.
      // A hand-picked bin is also disqualifying, for the same reason: this view lists products the
      // query names, so a bin chosen for its own contents has nothing representing it here, and
      // since the two views never render together its products would be unreachable.
      const everyBinScoped = visibleSourceBins.every(isBinScopedByQuery);
      const allQualify =
        picked.length > 0 && everyBinScoped && picked.every(entry => entry.binLocations.length > 2);
      const focused = allQualify ? picked : [];
      return isTargetEmergencyKit
        ? focused.filter(entry => entry.product.inventoryType === 'Purchased')
        : focused;
    }

    // Filter to only products that exist in more than 2 bins (3 or more)
    const multiBindProducts = allEntries.filter(entry => entry.binLocations.length > 2);

    // If targeting Emergency Kit, filter to only Purchased inventory
    if (isTargetEmergencyKit) {
      return multiBindProducts.filter(entry => entry.product.inventoryType === 'Purchased');
    }

    return multiBindProducts;
  }, [visibleSourceBins, isTargetEmergencyKit, doorShelfConfig, focusedQuery, moveMode]);

  // A narrowed focus can leave fewer products than the index the user had paged to.
  useEffect(() => {
    if (currentProductIndex > 0 && currentProductIndex >= productsAcrossMultipleBins.length) {
      setCurrentProductIndex(0);
    }
  }, [currentProductIndex, productsAcrossMultipleBins.length]);

  // The product the product-centric view is paged to. Read once rather than re-indexed at each use:
  // the badge helpers dereference the product, so a stale index (possible for one render, before the
  // clamp effect above lands) has to be a single null check rather than one per call.
  const focusedProduct = productsAcrossMultipleBins[currentProductIndex]?.product;

  // Whether what's on screen is actually narrowed by the search. The product view is only ever
  // reached through a query that scoped every bin, so it always is; the per-bin list is narrowed
  // only for bins the search put here, because a hand-picked bin keeps its whole contents (see
  // getSourceProducts). Keying the banner and the empty state off the bare query instead claimed a
  // filter was in force while the user was looking at a hand-picked bin in full.
  const sourceListNarrowed =
    !!focusedQuery &&
    (productsAcrossMultipleBins.length > 0 || (!!sourceBin && isBinScopedByQuery(sourceBin)));

  useEffect(() => {
    if (open && visibleSourceBins.length > 0) {
      const sourceBin = visibleSourceBins[0]; // Use the first source bin initially
      const initialQuantities = sourceBin.products.map(product => ({
        productId: product.id,
        quantity: product.quantity, // Default to full quantity for easy moving
        maxQuantity: product.quantity,
        moved: 0
      }));
      setProductMoveQuantities(initialQuantities);
      setMovedProducts([]);
      setPendingTransfers([]);
      setErrors({});
      setCurrentTargetBinIndex(0);
      setCurrentSourceBinIndex(0);
      setCurrentProductIndex(0);
    }
  }, [open, visibleSourceBins]);

  // Update quantities when source bin changes - default to available quantity
  useEffect(() => {
    if (sourceBin && visibleSourceBins.length > 1) {
      // Set move quantities to available quantity for easy moving
      const newQuantities = sourceBin.products.map(product => {
        // Find how much has been moved from this bin already
        const transfersFromThisBin = pendingTransfers.filter(
          pt => pt.fromBinId === sourceBin.id && pt.productId === product.id
        );
        const totalMoved = transfersFromThisBin.reduce((sum, transfer) => sum + transfer.quantity, 0);
        const availableQuantity = Math.max(0, product.quantity - totalMoved);
        
        return {
          productId: product.id,
          quantity: availableQuantity, // Default to available quantity for easy moving
          maxQuantity: product.quantity,
          moved: totalMoved
        };
      });
      setProductMoveQuantities(newQuantities);
      
      // Update moved products based on current quantities
      const movedProductsFromThisBin = sourceBin.products
        .map(product => {
          const quantityData = currentSourceBinAvailableQuantities.find(q => q.productId === product.id);
          const totalMoved = quantityData?.moved || 0;
          
          if (totalMoved > 0) {
            return {
              ...product,
              movedQuantity: totalMoved
            };
          }
          return null;
        })
        .filter(Boolean);
      
      setMovedProducts(movedProductsFromThisBin);
    }
  }, [currentSourceBinIndex, sourceBin, currentSourceBinAvailableQuantities, pendingTransfers]);

  const goToPreviousTargetBin = () => {
    if (currentTargetBinIndex > 0) {
      setCurrentTargetBinIndex(currentTargetBinIndex - 1);
    }
  };

  const goToNextTargetBin = () => {
    if (currentTargetBinIndex < targetBins.length - 1) {
      setCurrentTargetBinIndex(currentTargetBinIndex + 1);
    }
  };

  const goToPreviousSourceBin = () => {
    if (currentSourceBinIndex > 0) {
      setCurrentSourceBinIndex(currentSourceBinIndex - 1);
    }
  };

  const goToNextSourceBin = () => {
    if (currentSourceBinIndex < visibleSourceBins.length - 1) {
      setCurrentSourceBinIndex(currentSourceBinIndex + 1);
    }
  };

  const goToPreviousProduct = () => {
    if (currentProductIndex > 0) {
      setCurrentProductIndex(currentProductIndex - 1);
    }
  };

  const goToNextProduct = () => {
    if (currentProductIndex < productsAcrossMultipleBins.length - 1) {
      setCurrentProductIndex(currentProductIndex + 1);
    }
  };

  const updateMoveQuantity = (productId: string, quantity: number) => {
    // Find the available quantity for this product
    const availableData = currentSourceBinAvailableQuantities.find(q => q.productId === productId);
    const maxAvailable = availableData?.availableQuantity || 0;
    
    setProductMoveQuantities(prev => 
      prev.map(pmq => 
        pmq.productId === productId 
          ? { ...pmq, quantity: Math.max(0, Math.min(quantity, maxAvailable)) }
          : pmq
      )
    );
    
    if (errors[productId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  const handleMoveBack = (productId: string, moveBackQuantity: number, fromBinId?: string) => {
    if (!sourceBin || !targetBin) return;

    // Get the actual total moved quantity for this product to this target bin
    const transfersForThisProductAndBin = pendingTransfers.filter(
      pt => pt.productId === productId && pt.toBinId === targetBin.id
    );
    
    const totalMovedQuantity = transfersForThisProductAndBin.reduce((sum, transfer) => sum + transfer.quantity, 0);
    
    // Check if this is an allocated product (all transfers have quantity 0)
    const isAllocatedProduct = transfersForThisProductAndBin.length > 0 && totalMovedQuantity === 0;
    
    if (isAllocatedProduct) {
      // For allocated products, remove the allocation entirely
      handleRemoveAllocation(productId);
      return;
    }

    // For moved products with quantity > 0, proceed with normal move back logic
    if (moveBackQuantity <= 0 || moveBackQuantity > totalMovedQuantity) return;

    setPendingTransfers(prev => {
      const updatedTransfers = [];
      let remainingToRemove = moveBackQuantity;
      
      for (const transfer of prev) {
        // If fromBinId is specified, only remove from that specific source bin
        const shouldRemoveFromThisTransfer = fromBinId 
          ? (transfer.productId === productId && transfer.toBinId === targetBin.id && transfer.fromBinId === fromBinId && remainingToRemove > 0)
          : (transfer.productId === productId && transfer.toBinId === targetBin.id && remainingToRemove > 0);
        
        if (shouldRemoveFromThisTransfer) {
          if (transfer.quantity <= remainingToRemove) {
            remainingToRemove -= transfer.quantity;
            // Skip this transfer (remove it completely)
          } else {
            updatedTransfers.push({
              ...transfer,
              quantity: transfer.quantity - remainingToRemove
            });
            remainingToRemove = 0;
          }
        } else {
          updatedTransfers.push(transfer);
        }
      }
      
      return updatedTransfers;
    });

    setProductMoveQuantities(prev =>
      prev.map(pmq =>
        pmq.productId === productId
          ? { 
              ...pmq, 
              moved: Math.max(0, pmq.moved - moveBackQuantity),
              quantity: Math.min(pmq.maxQuantity - Math.max(0, pmq.moved - moveBackQuantity), pmq.maxQuantity)
            }
          : pmq
      )
    );

    setMovedProducts(prev => {
      return prev.map(mp => {
        if (mp.id === productId) {
          const newMovedQuantity = Math.max(0, mp.movedQuantity - moveBackQuantity);
          return { ...mp, movedQuantity: newMovedQuantity };
        }
        return mp;
      }).filter(mp => mp.movedQuantity > 0);
    });
  };

  const handleMoveProduct = (productId: string) => {
    if (!sourceBin || !targetBin) return;

    const sourceProduct = sourceBin.products.find(p => p.id === productId);
    if (!sourceProduct) return;

    // Check if already moved to this target bin
    const existingTransferToThisBin = pendingTransfers.find(pt => pt.productId === productId && pt.toBinId === targetBin.id);
    if (existingTransferToThisBin) {
      toast.error('Product already added to this bin');
      return;
    }

    // Allow moving even if product exists in target bin - it will consolidate
    // Simplified move: just add product to target without quantity tracking from source
    setMovedProducts(prev => {
      const existingIndex = prev.findIndex(mp => mp.id === productId);
      if (existingIndex >= 0) {
        toast.error('Product already added to this bin');
        return prev;
      } else {
        return [...prev, {
          ...sourceProduct,
          quantity: 0,
          movedQuantity: 0
        }];
      }
    });

    setPendingTransfers(prev => [...prev, {
      productId,
      fromBinId: sourceBin.id,
      toBinId: targetBin.id,
      quantity: 0,
      actionType: 'move' // Mark this as a move action
    }]);
  };

  const handleRemoveAllocation = (productId: string) => {
    if (!sourceBin || !targetBin) return;

    setPendingTransfers(prev => prev.filter(pt => !(pt.productId === productId && pt.toBinId === targetBin.id)));

    // Calculate how much was actually moved (not allocated) to other bins for this product
    const remainingTransfers = pendingTransfers.filter(pt => pt.productId === productId && pt.toBinId !== targetBin.id);
    const totalMovedToOtherBins = remainingTransfers.reduce((sum, transfer) => sum + transfer.quantity, 0);

    // Only update productMoveQuantities if there were actual moves (quantity > 0), not just allocations
    if (totalMovedToOtherBins > 0) {
      setProductMoveQuantities(prev =>
        prev.map(pmq =>
          pmq.productId === productId
            ? { 
                ...pmq, 
                moved: totalMovedToOtherBins, // Only count actual moved quantities, not allocations
                quantity: pmq.maxQuantity - totalMovedToOtherBins // Restore available quantity
              }
            : pmq
        )
      );
    }

    // Clean up movedProducts if no transfers remain for this product
    const hasOtherTransfers = remainingTransfers.length > 0;
    if (!hasOtherTransfers) {
      setMovedProducts(prev => prev.filter(mp => mp.id !== productId));
    }
  };

  // Same idea as handleRemoveAllocation, but for every product moved into the current target at
  // once — a dedicated pass rather than calling handleRemoveAllocation in a loop, since each of its
  // calls reads pendingTransfers from this render's closure to work out what's left; looping it
  // would have every iteration reasoning from the same pre-removal snapshot instead of the one
  // before it, correct for the transfer removal itself (which goes through a functional updater)
  // but wrong for the quantity-restore math beside it.
  const handleRemoveAllFromTarget = () => {
    if (!targetBin) return;
    const transfersToTarget = pendingTransfers.filter(pt => pt.toBinId === targetBin.id);
    if (transfersToTarget.length === 0) return;
    const affectedProductIds = new Set(transfersToTarget.map(pt => pt.productId));

    setPendingTransfers(prev => prev.filter(pt => pt.toBinId !== targetBin.id));

    setProductMoveQuantities(prev =>
      prev.map(pmq => {
        if (!affectedProductIds.has(pmq.productId)) return pmq;
        const remainingMoved = pendingTransfers
          .filter(pt => pt.productId === pmq.productId && pt.toBinId !== targetBin.id)
          .reduce((sum, pt) => sum + pt.quantity, 0);
        return { ...pmq, moved: remainingMoved, quantity: pmq.maxQuantity - remainingMoved };
      })
    );

    setMovedProducts(prev =>
      prev.filter(mp => {
        if (!affectedProductIds.has(mp.id)) return true;
        return pendingTransfers.some(pt => pt.productId === mp.id && pt.toBinId !== targetBin.id);
      })
    );

    // No toast. Picking and un-picking is what this step IS — the operator does it repeatedly while
    // making up their mind, and a confirmation per tap stacks messages over the very column that
    // already answers them. The screen shows the result in three places (the target count, the cards,
    // the Move List), so the toast could only restate it. Refusals still speak: those report something
    // the screen cannot show, because nothing changed.
  };

  // Handler for product-centric move from a specific bin
  const handleProductCentricMoveFromBin = (productId: string, binId: string) => {
    if (!targetBin) return;

    // Check if already moved from this bin to current target
    const existingTransfer = pendingTransfers.find(
      pt => pt.productId === productId && pt.fromBinId === binId && pt.toBinId === targetBin.id
    );
    
    if (existingTransfer) {
      toast.error('Product from this bin already added');
      return;
    }

    // Find the source bin and product
    const sourceBinForProduct = sourceBins.find(b => b.id === binId);
    if (!sourceBinForProduct) return;

    const sourceProduct = sourceBinForProduct.products.find(p => p.id === productId);
    if (!sourceProduct) return;

    // Add the transfer
    setPendingTransfers(prev => [...prev, {
      productId,
      fromBinId: binId,
      toBinId: targetBin.id,
      quantity: 0,
      actionType: 'move'
    }]);

    // No toast — see handleRemoveAllFromTarget. The card appears in the target column as this runs.
  };

  // Handler for moving all locations of a product at once
  const handleMoveAllFromProduct = () => {
    if (!targetBin || productsAcrossMultipleBins.length === 0) return;

    const currentProduct = productsAcrossMultipleBins[currentProductIndex];
    if (!currentProduct) return;

    let movedCount = 0;
    
    // Move from each bin location that hasn't been moved yet
    currentProduct.binLocations.forEach(binLocation => {
      // Check if already moved from this bin to current target
      const existingTransfer = pendingTransfers.find(
        pt => pt.productId === binLocation.productId && pt.fromBinId === binLocation.binId && pt.toBinId === targetBin.id
      );
      
      if (!existingTransfer) {
        setPendingTransfers(prev => [...prev, {
          productId: binLocation.productId,
          fromBinId: binLocation.binId,
          toBinId: targetBin.id,
          quantity: 0,
          actionType: 'move'
        }]);
        movedCount++;
      }
    });

    // Silent on success — see handleRemoveAllFromTarget. The refusal below still speaks, since a no-op
    // is the one outcome the columns cannot show.
    if (movedCount === 0) {
      toast.error('All locations already moved');
    }
  };

  // Check if a product has been moved from a specific bin
  const hasMovedFromBin = (productId: string, binId: string): boolean => {
    return pendingTransfers.some(
      pt => pt.productId === productId && pt.fromBinId === binId && pt.toBinId === targetBin.id
    );
  };

  const validateTransfers = (): boolean => {
    return pendingTransfers.length > 0;
  };

  // Every transfer this modal can stage is a move now — "Allocate only" was the other kind, and it
  // has gone to the Allocate Product workflow — so this always leads on to the quantity step rather
  // than committing. "Start" is the load-bearing word: this opens the quantity walk rather than
  // performing the move, and the buttons here are named for what happens next, never for the errand
  // as a whole (nothing says Confirm until it commits).
  const confirmActionLabel = 'Start Qty Move';

  const handleConfirm = () => {
    if (!validateTransfers() || !sourceBin || !targetBin) return;

    if (pendingTransfers.length > 0) {
      onConfirmAllocation(pendingTransfers);
      // Don't close modal here - let App.tsx handle it after serial number selection
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getSourceProducts = () => {
    if (!sourceBin) return [];
    
    let products = sourceBin.products.map(product => {
      // Use the memoized quantities for accurate real-time data
      const moveData = currentSourceBinAvailableQuantities.find(q => q.productId === product.id);
      return {
        ...product,
        remainingQuantity: product.quantity - (moveData?.moved || 0)
      };
    });

    // If targeting Emergency Kit, filter to only show "Purchased" inventory type products
    if (isTargetEmergencyKit) {
      products = products.filter(product => {
        // Enhance product to get proper inventory type
        const enhancedProduct = productDataService.enhanceProduct(product);
        return enhancedProduct.inventoryType === 'Purchased';
      });
    }

    // Scoped to what was picked IN THIS BIN. A bin the operator picked products from offers exactly
    // those; a bin hand-picked off the shelf has no picks and offers its whole contents, which is what it
    // was chosen for.
    //
    // This used to filter by the query, which has no bin attached — so a bin offered any product whose
    // identity had been picked anywhere, including ones the operator never pointed at in this bin.
    const pickedHere = productKeysForBin(sourceProductPicks, sourceBin.id);
    if (pickedHere.length > 0) {
      products = products.filter(product => pickedHere.includes(sourcePickKey(product)));
    }

    return products;
  };

  // The whole bin in one action, for the case the per-product buttons handle badly: emptying a bin
  // means making the same decision twelve times down a list of twelve. Deliberately narrow.
  //
  // One target bin only, as the user asked. With several targets the right panel pages through them,
  // so "all" would have to mean "all of this bin into whichever target happens to be showing" — a
  // choice the user hasn't made, and one they'd have to undo product by product.
  //
  // It also acts on exactly what getSourceProducts returns, never on the bin's raw contents. That is
  // what keeps it honest when the E-Kit filter is hiding ineligible inventory types, and it's why
  // it's withheld entirely while a search has the list narrowed: a "move all" that moved the one
  // visible product of four would be lying, and one that moved all four would be moving three the
  // user can't see.
  const moveAllCandidates = (): any[] => {
    // No targetBins.length check: the destination is `targetBin`, whichever the target pager is showing,
    // exactly as the per-product Select uses. Leaving it here after the button stopped enforcing it made
    // the list come back empty with several targets, so the button blamed the wrong thing — it reported
    // "everything is already selected" over a list where nothing was.
    if (!sourceBin || !targetBin || sourceListNarrowed) return [];
    const visible = new Set(getSourceProducts().map(product => product.id));
    return sourceBin.products.filter(product =>
      visible.has(product.id) &&
      !pendingTransfers.some(pt => pt.productId === product.id && pt.toBinId === targetBin.id)
    );
  };

  // Read once — the count row and the guard below would otherwise rebuild the list to count it.
  const visibleSourceProductCount = getSourceProducts().length;

  // Offered on structure, disabled on state: the control stays put once you've started staging
  // products rather than vanishing under the cursor as the last few are picked off.
  const handleMoveAllFromBin = () => {
    const candidates = moveAllCandidates();
    if (!sourceBin || !targetBin || candidates.length === 0) return;

    setMovedProducts(prev => {
      const known = new Set(prev.map(mp => mp.id));
      return [
        ...prev,
        ...candidates
          .filter(product => !known.has(product.id))
          .map(product => ({ ...product, quantity: 0, movedQuantity: 0 }))
      ];
    });

    // One append rather than one per product: setPendingTransfers inside a loop can't see what
    // earlier iterations added, which is the bug handleMoveAllFromProduct only avoids because its
    // bin/product pairs are distinct by construction.
    setPendingTransfers(prev => [
      ...prev,
      ...candidates.map(product => ({
        productId: product.id,
        fromBinId: sourceBin.id,
        toBinId: targetBin.id,
        quantity: 0,
        actionType: 'move' as const
      }))
    ]);

    // No toast — see handleRemoveAllFromTarget. The target column fills in as this runs.
  };

  const getTargetProducts = () => {
    if (!targetBin) return [];
    
    // rowKey, not product.id, identifies a row: the bin's own stock and an arrival of the same
    // product are two rows sharing one identity, so the id alone can't tell React which is which.
    const existingProducts = targetBin.products.map(product => ({
      ...product,
      movedQuantity: 0,
      rowKey: `existing-${product.id}`
    }));
    
    const transfersForThisBin = pendingTransfers.filter(pt => pt.toBinId === targetBin.id);

    // Grouped on the identity triple, not transfer.productId: the same drug in three source bins is
    // three product rows with three different ids, so keying on the id produced one arrival card per
    // source bin — three identical cards, each listing all three "From:" rows, because the card's own
    // source list matches on the identity (§3). One arrival per product, its quantity summed across
    // the bins it comes from.
    const transfersByProduct = transfersForThisBin.reduce((acc, transfer, index) => {
      // Resolve the transfer to its source row first; the identity lives on the product, not the
      // transfer, and a transfer whose source can't be found is one we can't describe at all.
      let sourceProduct: any = null;
      for (const bin of sourceBins) {
        sourceProduct = bin.products.find(p => p.id === transfer.productId);
        if (sourceProduct) break;
      }
      if (!sourceProduct) return acc;

      const key = `${sourceProduct.name}|${sourceProduct.ndc}|${sourceProduct.inventoryType}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          // The first contributing source row stands for the product's identity. Remove and Move Back
          // match on the identity triple across every transfer, so which id this is doesn't decide
          // what they act on.
          productId: transfer.productId,
          sourceProduct,
          totalQuantity: 0,
          rank: index,
          transfers: []
        };
      }
      acc[key].totalQuantity += transfer.quantity;
      acc[key].transfers.push(transfer);
      // Recency comes from the order of pendingTransfers, not from a timestamp taken here: this
      // function runs on every render, so Date.now() re-stamped every pending move with the same
      // instant and the sort at the bottom had nothing to order by. Last transfer wins, so a product
      // touched twice ranks by its latest move.
      acc[key].rank = index;
      return acc;
    }, {} as Record<string, { key: string; productId: string; sourceProduct: any; totalQuantity: number; rank: number; transfers: any[] }>);

    const allProducts = [...existingProducts];

    // Process each product's accumulated transfers
    Object.values(transfersByProduct).forEach(productTransfers => {
      const sourceProduct = productTransfers.sourceProduct;

      // CRITICAL FIX: Try to find existing product by ID first, then by name/NDC/inventoryType
      // This ensures we properly consolidate products even when they have different IDs
      let existingIndex = allProducts.findIndex(existing => existing.id === productTransfers.productId);
      
      // If not found by ID, try to find by name, NDC, and inventory type (same logic as useInventoryState)
      if (existingIndex === -1) {
        existingIndex = allProducts.findIndex(existing => 
          existing.name === sourceProduct.name && 
          existing.ndc === sourceProduct.ndc &&
          existing.inventoryType === sourceProduct.inventoryType
        );
      }
      
      // Arriving stock is its own row, whether or not the bin already stocks this product. It used to
      // be folded into the existing row as a combined quantity, which left that row saying two things
      // at once and — because the card's tint keys on "is this arriving" — showed the arrival with no
      // highlight at all, unlike a product new to the bin. Two rows: the bin's own stock, untouched
      // and plain, and the arrival beside it, tinted and removable.
      allProducts.push({
        ...(existingIndex >= 0 ? allProducts[existingIndex] : sourceProduct),
        quantity: productTransfers.totalQuantity,
        movedQuantity: productTransfers.totalQuantity,
        // Marks this row as the arrival rather than something the bin already held. Explicit because
        // the two rows are the same product identity, so nothing about the product itself can tell
        // them apart — a card deriving it from the bin's contents would call both pre-existing.
        isArrival: true,
        // The source bin's own product id, which is what Remove and Move Back match transfers on.
        sourceProductId: productTransfers.productId,
        rowKey: `arrival-${productTransfers.key}`,
        moveRank: productTransfers.rank
      });
    });
    
    // Anything the user just allocated or moved into this bin goes on top, most recent first, so the
    // result of the last tap is where the eye already is. Two things kept that from happening: the
    // old test was movedQuantity > 0, which an "Allocate only" fails by design (it carries no
    // quantity — the amount is named in the next step), and a product the bin already stocked is
    // updated in place above, so it held its alphabetical slot however it was allocated. Ranking on
    // the transfer covers both: the transfer exists either way, and it doesn't care whether the
    // product is new to the bin. Everything untouched stays alphabetical beneath.
    const sortedProducts = allProducts.sort((a, b) => {
      const aRank = (a as any).moveRank ?? -1;
      const bRank = (b as any).moveRank ?? -1;
      if (aRank !== bRank) return bRank - aRank;
      return a.name.localeCompare(b.name);
    });
    
    // Removed extensive debug logging for performance
    
    return sortedProducts;
  };

  // One target card, whichever section it lands in. Extracted so the arrivals and the bin's own stock
  // can be listed under separate headings without this body being written out twice.
  const renderTargetCard = (product: any) => {
    // Check if this product has a pending transfer to this bin
    const hasPendingTransfer = pendingTransfers.some(
      pt => pt.toBinId === targetBin!.id && (
        pt.productId === product.id ||
        // Also check by name/NDC/inventoryType for consolidated products
        (sourceBins.some(bin =>
          bin.products.some(p =>
            p.id === pt.productId &&
            p.name === product.name &&
            p.ndc === product.ndc &&
            p.inventoryType === product.inventoryType
          )
        ))
      )
    );

    // Calculate source bins for this product
    const sourceBinsList = pendingTransfers
      .filter(pt =>
        pt.toBinId === targetBin!.id && (
          pt.productId === product.id ||
          // Also match by name/NDC/inventoryType for consolidated products
          (sourceBins.some(bin =>
            bin.products.some(p =>
              p.id === pt.productId &&
              p.name === product.name &&
              p.ndc === product.ndc &&
              p.inventoryType === product.inventoryType
            )
          ))
        )
      )
      .map(pt => {
        // Find the source bin for this transfer
        let sourceBinInfo: any = null;
        Object.keys(doorShelfConfig).forEach(doorKey => {
          const shelves = doorShelfConfig[doorKey];
          shelves?.forEach(shelf => {
            shelf.bins?.forEach(bin => {
              if (bin.id === pt.fromBinId) {
                sourceBinInfo = {
                  binId: bin.id,
                  binName: bin.name,
                  doorName: getDoorName({ id: bin.id, name: bin.name } as any) || doorKey,
                  quantity: pt.quantity,
                  productId: pt.productId // Include the original product ID from this transfer
                };
              }
            });
          });
        });
        return sourceBinInfo;
      })
      .filter(Boolean);

    // Only the arrival row belongs to the move; the bin's own stock is just what's there, so it gets
    // neither a Remove nor any source bins.
    const isArrival = !!product.isArrival;
    return (
      <TargetProductCard
        key={product.rowKey ?? product.id}
        product={product}
        targetBin={targetBin!}
        onMoveBack={handleMoveBack}
        onRemove={handleRemoveAllocation}
        hasPendingTransfer={isArrival && hasPendingTransfer}
        isArrival={isArrival}
        sourceBins={isArrival && sourceBinsList.length > 0 ? sourceBinsList : undefined}
      />
    );
  };

  if (!sourceBin || !targetBin) return null;

  return (
    // Step ③ Review — a full page now, not a modal, so it matches the pages on either side of it in
    // the pipeline (UX: one consistent surface for the whole flow rather than a dialog in the middle).
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-hidden relative">
          {/* Source and target were two boxed cards (border, rounded, grey fill) with a gap between.
              Now one plane split by a single divider — the box chrome and the doubled padding it
              needed go back to the content, which gets the reclaimed width. The Move Summary panel
              sits outside that divider, as its own flex sibling, so its border never doubles up with
              the source/target divider. */}
          <div className="flex h-full min-h-0">
          <div className="flex-1 min-w-0 flex min-h-0 divide-x divide-gray-200">
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="border-b bg-white px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  {productsAcrossMultipleBins.length > 0 ? (
                    // Product-centric view header with product details
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-[#dbeafe] rounded-[10px] size-[40px] flex items-center justify-center shrink-0">
                          <div className="size-[20px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                              <g>
                                <path d="M9.16667 18.1083C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1083L16.6667 14.775C16.9198 14.6289 17.13 14.4187 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3333V6.66667C17.4997 6.3744 17.4225 6.08734 17.2763 5.8343C17.13 5.58126 16.9198 5.37114 16.6667 5.225L10.8333 1.89167C10.58 1.74539 10.2926 1.66838 10 1.66838C9.70744 1.66838 9.42003 1.74539 9.16667 1.89167L3.33333 5.225C3.08022 5.37114 2.86998 5.58126 2.72372 5.8343C2.57745 6.08734 2.5003 6.3744 2.5 6.66667V13.3333C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4187 3.08022 14.6289 3.33333 14.775L9.16667 18.1083Z" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                <path d="M10 18.3333V10" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                <path d="M2.74167 5.83333L10 10L17.2583 5.83333" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                <path d="M6.25 3.55833L13.75 7.85" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                              </g>
                            </svg>
                          </div>
                        </div>
                        
                        {/* The same block the source and target cards use — this header names one of
                            the products those cards list, so it shouldn't present it differently. */}
                        {/* No space-y: the NDC line sits directly under the generic name. The 6px gap
                            read as a break between two facts about one product, when the three lines
                            are one identity block. Kept in step with the two cards below. */}
                        <div className="flex-1 flex flex-col min-w-0">
                          <div>
                            {/* Badges beside the display name, as on both step-④ screens. On their own
                                line under the generic name they sat two rows from the NDC they help
                                identify, and the pipeline reads name-and-kind as one thing: which
                                product, and what handling it needs. */}
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h4 className="font-normal text-[#020817] text-[14px] leading-[20px]">
                                {focusedProduct?.name}
                              </h4>
                              <span className="flex items-center gap-1 shrink-0">
                                <ProductBadges product={focusedProduct} />
                              </span>
                            </div>
                            {focusedProduct?.description && (
                              <p className="italic text-gray-500 leading-snug text-[14px]">
                                {focusedProduct.description}
                              </p>
                            )}
                          </div>

                          <div className="text-gray-500 text-[14px] break-words">
                            {focusedProduct?.ndc} - {focusedProduct?.inventoryType}
                          </div>
                        </div>
                      </div>
                      
                      {/* Product Navigation */}
                      {productsAcrossMultipleBins.length > 1 && (
                        <div className="flex items-center gap-3 ml-3">
                          {/* Named for what it pages through. A bare "1 of 2" says a position without
                              saying in what — and this column pages products in a Product move but bins
                              in a Bin move, so the noun is the only thing that tells them apart. */}
                          <span className="text-sm text-gray-600">
                            Product {currentProductIndex + 1} of {productsAcrossMultipleBins.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <div 
                              className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentProductIndex === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              onClick={currentProductIndex === 0 ? undefined : goToPreviousProduct}
                            >
                              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                              <ChevronLeft className="w-4 h-4 text-[#095192]" />
                            </div>
                            <div 
                              className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentProductIndex === productsAcrossMultipleBins.length - 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              onClick={currentProductIndex === productsAcrossMultipleBins.length - 1 ? undefined : goToNextProduct}
                            >
                              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                              <ChevronRight className="w-4 h-4 text-[#095192]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Bin-centric view header
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-[16px]">
                            {getDoorName(sourceBin)} - {sourceBin?.name}
                          </h3>
                          <p className="text-sm text-gray-500 text-[14px]">{sourceBin.shelfName || 'Shelf'}</p>
                        </div>
                      </div>
                      
                      {visibleSourceBins.length > 1 && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">
                            Bin {currentSourceBinIndex + 1} of {visibleSourceBins.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <div
                              className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentSourceBinIndex === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              onClick={currentSourceBinIndex === 0 ? undefined : goToPreviousSourceBin}
                            >
                              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                              <ChevronLeft className="w-4 h-4 text-[#095192]" />
                            </div>
                            <div
                              className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentSourceBinIndex === visibleSourceBins.length - 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              onClick={currentSourceBinIndex === visibleSourceBins.length - 1 ? undefined : goToNextSourceBin}
                            >
                              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                              <ChevronRight className="w-4 h-4 text-[#095192]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Explains why the source panel is narrowed — the user picked one product in search.
                  Withheld for a Product move: that mode's product-centric view ALWAYS shows only the
                  picked products (moveMode === 'product' never falls back to the per-bin list, see
                  productsAcrossMultipleBins above), so for that mode this isn't a narrowing the
                  operator needs explained — it's just what a Product move always looks like. A Bin
                  move whose per-bin list gets narrowed by a search still needs the explanation. */}
              {sourceListNarrowed && moveMode !== 'product' && (
                <div className="bg-blue-50 border-b border-blue-200 px-[16px] py-[8px]">
                  <div className="flex items-center">
                    <p className="text-sm text-blue-900 font-medium text-left">
                      {/* Not "from search" any more: a product can now be picked off the canvas too,
                          so naming one route made the banner wrong half the time. */}
                      Showing only the products you selected.
                    </p>
                  </div>
                </div>
              )}

              {/* Emergency Kit Warning Message */}
              {isTargetEmergencyKit && (
                <div className="bg-orange-50 border-b border-orange-200 px-[16px] py-[10px] py-[8px]">
                  <div className="flex items-center">
                    <p className="text-sm text-orange-800 font-medium text-left">
                      Only purchased inventory product is shown, as it is eligible to move to the E-Kit.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {/* Count on the left, Select all on the right — the same header row the allocate panel
                    and the unallocated tray use, so a list of products is topped the same way wherever
                    it appears. Scoped to the bin-centric view because the product view brings its own.
                    The count reports what's LISTED rather than what the bin holds, so it agrees with
                    what Select all will do when the E-Kit filter hides ineligible inventory types.

                    The row used to be gated on Select all being usable, which meant the count vanished
                    with it — with two target bins there was no header at all, and the list started with
                    no idea how long it was. The count always shows now; the button explains itself when
                    it can't act, rather than the row disappearing (UX-AUDIT P1: never a dead control
                    without its reason). */}
                {productsAcrossMultipleBins.length === 0 && visibleSourceProductCount > 0 && (
                  <div className="mb-3 pb-3 border-b border-gray-200 flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-[#020817]">{visibleSourceProductCount}</span>{' '}
                      {visibleSourceProductCount === 1 ? 'Product' : 'Products'}
                    </span>

                    {/* One product is already "all of them", so the button would be a no-op. */}
                    {visibleSourceProductCount > 1 && (() => {
                      // Several target bins used to block this, on the grounds that "all of them" needs
                      // one destination. It doesn't: handleMoveAllFromBin commits to `targetBin` — the
                      // one the target pager is showing — which is exactly what the per-product Select
                      // beside each row already does. Blocking here while allowing five individual
                      // Selects that land in the same place was a rule the rest of the screen didn't
                      // keep.
                      //
                      // Still blocked where the action genuinely has nothing to do, and those keep their
                      // reason: a disabled control that won't say why is the audit's sharpest flaw (P1).
                      const blockedReason = sourceListNarrowed
                        ? 'The list is narrowed to a search — clear it to take everything in this bin'
                        : moveAllCandidates().length === 0
                          ? 'Everything listed here is already selected'
                          : null;

                      return (
                        <button
                          type="button"
                          onClick={blockedReason ? undefined : handleMoveAllFromBin}
                          disabled={!!blockedReason}
                          // No tooltip when it works — the row it tops says what "all" is, and the
                          // toast on click names the bin. The title is only carrying a refusal.
                          title={blockedReason ?? undefined}
                          className={`h-8 px-3 rounded-[4px] border border-[#095192] bg-white text-[#095192] text-[14px] leading-[20px] whitespace-nowrap transition-colors ${
                            blockedReason ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F1F6FA]'
                          }`}
                        >
                          Select all
                        </button>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Show product-centric view if products exist across multiple bins */}
                  {productsAcrossMultipleBins.length > 0 ? (
                    // Show only current product's bin locations
                    <ProductCentricCard
                      key={`${productsAcrossMultipleBins[currentProductIndex]?.product.name}-${productsAcrossMultipleBins[currentProductIndex]?.product.ndc}`}
                      product={productsAcrossMultipleBins[currentProductIndex]?.product}
                      binLocations={productsAcrossMultipleBins[currentProductIndex]?.binLocations || []}
                      onMoveFromBin={handleProductCentricMoveFromBin}
                      hasMovedFromBin={hasMovedFromBin}
                      hasOnlyOneTargetBin={targetBins.length === 1}
                      onMoveAll={handleMoveAllFromProduct}
                    />
                  ) : getSourceProducts().length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <div className="text-lg mb-2">
                          {isTargetEmergencyKit
                            ? "No Purchased Products Available"
                            : sourceListNarrowed
                              ? "Product Not In This Bin"
                              : "All Products Moved"}
                        </div>
                        <div className="text-sm">
                          {isTargetEmergencyKit
                            ? "Only Purchased inventory can be moved to Emergency Kit"
                            : sourceListNarrowed
                              ? "The product you selected isn't stocked in this bin"
                              : "No more products available to move"
                          }
                        </div>
                        {!isTargetEmergencyKit && !sourceListNarrowed && (
                          <div className="text-xs mt-1">Use "Move Back" to return products</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    getSourceProducts().map((product) => {
                      // Get the user's input move quantity (what they want to move)
                      const moveQuantity = productMoveQuantities.find(q => q.productId === product.id);
                      
                      // Get the available quantity (for validation and display)
                      const availableData = currentSourceBinAvailableQuantities.find(q => q.productId === product.id);
                      const remainingQuantity = availableData?.availableQuantity || 0;
                      
                      const hasError = !!errors[product.id];
                      const isPendingTransfer = pendingTransfers.some(pt => pt.productId === product.id && pt.toBinId === targetBin.id);
                      const isInTargetBin = targetBin && targetBin.products.some(p => p.id === product.id);
                      
                      // CRITICAL FIX: Only check if product exists in the currently displayed target bin
                      // This ensures the Allocate button is only hidden for the current target bin, not all target bins
                      const existsInCurrentTargetBin = targetBin && targetBin.products.some(p => 
                        p.name === product.name && 
                        p.ndc === product.ndc && 
                        p.inventoryType === product.inventoryType
                      );

                      // Removed debug logging for performance
                      
                      // Calculate total moved quantity to target bins for this product
                      const movedQuantityToTargets = pendingTransfers
                        .filter(pt => pt.productId === product.id && targetBins.some(bin => bin.id === pt.toBinId))
                        .reduce((total, transfer) => total + transfer.quantity, 0);
                      
                      // Check if this product has been moved to the current target bin
                      const hasMovedToCurrentTarget = pendingTransfers.some(
                        pt => pt.productId === product.id && pt.toBinId === targetBin.id
                      );
                      
                      return (
                        <SourceProductCard
                          key={product.id}
                          product={{ ...product, remainingQuantity }}
                          moveQuantity={moveQuantity}
                          hasError={hasError}
                          error={errors[product.id]}
                          isPendingTransfer={isPendingTransfer}
                          isInTargetBin={!!isInTargetBin}
                          isInTargetBins={existsInCurrentTargetBin}
                          movedQuantityToTarget={movedQuantityToTargets}
                          targetBins={targetBins}
                          currentTargetBin={targetBin}
                          doorShelfConfig={doorShelfConfig}
                          isMoveDisabled={hasMovedToCurrentTarget} // Disable if already moved to current target
                          onUpdateMoveQuantity={updateMoveQuantity}
                          onMoveProduct={handleMoveProduct}
                          onMoveBack={(productId) => {
                            // Move back all quantities for this product from current target bin
                            const transfersToCurrentBin = pendingTransfers
                              .filter(pt => pt.productId === productId && pt.toBinId === targetBin.id);
                            const totalToMoveBack = transfersToCurrentBin.reduce((sum, t) => sum + t.quantity, 0);
                            if (totalToMoveBack > 0) {
                              handleMoveBack(productId, totalToMoveBack);
                            }
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="border-b bg-white px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-[16px]">{getDoorName(targetBin)} - {targetBin.name}</h3>
                      <p className="text-sm text-gray-500 text-[14px]">{targetBin.shelfName || 'Shelf'}</p>
                    </div>
                  </div>
                  
                  {targetBins.length > 1 && (
                    <div className="flex items-center gap-3">
                      {/* Always "Bin": the destination is a bin whichever kind of move this is, which
                          is the same reason step ② is called Target rather than named for the unit. */}
                      <span className="text-sm text-gray-600">
                        Bin {currentTargetBinIndex + 1} of {targetBins.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <div 
                          className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentTargetBinIndex === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          onClick={currentTargetBinIndex === 0 ? undefined : goToPreviousTargetBin}
                        >
                          <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                          <ChevronLeft className="w-4 h-4 text-[#095192]" />
                        </div>
                        <div 
                          className={`bg-white relative rounded-[4px] h-8 w-8 flex items-center justify-center ${currentTargetBinIndex === targetBins.length - 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          onClick={currentTargetBinIndex === targetBins.length - 1 ? undefined : goToNextTargetBin}
                        >
                          <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
                          <ChevronRight className="w-4 h-4 text-[#095192]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Two sections, each with its own count: what this move is putting into the bin, then
                  what the bin already held. One combined list left the operator working out which
                  cards were theirs by looking for a Remove button on each; the headings say it once.
                  A bin with nothing arriving shows only the second section, so before anything is
                  picked the column reads as a plain statement of the bin's contents. */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {(() => {
                  const targetRows = getTargetProducts();
                  const arrivals = targetRows.filter((row: any) => row.isArrival);
                  const alreadyHere = targetRows.filter((row: any) => !row.isArrival);

                  if (targetRows.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        <div className="text-center">
                          <div className="text-lg mb-2">Empty Bin</div>
                          <div className="text-sm">No products currently allocated</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {arrivals.length > 0 && (
                        <>
                          {/* Same count row and padding the source column uses, with a Remove all
                              beside it once there's more than one to make the same "no-op on a single
                              item" call Select all does on the source side. */}
                          <div className="mb-3 pb-3 border-b border-gray-200 flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-600">
                              <span className="font-medium text-[#020817]">{arrivals.length}</span>{' '}
                              {arrivals.length === 1 ? 'Product' : 'Products'}
                            </span>

                            {arrivals.length > 1 && (
                              // Red, matching the per-product Remove sitting inches below it in this
                              // same column (TargetProductCard's #e7000b). The two do the same thing
                              // at different scales, so in blue this one read as a different KIND of
                              // action — the column's "undo" and its "confirm" wearing one colour.
                              <button
                                type="button"
                                onClick={handleRemoveAllFromTarget}
                                className="h-8 px-3 rounded-[4px] border border-[#e7000b] bg-white text-[#e7000b] text-[14px] leading-[20px] whitespace-nowrap transition-colors cursor-pointer hover:bg-[#FDF2F2]"
                              >
                                Remove all
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">{arrivals.map(renderTargetCard)}</div>
                        </>
                      )}

                      {alreadyHere.length > 0 && (
                        <>
                          <div
                            className={`mb-3 pb-3 border-b border-gray-200 ${
                              arrivals.length > 0 ? 'mt-6' : ''
                            }`}
                          >
                            <span className="text-sm text-gray-600">
                              <span className="font-medium text-[#020817]">{alreadyHere.length}</span>{' '}
                              {alreadyHere.length === 1 ? 'Product' : 'Products'} already in this bin
                            </span>
                          </div>
                          <div className="space-y-3">{alreadyHere.map(renderTargetCard)}</div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <MoveSummaryPanel
            rows={summaryRows}
            isOpen={summaryOpen}
            onToggle={() => setSummaryOpen(prev => !prev)}
          />
          </div>
        </div>

        <PipelineFooterShell>
          <StepCell step={3} moveMode={moveMode} />
          <FooterDivider />

          {/* Now that there's a Move Summary panel to open and close, this stage gets the same kind
              of counter the later stages already use for their own sheets — toggling the panel
              rather than a SideSheet, since the panel is meant to stay open and visible rather than
              overlay the screen, but the same footer affordance either way.
              Always enabled, unlike the Product/Source Bin cells elsewhere: those gate on having
              something to report, but this one is the ONLY way to close the panel once it's open —
              gating on summaryRows.length would have left it stuck open with nothing selected yet,
              since the panel starts closed and there'd be no other control to shut it again. */}
          <SummaryCell
            icon={<ListChecks className="w-4 h-4" />}
            label="Move List"
            value={`${summaryProductCount} ${summaryProductCount === 1 ? 'product' : 'products'}`}
            active={summaryOpen}
            enabled
            onClick={() => setSummaryOpen(prev => !prev)}
          />

          <FooterActions>
            {onCancel && <FooterButton label="Cancel" variant="secondary" onClick={onCancel} demoId="pipeline-cancel" />}
            {/* One step back to the Target selection — mode stays active, selection is kept. */}
            <FooterButton
              label="Back"
              variant="secondary"
              onClick={handleCancel}
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
              demoId="pipeline-back"
            />
            <FooterButton
              label={confirmActionLabel}
              variant="primary"
              enabled={validateTransfers()}
              onClick={handleConfirm}
              trailingIcon={<ArrowRight className="w-4 h-4" />}
              demoId="pipeline-primary"
            />
          </FooterActions>
        </PipelineFooterShell>
      </div>
  );
}