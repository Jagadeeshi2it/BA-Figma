import { Bin } from '../types';

// The one place badges are derived — bin cards, both product panels, the search dropdown, the
// allocation source/target cards, the product page and the history table all call in here. Any
// surface that computes its own SDV/MDV is how the same drug ends up labelled two different ways.

// Simple string hash so each badge's random-looking assignment stays stable across
// re-renders (same product always gets the same result) instead of flipping every render.
const hashString = (s: string): number => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

// A badge belongs to a product *identity*, not to a row: display name + NDC + inventory type is
// exactly what the app groups by everywhere (bin rows, panels, search results), so every view of
// the same drug derives the same badges. Keying on product.id — as this used to — gave two lots of
// one NDC different badges, changed a product's badge when it moved bins, and left search results
// (which have no id, being groups) unable to agree with the bins they point at.
const badgeIdentity = (product: any): string =>
  `${product.name || ''}|${product.ndc || ''}|${product.inventoryType || ''}`.toLowerCase();

// Deterministic pseudo-random SDV/MDV split, ~50/50 across products.
export const getVialType = (product: any): 'SDV' | 'MDV' =>
  hashString(`vial-${badgeIdentity(product)}`) % 2 === 0 ? 'MDV' : 'SDV';

// CLIMATE shows on about half of products; CIV (controlled substance) is rare (~1 in 12).
export const hasClimateBadge = (product: any): boolean =>
  hashString(`climate-${badgeIdentity(product)}`) % 2 === 0;

export const hasCivBadge = (product: any): boolean =>
  hashString(`civ-${badgeIdentity(product)}`) % 12 === 0;

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
