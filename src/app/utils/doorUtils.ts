import { DoorType, Bin, Shelf, Cabinet, DoorShelfConfig } from '../types';
import { cabinets } from '../data/cabinets';

// Get door type.
// Structured doors (Cabinets 1 & 2, doors 1-8) all render as a flat bin grid ('single'),
// since the real OCSRI bins carry no row/gridPosition metadata that the double/unique
// layouts depend on. Virtual doors (9-14) are handled separately via isFridgeDoor.
export const getDoorType = (doorName: string): DoorType => {
  return 'single';
};

// Get slots per shelf based on door type
export const getSlotsPerShelf = (doorName: string): number => {
  const doorType = getDoorType(doorName);
  switch (doorType) {
    case 'double': return 10; // 2 rows of 5 slots each = 10 total
    case 'unique': return 25; // 5x5 grid = 25 total
    case 'single': 
    default: return 5; // 1 row of 5 slots
  }
};

// Check if door is a double door (2 rows of 5 slots)
export const isDoubleDoor = (doorName: string): boolean => {
  return getDoorType(doorName) === 'double';
};

// Check if door is a unique door (5x5 grid)
export const isUniqueDoor = (doorName: string): boolean => {
  return getDoorType(doorName) === 'unique';
};

// Check if door is a fridge door (virtual cabinet doors 9-14 = bulk/pooled storage)
export const isFridgeDoor = (doorName: string): boolean => {
  const fridgeDoors = ["Door 9", "Door 10", "Door 11", "Door 12", "Door 13", "Door 14"];
  return fridgeDoors.includes(doorName);
};

// Check if door is a floor door (emergency kit cabinet doors)
export const isFloorDoor = (doorName: string): boolean => {
  const floorDoors = ["Door 17", "Door 18", "Door 19"];
  return floorDoors.includes(doorName);
};

// Split bins into rows for double doors based on row property
export const splitBinsIntoRows = (bins: Bin[], slotsPerRow: number = 5): [Bin[], Bin[]] => {
  // If bins have row property, use it to group them
  const binsWithRowInfo = bins.filter(bin => bin.row !== undefined);
  
  if (binsWithRowInfo.length > 0) {
    const row1 = bins.filter(bin => bin.row === 1);
    const row2 = bins.filter(bin => bin.row === 2);
    return [row1, row2];
  }
  
  // Fallback to old behavior for bins without row property
  const row1 = bins.slice(0, slotsPerRow);
  const row2 = bins.slice(slotsPerRow);
  return [row1, row2];
};

// Calculate available slots taking into account bin sizes
export const calculateAvailableSlots = (bins: Bin[], totalSlots: number): number => {
  const usedSlots = bins.reduce((total, bin) => {
    switch (bin.size) {
      case 'double': return total + 2;
      case '2x2': return total + 4;
      case '2x3': return total + 6;
      case '3x3': return total + 9;
      case 'fridge': return totalSlots; // Fridge bins take up all available space
      case 'floor': return totalSlots; // Floor bins take up all available space
      case 'single':
      default: return total + 1;
    }
  }, 0);
  return Math.max(0, totalSlots - usedSlots);
};

// Get bin size description
export const getBinSizeText = (size: string): string => {
  switch (size) {
    case 'double': return '';
    case '2x2': return '';
    case '2x3': return '';
    case '3x3': return '';
    default: return '';
  }
};

// Calculate cumulative available bins across all cabinets and doors
export const getAllAvailableBins = (doorShelfConfig: DoorShelfConfig): number => {
  const allDoors = cabinets.flatMap(cabinet => cabinet.doors);
  return allDoors.reduce((total, doorName) => {
    const shelves = doorShelfConfig[doorName] || [];
    const doorAvailableBins = shelves.reduce((doorTotal, shelf) => {
      return doorTotal + shelf.bins.filter(bin => bin.available).length;
    }, 0);
    return total + doorAvailableBins;
  }, 0);
};

// Get doors that contain available bins
export const getDoorsWithAvailableBins = (doorShelfConfig: DoorShelfConfig): string[] => {
  const allDoors = cabinets.flatMap(cabinet => cabinet.doors);
  return allDoors.filter(doorName => {
    const shelves = doorShelfConfig[doorName] || [];
    return shelves.some(shelf => 
      shelf.bins.some(bin => bin.available)
    );
  });
};

// Get shelves for a specific door
export const getCurrentShelves = (selectedDoor: string, doorShelfConfig: DoorShelfConfig): Shelf[] => {
  return doorShelfConfig[selectedDoor] || [];
};

// Initialize empty configs for doors without specific configurations
export const initializeDoorConfigs = (doorShelfConfig: DoorShelfConfig): DoorShelfConfig => {
  const allDoors = cabinets.flatMap(cabinet => cabinet.doors);
  const updatedConfig = { ...doorShelfConfig };
  
  allDoors.forEach(door => {
    if (!updatedConfig[door]) {
      updatedConfig[door] = [
        {
          id: `${door.toLowerCase().replace(' ', '_')}_shelf1`,
          name: "Shelf 1",
          bins: []
        },
        {
          id: `${door.toLowerCase().replace(' ', '_')}_shelf2`,
          name: "Shelf 2",
          bins: []
        },
        {
          id: `${door.toLowerCase().replace(' ', '_')}_shelf3`,
          name: "Shelf 3",
          bins: []
        },
        {
          id: `${door.toLowerCase().replace(' ', '_')}_shelf4`,
          name: "Shelf 4",
          bins: []
        }
      ];
    }
  });
  
  return updatedConfig;
};

