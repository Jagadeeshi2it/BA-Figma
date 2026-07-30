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
import { DoorShelfConfig, Bin, AllocationHistoryEntry, Product } from '../types';
import { productDataService } from '../services/ProductDataService';
import { pharmaceuticalProducts } from '../data/products';
import { eKitHistoryService } from '../services/EKitHistoryService';
import { emergencyKitService } from '../services/EmergencyKitService';

// Helper function to resolve product names consistently across the app
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
  const [showSearch, setShowSearch] = useState(false);
  const [showUnallocatedProducts, setShowUnallocatedProducts] = useState(false);
  const [selectedUnallocatedProducts, setSelectedUnallocatedProducts] = useState<string[]>([]);
  const [selectedBinsForAssignment, setSelectedBinsForAssignment] = useState<string[]>([]);
  const [unallocatedSearchQuery, setUnallocatedSearchQuery] = useState<string>("");
  const [allocationHistory, setAllocationHistory] = useState<AllocationHistoryEntry[]>(generateSeedHistory);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [changeAllocationMode, setChangeAllocationMode] = useState(false);
  const [changeAllocationSourceBins, setChangeAllocationSourceBins] = useState<string[]>([]);
  const [changeAllocationTargetBins, setChangeAllocationTargetBins] = useState<string[]>([]);
  const [changeAllocationStep, setChangeAllocationStep] = useState<1 | 2>(1);
  const [showChangeAllocationModal, setShowChangeAllocationModal] = useState(false);
  // The product(s) the user explicitly picked from the search bar while choosing SOURCE bins.
  // Picking "Select as Source" for a product means the intent is to move THAT product, so the
  // modal narrows its source panel to these instead of listing everything sharing those bins.
  // Kept separate from selectedSearchQuery, which step 2 overwrites with the target product.
  const [changeAllocationSourceQuery, setChangeAllocationSourceQuery] = useState<string>("");
  
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
          // Prevent selecting source bins as targets
          if (!changeAllocationSourceBins.includes(binId)) {
            if (changeAllocationTargetBins.includes(binId)) {
              // Remove this bin from target selection
              setChangeAllocationTargetBins(prev => prev.filter(id => id !== binId));
            } else {
              // Add this bin to target selection
              setChangeAllocationTargetBins(prev => [...prev, binId]);
            }
          }
        }
        return;
      }

      // If in unallocated products mode, check if products are selected first
      if (showUnallocatedProducts) {
        if (selectedUnallocatedProducts.length === 0) {
          // Prevent bin selection if no products are selected
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
  }, [selectedDoor, doorShelfConfig, changeAllocationMode, changeAllocationStep, changeAllocationSourceBins, changeAllocationTargetBins, showUnallocatedProducts, selectedUnallocatedProducts.length, selectedBinsForAssignment]);

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
    // Clear selected search query when user types to prevent highlighting while typing.
    // Not in change allocation mode: there the highlight marks products already committed to the
    // selection, so typing a new term must not erase what the user has picked so far.
    if (query !== selectedSearchQuery && !changeAllocationMode) {
      setSelectedSearchQuery("");
    }
  }, [selectedSearchQuery, changeAllocationMode]);

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
  }, []);

  const handleUnallocatedProductsClick = () => {
    // CRITICAL FIX: Toggle behavior - if already open, close it; if closed, open it
    if (showUnallocatedProducts) {
      setShowUnallocatedProducts(false);
      setSelectedUnallocatedProducts([]);
      setSelectedBinsForAssignment([]);
    } else {
      setShowUnallocatedProducts(true);
      setShowBinInventory(false);
      setSelectedBin(null);
    }
  };

  const closeUnallocatedProducts = () => {
    setShowUnallocatedProducts(false);
    setSelectedUnallocatedProducts([]);
    setSelectedBinsForAssignment([]);
    setUnallocatedSearchQuery("");
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
  };

  const handleSelectAllUnallocatedProducts = () => {
    // Filter products based on current search query to select only visible products
    const filteredProducts = unallocatedProducts.filter(product => {
      if (!unallocatedSearchQuery.trim()) return true;
      
      const query = unallocatedSearchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.ndc.toLowerCase().includes(query) ||
        product.source.toLowerCase().includes(query)
      );
    });

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
    if (highlightQuery) {
      setSelectedSearchQuery(prev => appendQueryGroup(prev, highlightQuery));
      setChangeAllocationSourceQuery(prev => appendQueryGroup(prev, highlightQuery));
    }
  }, [doorShelfConfig]);

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
                  
                  return {
                    ...bin,
                    products: [...bin.products, ...newProducts],
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

  const handleChangeAllocationClick = () => {
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

  const handleExitChangeAllocation = () => {
    setChangeAllocationMode(false);
    setChangeAllocationStep(1);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    setShowChangeAllocationModal(false);
    setSelectedSearchQuery(""); // Clear search highlighting when exiting change allocation mode
    setChangeAllocationSourceQuery("");
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

  const handleClearChangeAllocationSelection = () => {
    setChangeAllocationStep(1);
    setChangeAllocationSourceBins([]);
    setChangeAllocationTargetBins([]);
    setChangeAllocationSourceQuery("");
  };

  const handleClearSourceBins = () => {
    setChangeAllocationSourceBins([]);
    setChangeAllocationSourceQuery("");
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
  const handleRemoveSourceBin = useCallback((binId: string) => {
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
  }, [changeAllocationSourceQuery, doorShelfConfig]);

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
                    return {
                      ...bin,
                      products: [...bin.products, newProduct],
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
    const moveTransfers = regularTransfers.filter(t => t.quantity > 0);
    const allocationTransfers = regularTransfers.filter(t => t.quantity === 0);
    
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
    setTimeout(() => {
      const moveTransfersList = transfers.filter(t => t.quantity > 0);
      if (moveTransfersList.length > 0) {
        console.log('🔍 Checking for zero-quantity products after move (after state update)...');
        
        // Get unique source bins from transfers
        const sourceBinIds = Array.from(new Set(moveTransfersList.map(t => t.fromBinId).filter(Boolean)));
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
    allocationHistory,
    showHistoryModal,
    changeAllocationMode,
    changeAllocationStep,
    changeAllocationSourceBins,
    changeAllocationTargetBins,
    changeAllocationSourceQuery,
    showChangeAllocationModal,
    doorShelfConfig,
    unallocatedProducts, // CRITICAL FIX: Add unallocated products array
    unallocatedProductsCount: unallocatedProducts.length, // CRITICAL FIX: Add unallocated products count
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
    handleSelectTargetBinsFromSearch,
    handleSearchProductClick,
    handleConfirmAssignment,
    closeBinInventory,
    getCurrentBin,
    handleHistoryClick,
    handleChangeAllocationClick,
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