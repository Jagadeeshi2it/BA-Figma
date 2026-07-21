import React from 'react';
import { X, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
// CRITICAL FIX: Remove direct import, will receive as prop
import { DoorShelfConfig } from '../types';
import { getBinLocationDetails } from '../utils/doorUtils';
import { highlightText, highlightNDC } from '../utils/textHighlight';

interface UnallocatedProductsPanelProps {
  selectedUnallocatedProducts: string[];
  selectedBinsForAssignment: string[];
  unallocatedSearchQuery: string;
  doorShelfConfig: DoorShelfConfig;
  unallocatedProducts: any[]; // CRITICAL FIX: Accept unallocated products as prop
  onClose: () => void;
  onProductSelect: (productId: string) => void;
  onSearchChange: (query: string) => void;
  onClearSelection: () => void;
  onConfirmAssignment: () => void;
  onSelectAll: () => void;
}

export default function UnallocatedProductsPanel({
  selectedUnallocatedProducts,
  selectedBinsForAssignment,
  unallocatedSearchQuery,
  doorShelfConfig,
  unallocatedProducts,
  onClose,
  onProductSelect,
  onSearchChange,
  onClearSelection,
  onConfirmAssignment,
  onSelectAll
}: UnallocatedProductsPanelProps) {
  
  // Filter products based on search query
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

  // Check if all filtered products are selected
  const allFilteredProductsSelected = filteredProducts.length > 0 && 
    filteredProducts.every(product => selectedUnallocatedProducts.includes(product.id));

  return (
    <div className="fixed right-0 top-0 h-full w-[320px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold">Unallocated Products</h2>
        <div 
          className="bg-white relative rounded-[4px] cursor-pointer w-8 h-8 flex items-center justify-center"
          onClick={onClose}
        >
          <X className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Search Bar with Select All */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={unallocatedSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full text-[14px]"
            />
          </div>
          <div 
            className="bg-white relative rounded-[4px] cursor-pointer"
            onClick={onSelectAll}
          >
            <div aria-hidden="true" className="absolute border border-[#0068FF] border-solid inset-0 pointer-events-none rounded-[4px]" />
            <div className="flex flex-row items-center justify-end relative size-full">
              <div className="box-border content-stretch flex gap-2 items-center justify-end px-3 py-2 relative size-full">
                <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#0068FF] text-[14px] text-nowrap">
                  <p className="leading-[20px] whitespace-pre text-[14px]">{allFilteredProductsSelected ? 'Unselect All' : 'Select All'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Instructions - moved above product list for better visibility */}
      {selectedUnallocatedProducts.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-gray-200">
          {selectedBinsForAssignment.length === 0 ? (
            <p className="text-[#0068FF] text-center">Select bin(s) to assign {selectedUnallocatedProducts.length} selected product{selectedUnallocatedProducts.length > 1 ? 's' : ''}</p>
          ) : (
            <p className="text-[#0068FF] text-center">
              Assign {selectedUnallocatedProducts.length} product{selectedUnallocatedProducts.length > 1 ? 's' : ''} to {selectedBinsForAssignment.length} bin{selectedBinsForAssignment.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              Try searching for a different product name, NDC code, or keyword.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id}
                onClick={() => onProductSelect(product.id)}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedUnallocatedProducts.includes(product.id)
                    ? 'border-[#8F48D2] border-[1px] bg-[#F7EFFE]'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CardContent className="p-4 m-[0px]">
                  <div className="space-y-1">
                    <div className="flex items-start">
                      <h3 className="font-semibold text-gray-900 leading-tight text-[14px]">
                        {highlightText(product.name, unallocatedSearchQuery, '#EA4315', product)}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="ml-1 bg-[#000000] text-[#ffffff] text-[8px] px-1 py-0.5 rounded shrink-0"
                      >
                        {product.badge}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 leading-relaxed text-[14px]">
                      {product.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 text-[14px]">
                      <span className="font-medium">NDC:</span> {highlightNDC(product.ndc, unallocatedSearchQuery, '#EA4315', product)}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-[14px]">
                      <span className="font-medium">Inventory Type:</span> {highlightText(product.inventoryType, unallocatedSearchQuery, '#EA4315', product)}
                    </div>
                    
                    {/* Show bin assignments if this product is selected and bins are assigned */}
                    {selectedUnallocatedProducts.includes(product.id) && selectedBinsForAssignment.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-1">
                          {selectedBinsForAssignment.map((binId, index) => {
                            const binLocation = getBinLocationDetails(binId, doorShelfConfig);
                            return binLocation ? (
                              <div key={binId} className="text-xs text-blue-600 font-medium">
                                {binLocation}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Actions */}
      {selectedUnallocatedProducts.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">

          
          <div className="flex gap-2">
            <div 
              className={`bg-white relative rounded-[4px] flex-1 ${selectedUnallocatedProducts.length === 0 && selectedBinsForAssignment.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={selectedUnallocatedProducts.length === 0 && selectedBinsForAssignment.length === 0 ? undefined : onClearSelection}
            >
              <div aria-hidden="true" className="absolute border border-[#095192] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-row items-center justify-center relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-center px-3 py-2 relative size-full">
                  <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#095192] text-[14px] text-nowrap">
                    <p className="leading-[20px] whitespace-pre text-[14px]">Clear Selection</p>
                  </div>
                </div>
              </div>
            </div>
            {selectedBinsForAssignment.length > 0 && (
              <div 
                className="bg-[#095192] relative rounded-[4px] cursor-pointer flex-1"
                onClick={onConfirmAssignment}
              >
                <div className="flex flex-row items-center justify-center relative size-full">
                  <div className="box-border content-stretch flex gap-2 items-center justify-center px-3 py-2 relative size-full">
                    <Check className="w-4 h-4 text-white" />
                    <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
                      <p className="leading-[20px] whitespace-pre text-[14px]">Assign</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}