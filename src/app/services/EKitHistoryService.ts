/**
 * E-Kit History Service - Independent History Management for Emergency Kit Transactions
 * 
 * This service ensures that when targeting an E-Kit, both allocation and bin change activities
 * are recorded separately as distinct transactions, maintaining complete audit trail.
 * 
 * BUSINESS RULES:
 * 1. E-Kit transactions must record BOTH allocation and move activities separately
 * 2. Each activity type gets its own unique history entry with proper timestamps
 * 3. This logic is completely isolated from regular transaction history
 * 4. Serial numbers are properly tracked for both activity types
 * 
 * DESIGN PRINCIPLES:
 * - Complete isolation from existing history logic
 * - Maintains backward compatibility
 * - No impact on non-E-Kit transactions
 * - Ensures comprehensive audit trail for E-Kit operations
 */

import { AllocationHistoryEntry, ProductTransfer, DoorShelfConfig } from '../types';
import { emergencyKitService } from './EmergencyKitService';
import { productDataService } from './ProductDataService';
import { getBinLocationDetails } from '../utils/doorUtils';

// E-Kit specific history entry interface
export interface EKitHistoryEntry extends AllocationHistoryEntry {
  isEKitTransaction: boolean;
  originalTransactionId?: string; // Links related allocation and move entries
  activityType: 'allocation' | 'move';
  serialNumbers?: string[];
}

/**
 * E-Kit History Service Class
 * Handles dual activity recording specifically for E-Kit transactions
 */
export class EKitHistoryService {
  
