/**
 * Verifies the search grammar in src/app/utils/searchQuery.ts.
 *
 *     pnpm run dev
 *     node scripts/verify-search-query.mjs        # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * The case that motivated it: "carbo 600" found nothing. Terms split on commas alone, so the whole
 * thing was ONE term and had to appear verbatim — and the product reads "CARBOPLATIN 600", which
 * contains no such substring.
 *
 * Loads the real module from the dev server. See scripts/verify-move-route.mjs for why that works.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

let M;
try {
  const response = await fetch(`${ORIGIN}/src/app/utils/searchQuery.ts`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  M = await import(`data:text/javascript,${encodeURIComponent(await response.text())}`);
} catch (error) {
  console.error(`Could not load searchQuery.ts from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

const { splitOrGroups, splitTerms, textMatchesAllTerms, fieldsMatchAllTerms, queryMatchesFields, matchingGroupForText } = M;

let pass = 0, fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}\n        expected ${e}\n        actual   ${a}`); }
};

// Real rows from the seed.
const CARBO_PURCHASED = {
  name: 'CARBOPLATIN 600 MG/60 ML VIAL', ndc: '61703033956',
  source: 'McKesson', inventoryType: 'Purchased', description: 'carboplatin'
};
const CARBO_SAMPLE = { ...CARBO_PURCHASED, ndc: '61703033957', inventoryType: 'Sample' };
const OXALI = {
  name: 'OXALIPLATIN 50 MG/10 ML VIAL', ndc: '71288010110',
  source: 'McKesson', inventoryType: 'Sample', description: 'oxaliplatin'
};
const fields = p => [p.name, p.ndc, p.source, p.inventoryType, p.description];
const finds = (query, product) => queryMatchesFields(query, fields(product));

console.log('\n--- the reported bug: partial tokens, no delimiter to learn');
{
  check('"carbo" finds it', finds('carbo', CARBO_PURCHASED), true);
  check('"600" finds it', finds('600', CARBO_PURCHASED), true);
  check('"carbo 600" finds it — the query that used to return nothing', finds('carbo 600', CARBO_PURCHASED), true);
  check('order does not matter', finds('600 carbo', CARBO_PURCHASED), true);
  check('case does not matter', finds('CaRbO 600', CARBO_PURCHASED), true);
  check('extra spaces collapse', finds('  carbo    600 ', CARBO_PURCHASED), true);
  check('the comma still works, for anyone who learned it', finds('carbo, 600', CARBO_PURCHASED), true);
  check('mixed separators', finds('carbo, 600 vial', CARBO_PURCHASED), true);
}

console.log('\n--- tokens land in different fields');
{
  check('"carbo purchased" — name + inventory type', finds('carbo purchased', CARBO_PURCHASED), true);
  check('...and excludes the Sample of the same drug', finds('carbo purchased', CARBO_SAMPLE), false);
  check('"carbo sample" — the other way round', finds('carbo sample', CARBO_SAMPLE), true);
  check('...and excludes the Purchased one', finds('carbo sample', CARBO_PURCHASED), false);
  check('NDC fragment plus a name fragment', finds('carbo 61703', CARBO_PURCHASED), true);
  check('a different drug is not swept in by the shared type', finds('carbo sample', OXALI), false);
  check('every token must land somewhere', finds('carbo aspirin', CARBO_PURCHASED), false);
}

console.log('\n--- OR-groups: built by the app, never typed');
{
  const combined = 'CARBOPLATIN 600 MG/60 ML VIAL, 61703033956, Purchased | OXALIPLATIN 50 MG/10 ML VIAL, 71288010110, Sample';
  check('two groups', splitOrGroups(combined).length, 2);
  check('the first product matches its own group', finds(combined, CARBO_PURCHASED), true);
  check('so does the second', finds(combined, OXALI), true);
  check('a product in neither group does not match', finds(combined, CARBO_SAMPLE), false);
}

console.log('\n--- bin names are a single-field target');
{
  check('"bin 1a" matches Bin 1A', textMatchesAllTerms('Bin 1A', splitTerms('bin 1a')), true);
  check('...and not Bin 1B', textMatchesAllTerms('Bin 1B', splitTerms('bin 1a')), false);
  check('"bin 1" matches all of shelf 1', ['Bin 1A', 'Bin 1B', 'Bin 2A'].map(n => textMatchesAllTerms(n, splitTerms('bin 1'))), [true, true, false]);
  check('the group naming a bin is returned for highlighting', matchingGroupForText('bin 1a', 'Bin 1A'), 'bin 1a');
  check('no group names it -> empty', matchingGroupForText('carbo 600', 'Bin 1A'), '');
  check('a product query never names a bin', matchingGroupForText('CARBOPLATIN 600 MG/60 ML VIAL, 61703033956, Purchased', 'Bin 1A'), '');
}

console.log('\n--- degenerate input');
{
  check('empty query matches nothing', finds('', CARBO_PURCHASED), false);
  check('whitespace-only matches nothing', finds('   ', CARBO_PURCHASED), false);
  check('separators only matches nothing', finds(' , | , ', CARBO_PURCHASED), false);
  check('terms keep their original case for the highlighter', splitTerms('CaRbO 600'), ['CaRbO', '600']);
  check('a missing field is skipped, not treated as empty-match', fieldsMatchAllTerms([undefined, 'Purchased'], ['purchased']), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
