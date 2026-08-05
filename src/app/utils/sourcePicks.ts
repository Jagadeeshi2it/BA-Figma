/**
 * What the operator has actually picked as the source of a Move by Product: a set of
 * **(bin, product identity) pairs**.
 *
 * This replaces treating `changeAllocationSourceQuery` as the selection itself. A query is a list of
 * product identities with no idea which bin each came from, so once a second bin joined the selection,
 * every identity already in the query started matching that bin's contents too — picking ALBURX from
 * Bin 1C silently also picked the OCTAGAM sitting there, because OCTAGAM had been picked from Bin 1B
 * earlier. Pairs cannot express that mistake: a pick names one bin.
 *
 * The two gestures differ only in how many pairs they create, which is the point — breadth comes from
 * what the operator did, not from what happens to match:
 *
 * - tapping a product row on a bin card  ->  one pair, that product in that bin
 * - picking a product from search        ->  one pair per bin the product lives in (deliberate: the
 *                                            dropdown's whole purpose is "wherever this drug is")
 *
 * Import-free so it can be verified in Node (see scripts/verify-source-picks.mjs).
 */

export interface SourcePick {
  binId: string;
  /** The identity triple, lowercased — the app's product identity everywhere (CLAUDE.md §3). */
  productKey: string;
}

export const sourcePickKey = (product: {
  name?: string;
  ndc?: string;
  inventoryType?: string;
}): string =>
  `${product?.name ?? ''}|${product?.ndc ?? ''}|${product?.inventoryType ?? ''}`.toLowerCase();

/**
 * The search-query group that matches exactly this product — `name, ndc, inventoryType`, the same
 * comma-separated AND-set the query channels use.
 *
 * Needed so a picked row can be highlighted against its OWN identity rather than against whatever is in
 * the search box. Otherwise clearing the box wipes the highlight off products that are still picked.
 */
export const sourcePickQueryGroup = (product: {
  name?: string;
  ndc?: string;
  inventoryType?: string;
}): string =>
  [product?.name, product?.ndc, product?.inventoryType]
    .filter(term => term && String(term).trim().length > 0)
    .join(', ');

const samePick = (pick: SourcePick, binId: string, productKey: string) =>
  pick.binId === binId && pick.productKey === productKey;

export const hasSourcePick = (picks: SourcePick[], binId: string, productKey: string): boolean =>
  picks.some(pick => samePick(pick, binId, productKey));

/** Adds pairs, ignoring any already present. Order is preserved: earlier picks stay earlier. */
export const addSourcePicks = (picks: SourcePick[], additions: SourcePick[]): SourcePick[] => {
  const next = [...picks];
  additions.forEach(addition => {
    if (!hasSourcePick(next, addition.binId, addition.productKey)) next.push(addition);
  });
  return next;
};

export const removeSourcePick = (
  picks: SourcePick[],
  binId: string,
  productKey: string
): SourcePick[] => picks.filter(pick => !samePick(pick, binId, productKey));

/**
 * Every pick of one product, in every bin.
 *
 * This is what the review panel's per-product Remove does — it takes the product out of the move
 * entirely, which is a different act from un-tapping it in one bin.
 */
export const removeSourcePicksForProduct = (picks: SourcePick[], productKey: string): SourcePick[] =>
  picks.filter(pick => pick.productKey !== productKey);

/** Everything picked in one bin — for when the bin itself is removed from the selection. */
export const removeSourcePicksForBin = (picks: SourcePick[], binId: string): SourcePick[] =>
  picks.filter(pick => pick.binId !== binId);

/** The bins the picks put in play, first-picked first. */
export const binsFromSourcePicks = (picks: SourcePick[]): string[] =>
  Array.from(new Set(picks.map(pick => pick.binId)));

/** The product identities picked in one bin — what that bin's card counts and Review scopes to. */
export const productKeysForBin = (picks: SourcePick[], binId: string): string[] =>
  Array.from(new Set(picks.filter(pick => pick.binId === binId).map(pick => pick.productKey)));

/** Every identity picked anywhere, for deriving the highlight query. */
export const allPickedProductKeys = (picks: SourcePick[]): string[] =>
  Array.from(new Set(picks.map(pick => pick.productKey)));
