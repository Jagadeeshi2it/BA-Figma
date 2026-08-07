import { BadgeFilter, matchesBadgeFilter } from './badgeFilter';

/**
 * What the Unallocated tray is currently showing.
 *
 * Two independent narrowings, ANDed: the typed search and a badge filter. They are composed in one
 * module because **two callers need the identical answer** — the panel renders the list, and the hook's
 * `Select All` ticks it. Those two used to each write the search predicate out longhand, which was
 * survivable while there was one condition and is not now: a filter the panel applied and Select All
 * did not would tick products the operator cannot see, which is the one thing that control must never
 * do (its label says "all", and "all" has to mean the visible list).
 *
 * The badge half lives in `badgeFilter.ts`, because `AllocateProductsPanel` narrows by badge too. What
 * stays here is the part that really is the tray's: its own search.
 */

/**
 * The tray's search. Unlike the header's box this is a plain substring test over four fields, not the
 * `|`/AND grammar of `utils/searchQuery.ts` — the tray holds eight products, so there is nothing to
 * compose a query against. Left as it was rather than upgraded along with the filter.
 */
export const matchesUnallocatedSearch = (product: any, query: string): boolean => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  return (
    (product.name || '').toLowerCase().includes(trimmed) ||
    (product.description || '').toLowerCase().includes(trimmed) ||
    (product.ndc || '').toLowerCase().includes(trimmed) ||
    (product.source || '').toLowerCase().includes(trimmed)
  );
};

/** What the tray lists — the single source of truth for "visible", search AND badge. */
export const filterUnallocatedProducts = <T,>(
  products: T[],
  query: string,
  badgeFilter: BadgeFilter
): T[] =>
  products.filter(
    product => matchesUnallocatedSearch(product, query) && matchesBadgeFilter(product, badgeFilter)
  );
