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
import QuantitySelectionPage, { SkippedProduct } from "./components/QuantitySelectionPage";
import TargetBinSerialScanPage from "./components/TargetBinSerialScanPage";
import ProductDetailPage from "./components/ProductDetailPage";
import UnallocateConfirmModal from "./components/UnallocateConfirmModal";
import ErrorBoundary from "./components/ErrorBoundary";
import AllocationBottomBar from "./components/AllocationBottomBar";
import AllocationSelectionPanel from "./components/AllocationSelectionPanel";
import AllocateProductsPanel from "./components/AllocateProductsPanel";
import CancelMoveConfirmModal from "./components/CancelMoveConfirmModal";
import ZeroInventoryBanner from "./components/ZeroInventoryBanner";
import { useDebounce } from "./hooks/useDebounce";

import { useInventoryState } from "./hooks/useInventoryState";
import { useCabinetAccess } from "./hooks/useCabinetAccess";
import { useSerialNumberModal } from "./hooks/useSerialNumberModal";
import { cabinets } from "./data/cabinets";
import { doesProductMatchSearch } from "./utils/textHighlight";
import { ProductTransfer } from "./types";
import { planMoveRoute, twoPhaseWalkOrder, RouteBin } from "./utils/moveRoute";
import { isFridgeDoor } from "./utils/doorUtils";
import { productKeysForBin } from "./utils/sourcePicks";
import { productTapRefusal } from "./components/PipelineSteps";
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


  // Product detail page state
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productLocation, setProductLocation] = useState<any>(null);

  // Quantity selection modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingQuantityTransfers, setPendingQuantityTransfers] = useState<ProductTransfer[]>([]);

  // Target bin serial scan state
  const [showTargetBinScanPage, setShowTargetBinScanPage] = useState(false);
  const [pendingSerialTransfers, setPendingSerialTransfers] = useState<ProductTransfer[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<ProductTransfer[]>([]);

  // Every bin resolved to its door and storage kind — what the route planner needs to know about the
  // cabinet. Derived here rather than inside the step-④ screens so both halves order themselves against
  // one route instead of each deciding a walk of its own.
  const routeBinIndex = useMemo(() => {
    const index = new Map<string, RouteBin>();
    Object.keys(inventoryState.doorShelfConfig).forEach(doorName => {
      inventoryState.doorShelfConfig[doorName]?.forEach(shelf => {
        shelf.bins?.forEach(bin => {
          index.set(bin.id, {
            binId: bin.id,
            binName: bin.name,
            doorName,
            storage: isFridgeDoor(doorName) ? 'fridge' : 'cabinet'
          });
        });
      });
    });
    return index;
  }, [inventoryState.doorShelfConfig]);

  // The route for the move currently in step ④. Both halves are walking the same set of bins, so
  // whichever list is populated describes the same route.
  const moveRoute = useMemo(() => {
    const transfers = pendingQuantityTransfers.length > 0 ? pendingQuantityTransfers : pendingSerialTransfers;
    if (transfers.length === 0) return null;
    return planMoveRoute(transfers as any, routeBinIndex);
  }, [pendingQuantityTransfers, pendingSerialTransfers, routeBinIndex]);

  // The route flattened into the order two phases can execute — see twoPhaseWalkOrder. This is what the
  // screens sort themselves by; the route itself is what the Move Summary will eventually draw.
  const moveWalk = useMemo(
    () => (moveRoute ? twoPhaseWalkOrder(moveRoute, routeBinIndex) : null),
    [moveRoute, routeBinIndex]
  );

  // Whether the "really discard this?" prompt is open. A plain boolean: cancelling is only offered before
  // any quantity has been taken, so there is only one thing it can mean (STEP4-GUIDANCE.md §8).
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);

  // Which single cabinet door is open, shared by both halves of step ④. Replaces an accumulating set of
  // "doors already announced by a toast", which never removed anything and so believed two doors could be
  // unlocked at once — something the station cannot do (STEP4-GUIDANCE.md §1).
  const cabinetAccess = useCabinetAccess();

  // Products the quantity step was told to skip, carried across to the placement screen so its Move
  // Summary can still list them (marked) rather than silently dropping them.
  const [skippedMoveProducts, setSkippedMoveProducts] = useState<SkippedProduct[]>([]);

  /**
   * Back to the default view with nothing retained — the same end state a completed move leaves behind.
   *
   * The step-④ Cancel used to clear only the pipeline's own state, which left changeAllocationMode on
   * with the source and target bins still selected: the operator "cancelled" and landed back in step ②
   * holding the selection they had just abandoned. handleExitChangeAllocation is what actually leaves the
   * flow, so both halves have to happen.
   */
  const resetMoveFlow = useCallback(() => {
    delete (window as any).allocateOnlyTransfers;
    setShowTargetBinScanPage(false);
    setShowQuantityModal(false);
    setPendingSerialTransfers([]);
    setPendingQuantityTransfers([]);
    setCompletedTransfers([]);
    setSkippedMoveProducts([]);
    cabinetAccess.lockAll();
    inventoryState.handleExitChangeAllocation();
  }, [cabinetAccess, inventoryState.handleExitChangeAllocation]);


  // Unallocation modal state
  const [showUnallocateModal, setShowUnallocateModal] = useState(false);
  const [productsToUnallocate, setProductsToUnallocate] = useState<any[]>([]);

  // A move that empties a bin raises the banner above the cabinet, not a modal over it.
  //
  // The modal used to open the instant a move committed, which interrupted the operator at the one moment
  // they had just finished something — to ask about a decision with no deadline. A product sitting at 0
  // still holds its bin and can be unallocated whenever. So this is an acknowledgement they can act on or
  // set aside, and the modal now opens only when they ask for it.
  useEffect(() => {
    if (inventoryState.zeroQuantityProducts.length > 0) {
      setProductsToUnallocate(inventoryState.zeroQuantityProducts);
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
  // The doors a highlighted bin sits behind. Exempt from the change-allocation suppression below and
  // from the query channel entirely: this is the operator asking where a named bin is, and only one
  // door of the eight holding a "Bin 1A" is the answer. Without it Highlight All says nothing at the
  // cabinet level, which is the one level where seeing every instance at once is the point — the
  // shelves only ever show the open door.
  const doorsWithHighlightedBins = useMemo(() => {
    const binIds = inventoryState.binHighlight?.binIds;
    if (!binIds?.length || !inventoryState.doorShelfConfig) return [];
    return Object.entries(inventoryState.doorShelfConfig)
      .filter(([, shelves]) =>
        shelves.some(shelf => shelf.bins?.some(bin => binIds.includes(bin.id)))
      )
      .map(([doorName]) => doorName);
  }, [inventoryState.doorShelfConfig, inventoryState.binHighlight]);

  // CabinetComponent only tests this for truthiness — "is a search live at all", the gate on drawing a
  // door's match dot — and never matches against it. A bin highlight sets no query channel of its own,
  // so without this its doors would compute their matches and then decline to draw them.
  const cabinetSearchGateQuery =
    inventoryState.selectedSearchQuery || inventoryState.binHighlight?.query || '';

  const doorsWithSearchMatches = useMemo(() => {
    // A Bin move's source step breaks the assumption above on purpose: "Highlight in Bin" locates a
    // product without selecting anything, so "found, not yet selected" is exactly the state it
    // creates — and the door has to light up or the user can't tell which door to open to reach it.
    const isLocatorSearch =
      inventoryState.moveMode === 'bin' && inventoryState.changeAllocationStep === 1;
    const fromQuery =
      (inventoryState.changeAllocationMode && !isLocatorSearch) ||
      !debouncedSelectedSearchQuery.trim() ||
      !inventoryState.doorShelfConfig
        ? []
        : getDoorsWithSearchMatches(inventoryState.doorShelfConfig, debouncedSelectedSearchQuery);
    return [...new Set([...fromQuery, ...doorsWithHighlightedBins])];
  }, [inventoryState.doorShelfConfig, debouncedSelectedSearchQuery, inventoryState.changeAllocationMode, inventoryState.moveMode, inventoryState.changeAllocationStep, doorsWithHighlightedBins]);

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
        // New session at a locked cabinet: an open door left over from an abandoned attempt would have
        // the next one believing it already had access.
        cabinetAccess.lockAll();
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
    // A Product move counts its picks — they ARE the selection (CLAUDE.md §3). Deduped on the identity, so
    // one drug picked in three bins counts once. Counting query matches instead disagreed with the bin
    // cards' own "n Selected", because the query has no bin attached.
    const picks = inventoryState.sourceProductPicks ?? [];
    if (picks.length > 0) return new Set(picks.map(pick => pick.productKey)).size;

    // A Bin move has no picks: whole bins were chosen, so the figure is what those bins hold.
    const identities = new Set<string>();
    getSourceBins.forEach(bin => {
      (bin?.products ?? []).forEach((product: any) => {
        identities.add(`${product.name}|${product.ndc}|${product.inventoryType}`.toLowerCase());
      });
    });
    return identities.size;
  }, [getSourceBins, inventoryState.sourceProductPicks]);
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
            placeBinOrder={moveWalk?.placeBinOrder}
            skippedProducts={skippedMoveProducts}
            doorShelfConfig={inventoryState.doorShelfConfig}
            moveMode={inventoryState.moveMode}
            cabinetAccess={cabinetAccess}
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
                setSkippedMoveProducts([]);
                  setPendingQuantityTransfers([]);
                setShowQuantityModal(false);
                // The move is done, so the cabinet is closed. The old accumulating set was never reset
                // here, which did no harm while it only suppressed duplicate toasts — but an open door
                // outliving the move it was opened for is a lie about the hardware.
                cabinetAccess.lockAll();
                
                // Use setTimeout to ensure state cleanup completes before the handler runs
                setTimeout(() => {
                  console.log('🔧 State cleanup complete, calling handleConfirmChangeAllocation');
                  // Call the inventory state handler with ALL transfers
                  inventoryState.handleConfirmChangeAllocation(allTransfers);
                }, 0);
              }
            }}
            // Asks rather than acts: discarding a built selection is not something a single tap should
            // do, and by this screen the operator is also holding stock. resetMoveFlow runs only if
            // they confirm.
            onCancel={() => setCancelPromptOpen(true)}
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
            takeBinOrder={moveWalk?.takeBinOrder}
            doorShelfConfig={inventoryState.doorShelfConfig}
            cabinetAccess={cabinetAccess}
            moveMode={inventoryState.moveMode}
            onConfirm={(allTransfers, skippedProducts) => {
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
              setSkippedMoveProducts(skippedProducts);

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
            onCancel={() => setCancelPromptOpen(true)}
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
            sourceProductPicks={inventoryState.sourceProductPicks}
            moveMode={inventoryState.moveMode}
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
          // Only outside a move does a row open the product's detail page. Inside one, the panel is
          // either picking products (below) or purely a way to read a bin's full contents — and leaving
          // for a detail page mid-selection abandons the flow. BinCard's rows have always been gated
          // this way (!changeAllocationMode in isProductClickable); passing this unconditionally is what
          // let a Bin move, and a Product move's target step, fall through to navigation.
          onAllProductsProductClick={
            inventoryState.changeAllocationMode ? undefined : handleProductClick
          }
          // Same rule the shelves follow: during a Product move's source step a product row is a
          // selection, not a link. allProductsBinId is the bin the panel was opened from, so the pick
          // is scoped to that bin exactly as a tap on its card would be.
          allProductsCanPickSourceProduct={
            inventoryState.changeAllocationMode &&
            inventoryState.moveMode === 'product' &&
            inventoryState.changeAllocationStep === 1
          }
          // Scoped to the bin this panel was opened from, exactly as the bin card scopes its own rows —
          // a product picked in some other bin must not read as picked here.
          allProductsPickedProductKeys={
            allProductsBinId
              ? productKeysForBin(inventoryState.sourceProductPicks, allProductsBinId)
              : []
          }
          onAllProductsSelectSourceProduct={product => {
            if (!allProductsBinId) return;
            inventoryState.handleSelectSourceProductFromBin(allProductsBinId, product);
          }}
          // The mirror of handleBinClick's refusal, and the only place it is needed for a product row.
          // On the shelves an unclickable row lets the tap bubble to the bin card, which selects the
          // bin — the right answer in a Bin move and at either kind's target step. This panel is an
          // overlay with no card beneath it, so the same tap lands nowhere at all. Resolved here rather
          // than in the panel because App is what holds the move's mode and step.
          allProductsTapRefusal={
            inventoryState.changeAllocationMode
              ? productTapRefusal(inventoryState.changeAllocationStep, inventoryState.moveMode)
              : null
          }
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
              showAllocateProducts={inventoryState.showAllocateProducts}
              changeAllocationMode={inventoryState.changeAllocationMode}
              changeAllocationStep={inventoryState.changeAllocationStep}
              changeAllocationSourceBins={inventoryState.changeAllocationSourceBins}
              changeAllocationTargetBins={inventoryState.changeAllocationTargetBins}
              sourceProductPicks={inventoryState.sourceProductPicks}
              doorShelfConfig={inventoryState.doorShelfConfig}
              selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
              handleSearchQueryChange={inventoryState.handleSearchQueryChange}
              handleSearchAutofill={inventoryState.handleSearchAutofill}
              handleAvailableBinsClick={inventoryState.handleAvailableBinsClick}
              handleChangeAllocationClick={inventoryState.handleChangeAllocationClick}
              handleMoveBinClick={inventoryState.handleMoveBinClick}
              handleMoveProductClick={inventoryState.handleMoveProductClick}
              moveMode={inventoryState.moveMode}
              handleAllocateProductsClick={inventoryState.handleAllocateProductsClick}
              handleUnallocatedProductsClick={inventoryState.handleUnallocatedProductsClick}
              handleHistoryClick={inventoryState.handleHistoryClick}
              handleSelectBinsForAssignment={inventoryState.handleSelectBinsForAssignment}
              handleSelectSourceBinsFromSearch={inventoryState.handleSelectSourceBinsFromSearch}
              handleSelectTargetBinsFromSearch={inventoryState.handleSelectTargetBinsFromSearch}
              handleRemoveSourceProduct={inventoryState.handleRemoveSourceProduct}
              handleSelectBinFromSearch={inventoryState.handleSelectBinFromSearch}
              handleHighlightBins={inventoryState.handleHighlightBins}
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
                moveMode={inventoryState.moveMode}
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
                onSelectionChange={inventoryState.setAllocateSelectedProductKeys}
              />
            ) : allocationPanel ? (
              <AllocationSelectionPanel
                role={allocationPanel}
                moveMode={inventoryState.moveMode}
                bins={allocationPanel === 'source' ? getSourceBins : getTargetBins}
                sourceQuery={inventoryState.changeAllocationSourceQuery ?? ''}
            sourceProductPicks={inventoryState.sourceProductPicks}
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
          {/* Above the blueprint, so it reads as a note about the cabinet the operator is looking at rather
              than a system alert. Hidden while the review modal is open — the modal is the same question. */}
          {!showUnallocateModal && (
            <ZeroInventoryBanner
              productCount={productsToUnallocate.length}
              onReview={() => setShowUnallocateModal(true)}
              onDismiss={() => {
                // Clearing the hook's list too, or the effect above would re-raise the banner on the next
                // render — dismissing has to mean dismissed, not dismissed until something re-renders.
                inventoryState.handleClearZeroQuantityProducts();
                setProductsToUnallocate([]);
              }}
            />
          )}

          <CabinetSelection
            selectedCabinet={inventoryState.selectedCabinet}
            selectedDoor={inventoryState.selectedDoor}
            doorsWithAvailableBins={doorsWithAvailableBins}
            highlightAvailableBins={inventoryState.highlightAvailableBins}
            doorsWithSearchMatches={doorsWithSearchMatches}
            doorsWithSelectedBins={doorsWithSelectedBins}
            doorsWithChangeAllocationBins={doorsWithChangeAllocationBins}
            searchQuery={cabinetSearchGateQuery}
            showUnallocatedProducts={inventoryState.showUnallocatedProducts}
            changeAllocationMode={inventoryState.changeAllocationMode}
            onCabinetClick={inventoryState.handleCabinetClick}
            onDoorClick={inventoryState.handleDoorClick}
          />

          <ShelvesSection
            sourceProductPicks={inventoryState.sourceProductPicks}
            allProductsBinId={allProductsBinId}
            onOpenAllProducts={setAllProductsBinId}
            onCloseAllProducts={() => setAllProductsBinId(null)}
            currentShelves={currentShelves}
            searchQuery={inventoryState.selectedSearchQuery}
            binHighlight={inventoryState.binHighlight}
            searchMatchCount={searchMatchCount}
            selectedDoor={inventoryState.selectedDoor}
            selectedBin={inventoryState.selectedBin}
            showBinInventory={inventoryState.showBinInventory}
            highlightAvailableBins={inventoryState.highlightAvailableBins}
            selectedBinsForAssignment={inventoryState.selectedBinsForAssignment}
            changeAllocationMode={inventoryState.changeAllocationMode}
            changeAllocationStep={inventoryState.changeAllocationStep}
            moveMode={inventoryState.moveMode}
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
            onSelectSourceProduct={inventoryState.handleSelectSourceProductFromBin}
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
      <CancelMoveConfirmModal
        open={cancelPromptOpen}
        onOpenChange={setCancelPromptOpen}
        onDismiss={() => setCancelPromptOpen(false)}
        onConfirm={() => {
          setCancelPromptOpen(false);
          resetMoveFlow();
        }}
      />

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