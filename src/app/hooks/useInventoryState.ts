import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from "sonner@2.0.3";
import React from 'react';
import { CustomToast, ChangeAllocationToast, ValidationToast } from '../components/ui/sonner-1';
import { doorShelfConfig as initialDoorConfig } from '../data/doorConfigurations';
import { cabinets } from '../data/cabinets';
import { generateUnallocatedProducts } from '../data/unallocatedProducts';
import { generateSeedHistory } from '../data/seedHistory';
import { getCurrentShelves, initializeDoorConfigs, getBinLocationDetails, binMatchesSearch } from '../utils/doorUtils';
import { migrateHistoryEntriesWithSourceBin } from '../utils/historyUtils';
import { doesProductMatchSearch } from '../utils/textHighlight';
import { binTapRefusal, WRONG_UNIT_TOAST_ID } from '../components/PipelineSteps';
import {
  SourcePick,
  sourcePickKey,
  hasSourcePick,
  addSourcePicks,
  removeSourcePick,
  removeSourcePicksForProduct,
  removeSourcePicksForBin,
  binsFromSourcePicks
} from '../utils/sourcePicks';
import { BadgeFilter } from '../utils/badgeFilter';
import { filterUnallocatedProducts } from '../utils/unallocatedFilter';
import { focusPanelSearch } from '../utils/panelSearchFocus';
import { DoorShelfConfig, Bin, AllocationHistoryEntry, Product } from '../types';
import { productDataService } from '../services/ProductDataService';
import { pharmaceuticalProducts } from '../data/products';
import { eKitHistoryService } from '../services/EKitHistoryService';
import { emergencyKitService } from '../services/EmergencyKitService';

// Helper function to resolve product names consistently across the app
/**
 * One id for both allocation panels' "pick a product first" refusal, so tapping four bins in a row
 * replaces the message rather than stacking four copies of it down the screen. Same reasoning as the
 * move pipeline's WRONG_UNIT_TOAST_ID, and the same one fact: that tap cannot do what you meant.
 */
const PICK_PRODUCT_FIRST_TOAST_ID = 'pick-product-first';

const resolveProductName = (productId: string, doorShelfConfig: DoorShelfConfig): { name: string; ndc: string; badge: string; inventoryType: string; unit: string } => {
  const enhancedProduct = productDataService.enhanceProduct({ id: productId });
  
  return {
    name: enhancedProduct.name || `Product ${productId}`,
    ndc: enhancedProduct.ndc || 'Not Available',
    badge: enhancedProduct.vialType || 'Standard', // CRITICAL FIX: Use vialType for badge (SDV/MDV)
    inventoryType: enhancedProduct.inventoryType || 'Unknown', // CRITICAL FIX: Use inventoryType for inventory type (Purchased, etc.)
    unit: enhancedProduct.unit || 'vial'
  };
};

// Add one product's AND-group to a query without dropping what's already there. "|" means OR in
// this grammar, so appending widens the match instead of replacing it — picking a second product
// during change allocation has to keep the first one highlighted and in scope.
const appendQueryGroup = (previous: string, incoming: string): string => {
  const group = incoming.trim();
  if (!group) return previous;
  const groups = previous ? previous.split('|').map(part => part.trim()).filter(Boolean) : [];
  return groups.includes(group) ? previous : [...groups, group].join(' | ');
};

// appendQueryGroup's counterpart: take one product's group back out. Compared case-insensitively
// because the group is rebuilt from a product's own fields at removal time, not held onto.
const removeQueryGroup = (previous: string, outgoing: string): string => {
  const group = outgoing.trim().toLowerCase();
  if (!group) return previous;
  return (previous || '')
    .split('|')
    .map(part => part.trim())
    .filter(part => part && part.toLowerCase() !== group)
    .join(' | ');
};

// The query shape every selection path builds for a product: "name, ndc, inventory type".
const queryGroupForProduct = (product: { name?: string; ndc?: string; inventoryType?: string }): string =>
  [product.name, product.ndc, product.inventoryType].filter(Boolean).join(', ');

// A bin from anywhere in the cabinet, by id. The panel's bins span doors, so the current door's
// shelves — all handleBinClick has to work with — aren't enough to find them.
const findBinById = (binId: string, config: DoorShelfConfig): Bin | undefined => {
  for (const shelves of Object.values(config || {})) {
    for (const shelf of shelves || []) {
      const bin = (shelf.bins || []).find(candidate => candidate.id === binId);
      if (bin) return bin;
    }
  }
  return undefined;
};

// A bin in the structured shape a history entry wants. handleConfirmAssignment gets the same fields
// by splitting getBinLocationDetails' display string back apart on " - " and ", " — which only works
// while nothing in a bin, shelf or door name contains either separator. Walking the config is the
// same lookup without the round trip through prose.
const binLocationForHistory = (binId: string, config: DoorShelfConfig) => {
  for (const [doorKey, shelves] of Object.entries(config || {})) {
    for (const shelf of shelves || []) {
      const bin = (shelf.bins || []).find(candidate => candidate.id === binId);
      if (!bin) continue;
      const doorNumber = doorKey.split(' ')[1] || doorKey.replace('door-', '');
      const doorNum = parseInt(doorNumber, 10);
      // Same banding getBinLocationDetails uses: 1–4 Cabinet 1, 5–8 Cabinet 2, the fridges Cabinet 3.
      const cabinetNumber = doorNum >= 1 && doorNum <= 4 ? 1 : doorNum >= 5 && doorNum <= 8 ? 2 : 3;
      return {
        binId,
        binName: bin.name,
        shelfName: shelf.name,
        doorNumber: String(doorNumber),
        cabinetNumber: String(cabinetNumber)
      };
    }
  }
  return null;
};

// removeQueryGroup's counterpart in the other direction: drop OR-groups a specific set of bins no
// longer backs, rather than dropping one named group. Removing a BIN can just as easily orphan a
// group as removing a PRODUCT does — a bin that was the only one holding some product takes that
// product's whole group down with it — and a group nothing in binIds still matches is exactly the
// leftover state that read as "found by search" on a bin that's no longer part of the selection.
const pruneQueryToBins = (query: string, binIds: string[], config: DoorShelfConfig): string =>
  query
    .split('|')
    .map(group => group.trim())
    .filter(Boolean)
    .filter(group =>
      binIds.some(binId => {
        const bin = findBinById(binId, config);
        return bin ? binMatchesSearch(bin, group) : false;
      })
    )
    .join(' | ');

