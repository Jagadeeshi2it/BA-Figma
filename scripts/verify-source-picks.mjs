/**
 * Verifies the (bin, product) pair model behind a Move by Product's source selection.
 *
 *     pnpm run dev
 *     node scripts/verify-source-picks.mjs          # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * The case that motivated it: picking OCTAGAM from Bin 1B and then ALBURX from Bin 1C must NOT also
 * pick the OCTAGAM that happens to sit in Bin 1C. Under the old query-only selection it did, because a
 * query is a list of identities with no bin attached.
 *
 * Loads the real module from the dev server. See scripts/verify-move-route.mjs for why that works.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

let M;
try {
  const response = await fetch(`${ORIGIN}/src/app/utils/sourcePicks.ts`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  M = await import(`data:text/javascript,${encodeURIComponent(await response.text())}`);
} catch (error) {
  console.error(`Could not load sourcePicks.ts from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

const {
  sourcePickKey, sourcePickQueryGroup, hasSourcePick, addSourcePicks, removeSourcePick,
  removeSourcePicksForProduct, removeSourcePicksForBin,
  binsFromSourcePicks, productKeysForBin, allPickedProductKeys
} = M;

let pass = 0, fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}\n        expected ${e}\n        actual   ${a}`); }
};

const OCTAGAM = { name: 'OCTAGAM 10% VL 5GM 50ML', ndc: '68982085002', inventoryType: 'Sample' };
const ALBURX = { name: 'ALBURX (HUMAN) 25% VIAL 25GM/100ML', ndc: '44206025110', inventoryType: 'Specialty Pharmacy' };
const oct = sourcePickKey(OCTAGAM), alb = sourcePickKey(ALBURX);

console.log('\n--- the reported bug: a pick in one bin must not reach another');
{
  // Tap OCTAGAM in Bin 1B, then ALBURX in Bin 1C. Bin 1C also CONTAINS Octagam.
  let picks = addSourcePicks([], [{ binId: '1B', productKey: oct }]);
  picks = addSourcePicks(picks, [{ binId: '1C', productKey: alb }]);

  check('Bin 1B has only OCTAGAM picked', productKeysForBin(picks, '1B'), [oct]);
  check('Bin 1C has only ALBURX picked', productKeysForBin(picks, '1C'), [alb]);
  check("Bin 1C's OCTAGAM was NOT picked", hasSourcePick(picks, '1C', oct), false);
  check('both bins are in play', binsFromSourcePicks(picks), ['1B', '1C']);
  check('two identities picked overall', allPickedProductKeys(picks).length, 2);
}

console.log('\n--- the exception: a search pick spans every bin the product lives in');
{
  // The dropdown enumerates the bins itself, so the gesture creates one pair per bin.
  const picks = addSourcePicks([], ['1B', '1C', '2B'].map(binId => ({ binId, productKey: oct })));
  check('all three bins picked', binsFromSourcePicks(picks), ['1B', '1C', '2B']);
  check('each holds just that product', ['1B', '1C', '2B'].map(b => productKeysForBin(picks, b)), [[oct], [oct], [oct]]);
}

console.log('\n--- un-picking one bin of a search pick leaves the others');
{
  let picks = addSourcePicks([], ['1B', '1C', '2B'].map(binId => ({ binId, productKey: oct })));
  picks = removeSourcePick(picks, '1C', oct);
  check('1C released', binsFromSourcePicks(picks), ['1B', '2B']);
  check('the identity is still picked elsewhere', allPickedProductKeys(picks), [oct]);
}

console.log('\n--- removing a product from the review panel drops it everywhere');
{
  let picks = addSourcePicks([], [
    { binId: '1B', productKey: oct }, { binId: '1C', productKey: oct }, { binId: '1C', productKey: alb },
  ]);
  picks = removeSourcePicksForProduct(picks, oct);
  check('no OCTAGAM pick remains', allPickedProductKeys(picks), [alb]);
  check('1B is released, 1C stays for ALBURX', binsFromSourcePicks(picks), ['1C']);
}

console.log('\n--- removing a bin drops its picks only');
{
  let picks = addSourcePicks([], [
    { binId: '1B', productKey: oct }, { binId: '1C', productKey: oct }, { binId: '1C', productKey: alb },
  ]);
  picks = removeSourcePicksForBin(picks, '1C');
  check('only 1B left', picks, [{ binId: '1B', productKey: oct }]);
}

console.log('\n--- idempotence and identity');
{
  let picks = addSourcePicks([], [{ binId: '1B', productKey: oct }]);
  picks = addSourcePicks(picks, [{ binId: '1B', productKey: oct }]);
  check('re-adding the same pair is a no-op', picks.length, 1);
  // Identity is the triple, so the same drug under a different inventory type is a different product.
  const charity = sourcePickKey({ ...OCTAGAM, inventoryType: 'Charity Care' });
  check('inventory type is part of the identity', charity === oct, false);
  check('case does not matter', sourcePickKey({ name: 'Octagam 10% VL 5GM 50ML', ndc: '68982085002', inventoryType: 'sample' }), oct);
  check('a bin with no picks reports none', productKeysForBin(picks, 'nope'), []);
}

console.log('\n--- a picked row is highlighted against its own identity');
{
  // Not against the search box: clearing the box must not un-highlight something still picked.
  check('the group is the comma-separated AND-set the query channels use',
    sourcePickQueryGroup(OCTAGAM), 'OCTAGAM 10% VL 5GM 50ML, 68982085002, Sample');
  check('missing fields are dropped rather than leaving empty terms',
    sourcePickQueryGroup({ name: 'X' }), 'X');
  check('nothing to say produces nothing', sourcePickQueryGroup({}), '');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
