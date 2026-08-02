import React, { useState, useEffect, useMemo, useCallback } from "react";
import MainLayout from "./components/MainLayout";
import HeaderSection from "./components/HeaderSection";
import CabinetSelection from "./components/CabinetSelection";
import ShelvesSection from "./components/ShelvesSection";
import ProductDialog from "./components/ProductDialog";
import HistoryPage from "./components/HistoryPage";
import StationSelectionModal from "./components/StationSelectionModal";
import ChangeAllocationModal from "./components/ChangeAllocationModal";
import SerialNumberModal from "./components/SerialNumberModal";
import QuantitySelectionPage from "./components/QuantitySelectionPage";
import TargetBinSerialScanPage from "./components/TargetBinSerialScanPage";
import ProductDetailPage from "./components/ProductDetailPage";
import UnallocateConfirmModal from "./components/UnallocateConfirmModal";
import ErrorBoundary from "./components/ErrorBoundary";
import AllocationBottomBar from "./components/AllocationBottomBar";
import PipelineSteps from "./components/PipelineSteps";
import AllocationSelectionPanel from "./components/AllocationSelectionPanel";
import AllocateProductsPanel from "./components/AllocateProductsPanel";
import { useDebounce } from "./hooks/useDebounce";

import { useInventoryState } from "./hooks/useInventoryState";
import { useSerialNumberModal } from "./hooks/useSerialNumberModal";
import { cabinets } from "./data/cabinets";
import { doesProductMatchSearch } from "./utils/textHighlight";
import { ProductTransfer } from "./types";
import {
  getCurrentShelves,
  getAllAvailableBins,
  getDoorsWithAvailableBins,
  getDoorsWithSearchMatches,
  countSearchMatches,
  getDoorsWithSelectedBins,
} from "./utils/doorUtils";

// Import independent services
import { emergencyKitService } from "./services/EmergencyKitService";
import { productDataService } from "./services/ProductDataService";

