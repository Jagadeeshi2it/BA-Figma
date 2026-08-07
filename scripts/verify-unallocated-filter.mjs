/**
 * Verifies the Unallocated tray's badge filter — src/app/utils/unallocatedFilter.ts.
 *
 *     pnpm run dev
 *     node scripts/verify-unallocated-filter.mjs   # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * The invariant worth pinning: the panel's list and the hook's `Select All` must agree on what is
 * visible. They call one function here, so what this checks is that the function itself composes the
 * two narrowings correctly — search AND badge — and that a filter is never something Select All could
 * step outside of.
 *
 * Loads the real module from the dev server (see scripts/verify-move-route.mjs for why that works),
 * with relative import specifiers rewritten to absolute dev-server URLs so `binProducts` resolves.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

const fetchModule = async path => {
  const response = await fetch(`${ORIGIN}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  // Vite rewrites each module's imports to root-absolute paths ("/src/app/utils/binProducts.ts"). A
  // data: URL cannot resolve those — it has no base — and Node's ESM loader will not fetch http from
  // one either. So the dependency is concatenated in rather than imported: still the real code off the
  // dev server, which is the point, just linked by hand instead of by the loader.
  return (await response.text()).replace(/^\s*import\s[^\n]*$/gm, '');
};

let M;
try {
  const [filterSource, badgeSource] = await Promise.all([
    fetchModule('/src/app/utils/unallocatedFilter.ts'),
    fetchModule('/src/app/utils/binProducts.ts')
  ]);
  M = await import(
    `data:text/javascript,${encodeURIComponent(`${badgeSource}\n${filterSource}`)}`
  );
} catch (error) {
  console.error(`Could not load the filter modules from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

const {
  BADGE_FILTER_OPTIONS,
  matchesBadgeFilter,
  matchesUnallocatedSearch,
  filterUnallocatedProducts,
  // Re-exported through the concatenation above, so the cross-check below compares the filter against
  // the very functions the badges on screen are drawn from.
  getVialType,
  hasClimateBadge,
  hasCivBadge
} = M;

let pass = 0,
  fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual),
    e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error(`  FAIL  ${label}\n        expected ${e}\n        actual   ${a}`);
  }
};

/**
 * The eight products the current seed holds back for the tray (UNALLOCATED_RESERVE_IDS), in the shape
 * generateUnallocatedProducts emits. Real names, NDCs and inventory types, because a badge is a hash of
 * the identity triple — synthetic ones exercise the plumbing but not the distribution the operator sees.
 *
 * The inventory types are the ones the SEED produces, not the ones in realData.ts: `applyInventoryTypes`
 * spreads products across the four types at build time, and since the type is part of the identity
 * triple, taking them from the raw import gives different badges than the app draws. Verified against
 * the live DOM. If the tray's contents ever read differently on screen than they do here, this fixture
 * is what is stale.
 */
const TRAY = [
  { id: 'unalloc-1', name: 'SOLU-CORTEF 100 MG AOV 2 ML', description: 'hydrocortisone sod succinate (PF) 100 mg/2 mL solution for injection', ndc: '00009001103', source: 'BioCareSD', inventoryType: 'Purchased' },
  { id: 'unalloc-2', name: 'FLUOROURACIL 2.5 GRAM/50 ML VL', description: 'fluorouracil 2.5 gram/50 mL intravenous solution', ndc: '70700018822', source: 'BioCareSD', inventoryType: 'Charity Care' },
  { id: 'unalloc-3', name: 'MESNA 1 GRAM/10 ML VIAL', description: 'mesna 100 mg/mL intravenous solution', ndc: '10019095301', source: 'Oncology Supply', inventoryType: 'Charity Care' },
  { id: 'unalloc-4', name: 'DOXORUBICIN 200 MG/100 ML VIAL', description: 'doxorubicin 2 mg/mL intravenous solution', ndc: '00069154220', source: 'BioCareSD', inventoryType: 'Charity Care' },
  { id: 'unalloc-5', name: 'VINORELBINE 50 MG/5 ML VIAL', description: 'vinorelbine 50 mg/5 mL intravenous solution', ndc: '25021020405', source: 'Oncology Supply', inventoryType: 'Purchased' },
  { id: 'unalloc-6', name: 'KADCYLA 100 MG VIAL', description: 'ado-trastuzumab emtansine 100 mg intravenous solution', ndc: '50242008801', source: 'Oncology Supply', inventoryType: 'Specialty Pharmacy' },
  { id: 'unalloc-7', name: 'POLIVY 30 MG VIAL', description: 'polatuzumab vedotin-piiq 30 mg intravenous solution', ndc: '50242010301', source: 'Oncology Supply', inventoryType: 'Charity Care' },
  { id: 'unalloc-8', name: 'VYLOY 100 MG VIAL', description: 'zolbetuximab-clzb 100 mg intravenous solution', ndc: '00469342510', source: 'BioCareSD', inventoryType: 'Charity Care' }
];

const names = list => list.map(product => product.name.split(' ')[0]);

console.log('unallocatedFilter\n');

