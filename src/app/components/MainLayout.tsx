import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BinInventoryPanel from './BinInventoryPanel';
import AllProductsPanel from './AllProductsPanel';
import UnallocatedProductsPanel from './UnallocatedProductsPanel';
import { Toaster } from './ui/sonner';

interface MainLayoutProps {
  showBinInventory: boolean;
  // Bin whose full product list is open in the side panel ("+N more"), owned by App.
  allProductsBin?: any;
  selectedDoor?: string | null;
  searchQuery?: string;
  onAllProductsProductClick?: (product: any, location: any) => void;
  closeAllProducts?: () => void;
  showUnallocatedProducts: boolean;
  currentBin: any;
  selectedUnallocatedProducts: string[];
  selectedBinsForAssignment: string[];
  unallocatedSearchQuery: string;
  doorShelfConfig: any;
  unallocatedProducts: any[]; // CRITICAL FIX: Add unallocated products as prop
  currentStation?: string;
  onStationClick?: () => void;
  onLogout: () => void;
  closeBinInventory: () => void;
  closeUnallocatedProducts: () => void;
  handleUnallocatedProductSelect: (productId: string) => void;
  handleUnallocatedSearchChange: (query: string) => void;
  handleSelectAllUnallocatedProducts: () => void;
  handleClearUnallocatedSelection: () => void;
  handleConfirmAssignment: () => void;
  // Pinned below the scrolling content, inside the content column — so it can't cover the shelves
  // and it shifts with the column when a side panel opens, which position:fixed wouldn't.
  bottomBar?: React.ReactNode;
  // An extra fixed right-hand panel (the allocation review). Passed as a node with its own open
  // flag so the column's reserved margin can account for it.
  sidePanel?: React.ReactNode;
  sidePanelOpen?: boolean;
  children: React.ReactNode;
  removePadding?: boolean;
}

export default function MainLayout({
  showBinInventory,
  allProductsBin,
  selectedDoor,
  searchQuery,
  onAllProductsProductClick,
  closeAllProducts,
  showUnallocatedProducts,
  currentBin,
  selectedUnallocatedProducts,
  selectedBinsForAssignment,
  unallocatedSearchQuery,
  doorShelfConfig,
  unallocatedProducts,
  currentStation,
  onStationClick,
  onLogout,
  closeBinInventory,
  closeUnallocatedProducts,
  handleUnallocatedProductSelect,
  handleUnallocatedSearchChange,
  handleSelectAllUnallocatedProducts,
  handleClearUnallocatedSelection,
  handleConfirmAssignment,
  bottomBar,
  sidePanel,
  sidePanelOpen = false,
  children,
  removePadding
}: MainLayoutProps) {
  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
          // The unallocated panel is wider than the bin inventory one, so the reserved margin has
          // to match whichever is open or the panel overlaps the shelves.
          showUnallocatedProducts || allProductsBin || sidePanelOpen
            ? "mr-[440px]"
            : showBinInventory ? "mr-[320px]" : ""
        }`}
      >
        {/* Top Header */}
        <div className="h-[50px]">
          <TopNav 
            onLogout={onLogout} 
            currentStation={currentStation}
            onStationClick={onStationClick}
          />
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 min-h-0 ${removePadding ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          {children}
        </div>

        {bottomBar}
      </div>

      {sidePanel}

      {/* Fixed Bin Inventory Side Panel */}
      {showBinInventory && !showUnallocatedProducts && (
        <BinInventoryPanel
          bin={currentBin}
          onClose={closeBinInventory}
        />
      )}

      {/* A bin's full product list, opened from "+N more" on the bin card */}
      {allProductsBin && !showUnallocatedProducts && (
        <AllProductsPanel
          bin={allProductsBin}
          selectedDoor={selectedDoor ?? null}
          searchQuery={searchQuery ?? ''}
          onProductClick={onAllProductsProductClick}
          onClose={closeAllProducts ?? (() => {})}
        />
      )}

      {/* Unallocated Products Side Panel */}
      {showUnallocatedProducts && (
        <UnallocatedProductsPanel
          selectedUnallocatedProducts={selectedUnallocatedProducts}
          selectedBinsForAssignment={selectedBinsForAssignment}
          unallocatedSearchQuery={unallocatedSearchQuery}
          doorShelfConfig={doorShelfConfig}
          unallocatedProducts={unallocatedProducts} // CRITICAL FIX: Pass unallocated products as prop
          onClose={closeUnallocatedProducts}
          onProductSelect={handleUnallocatedProductSelect}
          onSearchChange={handleUnallocatedSearchChange}
          onSelectAll={handleSelectAllUnallocatedProducts}
          onConfirmAssignment={handleConfirmAssignment}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed top-0 left-[80px] right-[80px] z-50 pointer-events-none">
        <Toaster position="top-center" />
      </div>
    </div>
  );
}