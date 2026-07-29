import React from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { X } from "lucide-react";
import { Bin } from '../types';
import { getVialType } from '../utils/binProducts';

// Helper function to properly pluralize medical units
const pluralizeUnit = (unit: string, quantity: number): string => {
  if (quantity <= 1) return unit;
  
  // Handle common medical unit pluralizations
  const lowerUnit = unit.toLowerCase();
  
  // Handle abbreviations that shouldn't be pluralized
  if (unit.includes('.') || lowerUnit === 'via' || lowerUnit === 'via.') {
    return unit; // Keep abbreviations as-is
  }
  
  // Handle specific medical units
  switch (lowerUnit) {
    case 'vial':
      return 'vials';
    case 'syringe':
      return 'syringes';
    case 'tablet':
      return 'tablets';
    case 'capsule':
      return 'capsules';
    case 'dose':
      return 'doses';
    case 'each':
      return 'each'; // "each" doesn't pluralize
    case 'ml':
    case 'mg':
    case 'mcg':
    case 'g':
    case 'unit':
    case 'units':
      return unit; // Medical measurements typically don't change
    default:
      // For other units, try standard English pluralization
      if (lowerUnit.endsWith('s') || lowerUnit.endsWith('x')) {
        return unit; // Already plural or doesn't follow standard rules
      }
      return unit + 's';
  }
};

interface BinInventoryPanelProps {
  bin: Bin | undefined;
  onClose: () => void;
}

export default function BinInventoryPanel({ bin, onClose }: BinInventoryPanelProps) {
  if (!bin) return null;

  const getBinSizeLabel = (size: string): string => {
    switch (size) {
      case 'double': return 'Double Bin';
      case '2x2': return '2x2 Bin';
      case '2x3': return '2x3 Bin';
      case '3x3': return '3x3 Bin';
      default: return 'Single Bin';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[320px] bg-white border-l border-gray-200 shadow-lg z-10 flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {bin.name} Inventory
            </h2>
            <div className="text-sm text-gray-500 mt-1">
              {getBinSizeLabel(bin.size)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {bin.available ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <div className="text-lg mb-2">Empty Bin</div>
                <div className="text-sm">No products currently allocated</div>
                <div className="text-xs mt-1">({getBinSizeLabel(bin.size)})</div>
              </div>
            </div>
          ) : (
            bin.products.map((product) => (
              <Card key={product.id} className="border border-gray-200">
                <CardContent className="p-4 m-[0px]">
                  <div className="space-y-1">
                    <div className="flex items-start">
                      <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                        {product.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="ml-1 bg-[#000000] text-[#ffffff] text-[8px] px-1 py-0.5 rounded shrink-0"
                      >
                        {getVialType(product)}
                      </Badge>
                    </div>
                    
                    {product.description && (
                      <p className="text-xs text-gray-600 leading-relaxed text-[12px]">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 text-[12px]">
                      <span className="font-medium">NDC:</span> {product.ndc}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-[12px] text-[11px]">
                      <span className="font-medium">Inventory Type:</span> {product.inventoryType}
                    </div>
                    
                    <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                      <span className="text-xs font-medium text-gray-700 text-[12px]">Qty:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {product.quantity} {pluralizeUnit(product.unit, product.quantity)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}