  /**
   * Determines if any transfers in a transaction target E-Kit bins
   */
  public hasEKitTargets(transfers: ProductTransfer[], doorShelfConfig: DoorShelfConfig): boolean {
    return transfers.some(transfer => 
      emergencyKitService.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig)
    );
  }

  /**
   * Separates transfers into E-Kit and non-E-Kit transfers
   */
  public separateEKitTransfers(
    transfers: ProductTransfer[], 
    doorShelfConfig: DoorShelfConfig
  ): {
    eKitTransfers: ProductTransfer[];
    regularTransfers: ProductTransfer[];
  } {
    const eKitTransfers: ProductTransfer[] = [];
    const regularTransfers: ProductTransfer[] = [];

    console.log('🔍 Separating E-Kit Transfers:', {
      totalTransfers: transfers.length,
      transferDetails: transfers.map(t => ({
        productId: t.productId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        isEKit: emergencyKitService.isBinInEmergencyKit(t.toBinId, doorShelfConfig)
      }))
    });

    transfers.forEach(transfer => {
      const isEKit = emergencyKitService.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig);
      if (isEKit) {
        eKitTransfers.push(transfer);
        console.log('✅ E-Kit Transfer:', {
          productId: transfer.productId,
          toBinId: transfer.toBinId,
          quantity: transfer.quantity
        });
      } else {
        regularTransfers.push(transfer);
        console.log('✅ Regular Transfer:', {
          productId: transfer.productId,
          toBinId: transfer.toBinId,
          quantity: transfer.quantity
        });
      }
    });

    console.log('📊 Transfer Separation Result:', {
      eKitTransfers: eKitTransfers.length,
      regularTransfers: regularTransfers.length,
      totalProcessed: eKitTransfers.length + regularTransfers.length
    });

    return { eKitTransfers, regularTransfers };
  }

  /**
   * Creates dual history entries for E-Kit transactions
   * Ensures both allocation and move activities are recorded separately
   * 
   * CRITICAL BUSINESS RULE: Every E-Kit transaction must create BOTH activities:
   * 1. Allocation activity (quantity = 0) - Shows product was allocated to E-Kit
   * 2. Move activity (actual quantity) - Shows actual quantity moved to E-Kit
   */
  public createEKitHistoryEntries(
    eKitTransfers: ProductTransfer[],
    sourceBinId: string,
    doorShelfConfig: DoorShelfConfig,
    serialNumbers?: { [transferId: string]: string[] },
    existingQuantitiesMap?: Map<string, number>
  ): EKitHistoryEntry[] {
    if (eKitTransfers.length === 0) return [];

    const historyEntries: EKitHistoryEntry[] = [];
    const baseTransactionId = `ekit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseTimestamp = new Date();

    // CRITICAL FIX: For E-Kit transactions, respect the original transaction type
    // Only create the appropriate history entry based on the original transfer type
    
    // Separate E-Kit transfers by their original transaction type
    const allocationTransfers = eKitTransfers.filter(transfer => transfer.quantity === 0);
    const moveTransfers = eKitTransfers.filter(transfer => transfer.quantity > 0);
    
    console.log('🔧 E-Kit Transaction Type Analysis:', {
      totalEKitTransfers: eKitTransfers.length,
      allocationTransfers: allocationTransfers.length,
      moveTransfers: moveTransfers.length,
      allocationTransferDetails: allocationTransfers.map(t => ({
        productId: t.productId,
        toBinId: t.toBinId,
        quantity: t.quantity
      })),
      moveTransferDetails: moveTransfers.map(t => ({
        productId: t.productId,
        toBinId: t.toBinId,
        quantity: t.quantity
      }))
    });
    
    // Create allocation entry only if there were allocation transfers
    if (allocationTransfers.length > 0) {
      console.log('📝 Creating E-Kit allocation entry for', allocationTransfers.length, 'transfers');
      const allocationEntry = this.createAllocationHistoryEntry(
        allocationTransfers,
        sourceBinId,
        doorShelfConfig,
        baseTransactionId,
        new Date(baseTimestamp.getTime()),
        serialNumbers,
        existingQuantitiesMap
      );
      historyEntries.push(allocationEntry);
    }
    
    // Create move entry only if there were move transfers
    if (moveTransfers.length > 0) {
      console.log('📝 Creating E-Kit move entry for', moveTransfers.length, 'transfers');
      const moveEntry = this.createMoveHistoryEntry(
        moveTransfers,
        sourceBinId,
        doorShelfConfig,
        baseTransactionId,
        new Date(baseTimestamp.getTime() + 1),
        serialNumbers,
        existingQuantitiesMap
      );
      historyEntries.push(moveEntry);
    }

    return historyEntries;
  }

  /**
   * Creates allocation-specific history entry for E-Kit transactions
   */
  private createAllocationHistoryEntry(
    allocationTransfers: ProductTransfer[],
    sourceBinId: string,
    doorShelfConfig: DoorShelfConfig,
    transactionId: string,
    timestamp: Date,
    serialNumbers?: { [transferId: string]: string[] },
    existingQuantitiesMap?: Map<string, number>
  ): EKitHistoryEntry {
    const products = this.buildProductHistoryData(allocationTransfers, doorShelfConfig, serialNumbers);
    const bins = this.buildBinHistoryData(allocationTransfers, doorShelfConfig, existingQuantitiesMap);

    return {
      id: `${transactionId}-allocation`,
      timestamp,
      products,
      bins,
      action: 'allocation',
      transactionType: 'New Bin Allocation',
      isEKitTransaction: true,
      originalTransactionId: transactionId,
      activityType: 'allocation'
    };
  }

  /**
   * Creates move-specific history entry for E-Kit transactions
   */
  private createMoveHistoryEntry(
    moveTransfers: ProductTransfer[],
    sourceBinId: string,
    doorShelfConfig: DoorShelfConfig,
    transactionId: string,
    timestamp: Date,
    serialNumbers?: { [transferId: string]: string[] },
    existingQuantitiesMap?: Map<string, number>
  ): EKitHistoryEntry {
    const products = this.buildProductHistoryData(moveTransfers, doorShelfConfig, serialNumbers);
    const bins = this.buildBinHistoryData(moveTransfers, doorShelfConfig, existingQuantitiesMap);
    
    // CRITICAL FIX: Add source bin information for E-Kit moves
    const sourceBinDetails = this.buildSourceBinData(sourceBinId, doorShelfConfig);

    const eKitMoveEntry = {
      id: `${transactionId}-move`,
      timestamp,
      products,
      bins,
      // Add source bin information to E-Kit move entries
      sourceBin: sourceBinDetails,
      action: 'move',
      transactionType: 'Product moved',
      isEKitTransaction: true,
      originalTransactionId: transactionId,
      activityType: 'move'
    };

    // Debug logging to verify E-Kit source bin information is included
    console.log('🚨 E-Kit Move Entry with Source Bin:', {
      entryId: eKitMoveEntry.id,
      hasSourceBin: !!eKitMoveEntry.sourceBin,
      sourceBinDetails: eKitMoveEntry.sourceBin,
      transactionType: eKitMoveEntry.transactionType,
      isEKitTransaction: eKitMoveEntry.isEKitTransaction
    });

    return eKitMoveEntry;
  }

  /**
   * Builds product history data with proper enhancement
   */
  private buildProductHistoryData(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig,
    serialNumbers?: { [transferId: string]: string[] }
  ): any[] {
    const uniqueProducts: { [productId: string]: any } = {};

    transfers.forEach(transfer => {
      if (!uniqueProducts[transfer.productId]) {
        // Enhance product data for consistent naming
        const enhancedProduct = productDataService.enhanceProduct({ id: transfer.productId });
        
        // Get serial numbers for this transfer if available
        const transferId = `${transfer.productId}-${transfer.toBinId}`;
        const transferSerials = serialNumbers ? serialNumbers[transferId] : undefined;

        uniqueProducts[transfer.productId] = {
          id: transfer.productId,
          name: enhancedProduct.name || `Product ${transfer.productId}`,
          ndc: enhancedProduct.ndc || 'Not Available',
          badge: enhancedProduct.inventoryType || 'Standard',
          quantity: transfer.quantity,
          unit: enhancedProduct.unit || 'vial',
          serialNumbers: transferSerials
        };
      } else {
        // Add to existing product's total quantity
        uniqueProducts[transfer.productId].quantity += transfer.quantity;
      }
    });

    return Object.values(uniqueProducts);
  }

  /**
   * Builds bin history data with location details
   */
  private buildBinHistoryData(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig,
    existingQuantitiesMap?: Map<string, number>
  ): any[] {
    const uniqueBins = Array.from(new Set(transfers.map(t => t.toBinId)))
      .map(binId => {
        const location = getBinLocationDetails(binId, doorShelfConfig);
        if (location) {
          const [binName, rest] = location.split(' - ');
          const [shelfName, doorPart, cabinetPart] = rest.split(', ');
          const doorNumber = doorPart.replace('Door ', '');
          const cabinetNumber = cabinetPart.replace('Cabinet ', '');

          // Calculate total quantity for this bin
          const totalQuantity = transfers
            .filter(t => t.toBinId === binId)
            .reduce((sum, t) => sum + t.quantity, 0);

          // Calculate existing quantity for this bin
          let existingQuantity = 0;
          if (existingQuantitiesMap) {
            transfers
              .filter(t => t.toBinId === binId)
              .forEach(transfer => {
                const key = `${transfer.productId}-${transfer.toBinId}`;
                const capturedExistingQty = existingQuantitiesMap.get(key) || 0;
                existingQuantity += capturedExistingQty;
              });
          }

          return {
            binId,
            binName,
            shelfName,
            doorNumber,
            cabinetNumber,
            quantity: totalQuantity,
            existingQuantity: existingQuantity
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    return uniqueBins;
  }

  /**
   * Builds source bin history data with location details
   * CRITICAL FIX: This ensures E-Kit moves have proper source bin information
   */
  private buildSourceBinData(
    sourceBinId: string,
    doorShelfConfig: DoorShelfConfig
  ): any {
    const location = getBinLocationDetails(sourceBinId, doorShelfConfig);
    if (location) {
      const [binName, rest] = location.split(' - ');
      const [shelfName, doorPart, cabinetPart] = rest.split(', ');
      const doorNumber = doorPart.replace('Door ', '');
      const cabinetNumber = cabinetPart.replace('Cabinet ', '');

      return {
        binId: sourceBinId,
        binName,
        shelfName,
        doorNumber,
        cabinetNumber
      };
    }
    return null;
  }

  /**
   * Validates E-Kit transfers and returns validation results
   */
  public validateEKitTransfers(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): Array<{
    transfer: ProductTransfer;
    isValid: boolean;
    requiresSerial: boolean;
    reason?: string;
    operationType: 'allocation' | 'move';
  }> {
    return transfers.map(transfer => {
      const operationType = transfer.quantity === 0 ? 'allocation' : 'move';
      const isToEKit = emergencyKitService.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig);
      
      if (!isToEKit) {
        return {
          transfer,
          isValid: true,
          requiresSerial: false,
          operationType
        };
      }

      // Use Emergency Kit Service for validation
      const enhancedProduct = productDataService.enhanceProduct({ id: transfer.productId });
      const validationResult = emergencyKitService.validateTransfer(
        transfer,
        enhancedProduct.inventoryType || 'Standard',
        doorShelfConfig
      );

      return {
        transfer,
        isValid: validationResult.isValid,
        requiresSerial: validationResult.requiresSerial,
        reason: validationResult.reason,
        operationType: validationResult.operationType
      };
    });
  }

  /**
   * Filters transfers that require serial numbers for E-Kit operations
   */
  public getEKitTransfersRequiringSerials(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): ProductTransfer[] {
    return transfers.filter(transfer => {
      const isToEKit = emergencyKitService.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig);
      if (!isToEKit) return false;
      
      return emergencyKitService.requiresSerialNumbers(transfer, doorShelfConfig);
    });
  }

  /**
   * Merges E-Kit history entries with regular history entries
   * Maintains proper chronological order
   */
  public mergeWithRegularHistory(
    eKitEntries: EKitHistoryEntry[],
    regularEntries: AllocationHistoryEntry[]
  ): AllocationHistoryEntry[] {
    // Debug logging to ensure dual activities are being created
    if (eKitEntries.length > 0) {
      console.log('🔥 E-Kit Dual Activity Recording:', {
        totalEKitEntries: eKitEntries.length,
        allocationEntries: eKitEntries.filter(e => e.activityType === 'allocation').length,
        moveEntries: eKitEntries.filter(e => e.activityType === 'move').length,
        entries: eKitEntries.map(e => ({
          id: e.id,
          activityType: e.activityType,
          transactionType: e.transactionType,
          timestamp: e.timestamp.toISOString()
        }))
      });
    }

    const allEntries = [...eKitEntries, ...regularEntries];
    
    // Sort by timestamp (newest first)
    return allEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Debug method to validate dual activity creation
   * This helps ensure that E-Kit transactions are generating both activities
   */
  public validateDualActivityCreation(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): {
    hasEKitTransfers: boolean;
    eKitTransferCount: number;
    expectedHistoryEntries: number;
    shouldCreateDualActivities: boolean;
  } {
    const { eKitTransfers } = this.separateEKitTransfers(transfers, doorShelfConfig);
    
    return {
      hasEKitTransfers: eKitTransfers.length > 0,
      eKitTransferCount: eKitTransfers.length,
      expectedHistoryEntries: eKitTransfers.length > 0 ? 2 : 0, // Always 2 for E-Kit (allocation + move)
      shouldCreateDualActivities: eKitTransfers.length > 0
    };
  }

  /**
   * Debug method for comprehensive E-Kit transaction analysis
   */
  public debugEKitTransaction(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): any {
    console.log('🔍 E-Kit Transaction Debug Analysis:');
    
    const { eKitTransfers, regularTransfers } = this.separateEKitTransfers(transfers, doorShelfConfig);
    
    const analysis = {
      totalTransfers: transfers.length,
      eKitTransfers: eKitTransfers.length,
      regularTransfers: regularTransfers.length,
      eKitTransferDetails: eKitTransfers.map(t => ({
        productId: t.productId,
        toBinId: t.toBinId,
        quantity: t.quantity,
        isEKit: emergencyKitService.isBinInEmergencyKit(t.toBinId, doorShelfConfig),
        operationType: t.quantity === 0 ? 'allocation' : 'move'
      })),
      expectedDualActivities: eKitTransfers.length > 0 ? 2 : 0
    };
    
    console.log(analysis);
    return analysis;
  }
}

// Singleton instance for application-wide use
export const eKitHistoryService = new EKitHistoryService();

// Make E-Kit History Service available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).eKitHistoryService = eKitHistoryService;
  
  // Add test function for E-Kit dual activity verification
  (window as any).testEKitDualActivity = (transfers: ProductTransfer[], doorShelfConfig: any) => {
    console.log('🧪 Testing E-Kit Dual Activity Creation...');
    
    const validation = eKitHistoryService.validateDualActivityCreation(transfers, doorShelfConfig);
    console.log('Validation Result:', validation);
    
    if (validation.hasEKitTransfers) {
      const entries = eKitHistoryService.createEKitHistoryEntries(
        eKitHistoryService.separateEKitTransfers(transfers, doorShelfConfig).eKitTransfers,
        'test-source-bin',
        doorShelfConfig
      );
      
      console.log('Generated Entries:', entries);
      console.log('✅ Dual Activity Test Complete:', {
        expectedEntries: 2,
        actualEntries: entries.length,
        hasAllocation: entries.some(e => e.activityType === 'allocation'),
        hasMove: entries.some(e => e.activityType === 'move'),
        success: entries.length === 2 && 
                 entries.some(e => e.activityType === 'allocation') && 
                 entries.some(e => e.activityType === 'move')
      });
      
      return entries;
    } else {
      console.log('ℹ️ No E-Kit transfers found in test data');
      return [];
    }
  };
}

// Export types for external use
export type { EKitHistoryEntry };