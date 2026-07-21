/**
 * Emergency Kit Service - Independent Business Logic Module
 * 
 * This service encapsulates ALL Emergency Kit business logic in a single,
 * independent module following SOLID principles and clean architecture.
 * 
 * BUSINESS RULES:
 * 1. Serial numbers are ONLY required for MOVES (quantity > 0) to Emergency Kits
 * 2. Serial numbers are NOT required for ALLOCATIONS (quantity = 0) to Emergency Kits  
 * 3. Only "Purchased" inventory type can be MOVED (quantity > 0) to Emergency Kits
 * 4. Any inventory type can be ALLOCATED (quantity = 0) to Emergency Kits
 * 5. Emergency Kits are identified by floor doors (Door 17, 18, 19)
 * 
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Only handles E-Kit logic
 * - Open/Closed: Can be extended without modifying existing code
 * - Dependency Inversion: Depends on abstractions, not concretions
 * - Interface Segregation: Provides only needed methods
 * - No side effects: Pure functions where possible
 */

import { ProductTransfer } from '../types';

// Emergency Kit Configuration Interface
export interface EmergencyKitConfig {
  floorDoors: string[]; // Emergency Kit door identifiers
  allowedInventoryTypes: {
    allocation: string[]; // Inventory types allowed for allocations
    move: string[];       // Inventory types allowed for moves
  };
  requiresSerialNumbers: {
    allocation: boolean;  // Whether allocations require serial numbers
    move: boolean;        // Whether moves require serial numbers
  };
}

// Default Emergency Kit Configuration
export const DEFAULT_EMERGENCY_KIT_CONFIG: EmergencyKitConfig = {
  floorDoors: ['Door 17', 'Door 18', 'Door 19'],
  allowedInventoryTypes: {
    allocation: ['Purchased', 'Charity Care', 'Sample', 'Specialty Pharmacy'], // All types
    move: ['Purchased'] // Only purchased
  },
  requiresSerialNumbers: {
    allocation: false, // No serial numbers for allocations
    move: true        // Serial numbers required for moves
  }
};

// Transfer validation result
export interface TransferValidationResult {
  isValid: boolean;
  requiresSerial: boolean;
  reason?: string;
  operationType: 'allocation' | 'move';
}

// Door configuration type
export interface DoorShelfConfig {
  [doorKey: string]: Array<{
    name: string;
    bins: Array<{
      id: string;
      name: string;
      products: any[];
    }>;
  }>;
}

/**
 * Emergency Kit Service Class
 * Provides all Emergency Kit related functionality as an independent service
 */
export class EmergencyKitService {
  private config: EmergencyKitConfig;

  constructor(config: EmergencyKitConfig = DEFAULT_EMERGENCY_KIT_CONFIG) {
    this.config = config;
  }

  /**
   * Checks if a door is an Emergency Kit door
   */
  public isEmergencyKitDoor(doorKey: string): boolean {
    return this.config.floorDoors.includes(doorKey);
  }

