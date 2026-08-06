/**
 * The one place the search grammar is defined.
 *
 * It lived in three copies — productSearchUtils, doorUtils and textHighlight each split the query
 * themselves — which meant a change to what counts as a term had to be made three times or the
 * matcher and the highlighter would disagree about what matched.
 *
 * A query is one or more `|`-separated OR-groups, each an AND-set of terms. **A term is separated by
 * whitespace or a comma, interchangeably**, and matching is substring, case-insensitive, across every
 * searchable field — so `carbo 600` finds CARBOPLATIN 600 MG/60 ML VIAL, and `carbo purchased` finds
 * the Purchased ones by taking one token from the name and one from the inventory type.
 *
 * Whitespace is the change that made the box usable. Terms used to split on commas alone, so a typed
 * `carbo 600` was ONE term and had to appear verbatim: the product reads "CARBOPLATIN 600", which
 * contains no such substring, so the obvious query returned nothing. Nobody discovers a comma
 * convention, and nobody should have to.
 *
 * The `|` groups are not typed by anyone — callers build them to OR several products' identities into
 * one highlight query. They keep their separator because a product name can contain a comma but never
 * a pipe.
 *
 * Import-free so it can be verified in Node (scripts/verify-search-query.mjs).
 */

/** The independent alternatives in a query. A product need satisfy only one of them. */
export const splitOrGroups = (query: string): string[] =>
  query.split('|').map(group => group.trim()).filter(group => group.length > 0);

/**
 * The terms of one group, in their original case — the highlighter needs that to colour what it found.
 * Callers that only compare should lowercase.
 */
export const splitTerms = (group: string): string[] =>
  group.split(/[,\s]+/).map(term => term.trim()).filter(term => term.length > 0);

/** Every term appears somewhere in `text`. The AND half of the grammar, for single-field targets. */
export const textMatchesAllTerms = (text: string, terms: string[]): boolean => {
  const target = (text || '').toLowerCase();
  return terms.length > 0 && terms.every(term => target.includes(term.toLowerCase()));
};

/**
 * Every term appears in at least one of `fields` — **not necessarily the same one**. This is what lets
 * `carbo purchased` work: `carbo` is answered by the name and `purchased` by the inventory type, and
 * requiring one field to carry both would find nothing.
 */
export const fieldsMatchAllTerms = (fields: Array<string | undefined>, terms: string[]): boolean => {
  const targets = fields.filter(Boolean).map(field => String(field).toLowerCase());
  return (
    terms.length > 0 &&
    terms.every(term => {
      const needle = term.toLowerCase();
      return targets.some(target => target.includes(needle));
    })
  );
};

/** True when any OR-group is satisfied by these fields. */
export const queryMatchesFields = (query: string, fields: Array<string | undefined>): boolean =>
  splitOrGroups(query).some(group => fieldsMatchAllTerms(fields, splitTerms(group)));

/** The first OR-group `text` satisfies on its own, or '' — used to scope a highlight to one target. */
export const matchingGroupForText = (query: string, text: string): string => {
  if (!query.trim() || !text) return '';
  return splitOrGroups(query).find(group => textMatchesAllTerms(text, splitTerms(group))) ?? '';
};
