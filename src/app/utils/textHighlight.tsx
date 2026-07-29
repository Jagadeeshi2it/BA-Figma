import React from 'react';

// Escape every regex metacharacter in a search term before it goes into an alternation. Product
// names really do contain them — "ALBURX (HUMAN) 25% VIAL 25GM/100ML" — and unescaped parentheses
// become a capture group, which makes String.split emit `undefined` for the group that didn't
// participate in the match. That undefined then hit .toLowerCase() and crashed the page.
const escapeRegExp = (term: string): string => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A query is one or more "|"-separated OR-groups, each an AND'd set of comma-separated terms —
// same convention as productMatchesQuery/binMatchesSearch. Returns the original-case terms of
// the first group this product satisfies (so callers can highlight exactly those terms, not the
// whole query — a combined multi-product query's OTHER groups don't apply to this product), or
// null if none match.
const getMatchingGroupTerms = (product: any, searchQuery: string): string[] | null => {
  if (!searchQuery.trim() || !product) {
    return null;
  }

  const searchableText = [
    product.name || '',
    product.description || '',
    product.ndc || '',
    product.inventoryType || '',
    product.genericName || ''
  ].join(' ').toLowerCase();

  const orGroups = searchQuery.split('|').map(group => group.trim()).filter(group => group.length > 0);

  for (const group of orGroups) {
    const terms = group.split(',').map(term => term.trim()).filter(term => term.length > 0);
    if (terms.length > 0 && terms.every(term => searchableText.includes(term.toLowerCase()))) {
      return terms;
    }
  }
  return null;
};

export const doesProductMatchSearch = (
  product: any,
  searchQuery: string
): boolean => {
  return getMatchingGroupTerms(product, searchQuery) !== null;
};

/**
 * Highlights matching text within a string with the specified color
 * Supports both single terms and comma-separated search queries
 * @param text - The text to search within
 * @param searchQuery - The query to highlight (can be comma-separated like "product, ndc, type")
 * @param highlightColor - The color to use for highlighting (default: SEARCH_HIGHLIGHT_COLOR)
 * @param product - The product context to determine if highlighting should occur
 * @returns JSX element with highlighted text
 */
// The colour a search match is called out in — bin cards, both product panels and the search list.
// One constant so every surface highlights the same way — and not just the text: the bin's stroke,
// the emergency kit's outline and the dot on a door with matches all take this value too, so one
// search paints one colour everywhere it lands. It's the deep end of the yellow the bins used to
// highlight in (a #FACC14 border on a #FEFCE8 fill), dark enough to read as body text.
//
// Contrast, measured: 4.06:1 against #020817 body text and 4.92:1 on white. Both numbers matter and
// they pull against each other — anything dark enough to sit comfortably on white starts to read as
// black. The app's own #095192 managed only 2.48:1 against the text, which is why matches were easy
// to miss; the old #EA4315 separated fine at 5.06:1 but sat at 3.95:1 on white and was loud with it.
// Keep any replacement above ~3.5:1 on the first number and ~4.5:1 on the second.
//
// Two places mirror this value as a literal because Tailwind arbitrary values have to be static at
// build time: the bin stroke in BinCard (border-[#A16207]) and the picked row in SearchDropdown
// (text-[#A16207]). Change those with this one or the highlight will disagree with itself.
export const SEARCH_HIGHLIGHT_COLOR = '#A16207';

export const highlightText = (
  text: string,
  searchQuery: string,
  highlightColor: string = SEARCH_HIGHLIGHT_COLOR,
  product?: any
): React.ReactNode => {
  if (!searchQuery.trim()) {
    return text;
  }

  // When a product is given, highlight only the terms from the OR-group it actually matches —
  // not the whole query, which may contain other products' terms in a combined search.
  const matchedGroupTerms = product ? getMatchingGroupTerms(product, searchQuery) : null;
  if (product && !matchedGroupTerms) {
    return text;
  }

  const searchTerms = matchedGroupTerms ?? searchQuery
    .split(',')
    .map(term => term.trim())
    .filter(term => term.length > 0);

  // Create a single regex pattern that matches any of the search terms
  const escapedTerms = searchTerms.map(escapeRegExp);

  // Create regex for case-insensitive matching of any term
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  // Split the text by any matching search term
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Check if this part matches any search term (case-insensitive)
    const isMatch = typeof part === 'string' && searchTerms.some(term =>
      part.toLowerCase() === term.toLowerCase()
    );

    if (isMatch) {
      return (
        <span
          key={index}
          style={{ 
            backgroundColor: 'transparent',
            color: highlightColor,
            // Bolder than the text around it, so a match reads as a match at a glance rather
            // than relying on colour alone — which also keeps it legible for colour-blind users.
            fontWeight: 500
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};



/**
 * Highlights matching NDC numbers and inventory types
 * Supports both single terms and comma-separated search queries
 * @param ndcText - The NDC text to search within (e.g., "12345-6789 - Inventory Type")
 * @param searchQuery - The query to highlight (can be comma-separated)
 * @param highlightColor - The color to use for highlighting (default: SEARCH_HIGHLIGHT_COLOR)
 * @param product - The product context to determine if highlighting should occur
 * @returns JSX element with highlighted NDC numbers
 */
export const highlightNDC = (
  ndcText: string,
  searchQuery: string,
  highlightColor: string = SEARCH_HIGHLIGHT_COLOR,
  product?: any
): React.ReactNode => {
  if (!searchQuery.trim()) {
    return ndcText;
  }

  // When a product is given, highlight only the terms from the OR-group it actually matches —
  // not the whole query, which may contain other products' terms in a combined search.
  const matchedGroupTerms = product ? getMatchingGroupTerms(product, searchQuery) : null;
  if (product && !matchedGroupTerms) {
    return ndcText;
  }

  const searchTerms = matchedGroupTerms ?? searchQuery
    .split(',')
    .map(term => term.trim())
    .filter(term => term.length > 0);

  // We'll highlight any matching terms, not just numeric ones
  // This allows highlighting of both NDC numbers and inventory types like "Specialty Pharmacy"

  // Include all search terms, not just numeric ones
  const allTerms = searchTerms.map(term => term.toLowerCase());

  // Create a single regex pattern that matches any of the numeric search terms
  const escapedTerms = allTerms.map(escapeRegExp);

  // Create regex for case-insensitive matching of any numeric term
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  // Split the entire text by any matching search term
  const parts = ndcText.split(regex);

  return parts.map((part, index) => {
    // Check if this part matches any search term (case-insensitive)
    const isMatch = typeof part === 'string' && allTerms.some(term =>
      part.toLowerCase() === term.toLowerCase()
    );

    if (isMatch) {
      return (
        <span
          key={index}
          style={{ 
            backgroundColor: 'transparent',
            color: highlightColor,
            // Bolder than the text around it, so a match reads as a match at a glance rather
            // than relying on colour alone — which also keeps it legible for colour-blind users.
            fontWeight: 500
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};