import { Bin } from '../types';

// Shared by BinCard and AllProductsPanel. Both surfaces show the same bin, so the row grouping
// and the badges have to come from one place — deriving them twice is how the two views end up
// disagreeing about what a bin contains.

// Simple string hash so each badge's random-looking assignment stays stable across
// re-renders (same product always gets the same result) instead of flipping every render.
const hashString = (s: string): number => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

// Deterministic pseudo-random SDV/MDV split, ~50/50 across products.
export const getVialType = (product: any): 'SDV' | 'MDV' => {
  const key = `vial-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 2 === 0 ? 'MDV' : 'SDV';
};

// CLIMATE shows on about half of products; CIV (controlled substance) is rare (~1 in 12).
export const hasClimateBadge = (product: any): boolean => {
  const key = `climate-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 2 === 0;
};

export const hasCivBadge = (product: any): boolean => {
  const key = `civ-${product.id || ''}${product.ndc || ''}`;
  return hashString(key) % 12 === 0;
};

// One row per product identity, quantities summed. A bin can hold the same drug as several
// separate rows (different lots), and the original ids are kept so a click can still resolve back.
export const consolidateBinProducts = (bin: Bin | undefined): any[] => {
  if (!bin || bin.available) return [];

  const groupedProducts = (bin.products || []).reduce((acc, product) => {
    const key = `${product.name}-${product.ndc}-${product.inventoryType}`;
    if (!acc[key]) {
      acc[key] = {
        ...product,
        quantity: 0,
        productIds: [] // Keep track of original product IDs for click handling
      };
    }
    acc[key].quantity += product.quantity;
    acc[key].productIds.push(product.id);
    return acc;
  }, {} as Record<string, any>);

  return Object.values(groupedProducts);
};
