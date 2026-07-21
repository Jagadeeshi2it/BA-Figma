import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BinInventoryPanel from './BinInventoryPanel';
import UnallocatedProductsPanel from './UnallocatedProductsPanel';
import { Toaster } from './ui/sonner';

interface MainLayoutProps {
  showBinInventory: boolean;
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
  children: React.ReactNode;
  removePadding?: boolean;
}

export default function MainLayout({
  showBinInventory,
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
          showBinInventory || showUnallocatedProducts ? "mr-[320px]" : ""
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
        <div className={`flex-1 ${removePadding ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          {children}
        </div>
      </div>

      {/* Fixed Bin Inventory Side Panel */}
      {showBinInventory && !showUnallocatedProducts && (
        <BinInventoryPanel
          bin={currentBin}
          onClose={closeBinInventory}
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
          onClearSelection={handleClearUnallocatedSelection}
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