export const useInventoryState = () => {
  const [selectedCabinet, setSelectedCabinet] = useState<string>("Cabinet 1");
  const [selectedDoor, setSelectedDoor] = useState<string>("Door 1");
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedNavItem, setSelectedNavItem] = useState<string>("Allocation");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showBinInventory, setShowBinInventory] = useState(false);
  const [highlightAvailableBins, setHighlightAvailableBins] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSearchQuery, setSelectedSearchQuery] = useState<string>(""); // Only set when user selects from dropdown

  /**
   * Bins highlighted because the operator asked for THOSE BINS, held as ids rather than as a query.
   *
   * A bin-name query cannot express this. `bin.name` is only unique within its door, so "Bin 1A" names
   * eight bins in the current seed — putting it in selectedSearchQuery lit every one of them when the
   * operator had picked exactly one row out of a list that had already told them the eight apart.
   * Identity is what a bin hit selects, so identity is what the highlight has to carry.
   *
   * `query` rides along only to tell the bin card WHICH TEXT to colour in its header; it never decides
   * which bins are lit. Both list actions land here and differ only in how many ids they pass —
   * Highlight Bin sends one, Highlight All sends every match.
   */
  const [binHighlight, setBinHighlight] = useState<{ binIds: string[]; query: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showUnallocatedProducts, setShowUnallocatedProducts] = useState(false);
  const [selectedUnallocatedProducts, setSelectedUnallocatedProducts] = useState<string[]>([]);
  const [selectedBinsForAssignment, setSelectedBinsForAssignment] = useState<string[]>([]);
  // Allocate/Unallocate workflow — see handleAllocateProductsClick for why it is its own flag
  // rather than a third state of changeAllocationMode.
  const [showAllocateProducts, setShowAllocateProducts] = useState(false);
  // Identity keys (`ndc|inventoryType`) of the products currently ticked in AllocateProductsPanel.
  // The picked product objects themselves live in the panel's own state (see its own comment for
  // why), so this is the bit handleBinClick needs lifted out of it — both to gate a bin tap on a
  // product being chosen first, and to refuse a bin that already holds every ticked product.
  const [allocateSelectedProductKeys, setAllocateSelectedProductKeys] = useState<string[]>([]);
  const [unallocatedSearchQuery, setUnallocatedSearchQuery] = useState<string>("");
  // The tray's badge filter. It lives here rather than in the panel because `Select All` is a hook
  // handler and has to tick exactly what the panel lists — two copies of "what is visible" is how that
  // control comes to act on rows nobody can see.
  const [unallocatedBadgeFilter, setUnallocatedBadgeFilter] = useState<BadgeFilter>('all');
  // "Show me only what I have ticked", asked for from the footer's counter. Here for the same reason the
  // badge filter is: it changes what the tray lists, and `Select All` must act on exactly those rows.
  const [reviewUnallocatedSelection, setReviewUnallocatedSelection] = useState(false);
  const [allocationHistory, setAllocationHistory] = useState<AllocationHistoryEntry[]>(generateSeedHistory);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [changeAllocationMode, setChangeAllocationMode] = useState(false);
  // Which kind of move the user picked from the Move menu. 'bin' = choose whole bins (search only
  // locates a bin, products can't be picked); 'product' = choose products by search, bin taps are
  // off. It decides the Review perspective outright instead of the old heuristic inferring it from
  // how many bins a product happened to span. null when not in a move.
  const [moveMode, setMoveMode] = useState<'bin' | 'product' | null>(null);
  // One-shot request for the header to put the cursor in the search box, raised only when a Product
  // move is STARTED. It lives here rather than as an effect in the header because the header unmounts
  // while the Review and Move pages are up: a latch local to it would reset on remount and refocus
  // when the user stepped back. The header clears the flag as soon as it has used it, so returning to
  // the source step — from the target step or from further down the flow — never steals focus again.
  const [changeAllocationSourceBins, setChangeAllocationSourceBins] = useState<string[]>([]);
  const [changeAllocationTargetBins, setChangeAllocationTargetBins] = useState<string[]>([]);
  const [changeAllocationStep, setChangeAllocationStep] = useState<1 | 2>(1);
  const [showChangeAllocationModal, setShowChangeAllocationModal] = useState(false);
  // The product(s) the user explicitly picked from the search bar while choosing SOURCE bins.
  // Picking "Select as Source" for a product means the intent is to move THAT product, so the
  // modal narrows its source panel to these instead of listing everything sharing those bins.
  // Kept separate from selectedSearchQuery, which step 2 overwrites with the target product.
  const [changeAllocationSourceQuery, setChangeAllocationSourceQuery] = useState<string>("");

  /**
   * What a Move by Product has actually picked: (bin, product identity) pairs — see utils/sourcePicks.
   *
   * `changeAllocationSourceQuery` above is now a PROJECTION of this for highlighting, not the selection
   * itself. As the selection it could not say which bin an identity came from, so a second bin joining
   * the move silently adopted every identity already picked elsewhere: picking ALBURX from Bin 1C also
   * picked the OCTAGAM sitting there, because OCTAGAM had been picked from Bin 1B earlier.
   *
   * Empty in a Bin move, where whole bins are picked and there is no per-product scope.
   */
  const [sourceProductPicks, setSourceProductPicks] = useState<SourcePick[]>([]);
  
  // State for zero-quantity products after change allocation
  const [zeroQuantityProducts, setZeroQuantityProducts] = useState<any[]>([]);

  // Initialize door configurations
  const [doorShelfConfig, setDoorShelfConfig] = useState<DoorShelfConfig>(initializeDoorConfigs(initialDoorConfig));

  // CRITICAL FIX: Add state for unallocated products to ensure React reactivity
  const [unallocatedProducts, setUnallocatedProducts] = useState<any[]>([]);

  // Flag to track if history migration has been performed
  const [historyMigrated, setHistoryMigrated] = useState(false);

  // CRITICAL FIX: Initialize unallocated products to exclude products already assigned to bins
  // Only run this when doorShelfConfig changes AND we don't have any unallocated products yet
  useEffect(() => {
    console.log('🔄 Initializing unallocated products to exclude products already assigned to bins...');
    console.log('🔍 DoorShelfConfig available:', !!doorShelfConfig, 'Keys:', doorShelfConfig ? Object.keys(doorShelfConfig) : 'none');
    console.log('🔍 Current unallocated products count:', unallocatedProducts.length);
    
    // Only regenerate if we don't have any unallocated products yet (initial load)
    if (unallocatedProducts.length === 0) {
      const newUnallocatedProducts = generateUnallocatedProducts(doorShelfConfig);
      setUnallocatedProducts(newUnallocatedProducts);
      console.log('✅ Unallocated products initialized:', newUnallocatedProducts.length, 'products available for allocation');
    } else {
      console.log('⏭️ Skipping regeneration - unallocated products already exist');
    }
  }, [doorShelfConfig]);

  // CRITICAL FIX: Also initialize on component mount to handle page refresh
  useEffect(() => {
    console.log('🔄 Component mount - ensuring unallocated products are initialized...');
    if (doorShelfConfig && Object.keys(doorShelfConfig).length > 0) {
      // Only initialize if we don't have any unallocated products yet
      if (unallocatedProducts.length === 0) {
        const newUnallocatedProducts = generateUnallocatedProducts(doorShelfConfig);
        setUnallocatedProducts(newUnallocatedProducts);
        console.log('✅ Unallocated products initialized on mount:', newUnallocatedProducts.length, 'products available');
      } else {
        console.log('⏭️ Skipping mount initialization - unallocated products already exist');
      }
    } else {
      console.log('⏳ DoorShelfConfig not ready yet, will initialize when available');
    }
  }, []); // Run only on mount

  /**
   * An emptied selection ends the review of it.
   *
   * The exported value is ANDed with the selection's length so an empty review can never render, but
   * that alone leaves the *flag* set — and then ticking a product again silently re-enters a mode the
   * operator left several actions ago, scoping the tray to one row with no visible cause. Clearing it
   * here rather than at each place the selection can empty (untick the last row, `Unselect All`,
   * allocating everything picked, starting a move) because that list is exactly the kind that grows a
   * fourth member without this one being remembered.
   */
  useEffect(() => {
    if (selectedUnallocatedProducts.length === 0) setReviewUnallocatedSelection(false);
  }, [selectedUnallocatedProducts.length]);

  // CRITICAL FIX: One-time migration to backfill missing sourceBin information
  useEffect(() => {
    if (!historyMigrated && allocationHistory.length > 0) {
      console.log('🔄 Running one-time history migration to add missing sourceBin information...');
      
      const migratedHistory = migrateHistoryEntriesWithSourceBin(allocationHistory, doorShelfConfig);
      
      // Check if any entries were actually migrated
      const migrationsMade = migratedHistory.some((entry, index) => 
        !allocationHistory[index]?.sourceBin && entry.sourceBin
      );
      
      if (migrationsMade) {
        console.log('✅ History migration completed - sourceBin information added to existing entries');
        setAllocationHistory(migratedHistory);
      } else {
        console.log('ℹ️ No history migration needed - all entries already have proper sourceBin information');
      }
      
      setHistoryMigrated(true);
    }
  }, [allocationHistory.length, doorShelfConfig, historyMigrated]);

  const handleCabinetClick = useCallback((cabinetName: string) => {
    setSelectedCabinet(cabinetName);
  }, []);

  const handleDoorClick = useCallback((doorName: string) => {
    const cabinet = cabinets.find(cab => cab.doors.includes(doorName));
    
    if (cabinet) {
      setSelectedDoor(doorName);
      setSelectedCabinet(cabinet.name);
      setShowBinInventory(false);
      setSelectedBin(null);
    }
  }, []);

  const handleBinClick = useCallback((binId: string) => {
    const currentShelves = getCurrentShelves(selectedDoor, doorShelfConfig);
    const bin = currentShelves.flatMap(s => s.bins).find(b => b.id === binId);
    
    if (bin) {
      // If in change allocation mode
      if (changeAllocationMode) {
        if (changeAllocationStep === 1) {
          // Move › Product picks the source by searching products, not by tapping the shelves — a
          // shelf tap there has no product to scope to, so it cannot select anything. Target taps
          // (step 2) are unaffected: the target is always a bin, whichever kind of move this is.
          //
          // It says so rather than returning in silence, which is how it used to end: the operator
          // tapped a bin, nothing happened at all, and a rule working as designed was indistinguishable
          // from a dead control.
          const refusal = binTapRefusal(changeAllocationStep, moveMode);
          if (refusal) {
            toast.custom(() => React.createElement(ValidationToast, { message: refusal }), {
              id: WRONG_UNIT_TOAST_ID,
              duration: 4000
            });
            return;
          }
          // Step 1: Select multiple source bins (must contain products)
          if (!bin.available && bin.products.length > 0) {
            if (changeAllocationSourceBins.includes(binId)) {
              // Remove this bin from source selection
              setChangeAllocationSourceBins(prev => prev.filter(id => id !== binId));
            } else {
              // Add this bin to source selection
              setChangeAllocationSourceBins(prev => [...prev, binId]);
            }
            // The source query is deliberately left alone. Hand-picking a bin says something about
            // THIS bin — take everything in it — and nothing about bins that were added by searching
            // for a product; clearing the query here used to erase the product scope from those too,
            // collapsing a mixed selection into "every product in every bin". Both the review panel
            // and the modal now scope per bin (a bin that matches the query shows just that product,
            // a bin that doesn't shows all of its contents), so a mix survives as a mix.
          }
        } else if (changeAllocationStep === 2) {
          // Step 2: Select target bins (multiple allowed across any cabinet/door)
          //
          // A bin already being moved FROM cannot also be moved to — stock would leave and arrive in the
          // same place. The rule is right; the silence was not. The operator taps a bin they can see is
          // part of the move, nothing happens, and a rule working as designed is indistinguishable from a
          // dead control (UX-AUDIT H9-1) — the same reason step ①'s wrong-unit tap explains itself above.
          //
          // Worded for what they picked, not for the app's roles: in a Product move they chose products
          // and the bin came along, so it names the product end the way the footer does rather than
          // calling it a "source bin".
          if (changeAllocationSourceBins.includes(binId)) {
            const message =
              moveMode === 'product'
                ? 'This bin holds a product you are moving, so it cannot also be moved to. Pick a different bin.'
                : 'This bin is one you are moving from, so it cannot also be moved to. Pick a different bin.';
            toast.custom(() => React.createElement(ValidationToast, { message }), {
              // Shares the wrong-unit toast's id: both are "that tap cannot do what you meant", and a
              // repeated tap must replace the message rather than stack another copy of it.
              id: WRONG_UNIT_TOAST_ID,
              duration: 4000
            });
            return;
          }

          if (changeAllocationTargetBins.includes(binId)) {
            // Remove this bin from target selection
            setChangeAllocationTargetBins(prev => prev.filter(id => id !== binId));
          } else {
            // Add this bin to target selection
            setChangeAllocationTargetBins(prev => [...prev, binId]);
          }
        }
        return;
      }

      // Allocate/Unallocate: a bin tap picks where the panel's chosen products should live. It rides
      // the same selectedBinsForAssignment channel as the unallocated tray below, so the shelf
      // highlight and the clearing all come for free.
      //
      // Gated on a product being chosen first, same as the unallocated-tray branch below: a bin
      // tapped before anything is ticked has nothing to assign it to, and silently letting it
      // highlight anyway just builds a selection that Allocate can't use yet.
      if (showAllocateProducts) {
        if (allocateSelectedProductKeys.length === 0) {
          toast.custom(
            () => React.createElement(ValidationToast, {
              // Names WHERE both halves happen, because two search boxes are on screen and the old
              // "Search and select a product before choosing a bin" said which act without saying in
              // which field — the header's search is the more prominent of the two and finds products
              // as well, so it is the one an operator reaches for first, and it cannot pick anything
              // for an allocation.
              //
              // The panel is named, not pointed at: "this panel" still asks the operator to work out
              // which of the two things on screen is meant, and the toast fires at the top right,
              // nearer the panel's edge than to anything it is about. The title is the one label they
              // can check it against, so it is the label used.
              //
              // "Search for" rather than the tray's "Select": this panel lists nothing until something
              // is typed, so searching genuinely is the first act here. The tray lists its products on
              // open, where telling the operator to search for one already in front of them would be
              // an instruction to do the wrong thing.
              message:
                'Search for a product in the Multi Bin Assignment panel, then tap a bin on the left canvas.'
            }),
            { id: PICK_PRODUCT_FIRST_TOAST_ID, duration: 4000 }
          );
          // Gives that sentence somewhere to point — the panel is at the right of a screen whose left
          // half is the cabinet they were just tapping, and here the search box is literally the next
          // action, since the list is empty until it is used.
          focusPanelSearch('allocate');
          return;
        }

        const isAlreadySelected = selectedBinsForAssignment.includes(binId);
        // Refused if ANY ticked product already lives in this bin — not just if every one of them
        // does. A bin that already holds one of the two products someone is about to allocate would
        // silently drop that pairing at confirm (the same identity can't sit twice in one bin), so
        // "still fine for the other product" just meant the drop happened invisibly instead of never
        // happening. Simpler and more predictable to say the whole bin is off-limits while any
        // ticked product already sits there, so what the panel shows selected is what actually lands.
        if (!isAlreadySelected) {
          const binProductKeys = new Set(
            (bin.products || []).map((product: any) => `${product.ndc}|${product.inventoryType}`)
          );
          const hasConflict = allocateSelectedProductKeys.some(key => binProductKeys.has(key));
          if (hasConflict) {
            toast.custom(
              () => React.createElement(ValidationToast, {
                message: 'One of the selected products is already in that bin. Choose a different bin.'
              }),
              { duration: 4000 }
            );
            return;
          }
        }

        setSelectedBinsForAssignment(prev =>
          isAlreadySelected ? prev.filter(id => id !== binId) : [...prev, binId]
        );
        return;
      }

      // If in unallocated products mode, check if products are selected first
      if (showUnallocatedProducts) {
        if (selectedUnallocatedProducts.length === 0) {
          // The rule matched the panel above; the silence did not. A bin tapped before anything is
          // ticked has nothing to assign to it, and this branch simply returned — so the app's most
          // basic allocation flow was the one place where a refused tap did nothing and said nothing,
          // which is indistinguishable from a dead control (UX-AUDIT H9-1).
          //
          // "Select", not "Search for": the tray lists every unallocated product on open, so the row
          // the operator wants is already on screen. Everything after the comma is word-for-word the
          // other panel's, because the second half of the job is the same job — and the panel is named
          // by its own title for the same reason it is next door, so the sentence can be checked
          // against something on screen rather than resolved by elimination.
          toast.custom(
            () => React.createElement(ValidationToast, {
              message:
                'Select a product in the Unallocated Products panel, then tap a bin on the left canvas.'
            }),
            { id: PICK_PRODUCT_FIRST_TOAST_ID, duration: 4000 }
          );
          // Pulls the eye to the panel the sentence is about. Its search box rather than its first row
          // because focus belongs on something that takes input — and a query is how the operator gets
          // to a product that is not one of the handful in view.
          focusPanelSearch('unallocated');
          return;
        }
        
        // CRITICAL FIX: Prevent selecting E-Kit bins when selected products include non-Purchased types
        const isEKitBin = emergencyKitService.isBinInEmergencyKit(binId, doorShelfConfig as any);
        if (isEKitBin) {
          const selectedProductsData = unallocatedProducts.filter(p => selectedUnallocatedProducts.includes(p.id));
          const hasNonPurchased = selectedProductsData.some(p => (p.inventoryType || '').toLowerCase() !== 'purchased');
          if (hasNonPurchased) {
            toast.custom(() => React.createElement(ValidationToast, { message: 'Only Purchased products can be assigned to an E‑Kit bin. Deselect non‑Purchased items to select this bin.' }), { duration: 4000 });
            return; // Block selection for E-Kit until selection is compliant
          }
        }
        
        // Products are selected, allow bin selection for assignment
        if (selectedBinsForAssignment.includes(binId)) {
          // Deselect bin
          setSelectedBinsForAssignment(prev => prev.filter(id => id !== binId));
        } else {
          // Select bin for assignment
          setSelectedBinsForAssignment(prev => [...prev, binId]);
        }
        return;
      }

      // Normal bin click behavior
      setSelectedBin(binId);
    }
  }, [selectedDoor, doorShelfConfig, changeAllocationMode, moveMode, changeAllocationStep, changeAllocationSourceBins, changeAllocationTargetBins, showUnallocatedProducts, showAllocateProducts, allocateSelectedProductKeys, selectedUnallocatedProducts.length, selectedBinsForAssignment]);

  const handleAvailableSlotClick = () => {
    setShowProductDialog(true);
  };

  const handleAddProduct = () => {
    setShowProductDialog(false);
  };

  const handleNavItemClick = (itemName: string) => {
    setSelectedNavItem(itemName);
  };

  const handleAvailableBinsClick = () => {
    setHighlightAvailableBins(!highlightAvailableBins);
  };

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
    }
  };

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);

    // Emptying the box clears the highlight in EVERY mode, including a move. An empty search that
    // leaves products tinted is feedback with nothing left on screen to explain it — the user cleared
    // the box precisely to stop seeing it. Only the highlight goes: the bins stay selected and
    // changeAllocationSourceQuery keeps its product scope, so the Review still commits the same move.
    if (query.trim() === "") {
      setSelectedSearchQuery("");
      setBinHighlight(null);
      return;
    }

    // Typing a different term: view mode drops the old highlight so it can't outlive its query.
    // A move keeps it — there the highlight also marks products already committed to the selection,
    // so re-searching must not blank out what has been picked so far.
    if (query !== selectedSearchQuery && !changeAllocationMode) {
      setSelectedSearchQuery("");
    }

    // The bin highlight goes in every mode, unlike the product one. It marks bins the operator asked
    // to SEE, never bins they committed to, so there is nothing in it worth preserving across a new
    // search — and the autofill route (below) is what keeps a fresh pick from being wiped by the query
    // it just wrote into the box.
    if (binHighlight && query !== binHighlight.query) {
      setBinHighlight(null);
    }
  }, [selectedSearchQuery, changeAllocationMode, binHighlight]);

  // Autofill the search box from a dropdown pick. Deliberately NOT handleSearchQueryChange: that
  // clears the highlight whenever the typed text diverges from it, which would wipe the highlight
  // the pick just set. Here the two are meant to differ — the box shows the product's name while
  // the highlight stays scoped to its exact name + NDC + inventory type.
  const handleSearchAutofill = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // A completed transaction ends the task the search was serving, so the home page should come
  // back clean. Both channels have to go: the typed query (still sitting in the search box) and
  // the highlight-only one (still tinting the bin and product the user was working from).
  const clearProductSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedSearchQuery("");
    setBinHighlight(null);
  }, []);

  /**
   * The workflow menu's Allocate Product entry. Opens only — it was a toggle, which made sense while a
   * header button both opened and closed the tray, but that button is gone: the menu is hidden whenever
   * the tray is open, so the close half could never run again, and closing belongs to
   * closeUnallocatedProducts, which the panel's own X and Cancel already call.
   *
   * The clearing is not redundant with that close. `enterMoveMode` also drops the tray
   * (setShowUnallocatedProducts(false)) without touching its selections, so a visit abandoned by starting
   * a move leaves product ticks and tapped bins behind for the next open to inherit.
   */
  const handleUnallocatedProductsClick = () => {
    setShowUnallocatedProducts(true);
    setShowBinInventory(false);
    setSelectedBin(null);
    setSelectedUnallocatedProducts([]);
    setSelectedBinsForAssignment([]);
    // Cleared on OPEN as well as on close, unlike the search box, and for a sharper version of the same
    // reason the ticks are: a filter carried over from an abandoned visit hides products with no visible
    // cause. A stale tick at least shows itself in the footer's count; a stale `Climate` would just make
    // the tray look like it holds two products.
    setUnallocatedBadgeFilter('all');
    setReviewUnallocatedSelection(false);
  };

  const closeUnallocatedProducts = () => {
    setShowUnallocatedProducts(false);
    setSelectedUnallocatedProducts([]);
    setSelectedBinsForAssignment([]);
    setUnallocatedSearchQuery("");
    setUnallocatedBadgeFilter('all');
    setReviewUnallocatedSelection(false);
  };

  const handleUnallocatedProductSelect = (productId: string) => {
    setSelectedUnallocatedProducts(prev => {
      if (prev.includes(productId)) {
        // Remove if already selected
        const newSelection = prev.filter(id => id !== productId);
        if (newSelection.length === 0) {
          // Clear bin selection when no products are selected
          setSelectedBinsForAssignment([]);
        }
        return newSelection;
      } else {
        // Add to selection
        // CRITICAL FIX: If any selected bin is an E-Kit bin, only allow Purchased products to be selected
        const ekitSelected = selectedBinsForAssignment.some(id => emergencyKitService.isBinInEmergencyKit(id, doorShelfConfig as any));
        if (ekitSelected) {
          const product = unallocatedProducts.find(p => p.id === productId);
          const isPurchased = (product?.inventoryType || '').toLowerCase() === 'purchased';
          if (!isPurchased) {
            toast.custom(() => React.createElement(ValidationToast, { message: 'E‑Kit bins accept only Purchased products. Deselect E‑Kit bin or only select Purchased items.' }), { duration: 4000 });
            return prev; // Block selection
          }
        }
        return [...prev, productId];
      }
    });
  };

  const handleUnallocatedSearchChange = (query: string) => {
    setUnallocatedSearchQuery(query);
    // Searching is a question about the whole tray, so it leaves the review of the picks rather than
    // running inside it. Composing them would be defensible — the predicate ANDs all three — but it
    // needs a second empty state to explain a search that found nothing *within a selection*, and the
    // tray holds eight products: there is nothing in a selection of them worth searching.
    if (query.trim().length > 0) setReviewUnallocatedSelection(false);
  };

  /**
   * The footer's counter, tapped: show only the ticked products.
   *
   * The tray lists all eight by default, so unlike `AllocateProductsPanel` (where clearing the query is
   * enough — its no-query view already *is* the selection) this needs a state of its own. What it shares
   * is the promise: the control states how many products are picked, so tapping it must show that many.
   * Hence it clears the query and the badge filter on the way in — landing on a narrowed slice under a
   * `Selected products` header would read as picks that had gone missing.
   *
   * A toggle, because the tray has no other way back: in the other panel, typing returns you to the
   * search results, but here the thing you came from is the unfiltered list and no keystroke asks for it.
   *
   * Not guarded on the selection being non-empty. The control is not rendered at zero (the footer's whole
   * counter block is withheld there), and `reviewUnallocatedSelection` is ANDed with the selection's
   * length at the point of use, so unticking the last product drops back to the full tray rather than
   * leaving an empty list with no visible cause.
   */
  const handleReviewUnallocatedSelection = () => {
    setReviewUnallocatedSelection(previous => {
      const next = !previous;
      if (next) {
        setUnallocatedSearchQuery("");
        setUnallocatedBadgeFilter('all');
      }
      return next;
    });
  };

  const handleSelectAllUnallocatedProducts = () => {
    // Exactly what the panel lists — search AND badge filter, from the one shared predicate. This used
    // to re-implement the search test here, which was survivable with one condition and would not be
    // with two: a badge filter honoured by the list and not by this control would tick products that
    // are not on screen. "All" has to mean the visible list.
    const filteredProducts = filterUnallocatedProducts(
      unallocatedProducts,
      unallocatedSearchQuery,
      unallocatedBadgeFilter,
      // The review of the picks is a third narrowing and this control has to honour it too — while it is
      // on, every listed row is ticked by definition, so the checkbox reads `Unselect All` and the tap
      // clears the lot. That is the state the control is most wanted in.
      reviewUnallocatedSelection && selectedUnallocatedProducts.length > 0
        ? selectedUnallocatedProducts
        : null
    );

    // Check if all filtered products are currently selected
    const allFilteredProductsSelected = filteredProducts.length > 0 && 
      filteredProducts.every(product => selectedUnallocatedProducts.includes(product.id));

    if (allFilteredProductsSelected) {
      // Unselect all filtered products
      const filteredProductIds = filteredProducts.map(product => product.id);
      setSelectedUnallocatedProducts(prev => 
        prev.filter(id => !filteredProductIds.includes(id))
      );
      // Clear bin selection when unselecting all products
      setSelectedBinsForAssignment([]);
    } else {
      // Select all filtered products
      let selectableProducts = filteredProducts;
      // CRITICAL FIX: If an E-Kit bin is selected, restrict to Purchased products only
      const ekitSelected = selectedBinsForAssignment.some(id => emergencyKitService.isBinInEmergencyKit(id, doorShelfConfig as any));
      if (ekitSelected) {
        const originalCount = selectableProducts.length;
        selectableProducts = selectableProducts.filter(p => (p.inventoryType || '').toLowerCase() === 'purchased');
        if (selectableProducts.length === 0) {
          toast.custom(() => React.createElement(ValidationToast, { message: 'E‑Kit bins accept only Purchased products. None of the visible products meet this rule.' }), { duration: 4000 });
          return; // Nothing to add
        }
        if (selectableProducts.length < originalCount) {
          toast.custom(() => React.createElement(ValidationToast, { message: 'Only Purchased products were selected due to E‑Kit bin rule.' }), { duration: 3000 });
        }
      }

      const filteredProductIds = selectableProducts.map(product => product.id);
      setSelectedUnallocatedProducts(prev => {
        // Add only the products that aren't already selected
        const newSelections = filteredProductIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelections];
      });
    }
  };

  const handleClearUnallocatedSelection = () => {
    setSelectedUnallocatedProducts([]);
    setSelectedBinsForAssignment([]);
  };

  // Handler for selecting bins for assignment from search dropdown
  const handleSelectBinsForAssignment = useCallback((binIds: string[]) => {
    setSelectedBinsForAssignment(binIds);
  }, []);

  // Handler for selecting source bins from search dropdown
  /**
   * Records picks for every product in `binIds` matching any OR-group of `query`, and rebuilds what is
   * derived from them: the source bin list and the two query channels.
   *
   * Both source gestures funnel through here — they differ only in the bins they name. A row tap names
   * one bin; a search pick names every bin the product lives in, which is the dropdown's whole purpose
   * and the one case where selecting a product across bins is what the operator asked for.
   */
  const applySourcePicks = useCallback(
    (binIds: string[], query: string) => {
      const groups = query.split('|').map(group => group.trim()).filter(Boolean);
      if (groups.length === 0 || binIds.length === 0) return;

      const additions: SourcePick[] = [];
      binIds.forEach(binId => {
        const bin = findBinById(binId, doorShelfConfig);
        if (!bin || bin.available) return;
        (bin.products || []).forEach((product: any) => {
          // Matched per group, not against the whole query: a bin only picks up the products the
          // gesture actually named, never another group's product that happens to sit there too.
          if (groups.some(group => doesProductMatchSearch(product, group))) {
            additions.push({ binId, productKey: sourcePickKey(product) });
          }
        });
      });
      if (additions.length === 0) return;

      // Two separate calls, not one nested inside the other's updater: an updater has to be pure, and a
      // setState called from inside one is dropped or double-invoked. Because this only ever ADDS, the
      // bins it puts in play come straight from `additions` — no need to see the merged picks first.
      setSourceProductPicks(previous => addSourcePicks(previous, additions));
      const addedBins = binsFromSourcePicks(additions);
      setChangeAllocationSourceBins(bins => Array.from(new Set([...bins, ...addedBins])));

      setSelectedSearchQuery(previous => groups.reduce((acc, group) => appendQueryGroup(acc, group), previous));
      setChangeAllocationSourceQuery(previous => groups.reduce((acc, group) => appendQueryGroup(acc, group), previous));
    },
    [doorShelfConfig]
  );

  const handleSelectSourceBinsFromSearch = useCallback((binIds: string[], productName: string, highlightQuery?: string) => {
    // Filter out any bins that don't have products (only include bins with products for source)
    const validSourceBins = binIds.filter(binId => {
      // Find the bin and check if it has products
      for (const doorKey of Object.keys(doorShelfConfig || {})) {
        for (const shelf of doorShelfConfig[doorKey] || []) {
          const bin = shelf.bins?.find(b => b.id === binId);
          if (bin && !bin.available && bin.products.length > 0) {
            return true;
          }
        }
      }
      return false;
    });

    // Add valid bins to source selection (avoid duplicates)
    setChangeAllocationSourceBins(prev => {
      const newSelection = [...new Set([...prev, ...validSourceBins])];
      console.log(`Added ${validSourceBins.length} bins containing ${productName} as source bins`);
      return newSelection;
    });

    // Selecting straight from the "Select as Source" button skips the card's own onClick
    // (stopPropagation), so without this the product row never gets highlighted. Only the
    // dedicated highlight channel is set here — leaving the typed searchQuery alone means
    // the dropdown's own result list keeps showing whatever else still matches. Both channels
    // append: picking a second product adds to the selection, so replacing the query would
    // un-highlight the first product while its bins stay selected.
    // The pairs this gesture creates: the picked product(s) in EVERY bin the dropdown found them in.
    // That breadth is deliberate here, unlike a row tap — see applySourcePicks.
    if (highlightQuery) {
      applySourcePicks(validSourceBins, highlightQuery);
    }
  }, [doorShelfConfig, applySourcePicks]);

  // Handler for selecting target bins from search dropdown
  const handleSelectTargetBinsFromSearch = useCallback((binIds: string[], productName: string, highlightQuery?: string) => {
    // Filter out source bins from target selection
    const validTargetBins = binIds.filter(binId => !changeAllocationSourceBins.includes(binId));

    // Add valid bins to target selection (avoid duplicates)
    setChangeAllocationTargetBins(prev => {
      const newSelection = [...new Set([...prev, ...validTargetBins])];
      console.log(`Added ${validTargetBins.length} bins containing ${productName} as target bins`);
      return newSelection;
    });

    // Same as the source handler: append so each target pick adds to the highlight.
    if (highlightQuery) {
      setSelectedSearchQuery(prev => appendQueryGroup(prev, highlightQuery));
    }
  }, [changeAllocationSourceBins]);

  /**
   * A bin picked by NAME from the search dropdown — the bin-hit counterpart of the two handlers above.
   *
   * Deliberately NOT handleBinClick. That one resolves the bin against `getCurrentShelves(selectedDoor)`,
   * so it can only ever see the door already on screen — and the whole point of finding a bin by name is
   * that it is usually behind some other door. Changing the door first doesn't help either: setSelectedDoor
   * is async, so a handleBinClick called straight after would still be looking at the old door.
   *
   * What it does mirror is that function's change-allocation branches, rule for rule:
   *   - step 1 takes the bin whole (no source PICKS are recorded), which is what makes it hand-picked
   *     rather than scoped to a product — see isBinScopedByQuery. Routing this through
   *     applySourcePicks instead would quietly scope the bin to whatever the query matched inside it.
   *   - step 1 requires the bin to actually hold something; step 2 refuses a bin already being moved
   *     from. Both are the shelf tap's rules, and the dropdown disables the button for the same cases
   *     rather than relying on this silently declining.
   *   - both toggle, so picking a bin twice releases it exactly as a second tap does.
   *
   * **It writes to no query channel at all**, which is the whole difference between selecting and
   * highlighting. It used to append the bin's NAME to selectedSearchQuery so the card would light up —
   * and since binMatchesSearch tests bin.name, choosing one Bin 1A as Move From lit all eight of them
   * amber. A selection is not a search: the bin already says what it has become through its own blue or
   * green stroke and its Move From / Move To badge, and it needs no text query to say it.
   */
  const handleSelectBinFromSearch = useCallback((binId: string) => {
    if (!changeAllocationMode) return;

    if (changeAllocationStep === 1) {
      // Product moves pick their source by product; a bin has nothing to scope to there, so the
      // dropdown offers no Select on this row and this is belt-and-braces.
      if (moveMode === 'product') return;

      const bin = Object.values(doorShelfConfig || {})
        .flat()
        .flatMap(shelf => shelf.bins || [])
        .find(candidate => candidate.id === binId);
      if (!bin || bin.available || (bin.products?.length ?? 0) === 0) return;

      setChangeAllocationSourceBins(prev =>
        prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
      );
    } else {
      if (changeAllocationSourceBins.includes(binId)) return;
      setChangeAllocationTargetBins(prev =>
        prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
      );
    }
  }, [changeAllocationMode, changeAllocationStep, moveMode, doorShelfConfig, changeAllocationSourceBins]);

  /**
   * Light up bins found by name, without selecting them — the bin-hit counterpart of "Highlight in Bin".
   *
   * Replaces, never appends. The two actions that call this are alternatives to each other: asking for
   * one bin after asking for all of them means you want the one, and accumulating would make the
   * narrower request produce a wider result than the broader one.
   */
  const handleHighlightBins = useCallback((binIds: string[], query: string) => {
    setBinHighlight(binIds.length > 0 ? { binIds, query } : null);
  }, []);

  // Handler for clicking on a product in search dropdown (when change allocation mode is off)
  const handleSearchProductClick = useCallback((productName: string, ndc: string, inventoryType: string) => {
    // Create a specific search query with product name, NDC, and inventory type
    // This leverages the comma-separated search to highlight only this exact product variant
    const searchTerms = [productName, ndc, inventoryType].filter(term => term && term.trim().length > 0);
    const specificQuery = searchTerms.join(', ');

    // Only the highlight channel narrows to this exact product — leaving the typed
    // searchQuery untouched keeps the dropdown's own result list showing the rest of the matches.
    // In view mode this replaces the previous pick (one product is "the" selection at a time), but
    // during change allocation it appends: the highlight there also marks products already added to
    // the selection, and a preview click must not blank them out.
    setSelectedSearchQuery(prev =>
      changeAllocationMode ? appendQueryGroup(prev, specificQuery) : specificQuery
    );
    console.log(`Search query set to specific product: "${specificQuery}" for ${productName} (NDC: ${ndc}, Type: ${inventoryType})`);
  }, [changeAllocationMode]);

  // CRITICAL FIX: Function to add products back to unallocated list (for future use)
  const addProductsToUnallocated = (products: any[]) => {
    console.log('🔄 Adding products back to unallocated list:', products.map(p => p.name));
    setUnallocatedProducts(prevUnallocated => {
      const newProducts = products.map((product, index) => ({
        id: `unalloc-${Date.now()}-${index}`,
        // Recover the master id from the bin product's instance id (PROD###_...) so a
        // product that goes back to the tray and is re-allocated keeps its identity.
        masterId: product.masterId || (product.id?.match(/^(PROD\d+)/i) || [])[1],
        name: product.displayName || product.name,
        description: product.genericName || product.description,
        ndc: product.ndc,
        source: product.source,
        inventoryType: product.inventoryType,
        badge: product.vialType || product.badge
      }));
      const updatedProducts = [...prevUnallocated, ...newProducts];
      console.log('📊 Unallocated products before:', prevUnallocated.length, 'after:', updatedProducts.length);
      return updatedProducts;
    });
  };

  const handleConfirmAssignment = () => {
    if (selectedUnallocatedProducts.length > 0 && selectedBinsForAssignment.length > 0) {
      console.log('🔍 DEBUG - Selected unallocated product IDs:', selectedUnallocatedProducts);
      console.log('🔍 DEBUG - Current unallocated products:', unallocatedProducts.map(p => ({ id: p.id, name: p.name })));
      
      // Get the selected products data
      const selectedProductsData = unallocatedProducts.filter(product => 
        selectedUnallocatedProducts.includes(product.id)
      );
      
      console.log('🔍 DEBUG - Selected products data:', selectedProductsData.map(p => ({ id: p.id, name: p.name })));

      // Get bin location details for history
      const binDetailsForHistory = selectedBinsForAssignment.map(binId => {
        const location = getBinLocationDetails(binId, doorShelfConfig);
        if (location) {
          const [binName, rest] = location.split(' - ');
          const [shelfName, doorPart, cabinetPart] = rest.split(', ');
          const doorNumber = doorPart.replace('Door ', '');
          const cabinetNumber = cabinetPart.replace('Cabinet ', '');
          
          return {
            binId,
            binName,
            shelfName,
            doorNumber,
            cabinetNumber
          };
        }
        return null;
      }).filter(Boolean) as any[];

      // Create history entry with realistic starting quantities for new allocations
      const historyEntry: AllocationHistoryEntry = {
        id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        products: selectedProductsData.map(product => {
          // For new allocations, use realistic starting quantities based on product type
          const isSDV = product.badge === 'SDV';
          const baseQuantity = isSDV ? 10 : 5; // SDV gets more vials initially
          const variation = Math.floor(Math.random() * 5); // Add some variation
          const quantity = baseQuantity + variation;
          
          // Use enhanced product name resolution for consistent results
          const resolvedProduct = resolveProductName(product.id, doorShelfConfig);
          
          return {
            id: product.id,
            name: product.name || resolvedProduct.name, // CRITICAL FIX: Use display name (product.name) instead of generic name (description)
            description: product.description || resolvedProduct.genericName, // CRITICAL FIX: Store generic name for history modal display
            ndc: product.ndc || resolvedProduct.ndc,
            badge: product.badge || resolvedProduct.badge,
            inventoryType: product.inventoryType || resolvedProduct.inventoryType, // CRITICAL FIX: Include inventoryType in history
            quantity: quantity,
            unit: 'vial'
          };
        }),
        bins: binDetailsForHistory.map(bin => ({
          ...bin,
          quantity: selectedProductsData.reduce((total, product) => {
            // For new allocations, distribute quantity evenly across bins
            const isSDV = product.badge === 'SDV';
            const baseQuantity = isSDV ? 10 : 5;
            const variation = Math.floor(Math.random() * 5);
            const productQuantity = baseQuantity + variation;
            return total + Math.floor(productQuantity / selectedBinsForAssignment.length);
          }, 0)
        })),
        action: 'allocation',
        transactionType: 'New Bin Allocation'
      };

      // Add to history
      setAllocationHistory(prev => [historyEntry, ...prev]);

      // Update doorShelfConfig to add products to selected bins
      setDoorShelfConfig(prev => {
        const newConfig = { ...prev };
        
        selectedBinsForAssignment.forEach(binId => {
          // Find the bin and add products to it
          Object.keys(newConfig).forEach(doorKey => {
            newConfig[doorKey] = newConfig[doorKey].map(shelf => ({
              ...shelf,
              bins: shelf.bins.map(bin => {
                if (bin.id === binId) {
                  // Convert unallocated products to Product format and add to bin
                  const newProducts: Product[] = selectedProductsData.map(unallocProduct => {
                    // Persist the master product ID into the bin product's id, so
                    // ProductDataService can resolve it back to the catalogue.
                    //
                    // Prefer the id the tray carried through. The old lookup matched
                    // `ndc === ndc || displayName === name`, and several masters share a
                    // display name while differing by NDC — two "MESNA 1 GRAM/10 ML VIAL",
                    // two "VYLOY 100 MG VIAL". `find` returned whichever came first in the
                    // array, so a name match could win over the correct NDC match and the
                    // bin product got stamped with the WRONG master's id. Everything that
                    // resolves through that id then reported the wrong NDC, so search
                    // grouped the product under a different NDC than the bin displayed and
                    // the freshly allocated bin never matched or highlighted. It hit 3 of
                    // the 8 tray products.
                    //
                    // The fallbacks stay narrow: exact match on both fields, then NDC
                    // (unique enough to identify a product), and only then name.
                    const master = unallocProduct.masterId
                      ? pharmaceuticalProducts.find(mp => mp.id === unallocProduct.masterId)
                      : pharmaceuticalProducts.find(mp =>
                          mp.ndc === unallocProduct.ndc && mp.displayName === unallocProduct.name
                        ) ||
                        pharmaceuticalProducts.find(mp => mp.ndc === unallocProduct.ndc) ||
                        pharmaceuticalProducts.find(mp => mp.displayName === unallocProduct.name);
                    const masterId = master ? master.id : undefined;
                    const generatedId = masterId ? `${masterId}_${Date.now()}` : unallocProduct.id;
                    return {
                      id: generatedId,
                      name: unallocProduct.name,
                      ndc: unallocProduct.ndc,
                      quantity: 0, // New products start with 0 quantity
                      unit: 'vial', // Default unit
                      source: unallocProduct.source,
                      inventoryType: unallocProduct.inventoryType, // CRITICAL FIX: Use inventoryType instead of badge
                      description: unallocProduct.description
                    } as Product;
                  });
                  
                  // Prepended, not appended, and for the same reason workflow A prepends: a bin card
                  // shows only as many rows as its footprint fits and hides the rest behind "+N more",
                  // so a product added to the end of a full bin's list landed straight in the hidden
                  // remainder — the operator allocated it, watched the toast, and saw nothing change on
                  // the shelf. First in the list is where the result of the last action belongs.
                  return {
                    ...bin,
                    products: [...newProducts, ...bin.products],
                    available: false // Bin is no longer available since it has products
                  };
                }
                return bin;
              })
            }));
          });
        });
        
        return newConfig;
      });

      // CRITICAL FIX: Remove assigned products from unallocated list immediately
      console.log('🔄 Removing assigned products from unallocated list:', selectedUnallocatedProducts);
      console.log('🔍 DEBUG - Before removal, unallocated products:', unallocatedProducts.map(p => ({ id: p.id, name: p.name })));
      
      setUnallocatedProducts(prevUnallocated => {
        console.log('🔍 DEBUG - Inside setUnallocatedProducts, prevUnallocated:', prevUnallocated.map(p => ({ id: p.id, name: p.name })));
        const filteredProducts = prevUnallocated.filter(product => 
          !selectedUnallocatedProducts.includes(product.id)
        );
        console.log('🔍 DEBUG - After filtering, filteredProducts:', filteredProducts.map(p => ({ id: p.id, name: p.name })));
        console.log('📊 Unallocated products before:', prevUnallocated.length, 'after:', filteredProducts.length);
        return filteredProducts;
      });

      // Create custom toast message with product names
      const productNames = selectedProductsData.map(product => product.name);
      
      toast.custom((t) => React.createElement(CustomToast, { productNames }), {
        duration: 5000,
      });
      setSelectedUnallocatedProducts([]);
      setSelectedBinsForAssignment([]);
      clearProductSearch();
    }
  };

  const closeBinInventory = () => {
    setShowBinInventory(false);
    setSelectedBin(null);
  };

  const getCurrentBin = useCallback((): Bin | undefined => {
    const currentShelves = getCurrentShelves(selectedDoor, doorShelfConfig);
    return currentShelves.flatMap(s => s.bins).find(b => b.id === selectedBin);
  }, [selectedDoor, doorShelfConfig, selectedBin]);

  const handleHistoryClick = () => {
    setShowHistoryModal(true);
  };

  // Enter the move flow in one of its two kinds. Both share the same two-step source/target machine;
  // the kind only changes how the source is chosen and how the Review reads (see moveMode).
  const enterMoveMode = (kind: 'bin' | 'product') => {
    setMoveMode(kind);
    setChangeAllocationMode(true);
    setChangeAllocationStep(1);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    setShowBinInventory(false);
    setSelectedBin(null);
    setShowUnallocatedProducts(false);
    setSelectedSearchQuery(""); // Clear search highlighting when entering change allocation mode
    setChangeAllocationSourceQuery("");
  };
  const handleMoveBinClick = () => enterMoveMode('bin');
  const handleMoveProductClick = () => {
    enterMoveMode('product');
    // Searching is the only way to pick a source in this kind, so the box gets the cursor — once, here
    // at the start, not on every return to the source step.
  };
  // Kept for any remaining callers; defaults to the bin kind (the old catch-all behaviour).
  const handleChangeAllocationClick = () => enterMoveMode('bin');

  // The allocate/unallocate workflow. Deliberately not a third state of changeAllocationMode: that
  // machine exists to sequence two sets against each other (source bins, then target bins, with a
  // step deciding what a bin tap means). This one is one-sided — products, then the bins they should
  // live in — so it reuses the assignment channel the unallocated-products panel already drives
  // (selectedBinsForAssignment) rather than adding a third meaning to every bin tap.
  const handleAllocateProductsClick = () => {
    setShowAllocateProducts(true);
    setShowUnallocatedProducts(false);
    setShowBinInventory(false);
    setSelectedBin(null);
    setSelectedBinsForAssignment([]);
    setSelectedSearchQuery("");
    setAllocateSelectedProductKeys([]);
  };

  const handleCloseAllocateProducts = () => {
    setShowAllocateProducts(false);
    setSelectedBinsForAssignment([]);
    setSelectedSearchQuery("");
    setAllocateSelectedProductKeys([]);
  };

  // Give already-stocked products an additional bin. Kept apart from handleConfirmAssignment, which
  // resolves ids out of the unallocated tray and invents an opening quantity: here the product
  // already exists somewhere in the cabinet, so the new location copies a row that already works and
  // opens at zero. Stock arrives by moving it in — that is the other workflow's job, and the reason
  // this one never asks for a quantity.
  const handleAssignProductsToBins = (
    products: Array<{ ndc: string; inventoryType: string; name: string }>,
    binIds: string[]
  ) => {
    if (products.length === 0 || binIds.length === 0) return;

    // The app's one real business rule. The unallocated tray enforces it on the bin tap, because it
    // owns the product selection and can check it there; this workflow's selection lives in the
    // panel, so the check lands here instead — the only point that holds both halves. Refusing the
    // whole confirm rather than quietly dropping the offending pairs: a partial allocation the user
    // didn't ask for is worse than being told to fix the selection.
    const ekitBins = binIds.filter(binId =>
      emergencyKitService.isBinInEmergencyKit(binId, doorShelfConfig as any)
    );
    if (ekitBins.length > 0) {
      const disallowed = products.filter(
        product => (product.inventoryType || '').toLowerCase() !== 'purchased'
      );
      if (disallowed.length > 0) {
        toast.custom(
          () => React.createElement(ValidationToast, {
            message: 'Only Purchased products can be allocated to an E‑Kit bin. Deselect the E‑Kit bin or the non‑Purchased products.'
          }),
          { duration: 4000 }
        );
        return;
      }
    }

    // A row already in the cabinet for this identity, to copy unit/source/description from.
    const templateFor = (ndc: string, inventoryType: string): any => {
      for (const doorKey of Object.keys(doorShelfConfig)) {
        for (const shelf of doorShelfConfig[doorKey]) {
          for (const bin of shelf.bins) {
            const match = bin.products.find(
              (candidate: any) => candidate.ndc === ndc && candidate.inventoryType === inventoryType
            );
            if (match) return match;
          }
        }
      }
      return null;
    };

    // What will actually land, worked out ONCE against the current config and then used for both
    // halves — the state update and the history entry. It used to be computed inside the
    // setDoorShelfConfig updater, which made the history impossible to write honestly: the only thing
    // that escaped was a counter, so nothing outside knew *which* pairs had been skipped. Deriving it
    // twice would be worse, since the two derivations could disagree about what happened.
    //
    // It also takes a `let` counter out of a state updater. React invokes updaters twice in
    // StrictMode, so `assigned += …` was double-counting in dev; harmless only because the number was
    // never read for anything but a zero test.
    const additionsByBin = new Map<string, any[]>();
    // Per product, the bins it actually reached — the history's target list. Keyed on the identity
    // triple, the app's product identity everywhere else (§3), so two inventory types of one drug
    // stay two rows rather than folding into one.
    const landedByProduct = new Map<string, { product: typeof products[number]; rowId: string; binIds: string[] }>();
    const stamp = Date.now();

    binIds.forEach(binId => {
      const bin = findBinById(binId, doorShelfConfig);
      if (!bin) return;

      products.forEach(product => {
        // Already in this bin? Adding it again would split one product across two rows in the
        // same bin, and every count in the app would then report it twice.
        const alreadyHere = bin.products.some(
          (existing: any) =>
            existing.ndc === product.ndc && existing.inventoryType === product.inventoryType
        );
        if (alreadyHere) return;

        const template = templateFor(product.ndc, product.inventoryType);
        const masterId = template ? String(template.id).split('_')[0] : product.ndc;
        const row = {
          ...(template || {}),
          id: `${masterId}_${stamp}_${binId}`,
          name: product.name,
          ndc: product.ndc,
          inventoryType: product.inventoryType,
          quantity: 0
        };

        additionsByBin.set(binId, [...(additionsByBin.get(binId) || []), row]);

        const key = `${product.name}|${product.ndc}|${product.inventoryType}`;
        const landed = landedByProduct.get(key);
        if (landed) landed.binIds.push(binId);
        // The history row carries a real bin-row id rather than a synthetic one, so the ledger and
        // the cabinet name the same record and ProductDataService can resolve it back for the
        // generic name and vial badge.
        else landedByProduct.set(key, { product, rowId: row.id, binIds: [binId] });
      });
    });

    const assigned = Array.from(additionsByBin.values()).reduce((total, rows) => total + rows.length, 0);

    if (assigned > 0) {
      setDoorShelfConfig(prev => {
        const next = { ...prev };

        Object.keys(next).forEach(doorKey => {
          next[doorKey] = next[doorKey].map(shelf => ({
            ...shelf,
            bins: shelf.bins.map(bin => {
              const additions = additionsByBin.get(bin.id);
              if (!additions || additions.length === 0) return bin;
              // New rows go first, not last: consolidateBinProducts groups by each identity's FIRST
              // occurrence, so a product appended to the end of a bin already at its display cap
              // landed behind "+N more" with no way to tell it had actually been allocated.
              return { ...bin, products: [...additions, ...bin.products], available: false };
            })
          }));
        });

        return next;
      });

      // Multi Bin Assignment used to write nothing at all, so a product would appear in its new bin
      // with no trace of how it got there — the one workflow whose whole output is an allocation was
      // the one missing from the allocation ledger.
      //
      // It is filed exactly as the tray's allocations are ('New Bin Allocation'), because that is what
      // it is: a product gaining a location. What it must NOT copy from handleConfirmAssignment is the
      // invented opening quantity — that path makes up a plausible starting stock for a product
      // arriving from outside the cabinet, whereas this one gives an existing product another bin that
      // opens at zero. History renders no quantity line for an allocation, so a fabricated figure
      // would not even be visible; it would just be wrong in the record.
      //
      // Per-product target bins rather than one shared `bins` list: a bin that already stocked one of
      // the selected products is skipped for that product alone, so a single list would credit every
      // product with every bin and report allocations that never happened.
      const historyEntry: AllocationHistoryEntry = {
        id: `multi-bin-${stamp}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date(),
        products: Array.from(landedByProduct.values()).map(({ product, rowId, binIds: landedBinIds }) => {
          const template = templateFor(product.ndc, product.inventoryType);
          return {
            id: rowId,
            name: product.name,
            description: template?.description || '',
            ndc: product.ndc,
            badge: template?.vialType || template?.badge || '',
            inventoryType: product.inventoryType,
            quantity: 0,
            unit: template?.unit || 'vial',
            targetBins: landedBinIds
              .map(binId => binLocationForHistory(binId, doorShelfConfig))
              .filter(Boolean) as NonNullable<AllocationHistoryEntry['products'][number]['targetBins']>
          };
        }),
        // Every bin touched, for the legacy readers that fall back to this when a product carries no
        // targetBins of its own.
        bins: Array.from(additionsByBin.keys())
          .map(binId => binLocationForHistory(binId, doorShelfConfig))
          .filter(Boolean) as any[],
        action: 'allocation',
        transactionType: 'New Bin Allocation'
      };

      setAllocationHistory(prev => [historyEntry, ...prev]);
    }

    setSelectedBinsForAssignment([]);

    // The bin-tap handler already refuses a bin once every ticked product is already in it, but
    // that's checked against whatever was ticked at tap time — picking a bin, then ticking a
    // second product that bin already holds, slips past it. This is the last point that can still
    // catch it: if nothing actually got added anywhere, say so instead of claiming success.
    if (assigned === 0) {
      toast.custom(
        () => React.createElement(ValidationToast, {
          message: 'Nothing was allocated — the selected product(s) are already in the selected bin(s).'
        }),
        { duration: 4000 }
      );
      return;
    }

    // Same rich toast the unallocated-tray confirm uses (CustomToast already reads "allocated to
    // the bin(s)", which is exactly this action) rather than a plain success string of its own.
    toast.custom(
      (t) => React.createElement(CustomToast, { productNames: products.map(product => product.name) }),
      { duration: 5000 }
    );
  };

  const handleExitChangeAllocation = () => {
    setChangeAllocationMode(false);
    setSourceProductPicks([]);
    setMoveMode(null);
    setChangeAllocationStep(1);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    setShowChangeAllocationModal(false);
    setChangeAllocationSourceQuery("");
    // Both query channels, matching what a completed move does — abandoning the task leaves the search
    // serving nothing just as finishing it does, so the home page comes back clean either way. This used
    // to clear only the highlight, so the typed query stayed in the box after exiting.
    clearProductSearch();
  };

  const handleNextStep = () => {
    if (changeAllocationStep === 1 && changeAllocationSourceBins.length > 0) {
      setChangeAllocationStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (changeAllocationStep === 2) {
      setChangeAllocationStep(1);
      setChangeAllocationTargetBins([]);
    }
  };

  // Clearing the source clears its picks with it: the query and the bins are both derived from them, so
  // leaving the picks behind would have the next pick rebuild a selection the operator just emptied.
  const handleClearChangeAllocationSelection = () => {
    setChangeAllocationStep(1);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    setChangeAllocationSourceQuery("");
    setSourceProductPicks([]);
  };

  const handleClearSourceBins = () => {
    setChangeAllocationSourceBins([]);
    setChangeAllocationSourceQuery("");
    setSourceProductPicks([]);
  };

  const handleClearTargetBins = () => {
    setChangeAllocationTargetBins([]);
  };

  // Drop one bin from a selection. Separate from handleBinClick's toggle because that resolves the
  // bin from the current door's shelves — the review panel lists bins from every door, so half of
  // them would be unreachable through it.
  // Removing a bin can orphan a product exactly the way removing a product can orphan a bin: if this
  // was the only bin holding some product, that product's OR-group no longer matches anything and
  // has to go too — otherwise the query still names it, the "N products" count in the bottom bar
  // still includes it, and nothing about the bin ever having existed is left to explain why.
  // selectedSearchQuery is pruned against source bins AND target bins together, since it's a shared
  // accumulator for both — pruning it against source bins alone would strip groups a target bin
  // still needs highlighted.
  // Also drops that bin's product picks — the bin is leaving, so anything picked in it is leaving with it.
  const handleRemoveSourceBin = useCallback((binId: string) => {
    setSourceProductPicks(previous => removeSourcePicksForBin(previous, binId));
    const nextSourceBins = changeAllocationSourceBins.filter(id => id !== binId);
    setChangeAllocationSourceBins(nextSourceBins);
    setChangeAllocationSourceQuery(pruneQueryToBins(changeAllocationSourceQuery, nextSourceBins, doorShelfConfig));
    setSelectedSearchQuery(
      pruneQueryToBins(selectedSearchQuery, [...nextSourceBins, ...changeAllocationTargetBins], doorShelfConfig)
    );
  }, [changeAllocationSourceBins, changeAllocationTargetBins, changeAllocationSourceQuery, selectedSearchQuery, doorShelfConfig]);

  const handleRemoveTargetBin = useCallback((binId: string) => {
    const nextTargetBins = changeAllocationTargetBins.filter(id => id !== binId);
    setChangeAllocationTargetBins(nextTargetBins);
    setSelectedSearchQuery(
      pruneQueryToBins(selectedSearchQuery, [...changeAllocationSourceBins, ...nextTargetBins], doorShelfConfig)
    );
  }, [changeAllocationTargetBins, changeAllocationSourceBins, selectedSearchQuery, doorShelfConfig]);

  // Drop one product from the source selection. The product-level selection lives in the query, so
  // removal means taking its OR-group back out of both the source query and the highlight — and then
  // releasing any source bin left holding nothing that's still being moved. Without that a bin would
  // sit in the selection with no reason to be there, and the review panel, having nothing of the
  // query to show for it, would fall back to listing everything in it as though it were all moving.
  const handleRemoveSourceProduct = useCallback((product: { name?: string; ndc?: string; inventoryType?: string }) => {
    const group = queryGroupForProduct(product);
    if (!group) return;

    const nextQuery = removeQueryGroup(changeAllocationSourceQuery, group);
    setChangeAllocationSourceQuery(nextQuery);
    setSelectedSearchQuery(previous => removeQueryGroup(previous, group));

    // Only prune if this removal actually changed the query — that's the one signal that tells
    // apart "this product really was tracked" from "bins picked by hand happen to hold it too,
    // and the click was a no-op." Gating on nextQuery being non-empty instead (an earlier version
    // of this) got exactly the one case that matters backwards: removing the LAST tracked product
    // empties the query, which is precisely when every bin it was scoping loses its only reason to
    // be selected — and binMatchesSearch already returns false for an empty query, so pruning
    // against it correctly clears them all rather than leaving them stranded.
    if (nextQuery !== changeAllocationSourceQuery) {
      setChangeAllocationSourceBins(bins =>
        bins.filter(binId => {
          const bin = findBinById(binId, doorShelfConfig);
          return bin ? binMatchesSearch(bin, nextQuery) : false;
        })
      );
    }

    // The picks are the selection, so they have to go too — removing a product here means everywhere,
    // which is the difference between this and un-tapping it in one bin.
    setSourceProductPicks(previous => removeSourcePicksForProduct(previous, sourcePickKey(product)));
  }, [changeAllocationSourceQuery, doorShelfConfig]);

  /**
   * Picking a product off a shelf in a Product move — and un-picking it.
   *
   * A tap names THAT product in THAT bin: one pair. Unlike the search dropdown, which names every bin the
   * product lives in, a specific row names a specific place, so widening it would gather stock the
   * operator never pointed at.
   *
   * Tapping a picked product un-picks it — the same toggle a bin tap has in a Bin move. Un-picking is
   * per bin, so taking a product off one bin leaves it picked in the others, which matters for a product
   * that arrived via the search dropdown across several bins.
   */
  const handleSelectSourceProductFromBin = useCallback(
    (binId: string, product: any) => {
      const productKey = sourcePickKey(product);
      const group = queryGroupForProduct(product);
      if (!group) return;

      if (hasSourcePick(sourceProductPicks, binId, productKey)) {
        const next = removeSourcePick(sourceProductPicks, binId, productKey);
        setSourceProductPicks(next);

        // A bin with nothing left picked in it loses its only reason to be in the selection — otherwise
        // it sits there and Review, having no scope to show for it, lists everything in it as though it
        // were all moving.
        const remainingBins = binsFromSourcePicks(next);
        setChangeAllocationSourceBins(bins => bins.filter(id => remainingBins.includes(id)));

        // The query is a projection of the picks, so it drops a group only when no bin still picks it.
        if (!next.some(pick => pick.productKey === productKey)) {
          setChangeAllocationSourceQuery(previous => removeQueryGroup(previous, group));
          setSelectedSearchQuery(previous => removeQueryGroup(previous, group));
        }
        return;
      }

      applySourcePicks([binId], group);
    },
    [sourceProductPicks, applySourcePicks]
  );

  const handleOpenChangeAllocationModal = () => {
    if (changeAllocationSourceBins.length > 0 && changeAllocationTargetBins.length > 0) {
      setShowChangeAllocationModal(true);
    }
  };

  // Builds a history entry for a product removed from a bin (0-qty unallocation),
  // using the doorShelfConfig snapshot from BEFORE the removal so the bin/product info
  // is still there to capture.
  const buildUnallocateHistoryEntry = (
    productId: string,
    binId: string,
    configBeforeRemoval: DoorShelfConfig
  ): AllocationHistoryEntry | null => {
    const location = getBinLocationDetails(binId, configBeforeRemoval);
    if (!location) return null;

    let removedProduct: any = null;
    Object.values(configBeforeRemoval).forEach(shelves => {
      shelves.forEach(shelf => {
        shelf.bins.forEach(bin => {
          if (bin.id === binId) {
            const found = bin.products.find(p => p.id === productId);
            if (found) removedProduct = found;
          }
        });
      });
    });
    if (!removedProduct) return null;

    const [binName, rest] = location.split(' - ');
    const [shelfName, doorPart, cabinetPart] = rest.split(', ');
    const doorNumber = doorPart.replace('Door ', '');
    const cabinetNumber = cabinetPart.replace('Cabinet ', '');

    return {
      id: `unallocate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      products: [{
        id: removedProduct.id,
        name: removedProduct.name,
        description: removedProduct.description,
        ndc: removedProduct.ndc,
        badge: removedProduct.inventoryType,
        inventoryType: removedProduct.inventoryType,
        quantity: 0,
        unit: removedProduct.unit || 'vial'
      } as any],
      bins: [],
      sourceBin: { binId, binName, shelfName, doorNumber, cabinetNumber },
      action: 'unallocate',
      transactionType: 'Unallocated'
    };
  };

  // Unallocation handler - removes product from bin
  const handleUnallocateProduct = (productId: string, binId: string) => {
    console.log(`🗑️ Unallocating product ${productId} from bin ${binId}`);

    const historyEntry = buildUnallocateHistoryEntry(productId, binId, doorShelfConfig);

    setDoorShelfConfig(prev => {
      // Create a deep copy with proper immutability
      const newConfig = Object.keys(prev).reduce((acc, doorKey) => {
        acc[doorKey] = prev[doorKey].map(shelf => ({
          ...shelf,
          bins: shelf.bins.map(bin => {
            if (bin.id === binId) {
              // Remove the product from this bin
              const updatedProducts = bin.products.filter(p => p.id !== productId);
              
              console.log(`🗑️ Bin ${binId} before:`, bin.products.length, 'products');
              console.log(`🗑️ Bin ${binId} after:`, updatedProducts.length, 'products');
              
              return {
                ...bin,
                products: updatedProducts,
                available: updatedProducts.length === 0
              };
            }
            return bin;
          })
        }));
        return acc;
      }, {} as typeof prev);
      
      return newConfig;
    });

    if (historyEntry) {
      setAllocationHistory(prev => [historyEntry, ...prev]);
    }

    toast.success('Product unallocated from bin successfully');
  };

  // Handler to clear zero-quantity products
  const handleClearZeroQuantityProducts = () => {
    setZeroQuantityProducts([]);
  };

  // Handler to unallocate multiple products at once (for zero-quantity modal)
  const handleUnallocateMultipleProducts = (productIds: string[], binIds: string[]) => {
    console.log('🗑️ Unallocating multiple products:', { productIds, binIds });

    const historyEntries = productIds
      .map((productId, index) => buildUnallocateHistoryEntry(productId, binIds[index], doorShelfConfig))
      .filter(Boolean) as AllocationHistoryEntry[];

    setDoorShelfConfig(prev => {
      // Create a deep copy with proper immutability
      const newConfig = Object.keys(prev).reduce((acc, doorKey) => {
        acc[doorKey] = prev[doorKey].map(shelf => ({
          ...shelf,
          bins: shelf.bins.map(bin => {
            // Check if this bin has any products to unallocate
            const productIndices = productIds.reduce((indices, productId, index) => {
              if (binIds[index] === bin.id) {
                indices.push(index);
              }
              return indices;
            }, [] as number[]);
            
            if (productIndices.length > 0) {
              // Get the product IDs to remove from this bin
              const productsToRemove = productIndices.map(i => productIds[i]);
              const updatedProducts = bin.products.filter(p => !productsToRemove.includes(p.id));
              
              console.log(`🗑️ Bin ${bin.id} (${bin.name}):`, {
                before: bin.products.length,
                after: updatedProducts.length,
                removed: productsToRemove
              });
              
              return {
                ...bin,
                products: updatedProducts,
                available: updatedProducts.length === 0
              };
            }
            return bin;
          })
        }));
        return acc;
      }, {} as typeof prev);
      
      return newConfig;
    });

    if (historyEntries.length > 0) {
      setAllocationHistory(prev => [...historyEntries, ...prev]);
    }

    // Clear the zero-quantity products state
    setZeroQuantityProducts([]);

    toast.success(`${productIds.length} product${productIds.length !== 1 ? 's' : ''} unallocated successfully`);
  };

  // FIXED: Complete E-Kit dual activity recording implementation
  const handleConfirmChangeAllocation = (transfers: any[]) => {
    // CRITICAL FIX: Capture existing quantities BEFORE updating doorShelfConfig
    // This ensures we get the actual existing quantities before the move
    const existingQuantitiesMap = new Map<string, number>();
    
    transfers.forEach(transfer => {
      const key = `${transfer.productId}-${transfer.toBinId}`;
      if (!existingQuantitiesMap.has(key)) {
        let foundExistingQuantity = 0;
        let foundBin = false;
        
        // Find the target bin and get existing product quantity BEFORE the move
        Object.keys(doorShelfConfig).forEach(doorKey => {
          doorShelfConfig[doorKey].forEach(shelf => {
            const targetBin = shelf.bins.find(bin => bin.id === transfer.toBinId);
            if (targetBin) {
              foundBin = true;
              if (targetBin.products && targetBin.products.length > 0) {
                // Try to find the product by ID first
                let existingProduct = targetBin.products.find(p => p.id === transfer.productId);
                
                // If not found by ID, try to find by name and other properties
                if (!existingProduct) {
                  // Get the source product to match by name/NDC
                  const sourceBin = Object.keys(doorShelfConfig).reduce((found, doorKey) => {
                    if (found) return found;
                    return doorShelfConfig[doorKey].reduce((foundShelf, shelf) => {
                      if (foundShelf) return foundShelf;
                      return shelf.bins.find(bin => bin.id === transfer.fromBinId);
                    }, null);
                  }, null);
                  
                  if (sourceBin && sourceBin.products) {
                    const sourceProduct = sourceBin.products.find(p => p.id === transfer.productId);
                    if (sourceProduct) {
                      // Try to find matching product in target bin by name and NDC
                      existingProduct = targetBin.products.find(p => 
                        p.name === sourceProduct.name && 
                        p.ndc === sourceProduct.ndc &&
                        p.inventoryType === sourceProduct.inventoryType
                      );
                    }
                  }
                }
                
                if (existingProduct && typeof existingProduct.quantity === 'number') {
                  foundExistingQuantity = existingProduct.quantity;
                }
              }
            }
          });
        });
        
        existingQuantitiesMap.set(key, foundExistingQuantity);
        
        // Enhanced debug logging for each transfer
        console.log('🔍 Existing Quantity Capture for Transfer:', {
          transferKey: key,
          productId: transfer.productId,
          fromBinId: transfer.fromBinId,
          toBinId: transfer.toBinId,
          foundBin,
          foundExistingQuantity,
          binFound: foundBin,
          targetBinProducts: foundBin ? Object.keys(doorShelfConfig).reduce((products, doorKey) => {
            const targetBin = doorShelfConfig[doorKey].reduce((found, shelf) => {
              return found || shelf.bins.find(bin => bin.id === transfer.toBinId);
            }, null);
            return targetBin ? targetBin.products.map(p => ({ id: p.id, name: p.name, quantity: p.quantity })) : products;
          }, []) : []
        });
      }
    });

    // Debug logging to verify existing quantities are captured correctly
    console.log('🔍 Captured Existing Quantities Before Move:', {
      totalTransfers: transfers.length,
      existingQuantitiesMap: Array.from(existingQuantitiesMap.entries()).map(([key, qty]) => ({
        key,
        existingQuantity: qty
      })),
      doorShelfConfigSummary: Object.keys(doorShelfConfig).map(doorKey => ({
        door: doorKey,
        totalBins: doorShelfConfig[doorKey].reduce((total, shelf) => total + shelf.bins.length, 0),
        binsWithProducts: doorShelfConfig[doorKey].reduce((total, shelf) => 
          total + shelf.bins.filter(bin => bin.products && bin.products.length > 0).length, 0
        )
      }))
    });

    // Update doorShelfConfig to reflect the transfers
    setDoorShelfConfig(prev => {
      const newConfig = { ...prev };
      
      transfers.forEach(transfer => {
        // Find source and target bins
        Object.keys(newConfig).forEach(doorKey => {
          newConfig[doorKey] = newConfig[doorKey].map(shelf => ({
            ...shelf,
            bins: shelf.bins.map(bin => {
              if (bin.id === transfer.fromBinId) {
                // Remove quantity from source bin
                const updatedProducts = bin.products.map(product => {
                  if (product.id === transfer.productId) {
                    const newQuantity = product.quantity - transfer.quantity;
                    return { ...product, quantity: newQuantity };
                  }
                  return product;
                });
                
                return {
                  ...bin,
                  products: updatedProducts,
                  available: updatedProducts.length === 0
                };
              } else if (bin.id === transfer.toBinId) {
                // Add quantity to target bin
                let sourceProduct = null;
                Object.keys(prev).forEach(doorKey => {
                  prev[doorKey].forEach(shelf => {
                    shelf.bins.forEach(sourceBin => {
                      if (sourceBin.id === transfer.fromBinId) {
                        const foundProduct = sourceBin.products.find(p => p.id === transfer.productId);
                        if (foundProduct) {
                          sourceProduct = foundProduct;
                        }
                      }
                    });
                  });
                });
                
                if (sourceProduct) {
                  const existingProductIndex = bin.products.findIndex(p => 
                    p.name === sourceProduct.name && 
                    p.ndc === sourceProduct.ndc && 
                    p.inventoryType === sourceProduct.inventoryType
                  );
                  
                  if (existingProductIndex >= 0) {
                    const updatedProducts = [...bin.products];
                    updatedProducts[existingProductIndex] = {
                      ...updatedProducts[existingProductIndex],
                      quantity: updatedProducts[existingProductIndex].quantity + transfer.quantity
                    };
                    return {
                      ...bin,
                      products: updatedProducts,
                      available: false
                    };
                  } else {
                    const newProduct = {
                      ...sourceProduct,
                      quantity: transfer.quantity
                    };
                    // Front of the list, as in the two allocate paths: stock arriving in a bin is the
                    // result of the operator's last action, and appending it to a full bin buried it
                    // behind "+N more".
                    return {
                      ...bin,
                      products: [newProduct, ...bin.products],
                      available: false
                    };
                  }
                }
              }
              return bin;
            })
          }));
        });
      });
      
      return newConfig;
    });

    // CRITICAL FIX: Use E-Kit History Service for separate activity recording
    // Separate transfers into E-Kit and regular transfers
    const { eKitTransfers, regularTransfers } = eKitHistoryService.separateEKitTransfers(transfers, doorShelfConfig);
    
    // Debug logging for E-Kit transactions
    if (eKitTransfers.length > 0) {
      console.log('🎯 E-Kit Transaction Detected:', {
        totalTransfers: transfers.length,
        eKitTransfers: eKitTransfers.length,
        regularTransfers: regularTransfers.length
      });
      
      // Run debug analysis
      eKitHistoryService.debugEKitTransaction(transfers, doorShelfConfig);
    }
    
    // Extract serial numbers if provided
    const serialNumbersMap = transfers.reduce((acc, transfer) => {
      const transferId = `${transfer.productId}-${transfer.toBinId}`;
      if (transfer.serialNumbers) {
        acc[transferId] = transfer.serialNumbers;
      }
      return acc;
    }, {} as { [transferId: string]: string[] });

    // CRITICAL FIX: Group transfers by product to prevent duplicate history entries
    // This ensures that when a product is moved to multiple bins, it creates a single history entry
    // with all target bins rather than separate entries for each bin
    const groupedEKitTransfers = eKitTransfers.reduce((acc, transfer) => {
      const key = transfer.productId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(transfer);
      return acc;
    }, {} as { [productId: string]: any[] });

    const groupedRegularTransfers = regularTransfers.reduce((acc, transfer) => {
      const key = transfer.productId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(transfer);
      return acc;
    }, {} as { [productId: string]: any[] });

    // Create E-Kit history entries (handles dual activity recording automatically)
    // Process each product group separately to avoid duplicate entries
    const eKitHistoryEntries: any[] = [];
    Object.values(groupedEKitTransfers).forEach(productTransfers => {
      // Use the actual source bin ID from the transfer
      const sourceBinId = productTransfers[0]?.fromBinId || changeAllocationSourceBins[0] || null;
      const productEntries = eKitHistoryService.createEKitHistoryEntries(
        productTransfers,
        sourceBinId,
        doorShelfConfig,
        Object.keys(serialNumbersMap).length > 0 ? serialNumbersMap : undefined,
        existingQuantitiesMap
      );
      eKitHistoryEntries.push(...productEntries);
    });

    // Debug logging for created E-Kit entries
    if (eKitHistoryEntries.length > 0) {
      console.log('✅ E-Kit History Entries Created:', eKitHistoryEntries.length);
    }

    // Process regular transfers using existing logic (for non-E-Kit transfers)
    // Group by product to create single history entries per product
    //
    // Classify by actionType, not quantity. This used to be `t.quantity === 0` for allocationTransfers,
    // which was fine while a 0-quantity transfer only ever meant "Allocate only" (actionType: 'allocate',
    // now unreachable — see CLAUDE.md §7). It broke the moment a real move could legitimately end at
    // quantity 0 too: a product already at 0 in its source bin, relocated to a target bin. That transfer
    // still carries actionType: 'move' from ChangeAllocationModal, but the old check filed it as a new
    // allocation instead — wrong transactionType, and no "Product moved" entry for a move that happened.
    const moveTransfers = regularTransfers.filter(t => t.actionType !== 'allocate');
    const allocationTransfers = regularTransfers.filter(t => t.actionType === 'allocate');
    
    // CRITICAL FIX: Get source bin from anywhere in the doorShelfConfig (not just current door)
    // This fixes the cross-door move issue where source bin wasn't found
    let sourceBin = null;
    let sourceBinDoor = null;
    const sourceSourceBinId = changeAllocationSourceBins.length > 0 ? changeAllocationSourceBins[0] : null;
    if (sourceSourceBinId) {
      console.log('🔍 Searching for source bin:', sourceSourceBinId);
      // Search across ALL doors and cabinets for the source bin
      Object.keys(doorShelfConfig).forEach(doorKey => {
        doorShelfConfig[doorKey].forEach(shelf => {
          const foundBin = shelf.bins.find(bin => bin.id === sourceSourceBinId);
          if (foundBin && !sourceBin) {
            sourceBin = foundBin;
            sourceBinDoor = doorKey;
            console.log('✅ Source bin found:', {
              binId: foundBin.id,
              binName: foundBin.name,
              doorKey,
              shelfName: shelf.name,
              hasProducts: foundBin.products.length > 0
            });
          }
        });
      });
      
      if (!sourceBin) {
        console.error('❌ Source bin not found in any door:', {
          searchedBinId: sourceSourceBinId,
          availableDoors: Object.keys(doorShelfConfig),
          totalBinsSearched: Object.values(doorShelfConfig).reduce((total, shelves) => 
            total + shelves.reduce((shelfTotal, shelf) => shelfTotal + shelf.bins.length, 0), 0
          )
        });
      }
    }
    
    // Create history entries for regular transfers
    const historyEntries: AllocationHistoryEntry[] = [];
    
    // CRITICAL FIX: Group regular transfers by product to prevent duplicate history entries
    const groupedMoveTransfers = moveTransfers.reduce((acc, transfer) => {
      const key = transfer.productId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(transfer);
      return acc;
    }, {} as { [productId: string]: any[] });

    const groupedAllocationTransfers = allocationTransfers.reduce((acc, transfer) => {
      const key = transfer.productId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(transfer);
      return acc;
    }, {} as { [productId: string]: any[] });
    
    // Create history entry for regular moves (if any)
    if (Object.keys(groupedMoveTransfers).length > 0) {
      // Process each product group to create consolidated history entries
      Object.entries(groupedMoveTransfers).forEach(([productId, productTransfers]) => {
        // CRITICAL FIX: Get source bin details for THIS specific product
        // Different products may come from different source bins!
        let sourceBinDetails = null;
        const firstTransfer = productTransfers[0]; // Get first transfer to find source bin
        
        if (firstTransfer && firstTransfer.fromBinId) {
          const sourceLocation = getBinLocationDetails(firstTransfer.fromBinId, doorShelfConfig);
          if (sourceLocation) {
            const [binName, rest] = sourceLocation.split(' - ');
            const [shelfName, doorPart, cabinetPart] = rest.split(', ');
            const doorNumber = doorPart.replace('Door ', '');
            const cabinetNumber = cabinetPart.replace('Cabinet ', '');

            // Quantity moved out of the source, and what it had before the move — captured
            // now while `doorShelfConfig` still reflects pre-move state, so the Source column
            // can show "-N → remaining" the same way Target shows "+N → resulting".
            const movedQty = productTransfers.reduce((sum, t) => sum + (t.quantity || 0), 0);
            let beforeQty = 0;
            Object.values(doorShelfConfig).forEach(shelves => {
              shelves.forEach(shelf => {
                shelf.bins.forEach(bin => {
                  if (bin.id === firstTransfer.fromBinId) {
                    const sourceProduct = bin.products.find(p => p.id === productId);
                    if (sourceProduct) beforeQty = sourceProduct.quantity;
                  }
                });
              });
            });

            sourceBinDetails = {
              binId: firstTransfer.fromBinId,
              binName,
              shelfName,
              doorNumber,
              cabinetNumber,
              quantity: movedQty,
              remainingQuantity: Math.max(0, beforeQty - movedQty)
            };
            
            console.log('🔧 Source Bin Captured for Product:', {
              productId,
              sourceBinId: firstTransfer.fromBinId,
              sourceBinName: binName,
              sourceDoor: doorNumber,
              sourceCabinet: cabinetNumber,
              sourceShelf: shelfName,
              totalTransfers: productTransfers.length
            });
          } else {
            console.warn('⚠️ Could not get source location details for bin:', firstTransfer.fromBinId);
          }
        } else {
          console.warn('⚠️ No fromBinId found for product:', productId);
        }

        const moveEntry: AllocationHistoryEntry = {
          id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          products: [{
            id: productId,
            name: sourceBin?.products.find(p => p.id === productId)?.name || resolveProductName(productId, doorShelfConfig).name,
            description: sourceBin?.products.find(p => p.id === productId)?.description || resolveProductName(productId, doorShelfConfig).genericName, // CRITICAL FIX: Store generic name for history modal display
            ndc: sourceBin?.products.find(p => p.id === productId)?.ndc || resolveProductName(productId, doorShelfConfig).ndc,
            badge: sourceBin?.products.find(p => p.id === productId)?.inventoryType || resolveProductName(productId, doorShelfConfig).badge,
            quantity: productTransfers.reduce((sum, t) => sum + t.quantity, 0), // Total quantity for this product
            unit: sourceBin?.products.find(p => p.id === productId)?.unit || resolveProductName(productId, doorShelfConfig).unit
          }],
          bins: Array.from(new Set(productTransfers.map(t => t.toBinId))).map(binId => {
          const location = getBinLocationDetails(binId, doorShelfConfig);
          if (location) {
            const [binName, rest] = location.split(' - ');
            const [shelfName, doorPart, cabinetPart] = rest.split(', ');
            const doorNumber = doorPart.replace('Door ', '');
            const cabinetNumber = cabinetPart.replace('Cabinet ', '');
            
            const totalQuantity = productTransfers
              .filter(t => t.toBinId === binId)
              .reduce((sum, t) => sum + t.quantity, 0);
            
            // Debug logging for quantity per bin
            console.log('🔧 useInventoryState - Bin Quantity Calculation:', {
              binId,
              binName,
              productId,
              transfersToThisBin: productTransfers.filter(t => t.toBinId === binId).map(t => ({
                fromBinId: t.fromBinId,
                quantity: t.quantity
              })),
              totalQuantity
            });
            
            // CRITICAL FIX: Use captured existing quantities from before the move
            let existingQuantity = 0;
            try {
              // Sum up the existing quantities for all products being moved to this bin
              productTransfers
                .filter(t => t.toBinId === binId)
                .forEach(transfer => {
                  const key = `${transfer.productId}-${transfer.toBinId}`;
                  const capturedExistingQty = existingQuantitiesMap.get(key) || 0;
                  existingQuantity += capturedExistingQty;
                });
              
              // FALLBACK: If no existing quantity was captured, try to get it from current state
              if (existingQuantity === 0) {
                console.log('⚠️ No existing quantity captured, trying fallback method for bin:', binId);
                
                // Try to get existing quantity from the current doorShelfConfig state
                Object.keys(doorShelfConfig).forEach(doorKey => {
                  doorShelfConfig[doorKey].forEach(shelf => {
                    const targetBin = shelf.bins.find(bin => bin.id === binId);
                    if (targetBin && targetBin.products) {
                      productTransfers
                        .filter(t => t.toBinId === binId)
                        .forEach(transfer => {
                          // Try to find the product in the target bin
                          let existingProduct = targetBin.products.find(p => p.id === transfer.productId);
                          
                          // If not found by ID, try to find by name/NDC
                          if (!existingProduct) {
                            const sourceBin = Object.keys(doorShelfConfig).reduce((found, doorKey) => {
                              if (found) return found;
                              return doorShelfConfig[doorKey].reduce((foundShelf, shelf) => {
                                if (foundShelf) return foundShelf;
                                return shelf.bins.find(bin => bin.id === transfer.fromBinId);
                              }, null);
                            }, null);
                            
                            if (sourceBin && sourceBin.products) {
                              const sourceProduct = sourceBin.products.find(p => p.id === transfer.productId);
                              if (sourceProduct) {
                                existingProduct = targetBin.products.find(p => 
                                  p.name === sourceProduct.name && 
                                  p.ndc === sourceProduct.ndc &&
                                  p.inventoryType === sourceProduct.inventoryType
                                );
                              }
                            }
                          }
                          
                          if (existingProduct && typeof existingProduct.quantity === 'number') {
                            existingQuantity += existingProduct.quantity;
                            console.log('✅ Fallback found existing quantity:', {
                              productId: transfer.productId,
                              binId: binId,
                              existingQuantity: existingProduct.quantity
                            });
                          }
                        });
                    }
                  });
                });
              }
            } catch (error) {
              console.warn('Error calculating existing quantity for bin:', binId, error);
            }

            // Debug logging for existing quantity calculation
            console.log('📊 Existing Quantity Calculation:', {
              binId,
              binName,
              productTransfers: productTransfers.filter(t => t.toBinId === binId).map(t => ({
                productId: t.productId,
                quantity: t.quantity,
                key: `${t.productId}-${t.toBinId}`,
                capturedExistingQty: existingQuantitiesMap.get(`${t.productId}-${t.toBinId}`) || 0
              })),
              totalExistingQuantity: existingQuantity,
              totalMovedQuantity: totalQuantity
            });
              
            return {
              binId,
              binName,
              shelfName,
              doorNumber,
              cabinetNumber,
              quantity: totalQuantity,
              existingQuantity: existingQuantity // Add the existing quantity before the move
            };
          }
          return null;
        }).filter(Boolean) as any[],
        // CRITICAL FIX: Add source bin information to history entry
        sourceBin: sourceBinDetails,
        action: 'move',
        transactionType: 'Product moved'
      };
      
      // Enhanced debug logging to verify source bin information for cross-door moves
      console.log('📍 Regular Move Entry with Source Bin:', {
        entryId: moveEntry.id,
        hasSourceBin: !!moveEntry.sourceBin,
        sourceBinDetails: moveEntry.sourceBin,
        transactionType: moveEntry.transactionType,
        targetBins: moveEntry.bins.map(bin => ({
          binId: bin.binId,
          binName: bin.binName,
          door: bin.doorNumber,
          cabinet: bin.cabinetNumber
        })),
        isCrossDoorMove: moveEntry.sourceBin ? moveEntry.bins.some(bin => 
          bin.doorNumber !== moveEntry.sourceBin?.doorNumber
        ) : false
        });
        
        historyEntries.push(moveEntry);
      });
    }

    // Create history entry for regular allocations (if any)
    if (Object.keys(groupedAllocationTransfers).length > 0) {
      // Process each product group to create consolidated allocation entries
      Object.entries(groupedAllocationTransfers).forEach(([productId, productTransfers]) => {
        const allocationEntry: AllocationHistoryEntry = {
          id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          products: [{
            id: productId,
            name: sourceBin?.products.find(p => p.id === productId)?.name || resolveProductName(productId, doorShelfConfig).name,
            description: sourceBin?.products.find(p => p.id === productId)?.description || resolveProductName(productId, doorShelfConfig).genericName, // CRITICAL FIX: Store generic name for history modal display
            ndc: sourceBin?.products.find(p => p.id === productId)?.ndc || resolveProductName(productId, doorShelfConfig).ndc,
            badge: sourceBin?.products.find(p => p.id === productId)?.inventoryType || resolveProductName(productId, doorShelfConfig).badge,
            quantity: 0, // Allocation has 0 quantity
            unit: sourceBin?.products.find(p => p.id === productId)?.unit || resolveProductName(productId, doorShelfConfig).unit
          }],
          bins: Array.from(new Set(productTransfers.map(t => t.toBinId))).map(binId => {
          const location = getBinLocationDetails(binId, doorShelfConfig);
          if (location) {
            const [binName, rest] = location.split(' - ');
            const [shelfName, doorPart, cabinetPart] = rest.split(', ');
            const doorNumber = doorPart.replace('Door ', '');
            const cabinetNumber = cabinetPart.replace('Cabinet ', '');
            
            return {
              binId,
              binName,
              shelfName,
              doorNumber,
              cabinetNumber,
              quantity: 0 
            };
          }
          return null;
          }).filter(Boolean) as any[],
          action: 'allocation',
          transactionType: 'New Bin Allocation'
        };
        
        historyEntries.push(allocationEntry);
      });
    }

    // CRITICAL: Merge E-Kit and regular history entries using E-Kit History Service
    // This ensures both allocation and move activities are recorded separately for E-Kit transactions
    const mergedHistoryEntries = eKitHistoryService.mergeWithRegularHistory(eKitHistoryEntries, historyEntries);
    
    // Final validation: Ensure dual activities were created for E-Kit transactions
    if (eKitTransfers.length > 0) {
      const eKitAllocationEntries = mergedHistoryEntries.filter(entry => 
        entry.transactionType === 'New Bin Allocation' && (entry as any).isEKitTransaction
      );
      const eKitMoveEntries = mergedHistoryEntries.filter(entry => 
        entry.transactionType === 'Product moved' && (entry as any).isEKitTransaction
      );
      
      console.log('🏁 Final E-Kit Validation:', {
        expectedDualActivities: 2,
        actualAllocationEntries: eKitAllocationEntries.length,
        actualMoveEntries: eKitMoveEntries.length,
        totalMergedEntries: mergedHistoryEntries.length,
        dualActivitiesCreated: eKitAllocationEntries.length > 0 && eKitMoveEntries.length > 0
      });
    }
    
    // Add all entries to history state
    setAllocationHistory(prev => [...mergedHistoryEntries, ...prev]);
    
    // Show success toast
    if (transfers.length > 0) {
      const productNames = Array.from(new Set(transfers.map(t => {
        const product = sourceBin?.products.find(p => p.id === t.productId);
        const resolvedProduct = resolveProductName(t.productId, doorShelfConfig);
        return product?.name || resolvedProduct.name;
      })));
      
      toast.custom((t) => React.createElement(ChangeAllocationToast, { 
        productNames, 
        eKitTransfersCount: eKitTransfers.length 
      }), {
        duration: 5000,
      });
    }
    
    // Close modal and reset state
    setShowChangeAllocationModal(false);
    setChangeAllocationMode(false);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    clearProductSearch();

    // CRITICAL: Detect zero-quantity products in source bins after move
    // Use setTimeout to ensure state has updated before checking
    //
    // Scans every transfer's source bin, not just `quantity > 0` ones: a product already at 0 before
    // the move stays a phantom 0-qty row in its source bin (the update above is a 0-0 no-op), and a
    // batch that's entirely such transfers still needs this scan to offer unallocating it — the same
    // as any other product a move happens to drain to 0.
    setTimeout(() => {
      if (transfers.length > 0) {
        console.log('🔍 Checking for zero-quantity products after move (after state update)...');

        // Get unique source bins from transfers
        const sourceBinIds = Array.from(new Set(transfers.map(t => t.fromBinId).filter(Boolean)));
        const productsToUnallocate: any[] = [];
        
        // Access the updated doorShelfConfig via the state getter
        setDoorShelfConfig(currentConfig => {
          // Check each source bin for zero-quantity products
          sourceBinIds.forEach(binId => {
            Object.keys(currentConfig).forEach(doorKey => {
              currentConfig[doorKey].forEach(shelf => {
                const bin = shelf.bins.find(b => b.id === binId);
                if (bin && bin.products) {
                  // Find products with zero quantity in this bin
                  bin.products.forEach(product => {
                    if (parseInt(product.quantity.toString()) === 0) {
                      const location = getBinLocationDetails(binId, currentConfig);
                      productsToUnallocate.push({
                        productId: product.id,
                        productName: product.name,
                        binId: binId,
                        binName: bin.name,
                        location: location || `${bin.name} - ${shelf.name}, ${doorKey}`
                      });
                    }
                  });
                }
              });
            });
          });
          
          console.log('🔍 Zero-quantity products found:', productsToUnallocate.length);
          
          if (productsToUnallocate.length > 0) {
            // Set state to trigger modal in App.tsx
            setZeroQuantityProducts(productsToUnallocate);
            console.log('✅ Zero-quantity products detected:', productsToUnallocate.map(p => ({
              productName: p.productName,
              binName: p.binName,
              location: p.location
            })));
          }
          
          // Return unchanged config (we're just reading it)
          return currentConfig;
        });
      }
    }, 100);
  };

  return {
    // State
    selectedCabinet,
    selectedDoor,
    selectedBin,
    selectedNavItem,
    showProductDialog,
    showBinInventory,
    highlightAvailableBins,
    searchQuery,
    selectedSearchQuery,
    showSearch,
    showUnallocatedProducts,
    selectedUnallocatedProducts,
    selectedBinsForAssignment,
    unallocatedSearchQuery,
    unallocatedBadgeFilter,
    // Not the raw setter: picking a badge is a question about the whole tray, so it leaves the review of
    // the picks the same way typing does. Exported wrapped rather than left to the panel, because the
    // hook's own `Select All` reads both pieces of state and they have to change together.
    setUnallocatedBadgeFilter: (filter: BadgeFilter) => {
      setUnallocatedBadgeFilter(filter);
      setReviewUnallocatedSelection(false);
    },
    // ANDed with the selection here, once, so nothing downstream can render an empty review: unticking
    // the last product drops straight back to the full tray.
    reviewUnallocatedSelection: reviewUnallocatedSelection && selectedUnallocatedProducts.length > 0,
    handleReviewUnallocatedSelection,
    allocationHistory,
    showHistoryModal,
    changeAllocationMode,
    moveMode,
    changeAllocationStep,
    changeAllocationSourceBins,
    changeAllocationTargetBins,
    changeAllocationSourceQuery,
    showChangeAllocationModal,
    doorShelfConfig,
    unallocatedProducts, // CRITICAL FIX: Add unallocated products array
    showAllocateProducts,
    allocateSelectedProductKeys,
    setAllocateSelectedProductKeys,
    zeroQuantityProducts, // Zero-quantity products after change allocation
    
    // Handlers
    handleCabinetClick,
    handleDoorClick,
    handleBinClick,
    handleAvailableSlotClick,
    handleAddProduct,
    handleNavItemClick,
    handleAvailableBinsClick,
    handleSearchClick,
    handleSearchQueryChange,
    handleSearchAutofill,
    handleUnallocatedProductsClick,
    closeUnallocatedProducts,
    handleUnallocatedProductSelect,
    handleUnallocatedSearchChange,
    handleSelectAllUnallocatedProducts,
    handleClearUnallocatedSelection,
    handleSelectBinsForAssignment,
    handleSelectSourceBinsFromSearch,
    handleSelectSourceProductFromBin,
    sourceProductPicks,
    handleSelectTargetBinsFromSearch,
    handleSelectBinFromSearch,
    handleHighlightBins,
    binHighlight,
    handleSearchProductClick,
    handleConfirmAssignment,
    closeBinInventory,
    getCurrentBin,
    handleHistoryClick,
    handleChangeAllocationClick,
    handleMoveBinClick,
    handleMoveProductClick,
    handleAllocateProductsClick,
    handleCloseAllocateProducts,
    handleAssignProductsToBins,
    handleExitChangeAllocation,
    handleNextStep,
    handlePreviousStep,
    handleClearChangeAllocationSelection,
    handleClearSourceBins,
    handleClearTargetBins,
    handleRemoveSourceBin,
    handleRemoveTargetBin,
    handleRemoveSourceProduct,
    handleOpenChangeAllocationModal,
    handleConfirmChangeAllocation,
    handleUnallocateProduct,
    handleClearZeroQuantityProducts,
    handleUnallocateMultipleProducts,
    
    // Setters (needed for dialogs)
    setShowProductDialog,
    setShowHistoryModal,
    setShowChangeAllocationModal
  };
};