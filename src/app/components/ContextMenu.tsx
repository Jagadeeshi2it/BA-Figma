import React, { useState } from 'react';
import svgPaths from "../imports/svg-dli5qmg33t";

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuSelect?: (selection: string) => void;
  className?: string;
}

type MenuState = 'default' | 'hover' | 'clicked';

interface MenuItemProps {
  label: string;
  state: MenuState;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function MenuItem({ label, state, isActive, isHovered, onClick, onMouseEnter, onMouseLeave }: MenuItemProps) {
  const getBackgroundColor = () => {
    if (isActive) return 'bg-[#095192]';
    if (isHovered) return 'bg-[#edf1f6]';
    return 'bg-[#ffffff]';
  };

  const getTextColor = () => {
    if (isActive) return 'text-[#ffffff]';
    return 'text-[#25282a]';
  };

  const shouldShowArrow = isActive;

  return (
    <div 
      className={`h-9 relative shrink-0 w-full cursor-pointer transition-colors duration-150 ${getBackgroundColor()}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row h-9 items-center justify-between px-3 py-[9px] relative w-full">
          <div className={`font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[14px] text-left text-nowrap ${getTextColor()}`}>
            <p className="block leading-[normal] whitespace-pre">
              {label}
            </p>
          </div>
          {shouldShowArrow && (
            <div className="h-2 relative shrink-0 w-[5px]" data-name="Vector">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 5 8"
              >
                <path
                  clipRule="evenodd"
                  d={svgPaths.p3da5e380}
                  fill="var(--fill-0, white)"
                  fillRule="evenodd"
                  id="Vector"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContextMenu({ isOpen, onClose, onMenuSelect, className = '' }: ContextMenuProps) {
  const [activeItem, setActiveItem] = useState<string>('All Products');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const menuItems = [
    { id: 'all-products', label: 'All Products' },
    { id: 'serial-lookup', label: 'Serial Lookup' },
    { id: 'allocation', label: 'Allocation' }
  ];

  const handleItemClick = (label: string) => {
    setActiveItem(label);
    
    // Call parent callback if provided
    if (onMenuSelect) {
      onMenuSelect(label);
    }
    
    // Handle different menu selections
    switch (label) {
      case 'All Products':
        console.log('All Products view selected - showing complete inventory');
        break;
      case 'Serial Lookup':
        console.log('Serial Lookup selected - enabling serial number search');
        break;
      case 'Allocation':
        console.log('Allocation view selected - showing allocation interface');
        break;
      default:
        break;
    }

    // Close menu after a short delay to show the selection
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleItemHover = (label: string) => {
    setHoveredItem(label);
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
  };

  return (
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div className={`fixed z-50 w-[180px] ${className}`.trim()}>
        <div className="bg-[#ffffff] relative rounded size-full shadow-lg border border-[#dadee3]">
          <div className="box-border content-stretch flex flex-col items-start justify-start overflow-clip p-0 relative size-full rounded">
            {menuItems.map((item) => (
              <MenuItem
                key={item.id}
                label={item.label}
                state={activeItem === item.label ? 'clicked' : hoveredItem === item.label ? 'hover' : 'default'}
                isActive={activeItem === item.label}
                isHovered={hoveredItem === item.label}
                onClick={() => handleItemClick(item.label)}
                onMouseEnter={() => handleItemHover(item.label)}
                onMouseLeave={handleItemLeave}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}