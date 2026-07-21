import React from 'react';
import { Bin } from '../types';
import { highlightText, highlightNDC } from '../utils/textHighlight';

// Simple string hash so each badge's random-looking assignment stays stable across
// re-renders (same product always gets the same result) instead of flipping every render.
const hashString = (s: string): number => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

// Deterministic pseudo-random SDV/MDV split, ~50/50 across products.
const getVialType = (product: any): 'SDV' | 'MDV' => {
  const key = `vial-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 2 === 0 ? 'MDV' : 'SDV';
};

// CLIMATE shows on about half of products; CIV (controlled substance) is rare (~1 in 12).
const hasClimateBadge = (product: any): boolean => {
  const key = `climate-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 2 === 0;
};

const hasCivBadge = (product: any): boolean => {
  const key = `civ-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 12 === 0;
};

interface BinCardProps {
  bin: Bin;
  isSelected?: boolean;
  highlightAvailable: boolean;
  highlightSearch?: boolean;
  isSelectedForAssignment?: boolean;
  isChangeAllocationSource?: boolean;
  isChangeAllocationTarget?: boolean;
  changeAllocationMode?: boolean;
  showUnallocatedProducts?: boolean;
  onClick: (binId: string) => void;
  onProductClick?: (product: any, location: any) => void;
  className?: string;
  style?: React.CSSProperties;
  selectedDoor?: string;
  searchQuery?: string;
}

export default function BinCard({
  bin,
  isSelected = false,
  highlightAvailable,
  highlightSearch = false,
  isSelectedForAssignment = false,
  isChangeAllocationSource = false,
  isChangeAllocationTarget = false,
  changeAllocationMode = false,
  showUnallocatedProducts = false,
  onClick,
  onProductClick,
  className = "",
  style,
  selectedDoor,
  searchQuery = ""
}: BinCardProps) {
  const [showAllProducts, setShowAllProducts] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Convert bin size to numerical format
  const getBinSizeDisplay = (size: string): string => {
    const sizeMap: { [key: string]: string } = {
      'single': '1x1',
      'double': '2x1',
      '2x2': '2x2',
      '2x3': '2x3',
      '3x3': '3x3',
      'fridge': 'Fridge',
      'floor': 'Floor'
    };
    return sizeMap[size] || size;
  };

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!showAllProducts) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAllProducts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAllProducts]);

  // Group identical products by name, NDC, and inventory type to avoid duplicates
  const consolidatedProducts = React.useMemo(() => {
    if (bin.available) return [];
    
    const groupedProducts = bin.products.reduce((acc, product) => {
      const key = `${product.name}-${product.ndc}-${product.inventoryType}`;
      if (!acc[key]) {
        acc[key] = {
          ...product,
          quantity: 0,
          productIds: [] // Keep track of original product IDs for click handling
        };
      }
      acc[key].quantity += product.quantity;
      acc[key].productIds.push(product.id);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedProducts);
  }, [bin.products, bin.available]);

  // Define doors where product limiting applies (extract number from "Door X" format)
  const doorsWithLimiting = ['1', '2', '3', '5', '6', '7', '9', '10', '11'];
  const doorNumber = selectedDoor ? selectedDoor.replace('Door ', '') : '';
  const shouldLimit = doorNumber && doorsWithLimiting.includes(doorNumber) && bin.size !== 'fridge';

  const visibleProducts = shouldLimit && consolidatedProducts.length > 3 
    ? consolidatedProducts.slice(0, 3) 
    : consolidatedProducts;
  const additionalCount = consolidatedProducts.length - visibleProducts.length;

  const renderProduct = (product: any) => {
    const isProductClickable = !changeAllocationMode && !showUnallocatedProducts && onProductClick;
    
    return (
      <div 
        key={product.id} 
        className={`box-border content-stretch flex flex-row items-start justify-between gap-2 p-0 relative shrink-0 w-full ${
          isProductClickable ? 'cursor-pointer hover:bg-gray-50 rounded transition-colors p-2' : ''
        }`}
        onClick={isProductClickable ? (e) => {
          e.stopPropagation();
          const location = {
            cabinet: 'Cabinet',
            door: selectedDoor || '',
            bin: bin.name,
            shelf: 'Shelf'
          };
          onProductClick(product, location);
          if (showAllProducts) {
            setShowAllProducts(false);
          }
        } : undefined}
      >
        <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
          <div className="w-full flex flex-col font-normal justify-center leading-[0] not-italic relative text-[#020817] text-xs text-left">
            <p className="block leading-[16px] text-[14px] text-[11px]">{highlightText(product.name, searchQuery, '#EA4315', product)}</p>
          </div>
          <div className="flex items-center gap-1 my-1">
            <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">{getVialType(product)}</span>
            {hasClimateBadge(product) && (
              <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
            )}
            {hasCivBadge(product) && (
              <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
            )}
          </div>
          <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-xs text-left w-full">
            <p className="block leading-[16px] break-words overflow-hidden text-[14px]">{highlightNDC(`${product.ndc} - ${product.inventoryType}`, searchQuery, '#EA4315', product)}</p>
          </div>
        </div>
        <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-12">
          <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
          <div className="flex flex-col font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-xs text-nowrap text-right">
            <p className="block leading-[16px] whitespace-pre text-[14px] text-[11px]">{product.quantity}</p>
          </div>
          <div className="flex flex-col font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[8px] text-left text-nowrap">
            <p className="block leading-[normal] whitespace-pre text-[10px] text-[9px]">{product.unit}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`relative rounded-lg cursor-pointer transition-all hover:shadow-md ${className} ${
          highlightSearch ? 'bg-[#FEFCE8]' : 
          isSelectedForAssignment && !changeAllocationMode ? 'bg-[#F7EFFE]' : 
          isChangeAllocationSource ? 'bg-[#E3F2FD]' :
          isChangeAllocationTarget ? 'bg-[#E8F5E8]' :
          'bg-white'
        } ${
          isSelected ? 'border-blue-500 border-[1px] border-solid' : ''
        } ${
          isSelectedForAssignment && !changeAllocationMode ? 'ring-1 ring-[#8F48D2]' : ''
        } ${
          isChangeAllocationSource ? 'ring-1 ring-blue-600' : ''
        } ${
          isChangeAllocationTarget ? 'ring-1 ring-green-600' : ''
        } ${
          highlightAvailable && bin.available ? 'border-green-500 border-2 border-solid' : ''
        } ${
          highlightSearch ? 'border-[#FACC14] border-2 border-solid' : ''
        } ${
          isSelectedForAssignment && !changeAllocationMode ? 'border-[#8F48D2] border-[1px] border-solid' : ''
        } ${
          isChangeAllocationSource ? 'border-blue-600 border-1 border-solid' : ''
        } ${
          isChangeAllocationTarget ? 'border-green-600 border-1 border-solid' : ''
        } ${
          bin.size === 'fridge' ? 'min-h-[140px]' : 'min-h-[140px]'
        }`}
        style={style}
        onClick={() => onClick(bin.id)}
      >
        {/* Source/Target Bin Label */}
        {isChangeAllocationSource && (
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] right-3 not-italic text-[#165dfc] text-[14px] text-nowrap text-right top-2">
            Source Bin
          </p>
        )}
        {isChangeAllocationTarget && (
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] right-3 not-italic text-[#359f5a] text-[14px] text-nowrap text-right top-2">
            Target Bin
          </p>
        )}
        
        <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-lg" />
        <div className="min-h-inherit relative size-full">
          <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-4 relative size-full">
            <div className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full mb-2">
              <div className="basis-0 flex flex-col font-bold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#020817] text-xs text-left">
                <p className="block leading-[12px] text-[14px]">
                  {bin.name} <span className="text-[#7A7D85]">({getBinSizeDisplay(bin.size)})</span>
                </p>
              </div>
            </div>
            
            {bin.available ? (
              <div className="flex items-center justify-center flex-1 text-gray-500 text-xs w-full text-[14px]">
                Available Bin
              </div>
            ) : (
              <>
                <div className={`box-border content-stretch pb-0 pt-0 px-0 relative shrink-0 w-full ${
                  bin.size === 'fridge' || (selectedDoor && ['Door 17', 'Door 18', 'Door 19'].includes(selectedDoor)) 
                    ? 'grid overflow-y-auto max-h-[700px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-[60px] gap-y-3' 
                    : 'flex flex-col gap-3'
                }`}>
                  {visibleProducts.map(renderProduct)}
                </div>
                
                {additionalCount > 0 && (
                  <div className="box-border content-stretch flex flex-row items-start justify-start p-2 relative shrink-0 w-full">
                    <button
                      className="flex flex-col font-normal justify-start items-start leading-[0] not-italic relative text-[#176cff] text-xs hover:underline cursor-pointer bg-transparent border-none min-h-[44px] min-w-[44px] pt-2 -mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllProducts(true);
                      }}
                    >
                      <p className="block leading-[16px] text-[14px] text-left">+{additionalCount} more</p>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Popover overlay */}
      {showAllProducts && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-8 transition-opacity duration-300 ease-in-out"
          onClick={() => setShowAllProducts(false)}
        >
          <div 
            ref={popoverRef}
            className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-5xl w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-100 opacity-100 animate-in"
            style={{
              animation: 'fadeInScale 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="box-border content-stretch flex flex-col items-start justify-start p-6 relative">
              <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-gray-200">
                <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative text-[#020817] text-xs text-left">
                  <p className="block leading-[12px] text-[16px]">{bin.name} ({getBinSizeDisplay(bin.size)}) - All Products</p>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none cursor-pointer bg-transparent border-none p-0"
                  onClick={() => setShowAllProducts(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full">
                {consolidatedProducts.map(renderProduct)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}