import { getVialType, hasClimateBadge, hasCivBadge } from './binProducts';

/**
 * Narrowing a product list by the badge it wears — shared by both allocation panels.
 *
 * Split out of `unallocatedFilter.ts` when `AllocateProductsPanel` gained the same control: the badge
 * half is about products, while what remains there is about the *tray's* own four-field search. A module
 * called "unallocated" owning a rule the other panel depends on is how the two drift apart.
 */

/**
 * `climate` and `civ` are flags a product either carries or does not; `SDV`/`MDV` are the two halves of
 * one property, so a product always matches exactly one of them. That difference is why this is a
 * single-select rather than a set of checkboxes: `Climate + CIV` would have to mean either "both
 * badges" or "either badge" and the control cannot say which, while `SDV + MDV` means the unfiltered
 * list — a combination that reads as narrowing and does the opposite.
 *
 * The workflow this exists for is one filter at a time anyway: show me the fridge stock, tick it all,
 * put it in a fridge. An exception still goes through the unfiltered list, which is where it belongs —
 * it is an exception.
 */
export type BadgeFilter = 'all' | 'climate' | 'civ' | 'sdv' | 'mdv';

/**
 * Bare labels, no counts. Each option briefly read `Climate (2)`, which looked informative and was not:
 * the trigger shows the selected option's label, so the count the operator saw most was the one for the
 * filter they had already applied — a number restating the list directly beneath it. The counts also
 * moved as the list emptied, so the control flickered during exactly the bulk allocation it exists to
 * serve. The list's own length is the count, and it is one line down.
 */
export const BADGE_FILTER_OPTIONS: Array<{ value: BadgeFilter; label: string }> = [
  // "All products", not "All" — the trigger shows the selected label, and a bare "All" beside a
  // Select All checkbox reads as a second way to say the same thing.
  { value: 'all', label: 'All products' },
  { value: 'climate', label: 'Climate' },
  { value: 'civ', label: 'CIV' },
  { value: 'sdv', label: 'SDV' },
  { value: 'mdv', label: 'MDV' }
];

export const badgeFilterLabel = (filter: BadgeFilter): string =>
  BADGE_FILTER_OPTIONS.find(option => option.value === filter)?.label ?? '';

/**
 * Derived from the same `binProducts` helpers every badge on screen is drawn from, rather than from
 * `product.badge` — which is `'SDV'` for all eight tray products in the current seed and would make the
 * SDV/MDV filter answer "everything" and "nothing". A filter that disagrees with the badge beside it is
 * worse than no filter: the operator can see both.
 */
export const matchesBadgeFilter = (product: any, filter: BadgeFilter): boolean => {
  switch (filter) {
    case 'climate':
      return hasClimateBadge(product);
    case 'civ':
      return hasCivBadge(product);
    case 'sdv':
      return getVialType(product) === 'SDV';
    case 'mdv':
      return getVialType(product) === 'MDV';
    default:
      return true;
  }
};
