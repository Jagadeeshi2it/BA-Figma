import React, { useState, useMemo, memo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, Search, X, ArrowDown, Calendar } from 'lucide-react';
import { AllocationHistoryEntry } from '../types';
import { unallocatedProducts } from '../data/unallocatedProducts';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { getCurrentShelves } from '../utils/doorUtils';
import { doorShelfConfig } from '../data/doorConfigurations';
import { productDataService } from '../services/ProductDataService';
import { getSourceDisplayName, getSourceLocationDisplay, shouldHaveSourceBin } from '../utils/historyUtils';

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: AllocationHistoryEntry[];
  doorShelfConfig?: any; // Current door configuration to look up remaining quantities
}

const HistoryModal = memo(React.forwardRef<HTMLDivElement, HistoryModalProps>(({ open, onOpenChange, history, doorShelfConfig: currentDoorConfig }, ref) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBinChanges, setShowBinChanges] = useState(true);
  const [showBinAllocation, setShowBinAllocation] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('today');

  // Count entries by type
  const binChangesCount = useMemo(() => {
    if (!history || !Array.isArray(history)) return 0;
    return history.filter(entry => entry?.transactionType === 'Product moved').length;
  }, [history]);
  
  const binAllocationCount = useMemo(() => {
    if (!history || !Array.isArray(history)) return 0;
    return history.filter(entry => entry?.transactionType === 'New Bin Allocation').length;
  }, [history]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get enhanced product information with proper names and NDC
  const getEnhancedProduct = useCallback((product: any) => {
    if (!product) return product;
    
    try {
      // Use ProductDataService to enhance the product with proper display values
      const enhancedProduct = productDataService.enhanceProduct(product);
      return enhancedProduct;
    } catch (error) {
      console.error('Error enhancing product in history:', error);
      // Fallback to original product data if enhancement fails
      return product;
    }
  }, []);

  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    let filtered = [...history];

    // Filter by transaction type checkboxes
    if (!showBinChanges || !showBinAllocation) {
      filtered = filtered.filter(entry => {
        if (!entry?.transactionType) return false;
        if (entry.transactionType === 'Product moved' && !showBinChanges) return false;
        if (entry.transactionType === 'New Bin Allocation' && !showBinAllocation) return false;
        return true;
      });
    }

    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last15Days = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    filtered = filtered.filter(entry => {
      if (!entry?.timestamp) return false;
      const entryDate = new Date(entry.timestamp.getFullYear(), entry.timestamp.getMonth(), entry.timestamp.getDate());
      
      switch (dateFilter) {
        case 'today':
          return entryDate.getTime() === today.getTime();
        case 'yesterday':
          return entryDate.getTime() === yesterday.getTime();
        case 'last7days':
          return entryDate.getTime() >= lastWeek.getTime();
        case 'last15days':
          return entryDate.getTime() >= last15Days.getTime();
        case 'last30days':
          return entryDate.getTime() >= lastMonth.getTime();
        default:
          return true;
      }
    });

    // Filter by search query
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery) {
      return filtered;
    }

    const query = trimmedQuery.toLowerCase();
    
    return filtered.reduce((acc: typeof filtered, entry) => {
      if (!entry?.bins || !entry?.products) return acc;
      
      // Check if transaction type matches search
      const transactionTypeMatch = entry.transactionType?.toLowerCase().includes(query);
      
      // Check if any bin location matches search
      const binMatch = entry.bins.some(bin => 
        bin?.binName?.toLowerCase().includes(query) ||
        bin?.shelfName?.toLowerCase().includes(query) ||
        `door ${bin?.doorNumber || ''}`.toLowerCase().includes(query) ||
        `cabinet ${bin?.cabinetNumber || ''}`.toLowerCase().includes(query)
      );

      // If transaction type or bin matches, keep all products
      if (transactionTypeMatch || binMatch) {
        acc.push(entry);
        return acc;
      }

      // Filter products based on search criteria using enhanced product data
      const filteredProducts = entry.products.filter(product => {
        if (!product) return false;
        
        // Use enhanced product data for search
        const enhancedProduct = getEnhancedProduct(product);
        
        return (
          enhancedProduct.displayName?.toLowerCase().includes(query) ||
          enhancedProduct.name?.toLowerCase().includes(query) ||
          enhancedProduct.description?.toLowerCase().includes(query) ||
          enhancedProduct.ndc?.toLowerCase().includes(query) ||
          enhancedProduct.inventoryType?.toLowerCase().includes(query)
        );
      });

      // If products match, include entry with filtered products
      if (filteredProducts.length > 0) {
        acc.push({
          ...entry,
          products: filteredProducts
        });
      }
      
      return acc;
    }, []);
  }, [history, searchQuery, showBinChanges, showBinAllocation, dateFilter, getEnhancedProduct]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Get the badge text and color for transaction type
  const getTransactionBadge = useCallback((transactionType: string) => {
    if (transactionType === 'Product moved') {
      return { text: 'Bin Changes', className: 'bg-blue-100 text-blue-800' };
    }
    return { text: 'Bin Allocation', className: 'bg-green-100 text-green-800' };
  }, []);

  // Helper function to get remaining quantity for a product in the source bin
  const getRemainingQuantity = useCallback((productId: string, sourceBinId: string) => {
    if (!currentDoorConfig || !sourceBinId || !productId) return 0;
    
    try {
      // Search through all doors to find the source bin and the product
      const doors = Object.keys(currentDoorConfig);
      for (let i = 0; i < doors.length; i++) {
        const doorKey = doors[i];
        const shelves = currentDoorConfig[doorKey];
        if (!Array.isArray(shelves)) continue;
        
        for (let j = 0; j < shelves.length; j++) {
          const shelf = shelves[j];
          if (!shelf?.bins || !Array.isArray(shelf.bins)) continue;
          
          const bin = shelf.bins.find((b: any) => b?.id === sourceBinId);
          if (bin?.products && Array.isArray(bin.products)) {
            const product = bin.products.find((p: any) => p?.id === productId);
            if (product && typeof product.quantity === 'number') {
              return product.quantity;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in getRemainingQuantity:', error);
    }
    return 0;
  }, [currentDoorConfig]);

  // CRITICAL FIX: Enhanced source bin rendering with fallback logic
  const renderSourceBinInfo = (entry: AllocationHistoryEntry, product: any) => {
    if (entry.sourceBin) {
      return (
        <>
          <div className="font-medium text-gray-900">
            {entry.sourceBin.binName}
          </div>
          <div className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
            Cabinet {entry.sourceBin.cabinetNumber}, Door {entry.sourceBin.doorNumber}, {entry.sourceBin.shelfName}
          </div>
          <div className="text-sm text-gray-600 mt-1 flex gap-4">
            <span className="text-[14px]">Moved: <span className="text-green-700">{product.quantity} {pluralizeUnit(product.unit, product.quantity)}</span></span>
            <span className="text-[14px]">Remaining: <span className="text-[rgba(74,85,101,1)]">{getRemainingQuantity(product.id, entry.sourceBin.binId)} {pluralizeUnit(product.unit, getRemainingQuantity(product.id, entry.sourceBin.binId))}</span></span>
          </div>
        </>
      );
    } else {
      // Use fallback utilities for enhanced source display
      return (
        <>
          <div className="font-medium text-gray-900">
            {getSourceDisplayName(entry, currentDoorConfig || doorShelfConfig, history)}
          </div>
          <div className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
            {getSourceLocationDisplay(entry, currentDoorConfig || doorShelfConfig, history)}
          </div>
          {shouldHaveSourceBin(entry) && (
            <div className="text-sm text-gray-600 mt-1">
              <span className="text-[14px]">Moved: <span className="text-green-700">{product.quantity} {pluralizeUnit(product.unit, product.quantity)}</span></span>
            </div>
          )}
        </>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[800px] !h-[640px] !max-w-none !max-h-none [&>button]:hidden" aria-describedby={undefined}>
        <DialogHeader>
          <div className="bg-white h-[45px] flex items-center justify-between relative p-[0px]">
            <div className="flex items-center gap-6">
              <DialogTitle className="font-semibold text-neutral-950">History</DialogTitle>
              
              <div className="relative">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[120px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] font-normal">
                    <SelectValue placeholder="Date" />

                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last7days">7 days</SelectItem>
                    <SelectItem value="last15days">15 days</SelectItem>
                    <SelectItem value="last30days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Checkbox 
                  id="bin-changes" 
                  checked={showBinChanges}
                  onCheckedChange={setShowBinChanges}
                  className="w-4 h-4"
                />
                <label htmlFor="bin-changes" className="text-[14px] font-normal text-neutral-950 ml-1">
                  Bin Changes ({binChangesCount})
                </label>
              </div>

              <div className="flex items-center gap-1">
                <Checkbox 
                  id="bin-allocation" 
                  checked={showBinAllocation}
                  onCheckedChange={setShowBinAllocation}
                  className="w-4 h-4"
                />
                <label htmlFor="bin-allocation" className="text-[14px] font-normal text-neutral-950 ml-1">
                  Bin Allocation ({binAllocationCount})
                </label>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search Products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[180px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] placeholder:text-[#9fa9b7]"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={handleClearSearch}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[520px] pr-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery.trim() || (!showBinChanges && !showBinAllocation) ? (
                <>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No history yet</h3>
                  <p className="text-gray-600">
                    Product allocations will appear here once you start assigning products to bins.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-[8px]">
              {filteredHistory.slice(0, 50).map((entry) => {
                if (!entry?.id || !entry?.transactionType) return null;
                
                const badge = getTransactionBadge(entry.transactionType);
                const isProductMoved = entry.transactionType === 'Product moved';
                
                // Deduplicate products by ID and aggregate quantities
                const uniqueProducts = (() => {
                  if (!entry?.products || !Array.isArray(entry.products)) return [];
                  
                  return entry.products.reduce((acc, product) => {
                    if (!product?.id) return acc;
                    
                    const existingProduct = acc.find(p => p?.id === product.id);
                    if (existingProduct) {
                      // Aggregate quantities for the same product
                      existingProduct.quantity = (existingProduct.quantity || 0) + (product.quantity || 0);
                      // Preserve targetBins if they exist
                      if ((product as any).targetBins && Array.isArray((product as any).targetBins)) {
                        existingProduct.targetBins = (existingProduct as any).targetBins || [];
                        (existingProduct as any).targetBins.push(...(product as any).targetBins);
                      }
                    } else {
                      // Add new unique product
                      acc.push({ ...product });
                    }
                    return acc;
                  }, [] as typeof entry.products);
                })();

                // If multiple unique products, show each with clear bin assignment
                if (uniqueProducts.length > 1) {
                  return (
                    <div key={entry.id} className="bg-white rounded-lg border p-6">
                      {/* Transaction Header */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-[rgba(0,0,0,1)]">{formatTimestamp(entry.timestamp)}</div>
                          <div className="font-normal text-[14px]" style={{ marginLeft: '8px', color: '#6A7282' }}>Henry Taylor</div>
                        </div>
                        <Badge className={`${badge.className} text-[14px]`}>
                          {badge.text}
                        </Badge>
                      </div>

                      {/* Product-Bin Pairs */}
                      <div className="space-y-6">
                        {uniqueProducts.map((product, productIndex) => {
                          // Use product-specific target bins if available, otherwise fall back to all bins
                          const assignedBins = (product as any).targetBins || entry.bins;
                          
                          // Get enhanced product information with proper display values
                          const enhancedProduct = getEnhancedProduct(product);
                          
                          return (
                            <div key={`${entry.id}-product-${product.id}-pair`}>
                              <div>
                                <div className="grid grid-cols-12 gap-6">
                                  {/* Product Details - takes more space */}
                                  <div className="col-span-6">
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="font-semibold text-gray-900 text-[14px]">{enhancedProduct.displayName || enhancedProduct.name}</div>
                                      <div className="bg-[#000000] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1 py-0.5 relative rounded shrink-0 ml-1">
                                        <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[8px] text-left text-nowrap">
                                          <p className="block leading-[normal] whitespace-pre">
                                            {(() => {
                                              const seedValue = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                              return (seedValue % 2 === 0) ? 'MDV' : 'SDV';
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1 text-[14px]">{enhancedProduct.description || 'pharmaceutical product'}</div>
                                    <div className="text-sm text-gray-500 mb-1 text-[14px]">NDC: {enhancedProduct.ndc || 'Not Available'}</div>
                                    <div className="text-sm text-gray-600 mb-1 text-[14px]">Inventory Type: {enhancedProduct.inventoryType || 'Purchased'}</div>

                                  </div>

                                  {/* Bin Assignment */}
                                  <div className="col-span-6">
                                    {isProductMoved ? (
                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-sm text-gray-600 mb-1">Changed from:</div>
                                          {renderSourceBinInfo(entry, product)}
                                        </div>
                                        <div className="flex justify-start">
                                          <ArrowDown className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <div className="text-sm text-gray-600 mb-1">Changed to:</div>
                                          {assignedBins.length > 0 ? assignedBins.map((bin, binIndex) => (
                                            <div key={`${entry.id}-product-${product.id}-bin-${bin.binId || binIndex}`} className="mb-2">
                                              <div className="font-medium text-gray-900">
                                                {bin.binName}
                                                {isProductMoved && typeof bin.quantity === 'number' && bin.quantity > 0 && (
                                                  <span className="text-green-700 font-normal text-sm ml-1 text-[14px]">
                                                    ({bin.quantity} {pluralizeUnit(product.unit, bin.quantity)})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
                                                Cabinet {bin.cabinetNumber}, Door {bin.doorNumber}, {bin.shelfName}
                                              </div>
                                              {/* Show existing and remaining quantities for product moves */}
                                              {isProductMoved && (
                                                <div className="text-xs text-[rgba(74,85,101,1)] mt-1 text-[14px] flex gap-4">
                                                  {(() => {
                                                    const movedQty = Number(bin.quantity) || 0;
                                                    
                                                    // Trust the backend existingQuantity (it's being calculated correctly)
                                                    // Only use Number conversion to handle string values, don't default to 0
                                                    let existingQty = 0;
                                                    
                                                    if (bin.existingQuantity !== null && bin.existingQuantity !== undefined) {
                                                      existingQty = Number(bin.existingQuantity);
                                                    }
                                                    
                                                    const remainingQty = existingQty + movedQty;
                                                    
                                                    return (
                                                      <>
                                                        <span>Existing: <span className="text-[rgba(74,85,101,1)]">{existingQty} {pluralizeUnit(product.unit, existingQty)}</span></span>
                                                        {movedQty > 0 && (
                                                          <span>Remaining: <span className="text-[rgba(74,85,101,1)]">{remainingQty} {pluralizeUnit(product.unit, remainingQty)}</span></span>
                                                        )}
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              )}
                                            </div>
                                          )) : (
                                            <div className="text-sm text-gray-500">No specific bin assigned</div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="text-sm text-gray-600 mb-2">Assigned to:</div>
                                        {assignedBins.length > 0 ? assignedBins.map((bin, binIndex) => (
                                          <div key={`${entry.id}-product-${product.id}-bin-${bin.binId || binIndex}`} className="mb-2">
                                            <div className="font-medium text-gray-900">
                                              {bin.binName}
                                            </div>
                                            <div className="text-sm text-[rgba(0,0,0,1)]">
                                              Cabinet {bin.cabinetNumber}, Door {bin.doorNumber}, {bin.shelfName}
                                            </div>
                                          </div>
                                        )) : (
                                          <div className="text-sm text-gray-500">No specific bin assigned</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Add divider between products, but not after the last one */}
                              {productIndex < uniqueProducts.length - 1 && (
                                <div className="my-6 border-t border-gray-200"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  // Single product - use consistent layout with timestamp at top
                  const product = uniqueProducts[0];
                  const assignedBins = (product as any).targetBins || entry.bins;
                  
                  // Get enhanced product information with proper display values
                  const enhancedProduct = getEnhancedProduct(product);
                  
                  return (
                    <div key={entry.id} className="bg-white rounded-lg border p-[16px] mb-[8px]">
                      {/* Transaction Header - Consistent with multi-product layout */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-[rgba(0,0,0,1)] text-[14px]">{formatTimestamp(entry.timestamp)}</div>
                          <div className="font-normal text-[14px]" style={{ marginLeft: '8px', color: '#6A7282' }}>Henry Taylor</div>
                        </div>
                        <Badge className={`${badge.className} text-[14px]`}>
                          {badge.text}
                        </Badge>
                      </div>

                      {/* Product Content */}
                      <div className="grid grid-cols-12 gap-6">
                        {/* Product Details */}
                        <div className="col-span-6">
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="font-semibold text-gray-900 text-[14px]">{enhancedProduct.displayName || enhancedProduct.name}</div>
                              <div className="bg-[#000000] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1 py-0.5 relative rounded shrink-0 ml-1">
                                <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[8px] text-left text-nowrap">
                                  <p className="block leading-[normal] whitespace-pre">
                                    {(() => {
                                      const seedValue = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                      return (seedValue % 2 === 0) ? 'MDV' : 'SDV';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1 text-[14px]">{enhancedProduct.description || 'pharmaceutical product'}</div>
                            <div className="text-sm text-gray-500 mb-1 text-[14px]">NDC: {enhancedProduct.ndc || 'Not Available'}</div>
                            <div className="text-sm text-gray-600 mb-1 text-[14px]">Inventory Type: {enhancedProduct.inventoryType || 'Purchased'}</div>
                          </div>
                        </div>

                        {/* Bin Assignment */}
                        <div className="col-span-6">
                          {isProductMoved ? (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm text-gray-600 mb-1">Changed from:</div>
                                {renderSourceBinInfo(entry, product)}
                              </div>
                              <div className="flex justify-start">
                                <ArrowDown className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 mb-1">Changed to:</div>
                                {assignedBins.length > 0 ? assignedBins.map((bin, binIndex) => (
                                  <div key={`${entry.id}-product-${product.id}-bin-${bin.binId || binIndex}`} className="mb-2">
                                    <div className="font-medium text-gray-900">
                                      {bin.binName}
                                      {isProductMoved && typeof bin.quantity === 'number' && bin.quantity > 0 && (
                                        <span className="text-green-700 font-normal text-sm ml-1 text-[14px]">
                                          ({bin.quantity} {pluralizeUnit(product.unit, bin.quantity)})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-[rgba(0,0,0,1)] text-[14px]">
                                      Cabinet {bin.cabinetNumber}, Door {bin.doorNumber}, {bin.shelfName}
                                    </div>
                                    {/* Show existing and remaining quantities for product moves */}
                                    {isProductMoved && (
                                      <div className="text-xs text-[rgba(74,85,101,1)] mt-1 text-[14px] flex gap-4">
                                        {(() => {
                                          const movedQty = Number(bin.quantity) || 0;
                                          
                                          // Trust the backend existingQuantity (it's being calculated correctly)
                                          // Only use Number conversion to handle string values, don't default to 0
                                          let existingQty = 0;
                                          
                                          if (bin.existingQuantity !== null && bin.existingQuantity !== undefined) {
                                            existingQty = Number(bin.existingQuantity);
                                          }
                                          
                                          const remainingQty = existingQty + movedQty;
                                          
                                          return (
                                            <>
                                              <span>Existing: <span className="text-[rgba(74,85,101,1)]">{existingQty} {pluralizeUnit(product.unit, existingQty)}</span></span>
                                              {movedQty > 0 && (
                                                <span>Remaining: <span className="text-[rgba(74,85,101,1)]">{remainingQty} {pluralizeUnit(product.unit, remainingQty)}</span></span>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )) : (
                                  <div className="text-sm text-gray-500">No specific bin assigned</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-600 mb-2">Assigned to:</div>
                              {assignedBins.length > 0 ? assignedBins.map((bin, binIndex) => (
                                <div key={`${entry.id}-product-${product.id}-bin-${bin.binId || binIndex}`} className="mb-2">
                                  <div className="font-medium text-gray-900">
                                    {bin.binName}
                                  </div>
                                  <div className="text-sm text-[rgba(0,0,0,1)]">
                                    Cabinet {bin.cabinetNumber}, Door {bin.doorNumber}, {bin.shelfName}
                                  </div>
                                </div>
                              )) : (
                                <div className="text-sm text-gray-500">No specific bin assigned</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}));

HistoryModal.displayName = 'HistoryModal';

export default HistoryModal;