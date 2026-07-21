import { AllocationHistoryEntry, DoorShelfConfig } from '../types';
import { getBinLocationDetails } from './doorUtils';

/**
 * Utility functions for handling history entries and source bin resolution
 */

/**
 * Attempts to resolve source bin information for history entries that don't have it
 * This is used for backward compatibility with entries created before the fix
 */
export const resolveSourceBinFromEntry = (
  entry: AllocationHistoryEntry,
  doorShelfConfig: DoorShelfConfig
): { binId: string; binName: string; shelfName: string; doorNumber: string; cabinetNumber: string } | null => {
  // If entry already has sourceBin, return it
  if (entry.sourceBin) {
    return entry.sourceBin;
  }

  // For move transactions, try to infer source from entry metadata
  if (entry.transactionType === 'Product moved' && entry.action === 'move') {
    // Look for any clues in the entry ID or other metadata
    const entryId = entry.id;
    
    // Check if this is an E-Kit transaction (they have specific ID patterns)
    const isEKitTransaction = (entry as any).isEKitTransaction || entryId.includes('ekit');
    
    if (isEKitTransaction) {
      // For E-Kit transactions, check if there's a paired allocation entry
      // that might have source information
      return null; // Let calling code handle E-Kit specific logic
    }

    // For regular moves, we don't have enough information to reliably 
    // determine the source bin without additional context
    return null;
  }

  // For allocations, there typically isn't a source bin (new allocations)
  return null;
};

/**
 * Enhanced source bin resolution that tries multiple strategies
 */
export const getSourceBinInfo = (
  entry: AllocationHistoryEntry,
  doorShelfConfig: DoorShelfConfig,
  allHistory?: AllocationHistoryEntry[]
): { binId: string; binName: string; shelfName: string; doorNumber: string; cabinetNumber: string } | null => {
  // Strategy 1: Use existing sourceBin if available
  if (entry.sourceBin) {
    return entry.sourceBin;
  }

  // Strategy 2: Use the utility to resolve from entry data
  const resolvedSource = resolveSourceBinFromEntry(entry, doorShelfConfig);
  if (resolvedSource) {
    return resolvedSource;
  }

  // Strategy 3: For E-Kit transactions, look for paired entries
  if ((entry as any).isEKitTransaction && allHistory) {
    const originalTransactionId = (entry as any).originalTransactionId;
    if (originalTransactionId) {
      // Find the paired allocation entry which might have different source info
      const pairedEntry = allHistory.find(h => 
        (h as any).originalTransactionId === originalTransactionId && 
        h.id !== entry.id
      );
      if (pairedEntry?.sourceBin) {
        return pairedEntry.sourceBin;
      }
    }
  }

  // Strategy 4: For move entries, check if we can infer from target bin patterns
  if (entry.transactionType === 'Product moved' && entry.bins.length > 0) {
    // If all target bins are Emergency Kit bins, we might be able to infer
    // the source was a regular bin (but this is speculative)
    const allTargetsAreEKit = entry.bins.every(bin => {
      const doorNum = parseInt(bin.doorNumber);
      return doorNum >= 17 && doorNum <= 19; // Emergency Kit doors
    });

    if (allTargetsAreEKit) {
      // This was likely a move TO Emergency Kit, but we still can't 
      // determine the specific source bin without more context
      return null;
    }
  }

  // No source information available
  return null;
};

/**
 * Migrates existing history entries to include source bin information where possible
 * This is a one-time operation to backfill missing data
 */
export const migrateHistoryEntriesWithSourceBin = (
  history: AllocationHistoryEntry[],
  doorShelfConfig: DoorShelfConfig
): AllocationHistoryEntry[] => {
  return history.map(entry => {
    // Skip if entry already has sourceBin
    if (entry.sourceBin) {
      return entry;
    }

    // Try to resolve source bin information
    const sourceBinInfo = getSourceBinInfo(entry, doorShelfConfig, history);
    
    if (sourceBinInfo) {
      return {
        ...entry,
        sourceBin: sourceBinInfo
      };
    }

    // Return entry unchanged if no source info could be determined
    return entry;
  });
};

/**
 * Checks if a history entry represents a move transaction that should have source info
 */
export const shouldHaveSourceBin = (entry: AllocationHistoryEntry): boolean => {
  return entry.transactionType === 'Product moved' && entry.action === 'move';
};

/**
 * Gets a user-friendly display name for source bin or fallback message
 */
export const getSourceDisplayName = (
  entry: AllocationHistoryEntry,
  doorShelfConfig: DoorShelfConfig,
  allHistory?: AllocationHistoryEntry[]
): string => {
  const sourceBinInfo = getSourceBinInfo(entry, doorShelfConfig, allHistory);
  
  if (sourceBinInfo) {
    return sourceBinInfo.binName;
  }

  // Check if this entry should have source information
  if (shouldHaveSourceBin(entry)) {
    // Provide more specific fallback messages based on entry type
    if ((entry as any).isEKitTransaction) {
      return "Emergency Kit Source";
    }
    return "Previous Location";
  }

  // For allocations, "Unknown Source" is expected
  return "New Allocation";
};

/**
 * Gets detailed source location string or fallback
 */
export const getSourceLocationDisplay = (
  entry: AllocationHistoryEntry,
  doorShelfConfig: DoorShelfConfig,
  allHistory?: AllocationHistoryEntry[]
): string => {
  const sourceBinInfo = getSourceBinInfo(entry, doorShelfConfig, allHistory);
  
  if (sourceBinInfo) {
    return `Cabinet ${sourceBinInfo.cabinetNumber}, Door ${sourceBinInfo.doorNumber}, ${sourceBinInfo.shelfName}`;
  }

  // Provide context-aware fallback messages
  if (shouldHaveSourceBin(entry)) {
    if ((entry as any).isEKitTransaction) {
      return "From Emergency Kit inventory";
    }
    return "Source location not recorded";
  }

  return "Direct allocation to bin";
};