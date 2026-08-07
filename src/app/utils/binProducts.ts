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

// CLIMATE is a minority handling requirement (~1 in 6); CIV (controlled substance) is rarer (~1 in 12).
//
// It was a coin flip, which made ~41% of the catalogue temperature-sensitive — 114 of the 262 products
// sitting in bins. That is not what a pharmacy looks like, and it had two consequences beyond realism.
// It made the tray's Climate filter a control that halves a list rather than one that isolates the cold
// chain, and it made "climate-sensitive stock belongs in a fridge" impossible to model: honouring it
// would have emptied 40% of both cabinets into six pooled fridge bins.
//
// 6 rather than 4 or 8 because it has to leave enough Climate products for the fridges to look stocked
// while leaving the cabinets clearly the bigger store. Changing this divisor reshuffles WHICH products
// are Climate, not just how many — the badge is a hash of the identity triple — so the fridge relocation
// in doorConfigurations.ts and the tray's own distribution both move with it.
export const hasClimateBadge = (product: any): boolean =>
  hashString(`climate-${badgeIdentity(product)}`) % 6 === 0;

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

/**
 * What a bin's selection badge says, and in which colour — `2 Selected`, `Move From` or `Move To`.
 *
 * Shared because the badge has two homes. A cabinet bin draws it inside its own card, top-right under
 * the bin header; a **fridge** bin has no bin header to sit under (one pooled bin has nothing to be told
 * apart from), so its badge floated over the first product in the right-hand column and read as that
 * product's label rather than the bin's. There it is drawn in the shelf heading instead, opposite the
 * fridge name. Two surfaces deciding this text separately is how they come to disagree.
 *
 * `pickedCount` is per bin and only meaningful in a Product move, where a source bin joined the selection
 * *because* a product in it was picked. In a Bin move the whole bin was chosen, so there is no subset to
 * count and the badge names the end instead.
 */
export const selectionBadge = ({
  isSource,
  isTarget,
  moveMode,
  pickedCount
}: {
  isSource: boolean;
  isTarget: boolean;
  moveMode?: 'bin' | 'product' | null;
  pickedCount: number;
}): { text: string; className: string } | null => {
  if (isSource) {
    const counted = moveMode === 'product' && pickedCount > 0;
    return { text: counted ? `${pickedCount} Selected` : 'Move From', className: 'text-[#165dfc]' };
  }
  if (isTarget) return { text: 'Move To', className: 'text-[#359f5a]' };
  return null;
};
