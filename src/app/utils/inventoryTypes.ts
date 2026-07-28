// ---------------------------------------------------------------------------
// Inventory type assignment.
//
// The OCSRI import stamps every product "Purchased", so the whole catalogue reads
// the same. This spreads products across the four real inventory types instead.
//
// The assignment is pseudo-random but DERIVED, never stored: it is a hash of the
// master product id, so a product reports the same type on every render, after
// every reload, and in every view — the master catalogue, the bins, the
// unallocated tray and the search results can't disagree. Math.random() here
// would reshuffle types on each reload and make history records contradict the
// bins they came from.
//
// The key is name + NDC — deliberately the SAME identity BinCard consolidates
// rows on. Keying on the master product id instead looks equivalent but isn't:
// several master records share one name and NDC, so they'd draw different types
// and split a row the UI used to merge. That turned one "COSELA 300 MG VIAL,
// 103 vials" line into two lines of 100 and 3, and did it 80 times across the
// catalogue. Same identity as the consolidation key means row counts are untouched.
// ---------------------------------------------------------------------------

export const INVENTORY_TYPES = [
  'Purchased',
  'Charity Care',
  'Sample',
  'Specialty Pharmacy',
] as const;

export type InventoryType = typeof INVENTORY_TYPES[number];

// FNV-1a plus a final avalanche step. The simpler `hash * 31 + char` used for the
// badges isn't good enough here: `% 4` reads only the low two bits, and because 31
// is 3 mod 4 those bits stay correlated with the tail of the string. Drug names
// share long suffixes ("... MG VIAL"), which skewed the split badly — one type
// landed 33% and another 16%. Mixing the high bits down fixes the spread.
const hashString = (s: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  return hash >>> 0;
};

export const inventoryTypeFor = (name?: string, ndc?: string): InventoryType => {
  const key = `${(name || '').trim().toUpperCase()}|${(ndc || '').trim()}`;
  return INVENTORY_TYPES[hashString(`inventory-type-${key}`) % INVENTORY_TYPES.length];
};

// Masters name the product `displayName`, bin products call it `name`. Both shapes
// have to land on the same key or the catalogue and the bins would disagree.
type ProductLike = { name?: string; displayName?: string; ndc?: string };

/** Assign a type to one product-shaped object (master or bin instance). */
export const withInventoryType = <T extends ProductLike>(product: T): T => ({
  ...product,
  inventoryType: inventoryTypeFor(product.displayName ?? product.name, product.ndc),
});

export const withInventoryTypes = <T extends ProductLike>(products: T[]): T[] =>
  products.map(withInventoryType);
