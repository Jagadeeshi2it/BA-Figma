import React, { useState } from 'react';
import InteractiveIconContainer from "./InteractiveIconContainer";
import ContextMenu from "./ContextMenu";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [selectedInventoryView, setSelectedInventoryView] = useState('All Products');

  const handleInventoryClick = () => {
    setShowContextMenu(!showContextMenu);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleMenuSelect = (selection: string) => {
    setSelectedInventoryView(selection);
    
    // You can add additional logic here to handle different inventory views
    switch (selection) {
      case 'All Products':
        console.log('Switching to All Products view');
        break;
      case 'Serial Lookup':
        console.log('Switching to Serial Lookup view');
        break;
      case 'Allocation':
        console.log('Switching to Allocation view');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      {/* Sidebar */}
      <div className={`w-[60px] min-w-[60px] flex-shrink-0 h-full ${className}`.trim()}>
        <InteractiveIconContainer onInventoryClick={handleInventoryClick} />
      </div>

      {/* Context Menu positioned 8px from sidebar */}
      <ContextMenu
        isOpen={showContextMenu}
        onClose={handleCloseContextMenu}
        onMenuSelect={handleMenuSelect}
        className="left-[68px] top-[250px]"
      />
    </div>
  );
}