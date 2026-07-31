import { DoorShelfConfig, Product, Bin } from '../types';
import { productDataService } from '../services/ProductDataService';

export interface ProductSearchResult {
  ndc: string;
  inventoryType: string;
  name: string;
  // Generic name, for callers that show it under the display name the way the bin rows do.
  description?: string;
  totalQuantity: number;
  binLocations: Array<{
    binId: string;
    binName: string;
    shelfName: string;
    doorName: string;
    cabinetName: string;
    quantity: number;
  }>;
}

// Helper function to check if a product matches all search terms (AND within a group)
const productMatchesAllSearchTerms = (product: any, searchTerms: string[]): boolean => {
  // For each search term, check if it matches at least one product field
  return searchTerms.every(term => {
    return product.name.toLowerCase().includes(term) ||
           product.ndc.toLowerCase().includes(term) ||
           product.source.toLowerCase().includes(term) ||
           product.inventoryType.toLowerCase().includes(term) ||
           (product.description && product.description.toLowerCase().includes(term));
  });
};

// A query is one or more "|"-separated OR-groups, each an AND'd set of comma-separated terms.
// Plain typed queries (no "|") are a single group, so narrowing ("insulin, sanofi") is unchanged.
// "|" lets callers (e.g. "Select All") OR together several independent products' own AND-groups.
const productMatchesQuery = (product: any, searchQuery: string): boolean => {
  const orGroups = searchQuery.split('|').map(group => group.trim()).filter(group => group.length > 0);
  return orGroups.some(group => {
    const terms = group.split(',').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
    return terms.length > 0 && productMatchesAllSearchTerms(product, terms);
  });
};

// Walk every bin in the cabinet, keeping the products a predicate accepts, grouped by NDC +
// inventory type with one entry per location. Both exports below are this with a different filter.
const collectProducts = (
  doorShelfConfig: DoorShelfConfig,
  matches: (product: any) => boolean
): ProductSearchResult[] => {
  const productGroupMap = new Map<string, ProductSearchResult>();
  
  // Iterate through all doors and shelves
  Object.entries(doorShelfConfig).forEach(([doorName, shelves]) => {
    shelves.forEach(shelf => {
      shelf.bins.forEach(bin => {
        bin.products.forEach(product => {
          if (matches(product)) {
            // Get enhanced product data for consistent information
            const enhancedProduct = productDataService.enhanceProduct(product);
            
            // Extract cabinet name from door name
            const cabinetName = getCabinetNameFromDoorName(doorName);
            
            // Group by NDC + inventory type combination
            const groupKey = `${enhancedProduct.ndc || product.ndc}-${enhancedProduct.inventoryType || product.inventoryType}`;
            
            if (productGroupMap.has(groupKey)) {
              const existing = productGroupMap.get(groupKey)!;
              existing.totalQuantity += product.quantity;
              existing.binLocations.push({
                binId: bin.id,
                binName: bin.name,
                shelfName: shelf.name,
                doorName,
                cabinetName,
                quantity: product.quantity
              });
            } else {
              productGroupMap.set(groupKey, {
                ndc: enhancedProduct.ndc || product.ndc,
                inventoryType: enhancedProduct.inventoryType || product.inventoryType,
                name: enhancedProduct.name || product.name,
                description: enhancedProduct.description || product.description,
                totalQuantity: product.quantity,
                binLocations: [{
                  binId: bin.id,
                  binName: bin.name,
                  shelfName: shelf.name,
                  doorName,
                  cabinetName,
                  quantity: product.quantity
                }]
              });
            }
          }
        });
      });
    });
  });
  
  // Convert map to array and sort by total quantity (highest first)
  return Array.from(productGroupMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
};

// Search for products across all doors and bins, grouped by NDC and inventory type
export const searchProducts = (doorShelfConfig: DoorShelfConfig, searchQuery: string): ProductSearchResult[] =>
  searchQuery.trim()
    ? collectProducts(doorShelfConfig, product => productMatchesQuery(product, searchQuery))
    : [];

// Everything in the cabinet, shaped exactly like a search result. The allocate/unallocate panel
// needs the catalogue before anything is typed — its "empty locations" filter is a way of browsing,
// not of searching, so it cannot wait for a query the way the header's dropdown does.
export const listAllProducts = (doorShelfConfig: DoorShelfConfig): ProductSearchResult[] =>
  collectProducts(doorShelfConfig, () => true);

// Helper function to get cabinet name from door name
const getCabinetNameFromDoorName = (doorName: string): string => {
  const doorNumber = parseInt(doorName.replace('Door ', ''));
  
  if (doorNumber >= 1 && doorNumber <= 4) return 'Cabinet 1';
  if (doorNumber >= 5 && doorNumber <= 8) return 'Cabinet 2';
  if (doorNumber >= 9 && doorNumber <= 14) return 'Virtual';

  return 'Unknown Cabinet';
};

// Format quantity with unit
export const formatQuantity = (quantity: number): string => {
  return `${quantity} ${quantity === 1 ? 'unit' : 'units'}`;
};

// Get all bin IDs for a specific product
export const getBinIdsForProduct = (searchResult: ProductSearchResult): string[] => {
  return searchResult.binLocations.map(location => location.binId);
};