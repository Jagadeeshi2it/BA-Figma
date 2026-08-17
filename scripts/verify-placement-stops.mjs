/**
 * Verifies `buildPlacementStops` in src/app/components/TargetBinSerialScanPage.tsx — the order the
 * placement half of step ④ sends the operator round in.
 *
 *     pnpm run dev
 *     node scripts/verify-placement-stops.mjs      # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * The walk used to be product-major: every bin of product A, then every bin of product B. With a product
 * placing into two doors that sends the operator back through a door they had closed — the one thing the
 * one-door constraint makes expensive (STEP4-GUIDANCE.md §4), and the reason the take half has a route at
 * all. This walk is bin-major, so the assertions below are mostly about one property: **every stop behind
 * one door is contiguous.**
 *
 * Loads the real module from the dev server and evaluates only the function under test — the component
 * pulls in React and the whole app graph. Same approach as verify-placement-walk-status.mjs.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

let buildPlacementStops;
try {
  const response = await fetch(`${ORIGIN}/src/app/components/TargetBinSerialScanPage.tsx`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const source = await response.text();

  const start = source.indexOf('const buildPlacementStops =');
  if (start === -1) throw new Error('buildPlacementStops not found — was it renamed or unexported?');
  const end = source.indexOf('\n};', start);
  if (end === -1) throw new Error('could not find the end of buildPlacementStops');
  const declaration = source.slice(start, end + 3);

  buildPlacementStops = (await import(
    `data:text/javascript,${encodeURIComponent(`${declaration}\nexport { buildPlacementStops };`)}`
  )).buildPlacementStops;
} catch (error) {
  console.error(`Could not load buildPlacementStops from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

let pass = 0;
let fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass += 1;
    console.log(`  ok   ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL  ${label}\n        expected ${e}\n        got      ${a}`);
  }
};

console.log('verify-placement-stops\n');

/** A product placing into the named bins, in the order productGroups holds them. */
const product = (...bins) => ({
  targetBins: bins.map(([toBinId, targetDoorName]) => ({ toBinId, targetDoorName }))
});
const walk = (groups, order, added = []) =>
  buildPlacementStops(groups, order, added).map(stop => stop.toBinId);
const pairs = (groups, order, added = []) =>
  buildPlacementStops(groups, order, added).map(stop => `${stop.productIndex}.${stop.targetBinIndex}`);

// --- The case that motivated the change: two products, one of them spanning two doors.
{
  const groups = [
    product(['d1b1', 'Door 1'], ['d3b1', 'Door 3']),
    product(['d1b2', 'Door 1'])
  ];
  const order = ['d1b1', 'd1b2', 'd3b1'];
  check('bins are walked in route order, not product order', walk(groups, order), [
    'd1b1',
    'd1b2',
    'd3b1'
  ]);
  check('and the pairs follow the bins', pairs(groups, order), ['0.0', '1.0', '0.1']);
}

// --- Contiguity is the property, so state it directly over a messier batch.
{
  const groups = [
    product(['d1b1', 'Door 1'], ['d5b1', 'Door 5']),
    product(['d5b2', 'Door 5'], ['d1b2', 'Door 1']),
    product(['d1b1', 'Door 1'])
  ];
  const order = ['d1b1', 'd1b2', 'd5b1', 'd5b2'];
  const doors = buildPlacementStops(groups, order, []).map(stop => stop.doorName);
  const runs = doors.filter((door, index) => door !== doors[index - 1]);
  check('every door is opened exactly once', runs, ['Door 1', 'Door 5']);
  check('and its stops sit together', walk(groups, order), [
    'd1b1',
    'd1b1',
    'd1b2',
    'd5b1',
    'd5b2'
  ]);
}

// --- Two products into the SAME bin are consecutive stops: that is what lets the operator finish a bin.
{
  const groups = [product(['b1', 'Door 1']), product(['b1', 'Door 1']), product(['b2', 'Door 1'])];
  check('same bin, several products, one visit', pairs(groups, ['b1', 'b2']), [
    '0.0',
    '1.0',
    '2.0'
  ]);
}

// --- A product's bins are reached in ROUTE order, which need not be their array order — and that is why
//     `isLastTargetBinForProduct` asks the walk rather than comparing `currentTargetBinIndex` against
//     `targetBins.length - 1`. Here the product's LAST array entry (b1, index 1) is the FIRST bin the walk
//     reaches, so the array test would demand the product's whole quantity at its first stop and never
//     again. In the app this only arises when no `placeBinOrder` was handed down, since productGroups sorts
//     the array by the same ranking otherwise — one route away from being a silent stranded-remainder bug.
{
  const groups = [product(['b3', 'Door 3'], ['b1', 'Door 1'])];
  const order = ['b1', 'b3'];
  check('a product reaches its bins in route order', walk(groups, order), ['b1', 'b3']);
  const own = buildPlacementStops(groups, order, [])
    .filter(stop => stop.productIndex === 0)
    .map(stop => stop.targetBinIndex);
  check('array order and walk order can genuinely differ', own, [1, 0]);
  check('so the last STOP of the product is not its last array entry', own[own.length - 1], 0);
}

// --- Bins added mid-move land after everything else, in the order they were added. With no Back in step ④,
//     a bin ranked behind the operator can never be filled.
{
  const groups = [product(['b1', 'Door 1'], ['added2', 'Door 2'], ['added1', 'Door 1'])];
  check(
    'added bins sort last, in the order they were added',
    walk(groups, ['b1', 'added1', 'added2'], ['added2', 'added1']),
    ['b1', 'added2', 'added1']
  );
}

// --- No route handed down: fall back to first-appearance order rather than reshuffling.
{
  const groups = [product(['b9', 'Door 9'], ['b2', 'Door 2']), product(['b2', 'Door 2'])];
  check('unranked bins keep first-appearance order', walk(groups, undefined), ['b9', 'b2', 'b2']);
  check('an empty route order behaves the same', walk(groups, []), ['b9', 'b2', 'b2']);
}

// --- A bin the route order does not mention sinks below the ranked ones, never to the front, where it
//     would claim to be the operator's next stop.
{
  const groups = [product(['unknown', 'Door 7'], ['b1', 'Door 1'])];
  check('an unranked bin sorts after ranked ones', walk(groups, ['b1']), ['b1', 'unknown']);
}

// --- Degenerate inputs.
check('no products, no stops', walk([], ['b1']), []);
check('a product with no target bins contributes nothing', walk([product()], ['b1']), []);

console.log(`\n${pass}/${pass + fail} assertions passed`);
if (fail > 0) {
  console.error(`${fail} FAILED`);
  process.exit(1);
}
