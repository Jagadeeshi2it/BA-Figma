import { UnallocatedProduct, DoorShelfConfig } from '../types';
import { pharmaceuticalProducts, UNALLOCATED_RESERVE_IDS } from './products';

// Products held back for the unallocated tray (never placed in bins by the data build).
const HARDCODED_UNALLOCATED_PRODUCT_IDS = UNALLOCATED_RESERVE_IDS;

// Initial unallocated list, built from the reserved master products.
export let unallocatedProducts: UnallocatedProduct[] = pharmaceuticalProducts
  .filter(p => HARDCODED_UNALLOCATED_PRODUCT_IDS.includes(p.id))
  .map((p, index) => ({
    id: `unalloc-${index + 1}`,
    // Keep the master id: it's the only unambiguous link back to this catalogue
    // entry once the tray id replaces it.
    masterId: p.id,
    name: p.displayName,
    description: p.genericName,
    ndc: p.ndc,
    source: p.source,
    inventoryType: p.inventoryType,
    badge: p.vialType
  }));

// Function to get all products currently assigned to bins
const getAssignedProductIds = (doorShelfConfig: DoorShelfConfig): Set<string> => {
  const assignedIds = new Set<string>();
  
  Object.values(doorShelfConfig).forEach(shelves => {
    shelves.forEach(shelf => {
      shelf.bins.forEach(bin => {
        bin.products.forEach(product => {
          // Extract the master product ID from the product ID
          // Product IDs in bins are typically in format like "PROD001_12345" where PROD001 is the master ID
          const masterId = product.id.split('_')[0];
          assignedIds.add(masterId);
        });
      });
    });
  });
  
  return assignedIds;
};

// Function to generate unallocated products that are NOT already assigned to bins
export const generateUnallocatedProducts = (doorShelfConfig: DoorShelfConfig): UnallocatedProduct[] => {
  const assignedProductIds = getAssignedProductIds(doorShelfConfig);
  console.log('🔍 Assigned product IDs:', Array.from(assignedProductIds));
  
  // CRITICAL FIX: Use hardcoded products for unallocated list
  // These 5 products will ALWAYS be available for allocation and NEVER assigned to bins randomly
  const hardcodedProducts = pharmaceuticalProducts.filter(product => 
    HARDCODED_UNALLOCATED_PRODUCT_IDS.includes(product.id)
  );
  console.log('📦 Hardcoded unallocated products:', hardcodedProducts.map(p => `${p.id} - ${p.displayName}`));
  
  // Filter out hardcoded products that are already assigned to bins (shouldn't happen, but safety check)
  const unallocatedMasterProducts = hardcodedProducts.filter(product => 
    !assignedProductIds.has(product.id)
  );
  console.log('✅ Available hardcoded products:', unallocatedMasterProducts.length, 'out of', hardcodedProducts.length);
  
  // If no hardcoded products are available (shouldn't happen), fall back to any unassigned products
  const fallbackProducts = unallocatedMasterProducts.length === 0 
    ? pharmaceuticalProducts.filter(product => !assignedProductIds.has(product.id))
    : unallocatedMasterProducts;
  
  console.log('🎯 Final unallocated products count:', fallbackProducts.length);
  
  // Convert to unallocated product format
  return fallbackProducts.map((product, index) => ({
    id: `unalloc-${index + 1}`,
    // Carry the master id, same as the module-level list above. Without it, allocation has to
    // guess the master from name + NDC, and PROD348/PROD350 are both "VYLOY 100 MG VIAL" with
    // the same NDC — find() returns the wrong one, the bin product is stamped with it, and the
    // real master never counts as assigned. The emptied tray then regenerates and VYLOY comes
    // back, which looked like "allocate everything and one product is still left".
    masterId: product.id,
    name: product.displayName,
    description: product.genericName,
    ndc: product.ndc,
    source: product.source,
    inventoryType: product.inventoryType,
    badge: product.vialType
  }));
};

// Function to update the unallocated products list based on current bin assignments
export const updateUnallocatedProducts = (doorShelfConfig: DoorShelfConfig): void => {
  console.log('🔄 Updating unallocated products...');
  const newUnallocatedProducts = generateUnallocatedProducts(doorShelfConfig);
  console.log('📊 Generated unallocated products:', newUnallocatedProducts.length, 'products');
  console.log('📋 Unallocated products:', newUnallocatedProducts.map(p => p.name));
  unallocatedProducts = newUnallocatedProducts;
};