// Search functionality to filter bins based on query
export const searchBins = (shelves: Shelf[], query: string): Shelf[] => {
  if (!query.trim()) return shelves;
  
  // Split query by commas and trim each term
  const searchTerms = query.split(',').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) return shelves;
  
  return shelves.map(shelf => ({
    ...shelf,
    bins: shelf.bins.filter(bin => {
      // For single term, use the original logic for backwards compatibility
      if (searchTerms.length === 1) {
        const searchTerm = searchTerms[0];
        
        // Search in bin name
        if (bin.name.toLowerCase().includes(searchTerm)) return true;
        
        // Search in product names, NDC codes, and sources
        return bin.products.some(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.ndc.toLowerCase().includes(searchTerm) ||
          product.source.toLowerCase().includes(searchTerm) ||
          product.inventoryType.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // For multiple terms (comma-separated), check if bin name matches all terms
      if (matchesAllTerms(bin.name, searchTerms)) return true;
      
      // For products, each search term must match at least one field of the same product
      return bin.products.some(product => productMatchesAllTerms(product, searchTerms));
    })
  })).filter(shelf => shelf.bins.length > 0);
};

// Helper function to check if all search terms match a target string
const matchesAllTerms = (target: string, searchTerms: string[]): boolean => {
  const targetLower = target.toLowerCase();
  return searchTerms.every(term => targetLower.includes(term));
};

// Helper function to check if a product matches all search terms
const productMatchesAllTerms = (product: any, searchTerms: string[]): boolean => {
  // For each search term, check if it matches at least one product field
  return searchTerms.every(term => {
    return product.name.toLowerCase().includes(term) ||
           product.ndc.toLowerCase().includes(term) ||
           product.source.toLowerCase().includes(term) ||
           product.inventoryType.toLowerCase().includes(term) ||
           (product.description && product.description.toLowerCase().includes(term));
  });
};

// Check if a bin matches the search query for highlighting.
// A query is one or more "|"-separated OR-groups, each an AND'd set of comma-separated terms.
// Plain typed queries (no "|") are a single group, so narrowing ("insulin, sanofi") is unchanged.
// "|" lets callers (e.g. "Select All") OR together several independent products' own AND-groups.
export const binMatchesSearch = (bin: Bin, query: string): boolean => {
  if (!query.trim()) return false;

  const orGroups = query.split('|').map(group => group.trim()).filter(group => group.length > 0);
  if (orGroups.length === 0) return false;

  return orGroups.some(group => {
    const searchTerms = group.split(',').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
    if (searchTerms.length === 0) return false;

    // For multiple terms (comma-separated), check if bin name matches all terms
    if (matchesAllTerms(bin.name, searchTerms)) return true;

    // For products, each search term must match at least one field of the same product
    return bin.products.some(product => productMatchesAllTerms(product, searchTerms));
  });
};

// Get doors that contain bins matching the search query
export const getDoorsWithSearchMatches = (doorShelfConfig: DoorShelfConfig, searchQuery: string): string[] => {
  if (!searchQuery.trim()) return [];
  
  const doorsWithMatches: string[] = [];
  
  Object.entries(doorShelfConfig).forEach(([doorKey, shelves]) => {
    const hasMatches = shelves.some(shelf => 
      shelf.bins.some(bin => binMatchesSearch(bin, searchQuery))
    );
    
    if (hasMatches) {
      doorsWithMatches.push(doorKey);
    }
  });
  
  return doorsWithMatches;
};

// Get doors that contain selected bins for assignment
export const getDoorsWithSelectedBins = (doorShelfConfig: DoorShelfConfig, selectedBinsForAssignment: string[]): string[] => {
  if (selectedBinsForAssignment.length === 0) return [];
  
  const doorsWithSelectedBins: string[] = [];
  
  Object.entries(doorShelfConfig).forEach(([doorKey, shelves]) => {
    const hasSelectedBins = shelves.some(shelf => 
      shelf.bins.some(bin => selectedBinsForAssignment.includes(bin.id))
    );
    
    if (hasSelectedBins) {
      doorsWithSelectedBins.push(doorKey);
    }
  });
  
  return doorsWithSelectedBins;
};

// Count total matching bins across all doors for search results
export const countSearchMatches = (doorShelfConfig: DoorShelfConfig, searchQuery: string): number => {
  if (!searchQuery.trim()) return 0;
  
  let matchCount = 0;
  
  Object.values(doorShelfConfig).forEach(shelves => {
    shelves.forEach(shelf => {
      shelf.bins.forEach(bin => {
        if (binMatchesSearch(bin, searchQuery)) {
          matchCount++;
        }
      });
    });
  });
  
  return matchCount;
};

// Get bin location details from bin ID
export const getBinLocationDetails = (binId: string, doorShelfConfig: DoorShelfConfig): string | null => {
  for (const [doorKey, shelves] of Object.entries(doorShelfConfig)) {
    for (const shelf of shelves) {
      const bin = shelf.bins.find(b => b.id === binId);
      if (bin) {
        // Extract door number from door key (e.g., "Door 1" -> "1")
        const doorNumber = doorKey.split(' ')[1] || doorKey.replace('door-', '');
        
        // Extract cabinet number from door number
        // Doors 1-4: Cabinet 1, Doors 5-8: Cabinet 2, Doors 9-14: Virtual (shown as Cabinet 3)
        let cabinetNumber;
        const doorNum = parseInt(doorNumber);
        if (doorNum >= 1 && doorNum <= 4) cabinetNumber = 1;
        else if (doorNum >= 5 && doorNum <= 8) cabinetNumber = 2;
        else cabinetNumber = 3; // Virtual cabinet (doors 9-14)
        
        return `${bin.name} - ${shelf.name}, Door ${doorNumber}, Cabinet ${cabinetNumber}`;
      }
    }
  }
  return null;
};