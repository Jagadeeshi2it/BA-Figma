import { DoorShelfConfig, Product, Bin } from '../types';
import { productDataService } from '../services/ProductDataService';
import { queryMatchesFields, matchingGroupForText, textMatchesAllTerms, splitOrGroups, splitTerms } from './searchQuery';

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

// The fields a product is searchable by. One list, so the matcher and anything else asking "would
// this product be found by X" cannot drift apart.
const searchableFieldsOf = (product: any): Array<string | undefined> => [
  product?.name,
  product?.ndc,
  product?.source,
  product?.inventoryType,
  product?.description
];

// Grammar lives in utils/searchQuery — terms split on whitespace OR commas and each may be answered by
// a different field, which is what makes `carbo 600` and `carbo purchased` work.
const productMatchesQuery = (product: any, searchQuery: string): boolean =>
  queryMatchesFields(searchQuery, searchableFieldsOf(product));

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

export interface BinSearchResult {
  binId: string;
  binName: string;
  shelfName: string;
  doorName: string;
  cabinetName: string;
  /** Distinct product rows the bin holds — what its card lists. */
  productCount: number;
  totalQuantity: number;
  available: boolean;
}

/**
 * Bins whose NAME matches the query — the other half of what the search box has always claimed to do.
 *
 * Deliberately name-only. `binMatchesSearch` in doorUtils falls back to the bin's CONTENTS, which is
 * right for tinting a card but wrong here: a bin holding a matched product would appear in both this
 * list and the product list below it, as two different answers to one question. Products are the
 * product section's job; this section answers "where is the bin I was told to go to".
 *
 * Same query grammar as searchProducts — "|"-separated OR-groups of ","-separated AND-terms — so a
 * bin name and a product name can be searched with the same muscle memory.
 *
 * Ordered by door, then by the bin's own name, so the list reads in the order the operator would walk
 * it rather than in whatever order the config happens to enumerate.
 */
export const searchBinsByName = (
  doorShelfConfig: DoorShelfConfig,
  searchQuery: string
): BinSearchResult[] => {
  if (!searchQuery.trim()) return [];

  const orGroups = splitOrGroups(searchQuery);
  const matchesName = (binName: string): boolean =>
    orGroups.some(group => textMatchesAllTerms(binName, splitTerms(group)));

  const results: BinSearchResult[] = [];

  Object.entries(doorShelfConfig).forEach(([doorName, shelves]) => {
    shelves.forEach(shelf => {
      shelf.bins.forEach(bin => {
        if (!matchesName(bin.name)) return;
        const products = bin.products || [];
        results.push({
          binId: bin.id,
          binName: bin.name,
          shelfName: shelf.name,
          doorName,
          cabinetName: getCabinetNameFromDoorName(doorName),
          productCount: products.length,
          totalQuantity: products.reduce((total, product) => total + (product.quantity || 0), 0),
          // A bin the app considers free to allocate into. Note this is not the same as "holds
          // nothing" — the source rule below tests the products, exactly as the shelf tap does.
          available: bin.available
        });
      });
    });
  });

  const doorNumber = (doorName: string) => parseInt(doorName.replace('Door ', ''), 10) || 0;
  return results.sort(
    (a, b) => doorNumber(a.doorName) - doorNumber(b.doorName) || a.binName.localeCompare(b.binName)
  );
};


/**
 * The OR-group of `query` that matches this bin's NAME, or '' if none does.
 *
 * Lets a caller tell the two kinds of group in a highlight query apart. A product group is a record of
 * something already picked, so it must only reach bins in the selection — letting it loose lights up
 * every bin that merely holds the drug. A bin-name group is the opposite: it names one bin outright,
 * so it can't over-reach, and it means "you asked where this is" rather than "you chose this".
 */
export const binNameQueryGroup = (query: string, binName: string): string =>
  matchingGroupForText(query, binName);

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