/**
 * The step-④ quantity walk: every stop the operator has not skipped is visited exactly once, in the
 * route's order.
 *
 * `groupedTransfers` arrives already ordered by the route (takeBinOrder, door by door), so a product with
 * bins behind two doors has OTHER products' bins between its own. The page used to advance by looking for
 * the next group of the same product, which reordered the route behind the planner's back and stepped over
 * whatever lay between — and because a row's status is positional (groupIndex < currentIndex reads as
 * "done"), those stepped-over bins were reported as Taken at a default quantity the operator never saw.
 *
 * Run: node scripts/verify-quantity-walk.mjs
 */

const productKeyOf = group => `${group.productName}-${group.ndc}-${group.inventoryType}`;

// The page's own navigation, transcribed.
const findNextStopIndex = (groupedTransfers, currentIndex, skipped) =>
  groupedTransfers.findIndex(
    (group, idx) => idx > currentIndex && !skipped.has(productKeyOf(group))
  );

/**
 * Walk the batch. `skipAt` names stops where the operator presses Skip Product (by index of the stop as
 * the walk reaches it), so a skip mid-walk can be modelled.
 */
const walk = (groupedTransfers, skipAtIndexes = []) => {
  const skipped = new Set();
  const visited = [];
  let currentIndex = 0;

  // Guard against a runaway loop in a broken implementation rather than hanging the script.
  for (let guard = 0; guard <= groupedTransfers.length + 2; guard++) {
    visited.push(currentIndex);

    if (skipAtIndexes.includes(currentIndex)) {
      skipped.add(productKeyOf(groupedTransfers[currentIndex]));
    }

    const next = findNextStopIndex(groupedTransfers, currentIndex, skipped);
    if (next === -1) {
      return { visited, skipped, finalized: true };
    }
    currentIndex = next;
  }
  return { visited, skipped, finalized: false };
};

// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const ok = (label, condition) => {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}`);
  }
};

const group = (productName, ndc, bin) => ({
  productName,
  ndc,
  inventoryType: 'Charity Care',
  sourceBinName: bin
});

// The reported case: four CARBOPLATIN variants, three sharing a display name, ordered door by door so one
// product's bins (4C behind Door 2, then 2A and 2B behind Door 3) straddle the others'.
const interleaved = [
  group('CARBOPLATIN 600 MG/60 ML VIAL', '61703033956', 'Bin 4C'), // Door 2
  group('CARBOPLATIN 450 MG/45 ML VIAL', '60505628206', 'Bin 1B'), // Door 3
  group('CARBOPLATIN 600 MG/60 ML VIAL', '63323017260', 'Bin 1D'), // Door 3
  group('CARBOPLATIN 600 MG/60 ML VIAL', '61703033956', 'Bin 2A'), // Door 3
  group('CARBOPLATIN 600 MG/60 ML VIAL', '61703033956', 'Bin 2B'), // Door 3
  group('CARBOPLATIN 600 MG/60 ML VIAL', '60505628207', 'Bin 3B') // Door 3
];

console.log('The reported interleaving');
{
  const { visited, finalized } = walk(interleaved);
  ok('visits every stop', visited.length === interleaved.length);
  ok('in the route order, never jumping back', visited.every((v, i) => v === i));
  ok('nothing is stepped over', new Set(visited).size === interleaved.length);
  ok('and it finalizes at the end', finalized);
}

console.log('\nSkipping a product with bins further along the walk');
{
  // Skip 61703033956 at its first stop (index 0). Its other bins — 2A and 2B — lie at 3 and 4, so the walk
  // has to step over those and still visit everything else.
  const { visited, skipped, finalized } = walk(interleaved, [0]);
  ok('the skipped product is recorded once', skipped.size === 1);
  ok('its later bins are stepped over', !visited.includes(3) && !visited.includes(4));
  ok('every other stop is still visited', [1, 2, 5].every(i => visited.includes(i)));
  ok('and it finalizes', finalized);
}

console.log('\nSkipping the last stop');
{
  const { visited, finalized } = walk(interleaved, [5]);
  ok('the walk still ends rather than stalling', finalized);
  ok('every stop was reached', visited.length === interleaved.length);
}

console.log('\nA single product across several bins');
{
  const oneProduct = [
    group('ALIMTA 100 MG VIAL', '00002764001', 'Bin 1A'),
    group('ALIMTA 100 MG VIAL', '00002764001', 'Bin 1B'),
    group('ALIMTA 100 MG VIAL', '00002764001', 'Bin 2C')
  ];
  const { visited, finalized } = walk(oneProduct);
  ok('walks all three bins', visited.length === 3 && visited.every((v, i) => v === i));
  ok('and finalizes', finalized);

  const skippedRun = walk(oneProduct, [0]);
  ok('skipping it at the first bin ends the walk', skippedRun.finalized);
  ok('without visiting its other bins', skippedRun.visited.length === 1);
}

console.log('\nOne stop only');
{
  const single = [group('VYLOY 300 MG VIAL', '00469442530', 'Bin 2A')];
  const { visited, finalized } = walk(single);
  ok('is visited and finalizes', finalized && visited.length === 1);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
