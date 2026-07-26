import React from 'react';

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
 * @param highlightColor - The color to use for highlighting (default: #EA4315)
 * @param product - The product context to determine if highlighting should occur
 * @returns JSX element with highlighted text
 */
export const highlightText = (
  text: string,
  searchQuery: string,
  highlightColor: string = '#EA4315',
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
  const escapedTerms = searchTerms.map(term => 
    term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
  );
  
  // Create regex for case-insensitive matching of any term
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  
  // Split the text by any matching search term
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches any search term (case-insensitive)
    const isMatch = searchTerms.some(term => 
      part.toLowerCase() === term.toLowerCase()
    );
    
    if (isMatch) {
      return (
        <span
          key={index}
          style={{ 
            backgroundColor: 'transparent',
            color: highlightColor,
            fontWeight: 'inherit'
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
 * @param highlightColor - The color to use for highlighting (default: #EA4315)
 * @param product - The product context to determine if highlighting should occur
 * @returns JSX element with highlighted NDC numbers
 */
export const highlightNDC = (
  ndcText: string,
  searchQuery: string,
  highlightColor: string = '#EA4315',
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
  const escapedTerms = allTerms.map(term => 
    term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
  );
  
  // Create regex for case-insensitive matching of any numeric term
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  
  // Split the entire text by any matching search term
  const parts = ndcText.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches any search term (case-insensitive)
    const isMatch = allTerms.some(term => 
      part.toLowerCase() === term.toLowerCase()
    );
    
    if (isMatch) {
      return (
        <span
          key={index}
          style={{ 
            backgroundColor: 'transparent',
            color: highlightColor,
            fontWeight: 'inherit'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};