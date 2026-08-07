import { BadgeFilter, matchesBadgeFilter } from './badgeFilter';

/**
 * What the Unallocated tray is currently showing.
 *
 * Three independent narrowings, ANDed: the typed search, a badge filter, and the review control's
 * "only what I have picked". They are composed in one
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

/**
 * What the tray lists — the single source of truth for "visible": search AND badge AND, when the
 * operator has asked to review their picks, selection.
 *
 * `selectedIds` is the third narrowing and the odd one out: `null` (the usual case) means "not asking",
 * while an array means "only these". It is a list of ids rather than a boolean because this module is
 * the one place both callers agree on, and the panel and the hook must scope to the *same* ids —
 * handing each of them a flag would leave them to look the selection up separately, which is exactly
 * the drift the module exists to prevent.
 *
 * It composes as AND with the other two like everything else here, but in practice the tray's review
 * control clears the query and the filter as it turns this on, and any change to either turns it back
 * off (see `handleReviewUnallocatedSelection`) — so a compound state is reachable only for the instant
 * before that exit fires. AND is still the right composition: an OR would make asking for your
 * selection *widen* the list.
 */
export const filterUnallocatedProducts = <T extends { id?: string },>(
  products: T[],
  query: string,
  badgeFilter: BadgeFilter,
  selectedIds: string[] | null = null
): T[] =>
  products.filter(
    product =>
      matchesUnallocatedSearch(product, query) &&
      matchesBadgeFilter(product, badgeFilter) &&
      (selectedIds === null || selectedIds.includes(product.id as string))
  );
