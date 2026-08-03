import React, { useState, useEffect, useMemo } from 'react';
import PipelineSteps from "./PipelineSteps";
import {
  PipelineFooterShell,
  FooterActions,
  StepCell,
  FooterButton
} from "./PipelineFooter";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Package, ChevronLeft, ChevronRight, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import SourceProductCard from "./SourceProductCard";
import TargetProductCard from "./TargetProductCard";
import ProductCentricCard from "./ProductCentricCard";
import { formatBinLocation, getDoorName } from '../utils/changeAllocationUtils';
import { doesProductMatchSearch } from '../utils/textHighlight';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';
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

    toast.success(`Added ${sourceProduct.name} from ${sourceBinForProduct.name}`);
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

    if (movedCount > 0) {
      toast.success(`Moved ${currentProduct.product.name} from ${movedCount} bin${movedCount > 1 ? 's' : ''}`);
    } else {
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

    // Search-driven selection: only the picked product is in scope for this move — but only for the
    // bins the search actually put here. A bin hand-picked off the shelf during the same session was
    // chosen for its whole contents, so scoping it to another bin's searched product would hide the
    // very products the user picked it for.
    if (focusedQuery && isBinScopedByQuery(sourceBin)) {
      products = products.filter(product => productMatchesQuery(product, focusedQuery));
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

    toast.success(
      `Moving ${candidates.length} product${candidates.length > 1 ? 's' : ''} from ${sourceBin.name}`
    );
  };

  const getTargetProducts = () => {
    if (!targetBin) return [];
    
    const existingProducts = targetBin.products.map(product => ({
      ...product,
      movedQuantity: 0
    }));
    
    const transfersForThisBin = pendingTransfers.filter(pt => pt.toBinId === targetBin.id);

    // Recency comes from the order of pendingTransfers, not from a timestamp taken here: this
    // function runs on every render, so Date.now() re-stamped every pending move with the same
    // instant and the sort at the bottom had nothing to order by. Last transfer wins, so a product
    // touched twice ranks by its latest move.
    const transferRank = new Map<string, number>();
    transfersForThisBin.forEach((transfer, index) => transferRank.set(transfer.productId, index));

    // Group transfers by product ID and accumulate quantities
    const transfersByProduct = transfersForThisBin.reduce((acc, transfer) => {
      if (!acc[transfer.productId]) {
        acc[transfer.productId] = {
          productId: transfer.productId,
          totalQuantity: 0,
          transfers: []
        };
      }
      acc[transfer.productId].totalQuantity += transfer.quantity;
      acc[transfer.productId].transfers.push(transfer);
      return acc;
    }, {} as Record<string, { productId: string; totalQuantity: number; transfers: any[] }>);
    
    const allProducts = [...existingProducts];
    
    // Process each product's accumulated transfers
    Object.values(transfersByProduct).forEach(productTransfers => {
      // Find source product across all source bins
      let sourceProduct = null;
      for (const bin of sourceBins) {
        sourceProduct = bin.products.find(p => p.id === productTransfers.productId);
        if (sourceProduct) break;
      }
      if (!sourceProduct) return;
      
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
      
      if (existingIndex >= 0) {
        // CRITICAL FIX: Product already exists in target bin, update with combined quantities
        // This ensures we show a single card with the total quantity instead of duplicate cards
        const existingProduct = allProducts[existingIndex];
        allProducts[existingIndex] = {
          ...existingProduct,
          quantity: existingProduct.quantity + productTransfers.totalQuantity, // Combined total
          movedQuantity: productTransfers.totalQuantity, // Track moved amount
          // CRITICAL FIX: Keep the source product ID for move back functionality
          // This ensures the move back button works correctly with pendingTransfers
          sourceProductId: productTransfers.productId,
          moveRank: transferRank.get(productTransfers.productId) ?? -1
        };
        
        // Removed debug logging for performance
      } else {
        // New product being moved to target bin
        allProducts.push({
          ...sourceProduct,
          quantity: productTransfers.totalQuantity,
          movedQuantity: productTransfers.totalQuantity,
          moveRank: transferRank.get(productTransfers.productId) ?? -1
        });
        
        // Removed debug logging for performance
      }
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

  if (!sourceBin || !targetBin) return null;

  return (
    // Step ③ Review — a full page now, not a modal, so it matches the pages on either side of it in
    // the pipeline (UX: one consistent surface for the whole flow rather than a dialog in the middle).
    <div className="flex flex-col h-full bg-white">
      <PipelineSteps current={3} moveMode={moveMode} />

      <div className="flex-1 overflow-hidden relative">
          {/* Source and target were two boxed cards (border, rounded, grey fill) with a gap between.
              Now one plane split by a single divider — the box chrome and the doubled padding it
              needed go back to the content, which gets the reclaimed width. */}
          <div className="flex h-full min-h-0 divide-x divide-gray-200">
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
                        <div className="flex-1 flex flex-col space-y-1.5 min-w-0">
                          <div>
                            <h4 className="font-normal text-[#020817] text-[14px] leading-[20px]">
                              {focusedProduct?.name}
                            </h4>
                            {focusedProduct?.description && (
                              <p className="italic text-gray-500 leading-snug text-[14px]">
                                {focusedProduct.description}
                              </p>
                            )}
                          </div>

                          {focusedProduct && (
                            <div className="flex items-center gap-1">
                              <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">
                                {getVialType(focusedProduct)}
                              </span>
                              {hasClimateBadge(focusedProduct) && (
                                <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
                              )}
                              {hasCivBadge(focusedProduct) && (
                                <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
                              )}
                            </div>
                          )}

                          <div className="text-gray-500 text-[14px] break-words">
                            {focusedProduct?.ndc} - {focusedProduct?.inventoryType}
                          </div>
                        </div>
                      </div>
                      
                      {/* Product Navigation */}
                      {productsAcrossMultipleBins.length > 1 && (
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-sm text-gray-600">
                            {currentProductIndex + 1} of {productsAcrossMultipleBins.length}
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
                            {currentSourceBinIndex + 1} of {visibleSourceBins.length}
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
              
              {/* Explains why the source panel is narrowed — the user picked one product in search */}
              {sourceListNarrowed && (
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
                      <span className="text-sm text-gray-600">
                        {currentTargetBinIndex + 1} of {targetBins.length}
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
              
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-3">
                  {getTargetProducts().length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <div className="text-lg mb-2">Empty Bin</div>
                        <div className="text-sm">No products currently allocated</div>
                      </div>
                    </div>
                  ) : (
                    getTargetProducts().map((product) => {
                      // Check if this product has a pending transfer to this bin
                      const hasPendingTransfer = pendingTransfers.some(
                        pt => pt.toBinId === targetBin.id && (
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
                          pt.toBinId === targetBin.id && (
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
                          let sourceBinInfo = null;
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
                      
                      return (
                        <TargetProductCard
                          key={product.id}
                          product={product}
                          targetBin={targetBin}
                          onMoveBack={handleMoveBack}
                          onRemove={handleRemoveAllocation}
                          hasPendingTransfer={hasPendingTransfer}
                          sourceBins={sourceBinsList.length > 0 ? sourceBinsList : undefined}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PipelineFooterShell>
          <StepCell step={3} moveMode={moveMode} />

          {/* No summary cell here, unlike the other stages: the count would restate what the two columns
              above already show product by product, and it had nothing to open. The cells elsewhere earn
              their place by reporting a selection made on a different screen — this stage's selection is
              the screen. */}
          <FooterActions>
            {onCancel && <FooterButton label="Cancel" variant="secondary" onClick={onCancel} />}
            {/* One step back to the Target selection — mode stays active, selection is kept. */}
            <FooterButton
              label="Back"
              variant="secondary"
              onClick={handleCancel}
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
            />
            <FooterButton
              label={confirmActionLabel}
              variant="primary"
              enabled={validateTransfers()}
              onClick={handleConfirm}
              trailingIcon={validateTransfers() ? <ArrowRight className="w-4 h-4" /> : undefined}
            />
          </FooterActions>
        </PipelineFooterShell>
      </div>
  );
}