export default function App() {
  const inventoryState = useInventoryState();
  const serialNumberModal = useSerialNumberModal(inventoryState.doorShelfConfig);

  // Station selection state
  const [currentStation, setCurrentStation] = useState("Onco Station");
  const [showStationModal, setShowStationModal] = useState(false);

  // Bin to scroll into view after a search-dropdown selection switches doors — set and
  // cleared in the same effect pass, once the target door's bins have actually rendered.
  const [pendingScrollBinId, setPendingScrollBinId] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingScrollBinId) return;
    const el = document.querySelector(`[data-bin-id="${pendingScrollBinId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setPendingScrollBinId(null);
  }, [pendingScrollBinId, inventoryState.selectedDoor]);

  // State for showing/hiding the Unallocated Products button
  const [showUnallocatedButton, setShowUnallocatedButton] = useState(false);

  // Product detail page state
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productLocation, setProductLocation] = useState<any>(null);

  // Quantity selection modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingQuantityTransfers, setPendingQuantityTransfers] = useState<ProductTransfer[]>([]);
  // Product the quantity page should resume on when re-entered via the target page's Back — its
  // identity triple, or undefined for a fresh entry (which lands on the first product). See H3-2.
  const [quantityResumeProductKey, setQuantityResumeProductKey] = useState<string | undefined>(undefined);

  // Target bin serial scan state
  const [showTargetBinScanPage, setShowTargetBinScanPage] = useState(false);
  const [pendingSerialTransfers, setPendingSerialTransfers] = useState<ProductTransfer[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<ProductTransfer[]>([]);

  // Doors already announced as "unlocked" (via toast) during the current change-allocation
  // session — shared between QuantitySelectionPage (source door) and TargetBinSerialScanPage
  // (target door) so the same physical door never gets a duplicate unlock toast, e.g. when a
  // product's source and destination bin happen to sit behind the same door.
  const [unlockedDoors, setUnlockedDoors] = useState<Set<string>>(new Set());
  const handleDoorUnlocked = useCallback((doorName: string) => {
    setUnlockedDoors(prev => {
      if (prev.has(doorName)) return prev;
      const next = new Set(prev);
      next.add(doorName);
      return next;
    });
  }, []);

  // Unallocation modal state
  const [showUnallocateModal, setShowUnallocateModal] = useState(false);
  const [productsToUnallocate, setProductsToUnallocate] = useState<any[]>([]);

  // Keyboard event listener for "/" key to show Unallocated Products button
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only activate on "/" key and when not typing in an input or search field
      if (event.key === "/" && 
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault(); // Prevent "/" from being typed
        setShowUnallocatedButton(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  
  // Watch for zero-quantity products after change allocation
  useEffect(() => {
    if (inventoryState.zeroQuantityProducts.length > 0) {
      console.log('🔔 Zero-quantity products detected, showing modal:', inventoryState.zeroQuantityProducts);
      setProductsToUnallocate(inventoryState.zeroQuantityProducts);
      setShowUnallocateModal(true);
    }
  }, [inventoryState.zeroQuantityProducts]);

  const currentShelves = useMemo(() => {
    if (!inventoryState.selectedDoor || !inventoryState.doorShelfConfig) return [];
    return getCurrentShelves(inventoryState.selectedDoor, inventoryState.doorShelfConfig);
  }, [inventoryState.selectedDoor, inventoryState.doorShelfConfig]);

  const allAvailableBins = useMemo(() => {
    if (!inventoryState.doorShelfConfig) return [];
    return getAllAvailableBins(inventoryState.doorShelfConfig);
  }, [inventoryState.doorShelfConfig]);

  const doorsWithAvailableBins = useMemo(() => {
    if (!inventoryState.doorShelfConfig) return [];
    return getDoorsWithAvailableBins(inventoryState.doorShelfConfig);
  }, [inventoryState.doorShelfConfig]);

  // Debounce selected search query (only set when user picks from dropdown) to prevent excessive calculations
  const debouncedSelectedSearchQuery = useDebounce(inventoryState.selectedSearchQuery, 300);

  // Same reasoning as ShelfLayout's resolveSearchQuery: in change allocation mode, selectedSearchQuery
  // only ever grows alongside changeAllocationSourceBins/TargetBins (every commit path adds both
  // together), so there is no way left to acquire a real "found, not yet selected" door. A door that
  // still matches a leftover query after its only matching bin was removed from the panel would light
  // up as found for a product that was just taken back out — doorsWithChangeAllocationBins already
  // covers the doors that genuinely hold a selection.
  const doorsWithSearchMatches = useMemo(() => {
    if (inventoryState.changeAllocationMode) return [];
    if (!debouncedSelectedSearchQuery.trim() || !inventoryState.doorShelfConfig) return [];
    return getDoorsWithSearchMatches(inventoryState.doorShelfConfig, debouncedSelectedSearchQuery);
  }, [inventoryState.doorShelfConfig, debouncedSelectedSearchQuery, inventoryState.changeAllocationMode]);

  const doorsWithSelectedBins = useMemo(() => {
    if (inventoryState.selectedBinsForAssignment.length === 0 || !inventoryState.doorShelfConfig) return [];
    return getDoorsWithSelectedBins(inventoryState.doorShelfConfig, inventoryState.selectedBinsForAssignment);
  }, [inventoryState.doorShelfConfig, inventoryState.selectedBinsForAssignment]);

  // Get doors with change allocation bins (source + target bins)
  const changeAllocationBins = useMemo(() => {
    const bins = [];
    if (inventoryState.changeAllocationSourceBins?.length > 0) {
      bins.push(...inventoryState.changeAllocationSourceBins);
    }
    if (inventoryState.changeAllocationTargetBins?.length > 0) {
      bins.push(...inventoryState.changeAllocationTargetBins);
    }
    return bins;
  }, [inventoryState.changeAllocationSourceBins, inventoryState.changeAllocationTargetBins]);

  const doorsWithChangeAllocationBins = useMemo(() => {
    if (changeAllocationBins.length === 0 || !inventoryState.doorShelfConfig) return [];
    return getDoorsWithSelectedBins(inventoryState.doorShelfConfig, changeAllocationBins);
  }, [inventoryState.doorShelfConfig, changeAllocationBins]);

  const searchMatchCount = useMemo(() => {
    const trimmedQuery = debouncedSelectedSearchQuery?.trim();
    if (!trimmedQuery || !inventoryState.doorShelfConfig) return 0;
    return countSearchMatches(inventoryState.doorShelfConfig, trimmedQuery);
  }, [inventoryState.doorShelfConfig, debouncedSelectedSearchQuery]);

  const currentBin = useMemo(() => {
    if (!inventoryState.selectedBin || !inventoryState.doorShelfConfig) return null;
    return inventoryState.getCurrentBin();
  }, [inventoryState.selectedBin, inventoryState.doorShelfConfig, inventoryState.getCurrentBin]);

  const handleStationSelect = useCallback((station: string) => {
    setCurrentStation(station);
  }, []);

  const handleLogout = useCallback(() => {
    // Handle logout functionality here
    console.log("Logout clicked");
  }, []);

  // Which bin's "All Products" modal is open. Held here rather than inside BinCard
  // because opening a product from that modal renders ProductDetailPage in place of
  // the whole shelf layout — BinCard unmounts, so local state would be lost and Back
  // would land the user on the shelf page instead of the modal they came from.
  const [allProductsBinId, setAllProductsBinId] = useState<string | null>(null);

  // Which half of the allocation selection is open for review in the side panel.
  const [allocationPanel, setAllocationPanel] = useState<'source' | 'target' | null>(null);

  // Handle product click for product detail page
  const handleProductClick = useCallback((product: any, location: any) => {
    setSelectedProduct(product);
    setProductLocation(location);
    setShowProductDetail(true);
    // allProductsBinId is intentionally left alone: if the product was opened from a
    // bin's modal, that id stays set and the modal reappears when the user goes back.
  }, []);

  // Handle back from product detail page
  const handleProductDetailBack = useCallback(() => {
    setShowProductDetail(false);
    setSelectedProduct(null);
    setProductLocation(null);
  }, []);

  // CRITICAL FIX: Handle change allocation confirmation - Open quantity selection modal for all moves
  const handleChangeAllocationConfirm = useCallback((transfers: ProductTransfer[], serialNumbers?: { [transferId: string]: string[] }) => {
    if (!transfers?.length) {
      console.warn('No transfers provided to handleChangeAllocationConfirm');
      return;
    }

    try {
      // Separate allocate-only transfers (quantity = 0) from move transfers (quantity > 0)
      const allocateOnlyTransfers = transfers.filter(t => t.quantity === 0 && (t as any).actionType === 'allocate');
      const moveTransfers = transfers.filter(t => t.quantity > 0 || (t as any).actionType === 'move');
      
      console.log('🔧 Transfer Analysis:', {
        totalTransfers: transfers.length,
        allocateOnlyCount: allocateOnlyTransfers.length,
        moveTransfersCount: moveTransfers.length,
        allocateOnlyTransfers: allocateOnlyTransfers.map(t => ({
          productId: t.productId,
          toBinId: t.toBinId,
          quantity: t.quantity,
          actionType: (t as any).actionType
        })),
        moveTransfers: moveTransfers.map(t => ({
          productId: t.productId,
          toBinId: t.toBinId,
          quantity: t.quantity,
          actionType: (t as any).actionType
        }))
      });
      
      // Close the change allocation modal first
      inventoryState.setShowChangeAllocationModal(false);
      
      // If ALL transfers are allocate-only (no quantity movement), skip quantity/serial selection
      if (moveTransfers.length === 0 && allocateOnlyTransfers.length > 0) {
        console.log('🔧 All transfers are allocate-only, skipping quantity/serial selection');
        // Directly confirm the allocation without quantity/serial selection
        inventoryState.handleConfirmChangeAllocation(allocateOnlyTransfers);
        return;
      }
      
      // If there are move transfers, they need quantity/serial selection
      if (moveTransfers.length > 0) {
        console.log('🔧 Opening Quantity Selection Modal for move transfers');
        
        // Store BOTH move transfers and allocate transfers
        // We'll need to combine them after quantity/serial selection
        (window as any).allocateOnlyTransfers = allocateOnlyTransfers;
        
        // Store transfers and open quantity selection modal for move transfers only
        // New session: forget which doors were already announced as unlocked.
        setUnlockedDoors(new Set());
        // Fresh entry from the modal starts at the first product; only a target-page Back resumes on
        // a specific one, so clear any leftover resume key from an earlier back-navigation.
        setQuantityResumeProductKey(undefined);
        setPendingQuantityTransfers(moveTransfers);
        setShowQuantityModal(true);
      }
    } catch (error) {
      console.error('Error in handleChangeAllocationConfirm:', error);
    }
  }, [inventoryState]);

  // Create a bin lookup map for performance (only when doorShelfConfig changes)
  const binLookupMap = useMemo(() => {
    if (!inventoryState.doorShelfConfig) return new Map();
    
    const map = new Map();
    try {
      Object.keys(inventoryState.doorShelfConfig).forEach((doorKey) => {
        const shelves = inventoryState.doorShelfConfig[doorKey];
        if (!shelves) return;
        
        shelves.forEach((shelf) => {
          if (!shelf.bins) return;
          shelf.bins.forEach((bin) => {
            // Find which cabinet this door belongs to
            const cabinet = cabinets.find((cab) => cab.doors.includes(doorKey));
            const location = cabinet ? `${doorKey}, ${cabinet.name}` : doorKey;
            
            map.set(bin.id, {
              ...bin,
              location,
              shelfName: shelf.name,
              doorKey,
            });
          });
        });
      });
    } catch (error) {
      console.warn('Error creating bin lookup map:', error);
    }
    
    return map;
  }, [inventoryState.doorShelfConfig]);

  // The bin behind allProductsBinId, resolved for AllProductsPanel. Declared after binLookupMap
  // because it reads from it. Held here rather than in BinCard so the panel survives the product
  // detail page unmounting the shelves — Back returns the user to it.
  const allProductsBin = useMemo(
    () => (allProductsBinId ? binLookupMap.get(allProductsBinId) ?? null : null),
    [allProductsBinId, binLookupMap]
  );

  // Get individual source bins with location info for the modal
  const getSourceBins = useMemo(() => {
    if (!inventoryState.changeAllocationSourceBins?.length || binLookupMap.size === 0) return [];

    try {
      return inventoryState.changeAllocationSourceBins
        .map(binId => binLookupMap.get(binId))
        .filter(Boolean);
    } catch (error) {
      console.warn('Error creating source bins:', error);
      return [];
    }
  }, [inventoryState.changeAllocationSourceBins, binLookupMap]);

  const getTargetBins = useMemo(() => {
    // Get all target bins across any cabinet/door
    if (!inventoryState.changeAllocationSourceBins?.length || binLookupMap.size === 0 || !inventoryState.changeAllocationTargetBins?.length) return [];

    try {
      return inventoryState.changeAllocationTargetBins
        .map(binId => binLookupMap.get(binId))
        .filter(Boolean);
    } catch (error) {
      console.warn('Error finding target bins:', error);
      return [];
    }
  }, [inventoryState.changeAllocationSourceBins, inventoryState.changeAllocationTargetBins, binLookupMap]);

  // The review panel is only ever a window onto a live selection, so it closes with the thing it was
  // showing: leaving the mode, or clearing the half that was open.
  const sourceBinCount = inventoryState.changeAllocationSourceBins?.length ?? 0;
  const targetBinCount = inventoryState.changeAllocationTargetBins?.length ?? 0;

  // Distinct products already sitting in the target bins. Deduped on the same name + NDC + inventory
  // type identity the rest of the app groups by, so one drug spread across two target bins counts
  // once — matching how the source figure counts products rather than rows.
  const targetProductCount = useMemo(() => {
    const identities = new Set<string>();
    getTargetBins.forEach(bin => {
      (bin?.products ?? []).forEach((product: any) => {
        identities.add(`${product.name}|${product.ndc}|${product.inventoryType}`.toLowerCase());
      });
    });
    return identities.size;
  }, [getTargetBins]);

  // Distinct products the source selection actually puts in play, counted the same way the target
  // figure is — off the bins' contents — so a selected bin reports what's in it instead of nothing.
  // It used to count OR-groups in the highlight query, which meant a bin clicked straight off the
  // shelf contributed 0 and the bar read "1 Bin, 0 Products" over a bin holding three.
  //
  // The query still matters, per bin: a bin the search put here is only contributing the product
  // that was searched for, so counting its whole contents would overstate the move. A bin picked by
  // hand was chosen for everything in it. Deduped on the shared name + NDC + inventory type identity,
  // so one drug across three bins counts once.
  const sourceProductCount = useMemo(() => {
    const query = inventoryState.changeAllocationSourceQuery?.trim();
    const identities = new Set<string>();

    getSourceBins.forEach(bin => {
      const products = bin?.products ?? [];
      const scoped = !!query && products.some((product: any) => doesProductMatchSearch(product, query));
      products.forEach((product: any) => {
        if (scoped && !doesProductMatchSearch(product, query!)) return;
        identities.add(`${product.name}|${product.ndc}|${product.inventoryType}`.toLowerCase());
      });
    });

    return identities.size;
  }, [getSourceBins, inventoryState.changeAllocationSourceQuery]);
  useEffect(() => {
    if (!inventoryState.changeAllocationMode) {
      setAllocationPanel(null);
      return;
    }
    if (allocationPanel === 'source' && sourceBinCount === 0) setAllocationPanel(null);
    if (allocationPanel === 'target' && targetBinCount === 0) setAllocationPanel(null);
  }, [inventoryState.changeAllocationMode, allocationPanel, sourceBinCount, targetBinCount]);

  // Add loading state to prevent timeout during heavy operations
  if (!inventoryState.doorShelfConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Show Target Bin Serial Scan Page if active */}
      {showTargetBinScanPage && pendingSerialTransfers.length > 0 ? (
        <MainLayout
          showBinInventory={false}
          showUnallocatedProducts={false}
          currentBin={null}
          selectedUnallocatedProducts={[]}
          selectedBinsForAssignment={[]}
          unallocatedSearchQuery=""
          doorShelfConfig={inventoryState.doorShelfConfig}
          unallocatedProducts={inventoryState.unallocatedProducts}
          currentStation={currentStation}
          onStationClick={() => setShowStationModal(true)}
          onLogout={handleLogout}
          closeBinInventory={() => {}}
          closeUnallocatedProducts={() => {}}
          handleUnallocatedProductSelect={() => {}}
          handleUnallocatedSearchChange={() => {}}
          handleSelectAllUnallocatedProducts={() => {}}
          handleClearUnallocatedSelection={() => {}}
          handleConfirmAssignment={() => {}}
          removePadding={true}
        >
          <TargetBinSerialScanPage
            transfers={pendingSerialTransfers}
            doorShelfConfig={inventoryState.doorShelfConfig}
            unlockedDoors={unlockedDoors}
            onDoorUnlocked={handleDoorUnlocked}
            onConfirm={(transfers) => {
              // Handle serial scan confirmation
              console.log('🔧 Serial Scan Confirmation:', {
                transferCount: transfers.length,
                totalSerials: transfers.reduce((sum, t) => sum + (t.serialNumbers?.length || 0), 0),
                previousCompletedTransfers: completedTransfers.length
              });

              // Accumulate completed transfers
              const allCompletedTransfers = [...completedTransfers, ...transfers];
              setCompletedTransfers(allCompletedTransfers);

              {
                // Saving here always finishes the move now: the quantity step hands over every
                // product at once, so this page is never showing a partial batch with more queued
                // behind it. The branch that returned to the quantity step for the next product is
                // gone with the round trip it existed to drive.
                // Combine ALL completed move transfers with allocate-only transfers (if any)
                const allocateOnlyTransfers = (window as any).allocateOnlyTransfers || [];
                const allTransfers = [...allCompletedTransfers, ...allocateOnlyTransfers];
                
                console.log('🔧 Combining all transfers for history:', {
                  completedMoveTransfers: allCompletedTransfers.length,
                  allocateOnlyTransfers: allocateOnlyTransfers.length,
                  totalTransfers: allTransfers.length,
                  transferDetails: allTransfers.map(t => ({
                    productId: t.productId,
                    fromBinId: t.fromBinId,
                    toBinId: t.toBinId,
                    quantity: t.quantity,
                    serialNumbers: t.serialNumbers?.length || 0
                  }))
                });
                
                // Clean up and reset ALL state FIRST before calling handleConfirmChangeAllocation
                delete (window as any).allocateOnlyTransfers;
                setShowTargetBinScanPage(false);
                setPendingSerialTransfers([]);
                setCompletedTransfers([]);
                  setPendingQuantityTransfers([]);
                setShowQuantityModal(false);
                
                // Use setTimeout to ensure state cleanup completes before the handler runs
                setTimeout(() => {
                  console.log('🔧 State cleanup complete, calling handleConfirmChangeAllocation');
                  // Call the inventory state handler with ALL transfers
                  inventoryState.handleConfirmChangeAllocation(allTransfers);
                }, 0);
              }
            }}
            onCancel={() => {
              // Full-flow abort: reset every piece of pipeline state, not just this page's own
              // slice — otherwise leftover remaining/completed transfers from this attempt could
              // silently bleed into the next Change Allocation the user starts.
              delete (window as any).allocateOnlyTransfers;
              setShowTargetBinScanPage(false);
              setPendingSerialTransfers([]);
              setCompletedTransfers([]);
              setPendingQuantityTransfers([]);
              setUnlockedDoors(new Set());
            }}
            onBack={(productKey) => {
              // Go back to quantity selection. CRITICAL: merge the current product's transfers
              // back together with whatever other products were still pending — otherwise the
              // quantity page reopens believing this is the ONLY product in the batch, silently
              // dropping every other queued product/bin from the allocation.
              setShowTargetBinScanPage(false);
              setShowQuantityModal(true);
              setPendingQuantityTransfers(pendingSerialTransfers);
              setPendingSerialTransfers([]);
              // Land the quantity page on the product the operator was placing, not back at product 0
              // (UX-AUDIT H3-2). productKey is the identity triple carried up from the target page.
              setQuantityResumeProductKey(productKey);
            }}
          />
        </MainLayout>
      ) : showQuantityModal && pendingQuantityTransfers.length > 0 ? (
        /* Show Quantity Selection Page */
        <MainLayout
          showBinInventory={false}
          showUnallocatedProducts={false}
          currentBin={null}
          selectedUnallocatedProducts={[]}
          selectedBinsForAssignment={[]}
          unallocatedSearchQuery=""
          doorShelfConfig={inventoryState.doorShelfConfig}
          unallocatedProducts={inventoryState.unallocatedProducts}
          currentStation={currentStation}
          onStationClick={() => setShowStationModal(true)}
          onLogout={handleLogout}
          closeBinInventory={() => {}}
          closeUnallocatedProducts={() => {}}
          handleUnallocatedProductSelect={() => {}}
          handleUnallocatedSearchChange={() => {}}
          handleSelectAllUnallocatedProducts={() => {}}
          handleClearUnallocatedSelection={() => {}}
          handleConfirmAssignment={() => {}}
          removePadding={true}
        >
          <QuantitySelectionPage
            transfers={pendingQuantityTransfers}
            doorShelfConfig={inventoryState.doorShelfConfig}
            unlockedDoors={unlockedDoors}
            onDoorUnlocked={handleDoorUnlocked}
            initialProductKey={quantityResumeProductKey}
            onBack={() => {
              // One stage back to the product-selection modal (the "Review Selection" overlay on
              // step ②), distinct from onCancel's full abort below. The source and target bins live
              // in inventoryState and survive, so the modal reopens on the same selection; per-bin
              // product picks are re-chosen there. Clear the batch so the modal rebuilds it on Move Qty.
              setShowQuantityModal(false);
              setPendingQuantityTransfers([]);
              setQuantityResumeProductKey(undefined);
              inventoryState.setShowChangeAllocationModal(true);
            }}
            onConfirm={(allTransfers) => {
              // The quantity step walks every product itself and hands the whole move over in one
              // go — see its finalizeAll. It used to report one product at a time, and this handler
              // walked to the target bin for each one, so emptying a bin of four products meant four
              // source-to-target round trips over the same two doors. That is what the operator
              // experiences as switching between product and target again and again. Taking every
              // quantity at the source and carrying the lot across once matches how the work is
              // actually done — and TargetBinSerialScanPage already pages through several products,
              // so it needed no change to receive them all.
              console.log('🔧 App.tsx - Quantity step complete:', {
                transferCount: allTransfers.length,
                totalQuantity: allTransfers.reduce((sum, transfer) => sum + transfer.quantity, 0),
                products: new Set(allTransfers.map(t => (t as any).productName)).size
              });

              setPendingQuantityTransfers([]);

              // Skipping every product leaves nothing to carry, and the target page renders behind
              // `pendingSerialTransfers.length > 0` — entering it empty was a blank screen with no
              // way back. Nothing to carry means nothing to carry: close the step, selection intact.
              if (allTransfers.length === 0) {
                setShowQuantityModal(false);
                return;
              }

              setPendingSerialTransfers(allTransfers);
              setShowTargetBinScanPage(true);
              setShowQuantityModal(false);
            }}
            onCancel={() => {
              // Full-flow abort: also clear remaining/completed state so a later Change
              // Allocation attempt never inherits leftovers from this cancelled one.
              setShowQuantityModal(false);
              setPendingQuantityTransfers([]);
              setCompletedTransfers([]);
              delete (window as any).allocateOnlyTransfers;
              setUnlockedDoors(new Set());
            }}
          />
        </MainLayout>
      ) : inventoryState.showChangeAllocationModal ? (
        /* Step ③ Review — the product-selection screen, now a full page (was a modal overlay) so it
           matches the pages on either side of it. Wrapped like the Move pages: nav rail present, no
           top bar, no padding — the page supplies its own stepper header and footer. */
        <MainLayout
          showBinInventory={false}
          showUnallocatedProducts={false}
          currentBin={null}
          selectedUnallocatedProducts={[]}
          selectedBinsForAssignment={[]}
          unallocatedSearchQuery=""
          doorShelfConfig={inventoryState.doorShelfConfig}
          unallocatedProducts={inventoryState.unallocatedProducts}
          currentStation={currentStation}
          onStationClick={() => setShowStationModal(true)}
          onLogout={handleLogout}
          closeBinInventory={() => {}}
          closeUnallocatedProducts={() => {}}
          handleUnallocatedProductSelect={() => {}}
          handleUnallocatedSearchChange={() => {}}
          handleSelectAllUnallocatedProducts={() => {}}
          handleClearUnallocatedSelection={() => {}}
          handleConfirmAssignment={() => {}}
          removePadding={true}
        >
          <ChangeAllocationModal
            open={inventoryState.showChangeAllocationModal}
            onOpenChange={inventoryState.setShowChangeAllocationModal}
            sourceBins={getSourceBins}
            targetBins={getTargetBins}
            doorShelfConfig={inventoryState.doorShelfConfig}
            sourceProductQuery={inventoryState.changeAllocationSourceQuery}
            onConfirmAllocation={handleChangeAllocationConfirm}
            onCancel={inventoryState.handleExitChangeAllocation}
          />
        </MainLayout>
      ) : inventoryState.showHistoryModal ? (
        /* Dedicated full-page History (table view) */
        <HistoryPage
          history={inventoryState.allocationHistory}
          doorShelfConfig={inventoryState.doorShelfConfig}
          currentStation={currentStation}
          onStationClick={() => setShowStationModal(true)}
          onLogout={handleLogout}
          onBack={() => inventoryState.setShowHistoryModal(false)}
        />
      ) : showProductDetail && selectedProduct ? (
        /* Show product detail page if a product is selected */
        <ProductDetailPage
          product={selectedProduct}
          location={productLocation}
          doorShelfConfig={inventoryState.doorShelfConfig}
          onBack={handleProductDetailBack}
          onUnallocate={(productId, binId) => {
            console.log('🔧 App.tsx: Unallocating product', productId, 'from bin', binId);
            inventoryState.handleUnallocateProduct(productId, binId);
            // Wait for state update to complete before navigating back
            setTimeout(() => {
              handleProductDetailBack();
            }, 100);
          }}
        />
      ) : (
        <MainLayout
          showBinInventory={inventoryState.showBinInventory}
          allProductsBin={allProductsBin}
          selectedDoor={inventoryState.selectedDoor}
          searchQuery={inventoryState.selectedSearchQuery}
          onAllProductsProductClick={handleProductClick}
          closeAllProducts={() => setAllProductsBinId(null)}
          showUnallocatedProducts={inventoryState.showUnallocatedProducts}
          currentBin={currentBin}
          selectedUnallocatedProducts={inventoryState.selectedUnallocatedProducts}
          selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
          unallocatedSearchQuery={inventoryState.unallocatedSearchQuery}
          doorShelfConfig={inventoryState.doorShelfConfig}
          unallocatedProducts={inventoryState.unallocatedProducts} // CRITICAL FIX: Pass unallocated products
          currentStation={currentStation}
          onStationClick={() => setShowStationModal(true)}
          onLogout={handleLogout}
          closeBinInventory={inventoryState.closeBinInventory}
          closeUnallocatedProducts={inventoryState.closeUnallocatedProducts}
          handleUnallocatedProductSelect={inventoryState.handleUnallocatedProductSelect}
          handleUnallocatedSearchChange={inventoryState.handleUnallocatedSearchChange}
          handleSelectAllUnallocatedProducts={inventoryState.handleSelectAllUnallocatedProducts}
          handleClearUnallocatedSelection={inventoryState.handleClearUnallocatedSelection}
          handleConfirmAssignment={inventoryState.handleConfirmAssignment}
          topBar={
            <HeaderSection
              searchQuery={inventoryState.searchQuery}
              highlightAvailableBins={inventoryState.highlightAvailableBins}
              allAvailableBins={allAvailableBins}
              showUnallocatedProducts={inventoryState.showUnallocatedProducts}
              showUnallocatedButton={showUnallocatedButton}
              changeAllocationMode={inventoryState.changeAllocationMode}
              changeAllocationStep={inventoryState.changeAllocationStep}
              changeAllocationSourceBins={inventoryState.changeAllocationSourceBins}
              changeAllocationTargetBins={inventoryState.changeAllocationTargetBins}
              unallocatedProductsCount={inventoryState.unallocatedProductsCount}
              doorShelfConfig={inventoryState.doorShelfConfig}
              selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
              handleSearchQueryChange={inventoryState.handleSearchQueryChange}
              handleSearchAutofill={inventoryState.handleSearchAutofill}
              handleAvailableBinsClick={inventoryState.handleAvailableBinsClick}
              handleChangeAllocationClick={inventoryState.handleChangeAllocationClick}
              handleAllocateProductsClick={inventoryState.handleAllocateProductsClick}
              handleUnallocatedProductsClick={inventoryState.handleUnallocatedProductsClick}
              handleHistoryClick={inventoryState.handleHistoryClick}
              handleSelectBinsForAssignment={inventoryState.handleSelectBinsForAssignment}
              handleSelectSourceBinsFromSearch={inventoryState.handleSelectSourceBinsFromSearch}
              handleSelectTargetBinsFromSearch={inventoryState.handleSelectTargetBinsFromSearch}
              handleSearchProductClick={inventoryState.handleSearchProductClick}
              handleDoorClick={inventoryState.handleDoorClick}
              handleScrollToBin={setPendingScrollBinId}
            />
          }
          bottomBar={
            inventoryState.changeAllocationMode ? (
              <AllocationBottomBar
                step={inventoryState.changeAllocationStep}
                sourceBinCount={sourceBinCount}
                sourceProductCount={sourceProductCount}
                targetBinCount={targetBinCount}
                targetProductCount={targetProductCount}
                openPanel={allocationPanel}
                onOpenSource={() => setAllocationPanel(current => (current === 'source' ? null : 'source'))}
                onOpenTarget={() => setAllocationPanel(current => (current === 'target' ? null : 'target'))}
                onCancel={inventoryState.handleExitChangeAllocation}
                onBackToSource={inventoryState.handlePreviousStep}
                onNext={inventoryState.handleNextStep}
                onConfirm={inventoryState.handleOpenChangeAllocationModal}
              />
            ) : null
          }
          showAllocateProducts={inventoryState.showAllocateProducts}
          sidePanel={
            inventoryState.showAllocateProducts ? (
              <AllocateProductsPanel
                doorShelfConfig={inventoryState.doorShelfConfig}
                selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
                onConfirmAssignment={inventoryState.handleAssignProductsToBins}
                onClose={inventoryState.handleCloseAllocateProducts}
              />
            ) : allocationPanel ? (
              <AllocationSelectionPanel
                role={allocationPanel}
                bins={allocationPanel === 'source' ? getSourceBins : getTargetBins}
                sourceQuery={inventoryState.changeAllocationSourceQuery ?? ''}
                onRemoveBin={
                  allocationPanel === 'source'
                    ? inventoryState.handleRemoveSourceBin
                    : inventoryState.handleRemoveTargetBin
                }
                // Target bins hold no product-level selection — their rows are the bin's existing
                // contents, so there is nothing there to remove from the allocation.
                onRemoveProduct={
                  allocationPanel === 'source' ? inventoryState.handleRemoveSourceProduct : undefined
                }
                // Clears the half being reviewed, not the step the bar happens to be on — the panel is
                // openable from either summary, so it has to act on what it's showing.
                onRemoveAll={
                  allocationPanel === 'source'
                    ? (inventoryState.handleClearSourceBins ?? (() => {}))
                    : (inventoryState.handleClearTargetBins ?? (() => {}))
                }
                onClose={() => setAllocationPanel(null)}
              />
            ) : null
          }
        >
          {/* Pipeline spine for stages ① Source / ② Target — the two bin-selection steps live on
              this cabinet page, so the indicator reads the same step the bottom bar is on.
              The negative margins pull it out of the scroll area's p-6 so it sits flush under the
              Allocation header, edge to edge — but it stays INSIDE the scroll container, so it
              scrolls away with the cabinets rather than pinning to the top (per request: not fixed). */}
          {inventoryState.changeAllocationMode && (
            <div className="-mt-6 -mx-6 mb-6">
              <PipelineSteps current={inventoryState.changeAllocationStep} />
            </div>
          )}

          <CabinetSelection
            selectedCabinet={inventoryState.selectedCabinet}
            selectedDoor={inventoryState.selectedDoor}
            doorsWithAvailableBins={doorsWithAvailableBins}
            highlightAvailableBins={inventoryState.highlightAvailableBins}
            doorsWithSearchMatches={doorsWithSearchMatches}
            doorsWithSelectedBins={doorsWithSelectedBins}
            doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
            searchQuery={inventoryState.selectedSearchQuery}
            showUnallocatedProducts={inventoryState.showUnallocatedProducts}
            changeAllocationMode={inventoryState.changeAllocationMode}
            onCabinetClick={inventoryState.handleCabinetClick}
            onDoorClick={inventoryState.handleDoorClick}
          />

          <ShelvesSection
            allProductsBinId={allProductsBinId}
            onOpenAllProducts={setAllProductsBinId}
            onCloseAllProducts={() => setAllProductsBinId(null)}
            currentShelves={currentShelves}
            searchQuery={inventoryState.selectedSearchQuery}
            searchMatchCount={searchMatchCount}
            selectedDoor={inventoryState.selectedDoor}
            selectedBin={inventoryState.selectedBin}
            showBinInventory={inventoryState.showBinInventory}
            highlightAvailableBins={inventoryState.highlightAvailableBins}
            selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
            changeAllocationMode={inventoryState.changeAllocationMode}
            changeAllocationStep={inventoryState.changeAllocationStep}
            changeAllocationSourceBins={inventoryState.changeAllocationSourceBins}
            changeAllocationTargetBins={inventoryState.changeAllocationTargetBins}
            // This prop does exactly one thing by the time it reaches BinCard: it stops the product
            // rows inside a bin from being tappable. Both bin-picking workflows need that — while
            // you are choosing bins, a tap has to mean the bin and not something inside it — so both
            // feed it, despite the name only describing the older one.
            showUnallocatedProducts={
              inventoryState.showUnallocatedProducts || inventoryState.showAllocateProducts
            }
            onBinClick={inventoryState.handleBinClick}
            onProductClick={handleProductClick}
          />
        </MainLayout>
      )}

      {/* Add Product Dialog */}
      <ProductDialog
        open={inventoryState.showProductDialog}
        onOpenChange={inventoryState.setShowProductDialog}
        onAddProduct={inventoryState.handleAddProduct}
      />

      {/* History is now a dedicated full page (see the showHistoryModal branch above). */}

      {/* Station Selection Modal */}
      <StationSelectionModal
        open={showStationModal}
        onOpenChange={setShowStationModal}
        currentStation={currentStation}
        onStationSelect={handleStationSelect}
      />

      {/* Step ③ Review is rendered as a full page in the routing chain above (was a modal here). */}

      {/* Serial Number Modal - Required for all product moves (quantity > 0) between bins */}
      <SerialNumberModal
        open={serialNumberModal.showSerialNumberModal}
        onOpenChange={serialNumberModal.setShowSerialNumberModal}
        transfers={serialNumberModal.pendingTransfers} // Pass ALL transfers requiring serial numbers
        onConfirm={(transfers, serialNumbers) => {
          // Handle multi-transfer serial number confirmation
          console.log('🔧 Multi-Transfer Serial Confirmation:', {
            transferCount: transfers.length,
            serialNumberKeys: Object.keys(serialNumbers),
            totalSerials: Object.values(serialNumbers).flat().length
          });
          
          // CRITICAL FIX: Use ALL original transfers, not just the pending E-Kit transfers
          // This ensures that regular transfers are not discarded in mixed bin scenarios
          const allOriginalTransfers = (window as any).allOriginalTransfers || serialNumberModal.pendingTransfers;
          
          console.log('🔧 Mixed Bin Fix - App.tsx Using All Original Transfers:', {
            allOriginalTransfers: allOriginalTransfers.length,
            pendingTransfers: serialNumberModal.pendingTransfers.length,
            hasStoredOriginalTransfers: !!(window as any).allOriginalTransfers,
            mixedBinScenario: allOriginalTransfers.length > serialNumberModal.pendingTransfers.length
          });
          
          // Call the inventory state handler with ALL original transfers and their serial numbers
          inventoryState.handleConfirmChangeAllocation(
            allOriginalTransfers.map(transfer => {
              const transferId = `${transfer.productId}-${transfer.toBinId}`;
              return {
                ...transfer,
                serialNumbers: serialNumbers[transferId] || []
              };
            })
          );
          
          // Reset the serial number modal state and clean up stored transfers
          serialNumberModal.setShowSerialNumberModal(false);
          delete (window as any).allOriginalTransfers;
        }}
        onBack={() => serialNumberModal.handleSerialNumberBack(inventoryState.setShowChangeAllocationModal)}
        doorShelfConfig={inventoryState.doorShelfConfig}
        currentIndex={0} // Not used in multi-transfer mode
        totalCount={serialNumberModal.pendingTransfers.length}
      />
      
      {/* Unallocation Confirmation Modal - Shows after change allocation when products have zero quantity */}
      <UnallocateConfirmModal
        open={showUnallocateModal}
        onOpenChange={setShowUnallocateModal}
        productsToUnallocate={productsToUnallocate}
        onConfirm={(productIds, binIds) => {
          console.log('🗑️ Confirming unallocation of products:', { productIds, binIds });
          inventoryState.handleUnallocateMultipleProducts(productIds, binIds);
          setShowUnallocateModal(false);
          setProductsToUnallocate([]);
        }}
        onCancel={() => {
          console.log('🚫 User cancelled unallocation');
          inventoryState.handleClearZeroQuantityProducts();
          setShowUnallocateModal(false);
          setProductsToUnallocate([]);
        }}
      />
    </ErrorBoundary>
  );
}