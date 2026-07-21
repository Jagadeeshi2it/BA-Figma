// Master Product interface
export interface MasterProduct {
  id: string;
  displayName: string;
  genericName: string;
  ndc: string;
  source: string;
  inventoryType: string;
  vialType: string;
  defaultUnit: string;
}

// Real master catalog derived from the OCSRI bin-allocation data (see realData.ts).
export { pharmaceuticalProducts, UNALLOCATED_RESERVE_IDS } from './realData';
import { pharmaceuticalProducts, UNALLOCATED_RESERVE_IDS } from './realData';


// Utility function to create a Product from MasterProduct with quantity
export const createProductFromMaster = (masterProduct: MasterProduct, quantity: number): any => {
  return {
    id: `${masterProduct.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: masterProduct.displayName,
    genericName: masterProduct.genericName,
    ndc: masterProduct.ndc,
    quantity,
    unit: masterProduct.defaultUnit,
    source: masterProduct.source,
    inventoryType: masterProduct.inventoryType,
    vialType: masterProduct.vialType,
    description: masterProduct.genericName
  };
};

// Utility function to get random quantities for realistic allocation
export const getRandomQuantity = (): number => {
  const quantities = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 47, 50, 82, 100, 150, 200, 292, 396];
  return quantities[Math.floor(Math.random() * quantities.length)];
};

// Utility function to get a random product with quantity
export const getRandomProduct = (): any => {
  // Use products available for random allocation (excludes hardcoded unallocated products)
  const availableProducts = getProductsForRandomAllocation();
  const randomMaster = availableProducts[Math.floor(Math.random() * availableProducts.length)];
  return createProductFromMaster(randomMaster, getRandomQuantity());
};

// Utility function to get a random "Purchased" product specifically for Emergency Kit doors
export const getRandomPurchasedProduct = (): any => {
  const purchasedProducts = pharmaceuticalProducts.filter(product => 
    product.inventoryType === 'Purchased' && 
    !HARDCODED_UNALLOCATED_PRODUCT_IDS.includes(product.id)
  );
  if (purchasedProducts.length === 0) {
    console.warn('No "Purchased" inventory type products found (excluding hardcoded unallocated products)');
    return getRandomProduct(); // Fallback to any product
  }
  const randomMaster = purchasedProducts[Math.floor(Math.random() * purchasedProducts.length)];
  return createProductFromMaster(randomMaster, getRandomQuantity());
};

// Utility function to get multiple random products (no duplicates)
export const getRandomProducts = (count: number): any[] => {
  // Ensure count doesn't exceed available products
  const actualCount = Math.min(count, pharmaceuticalProducts.length);
  const shuffled = [...pharmaceuticalProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualCount).map(master => createProductFromMaster(master, getRandomQuantity()));
};

// Products held back for the unallocated tray (never placed in bins by the data build).
const HARDCODED_UNALLOCATED_PRODUCT_IDS = UNALLOCATED_RESERVE_IDS;

// Products available for random allocation (excludes hardcoded unallocated products)
export const getProductsForRandomAllocation = (): any[] => {
  return pharmaceuticalProducts.filter(product => 
    !HARDCODED_UNALLOCATED_PRODUCT_IDS.includes(product.id)
  );
};

// CRITICAL FIX: Reserve some products for unallocated list
// This ensures that not all products are assigned to bins, leaving some for the unallocated list
export const getRandomProductsWithReserve = (count: number, reserveCount: number = 10): any[] => {
  // Use products available for random allocation (excludes hardcoded unallocated products)
  const availableProducts = getProductsForRandomAllocation();
  const actualCount = Math.min(count, availableProducts.length);
  const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualCount).map(master => createProductFromMaster(master, getRandomQuantity()));
};

// Utility function to get random products filtered by inventory type (for Emergency Kit doors)
export const getRandomProductsByInventoryType = (count: number, inventoryType: string): any[] => {
  // Filter products by inventory type AND exclude hardcoded unallocated products
  const filteredProducts = pharmaceuticalProducts.filter(product => 
    product.inventoryType === inventoryType && 
    !HARDCODED_UNALLOCATED_PRODUCT_IDS.includes(product.id)
  );
  
  if (filteredProducts.length === 0) {
    console.warn(`No products found for inventory type: ${inventoryType}`);
    return [];
  }
  
  // Ensure count doesn't exceed available filtered products
  const actualCount = Math.min(count, filteredProducts.length);
  const shuffled = [...filteredProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualCount).map(master => createProductFromMaster(master, getRandomQuantity()));
};

// Utility function specifically for Emergency Kit doors - only "Purchased" inventory type
export const getRandomPurchasedProducts = (count: number): any[] => {
  return getRandomProductsByInventoryType(count, 'Purchased');
};
