import React from 'react';

/**
 * Check if a product matches all search criteria from a comma-separated query
 * @param product - The product object to check
 * @param searchQuery - The comma-separated search query
 * @returns boolean indicating if the product matches the search criteria
 */
export const doesProductMatchSearch = (
  product: any,
  searchQuery: string
): boolean => {
  if (!searchQuery.trim() || !product) {
    return false;
  }

  // Parse comma-separated search terms
  const searchTerms = searchQuery
    .split(',')
    .map(term => term.trim().toLowerCase())
    .filter(term => term.length > 0);

  // Create searchable text from product properties
  const searchableText = [
    product.name || '',
    product.description || '',
    product.ndc || '',
    product.inventoryType || '',
    product.genericName || ''
  ].join(' ').toLowerCase();

  // Check if ALL search terms are found in the product (AND logic)
  return searchTerms.every(term => searchableText.includes(term));
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

  // Only highlight if the product matches the search criteria (when product context is provided)
  if (product && !doesProductMatchSearch(product, searchQuery)) {
    return text;
  }

  // Parse comma-separated search terms (remove empty terms and trim whitespace)
  const searchTerms = searchQuery
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

  // Only highlight if the product matches the search criteria (when product context is provided)
  if (product && !doesProductMatchSearch(product, searchQuery)) {
    return ndcText;
  }

  // Parse comma-separated search terms
  const searchTerms = searchQuery
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