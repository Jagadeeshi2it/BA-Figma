// How many distinct products an allocation selection was built from. The highlight query behind a
// search-driven selection carries one `|`-separated OR-group per product picked from the search list,
// so counting groups counts products. Returns 0 when the bins were clicked straight off the shelf,
// which is exactly the case where a product count would be a guess rather than a fact.
export const countSelectedProducts = (query: string | undefined): number =>
  (query || '')
    .split('|')
    .map(group => group.trim())
    .filter(group => group.length > 0)
    .length;
