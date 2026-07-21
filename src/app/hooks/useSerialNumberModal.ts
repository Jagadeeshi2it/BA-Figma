import { useState, useMemo } from 'react';
import { ProductTransfer } from '../types';

export function useSerialNumberModal(doorShelfConfig: any) {
  const [showSerialNumberModal, setShowSerialNumberModal] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState<ProductTransfer[]>([]);
  const [currentTransferIndex, setCurrentTransferIndex] = useState(0);
  const [collectedSerialNumbers, setCollectedSerialNumbers] = useState<{ [transferId: string]: string[] }>({});

  // Check if any transfers require serial numbers (all moves with quantity > 0)
  const hasSerialRequiredTransfers = useMemo(() => (transfers: ProductTransfer[]) => {
    // Serial numbers are now required for ANY product move (quantity > 0) between bins
    return transfers.some(transfer => transfer.quantity > 0);
  }, []);

  // Handle multi-transfer serial number confirmation for all product moves
  const handleSerialNumberConfirm = (transfers: ProductTransfer[], serialNumbers: { [transferId: string]: string[] }, onConfirmAllocation: (transfers: ProductTransfer[]) => void) => {
    console.log('🔧 Multi-Transfer Serial Number Confirmation:', {
      transfersReceived: transfers.length,
      pendingTransfers: pendingTransfers.length,
      serialNumberKeys: Object.keys(serialNumbers),
      serialNumbers: Object.entries(serialNumbers).map(([id, serials]) => ({
        transferId: id,
        serialCount: serials.length,
        serials: serials.slice(0, 3) // Show first 3 for debugging
      }))
    });

    // Use ALL original transfers including allocations (quantity = 0) that don't require serials
    const allOriginalTransfers = (window as any).allOriginalTransfers || pendingTransfers;
    
    console.log('🔧 Processing All Original Transfers:', {
      allOriginalTransfers: allOriginalTransfers.length,
      pendingTransfers: pendingTransfers.length,
      hasStoredOriginalTransfers: !!(window as any).allOriginalTransfers,
      mixedScenario: allOriginalTransfers.length > pendingTransfers.length
    });

    // Apply serial numbers to ALL original transfers
    const transfersWithSerials = allOriginalTransfers.map(transfer => {
      const transferId = `${transfer.productId}-${transfer.toBinId}`;
      return {
        ...transfer,
        serialNumbers: serialNumbers[transferId] || []
      };
    });
    
    // Confirm all transfers at once
    onConfirmAllocation(transfersWithSerials);
    
    // Reset state and clean up stored transfers
    setPendingTransfers([]);
    setCurrentTransferIndex(0);
    setCollectedSerialNumbers({});
    setShowSerialNumberModal(false);
    delete (window as any).allOriginalTransfers;
  };

  const handleSerialNumberBack = (setShowChangeAllocationModal: (show: boolean) => void) => {
    if (currentTransferIndex > 0) {
      // Go back to previous transfer
      setCurrentTransferIndex(currentTransferIndex - 1);
    } else {
      // Go back to change allocation modal
      setShowSerialNumberModal(false);
      setShowChangeAllocationModal(true);
      setCurrentTransferIndex(0);
      setCollectedSerialNumbers({});
    }
  };

  // CRITICAL FIX: Initialize multi-transfer serial number modal
  const initializeSerialNumberModal = (transfers: ProductTransfer[]) => {
    console.log('🔧 Initializing Multi-Transfer Serial Number Modal:', {
      transferCount: transfers.length,
      transfers: transfers.map(t => ({
        productId: t.productId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        fromBinId: t.fromBinId
      }))
    });
    
    setPendingTransfers(transfers);
    setCurrentTransferIndex(0);
    setCollectedSerialNumbers({});
    setShowSerialNumberModal(true);
  };

  return {
    showSerialNumberModal,
    setShowSerialNumberModal,
    pendingTransfers,
    currentTransferIndex,
    collectedSerialNumbers,
    hasSerialRequiredTransfers,
    handleSerialNumberConfirm,
    handleSerialNumberBack,
    initializeSerialNumberModal
  };
}