// ── The filter is the badge the row shows ───────────────────────────────────
// A filter deriving its answer any other way than the badge beside it is worse than no filter, because
// the operator can see both. Every product, every option, cross-checked against binProducts directly.
for (const product of TRAY) {
  check(`climate matches the badge — ${product.name}`, matchesBadgeFilter(product, 'climate'), hasClimateBadge(product));
  check(`civ matches the badge — ${product.name}`, matchesBadgeFilter(product, 'civ'), hasCivBadge(product));
  check(`sdv matches the badge — ${product.name}`, matchesBadgeFilter(product, 'sdv'), getVialType(product) === 'SDV');
  check(`mdv matches the badge — ${product.name}`, matchesBadgeFilter(product, 'mdv'), getVialType(product) === 'MDV');
}

// ── SDV and MDV partition; climate and CIV do not ───────────────────────────
const sdv = filterUnallocatedProducts(TRAY, '', 'sdv');
const mdv = filterUnallocatedProducts(TRAY, '', 'mdv');
check('every product is exactly one of SDV/MDV', sdv.length + mdv.length, TRAY.length);
check('SDV and MDV do not overlap', sdv.filter(p => mdv.includes(p)).length, 0);

// ── The seed actually has something to show, in every option ────────────────
// If the seed ever stops carrying a CLIMATE or CIV product, the filter still works and demonstrates
// nothing. That is a data regression the UI cannot report, so it is asserted here.
check('the seed holds CLIMATE products', filterUnallocatedProducts(TRAY, '', 'climate').length > 0, true);
check('the seed holds CIV products', filterUnallocatedProducts(TRAY, '', 'civ').length > 0, true);
check('the seed holds SDV products', sdv.length > 0, true);
check('the seed holds MDV products', mdv.length > 0, true);

// ── 'all' is the identity ───────────────────────────────────────────────────
check('all products pass the "all" option', filterUnallocatedProducts(TRAY, '', 'all').length, TRAY.length);

// ── Search and filter compose as AND, in either direction ───────────────────
// The bug this guards: an OR here would make picking a filter WIDEN the list, which reads as the
// control doing the opposite of what it says.
for (const option of BADGE_FILTER_OPTIONS) {
  const filtered = filterUnallocatedProducts(TRAY, 'vial', option.value);
  check(
    `"vial" + ${option.value} is a subset of ${option.value} alone`,
    filtered.every(product => matchesBadgeFilter(product, option.value)),
    true
  );
  check(
    `"vial" + ${option.value} is a subset of "vial" alone`,
    filtered.every(product => matchesUnallocatedSearch(product, 'vial')),
    true
  );
}

// A concrete pairing rather than only the algebra above.
const climate = filterUnallocatedProducts(TRAY, '', 'climate');
check('CLIMATE alone', names(climate), ['SOLU-CORTEF', 'FLUOROURACIL']);
check('CIV alone', names(filterUnallocatedProducts(TRAY, '', 'civ')), ['VINORELBINE', 'VYLOY']);
check('SDV alone', names(sdv), ['SOLU-CORTEF', 'FLUOROURACIL']);
check('CLIMATE + a query matching one of them', names(filterUnallocatedProducts(TRAY, 'fluoro', 'climate')), ['FLUOROURACIL']);
check('CLIMATE + a query matching neither', filterUnallocatedProducts(TRAY, 'kadcyla', 'climate').length, 0);

// ── Select All can never step outside the list ──────────────────────────────
// The whole reason the predicate is shared. Both callers pass the same three arguments, so this asserts
// the property that matters: the visible set is a function of (query, filter) and nothing else.
for (const option of BADGE_FILTER_OPTIONS) {
  for (const query of ['', 'vial', 'PURCHASED', 'zzz']) {
    const listed = filterUnallocatedProducts(TRAY, query, option.value);
    const ticked = filterUnallocatedProducts(TRAY, query, option.value);
    check(`Select All ticks exactly what is listed — ${option.value} / "${query}"`, names(ticked), names(listed));
  }
}

// ── Search still reaches every field it used to ─────────────────────────────
check('search by NDC', names(filterUnallocatedProducts(TRAY, '50242008801', 'all')), ['KADCYLA']);
check('search by source', names(filterUnallocatedProducts(TRAY, 'biocaresd', 'all')), ['SOLU-CORTEF', 'FLUOROURACIL', 'DOXORUBICIN', 'VYLOY']);
check('search by generic name', names(filterUnallocatedProducts(TRAY, 'mesna', 'all')), ['MESNA']);
check('search is case-insensitive', names(filterUnallocatedProducts(TRAY, 'PoLiVy', 'all')), ['POLIVY']);
check('whitespace-only query lists everything', filterUnallocatedProducts(TRAY, '   ', 'all').length, TRAY.length);

// ── The options carry no counts ─────────────────────────────────────────────
// A count read as informative and was not: the trigger shows the selected option's label, so the number
// on screen most of the time restated the list directly below it, and it moved as the tray emptied —
// flickering during exactly the bulk allocation the filter exists to serve.
check('no option label carries a count', BADGE_FILTER_OPTIONS.some(option => /\(\s*\d+\s*\)/.test(option.label)), false);
check('badgeFilterCounts is gone', typeof M.badgeFilterCounts, 'undefined');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