  /**
   * Finds which door a bin belongs to
   */
  public findBinDoor(binId: string, doorShelfConfig: DoorShelfConfig): string | null {
    for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
      for (const shelf of shelves) {
        if (shelf.bins.some(bin => bin.id === binId)) {
          return doorKey;
        }
      }
    }
    return null;
  }

  /**
   * Checks if a specific bin is in an Emergency Kit
   */
  public isBinInEmergencyKit(binId: string, doorShelfConfig: DoorShelfConfig): boolean {
    const doorKey = this.findBinDoor(binId, doorShelfConfig);
    return doorKey ? this.isEmergencyKitDoor(doorKey) : false;
  }

  /**
   * Determines the operation type of a transfer
   */
  public getOperationType(transfer: ProductTransfer): 'allocation' | 'move' {
    return transfer.quantity === 0 ? 'allocation' : 'move';
  }

  /**
   * Checks if an inventory type is allowed for a specific operation to Emergency Kit
   */
  public isInventoryTypeAllowed(inventoryType: string, operationType: 'allocation' | 'move'): boolean {
    const allowedTypes = this.config.allowedInventoryTypes[operationType];
    return allowedTypes.includes(inventoryType);
  }

  /**
   * Determines if a transfer requires serial numbers
   */
  public requiresSerialNumbers(transfer: ProductTransfer, doorShelfConfig: DoorShelfConfig): boolean {
    const isToEmergencyKit = this.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig);
    const isFromEmergencyKit = this.isBinInEmergencyKit(transfer.fromBinId, doorShelfConfig);
    
    // Serial numbers required when moving TO Emergency Kit
    if (isToEmergencyKit) {
      const operationType = this.getOperationType(transfer);
      return this.config.requiresSerialNumbers[operationType];
    }
    
    // Serial numbers also required when moving FROM Emergency Kit
    if (isFromEmergencyKit) {
      const operationType = this.getOperationType(transfer);
      return this.config.requiresSerialNumbers[operationType];
    }

    return false;
  }

  /**
   * Validates a single transfer against Emergency Kit business rules
   */
  public validateTransfer(
    transfer: ProductTransfer, 
    inventoryType: string, 
    doorShelfConfig: DoorShelfConfig
  ): TransferValidationResult {
    const operationType = this.getOperationType(transfer);
    const isToEmergencyKit = this.isBinInEmergencyKit(transfer.toBinId, doorShelfConfig);
    
    // If not targeting Emergency Kit, no restrictions apply
    if (!isToEmergencyKit) {
      return {
        isValid: true,
        requiresSerial: false,
        operationType
      };
    }

    // Check inventory type restrictions for Emergency Kit
    const isInventoryTypeAllowed = this.isInventoryTypeAllowed(inventoryType, operationType);
    
    if (!isInventoryTypeAllowed) {
      return {
        isValid: false,
        requiresSerial: this.config.requiresSerialNumbers[operationType],
        reason: `Only "${this.config.allowedInventoryTypes[operationType].join('", "')}" inventory type(s) can be ${operationType === 'move' ? 'moved' : 'allocated'} to E-Kit`,
        operationType
      };
    }

    // Transfer is valid for Emergency Kit
    return {
      isValid: true,
      requiresSerial: this.config.requiresSerialNumbers[operationType],
      operationType
    };
  }

  /**
   * Validates multiple transfers and returns results for each
   */
  public validateTransfers(
    transfers: ProductTransfer[],
    getInventoryType: (productId: string) => string,
    doorShelfConfig: DoorShelfConfig
  ): Array<TransferValidationResult & { transfer: ProductTransfer }> {
    return transfers.map(transfer => ({
      transfer,
      ...this.validateTransfer(transfer, getInventoryType(transfer.productId), doorShelfConfig)
    }));
  }

  /**
   * Filters transfers that require serial numbers
   */
  public getTransfersRequiringSerialNumbers(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): ProductTransfer[] {
    return transfers.filter(transfer => this.requiresSerialNumbers(transfer, doorShelfConfig));
  }

  /**
   * Checks if any transfers in a list require serial numbers
   */
  public hasTransfersRequiringSerialNumbers(
    transfers: ProductTransfer[],
    doorShelfConfig: DoorShelfConfig
  ): boolean {
    return this.getTransfersRequiringSerialNumbers(transfers, doorShelfConfig).length > 0;
  }

  /**
   * Gets Emergency Kit business rules summary for a bin
   */
  public getBusinessRulesForBin(binId: string, doorShelfConfig: DoorShelfConfig): {
    isEmergencyKit: boolean;
    doorKey: string | null;
    rules: {
      serialNumbersRequired: {
        allocation: boolean;
        move: boolean;
      };
      allowedInventoryTypes: {
        allocation: string[];
        move: string[];
      };
    };
  } {
    const doorKey = this.findBinDoor(binId, doorShelfConfig);
    const isEmergencyKit = doorKey ? this.isEmergencyKitDoor(doorKey) : false;

    return {
      isEmergencyKit,
      doorKey,
      rules: {
        serialNumbersRequired: {
          allocation: isEmergencyKit ? this.config.requiresSerialNumbers.allocation : false,
          move: isEmergencyKit ? this.config.requiresSerialNumbers.move : false
        },
        allowedInventoryTypes: {
          allocation: isEmergencyKit ? this.config.allowedInventoryTypes.allocation : [],
          move: isEmergencyKit ? this.config.allowedInventoryTypes.move : []
        }
      }
    };
  }

  /**
   * Updates the Emergency Kit configuration
   * Allows for runtime configuration changes without affecting other systems
   */
  public updateConfig(newConfig: Partial<EmergencyKitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current Emergency Kit configuration
   */
  public getConfig(): Readonly<EmergencyKitConfig> {
    return Object.freeze({ ...this.config });
  }
}

// Singleton instance for application-wide use
export const emergencyKitService = new EmergencyKitService();

// Export types and default config for external use
export type { EmergencyKitConfig, TransferValidationResult, DoorShelfConfig };