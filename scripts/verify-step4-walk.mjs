/**
 * Verifies that ordering step ④'s two screens by the route removes the redundant door interaction —
 * the reported case: sources behind Door 1 and Door 7, target behind Door 1, which used to cost three
 * door interactions (Door 1, Door 7, Door 1) instead of two.
 *
 *     pnpm run dev
 *     node scripts/verify-step4-walk.mjs
 *
 * Loads the real modules from the dev server. See scripts/verify-move-route.mjs for why that works.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';
const load = async (path) => {
  const response = await fetch(`${ORIGIN}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return import(`data:text/javascript,${encodeURIComponent(await response.text())}`);
};

let planMoveRoute, twoPhaseWalkOrder, nextDoorTransition;
try {
  ({ planMoveRoute, twoPhaseWalkOrder } = await load('/src/app/utils/moveRoute.ts'));
  ({ nextDoorTransition } = await load('/src/app/utils/cabinetAccess.ts'));
} catch (error) {
  console.error(`Could not load modules from ${ORIGIN} — is the dev server running?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

let pass = 0, fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}\n        expected ${e}\n        actual   ${a}`); }
};

const FRIDGE = new Set(['Door 9','Door 10','Door 11','Door 12','Door 13','Door 14']);

/**
 * Counts the door interactions the operator actually performs, by walking bins through the real door
 * transition. This is the figure the complaint was about — not visits in the plan, but unlocks in the hand.
 */
const doorInteractions = (binIds, binIndex) => {
  let openDoor = null, unlocks = 0;
  const sequence = [];
  binIds.forEach((binId) => {
    const bin = binIndex.get(binId);
    const transition = nextDoorTransition(openDoor, bin.doorName, FRIDGE.has(bin.doorName));
    if (transition.unlocked) { unlocks++; sequence.push(transition.unlocked); }
    openDoor = transition.openDoor;
  });
  return { unlocks, sequence };
};

// ── The reported scenario ─────────────────────────────────────────────────────────────────────────
const bins = new Map([
  ['d1b', { binId: 'd1b', binName: 'Bin 1B', doorName: 'Door 1', storage: 'cabinet' }],
  ['d7b', { binId: 'd7b', binName: 'Bin 1B', doorName: 'Door 7', storage: 'cabinet' }],
  ['tgt', { binId: 'tgt', binName: 'Bin 3A', doorName: 'Door 1', storage: 'cabinet' }],
]);
const t = (id, from, qty, name, ndc) => ({
  productId: id, fromBinId: from, toBinId: 'tgt', quantity: qty,
  productName: name, ndc, inventoryType: 'Sample', unit: 'vial',
});
// Arrival order deliberately puts the Door 1 products first — this is what produced Door 1 -> 7 -> 1.
const transfers = [
  t('p1', 'd1b',   0, 'ALIMTA 100 MG VIAL', 'N1'),
  t('p2', 'd1b', 190, 'OCTAGAM 10% VL 5GM 50ML', 'N2'),
  t('p3', 'd7b',  82, 'IRINOTECAN HCL 40 MG/2 ML VIAL', 'N3'),
  t('p4', 'd7b',  25, 'MARGENZA 250 MG/10 ML VIAL', 'N4'),
];

console.log('\n--- before: arrival order (what the screens used to walk)');
{
  // Takes in arrival order, then the placement.
  const takeBins = [...new Set(transfers.map(x => x.fromBinId))];
  const placeBins = [...new Set(transfers.map(x => x.toBinId))];
  const { unlocks, sequence } = doorInteractions([...takeBins, ...placeBins], bins);
  console.log(`    ${sequence.join(' -> ')}`);
  check('arrival order costs three door interactions', unlocks, 3);
  check('and returns to a door it had finished with', sequence[0] === sequence[2], true);
}

console.log('\n--- after: route order');
const route = planMoveRoute(transfers, bins);
const walk = twoPhaseWalkOrder(route, bins);
{
  const { unlocks, sequence } = doorInteractions([...walk.takeBinOrder, ...walk.placeBinOrder], bins);
  console.log(`    ${sequence.join(' -> ')}`);
  check('route order costs two', unlocks, 2);
  check('Door 7 is worked first', sequence[0], 'Door 7');
  check('the target door is worked last, and stays open for the placement', sequence[1], 'Door 1');
  check('no door is opened twice', new Set(sequence).size, sequence.length);
  check('two phases lose nothing here', walk.extraDoorVisits, 0);
  check('and no interleaving was needed', walk.needsInterleaving, false);
}

console.log('\n--- the case two phases genuinely cannot do');
{
  // Two independent moves: Door 2 -> Door 3, and Door 7 -> Door 1. The ideal route interleaves
  // (take, place, take, place); two phases must do both takes first, which costs an extra visit.
  const idx = new Map([
    ['s2', { binId: 's2', binName: 'Bin 1A', doorName: 'Door 2', storage: 'cabinet' }],
    ['t3', { binId: 't3', binName: 'Bin 1A', doorName: 'Door 3', storage: 'cabinet' }],
    ['s7', { binId: 's7', binName: 'Bin 1A', doorName: 'Door 7', storage: 'cabinet' }],
    ['t1', { binId: 't1', binName: 'Bin 1A', doorName: 'Door 1', storage: 'cabinet' }],
  ]);
  const r = planMoveRoute([
    { productId: 'a', fromBinId: 's2', toBinId: 't3', quantity: 5, productName: 'A', ndc: 'A', inventoryType: 'Purchased' },
    { productId: 'b', fromBinId: 's7', toBinId: 't1', quantity: 5, productName: 'B', ndc: 'B', inventoryType: 'Purchased' },
  ], idx);
  const w = twoPhaseWalkOrder(r, idx);
  console.log(`    ideal route: ${r.visits.map(v => v.doorName).join(' -> ')}  (${r.cabinetDoorVisits} visits)`);
  const { sequence } = doorInteractions([...w.takeBinOrder, ...w.placeBinOrder], idx);
  console.log(`    two-phase:   ${sequence.join(' -> ')}`);
  check('reported as needing interleaving', w.needsInterleaving, true);
  // Interleaving is not always more expensive: here the two-phase order visits four doors too, just in a
  // different sequence. needsInterleaving says the plan was not followed; extraDoorVisits says what that
  // cost, and the two are independent.
  check('but reordering was free — four visits either way', w.extraDoorVisits, 0);
}

console.log('\n--- where two phases genuinely cost more');
{
  // Each door holds a source AND its own target. Ideally each is one visit: take, then place, while it is
  // open. Two phases must do every take before any place, so each door is opened twice.
  const idx = new Map([
    ['s2', { binId: 's2', binName: 'Bin 1A', doorName: 'Door 2', storage: 'cabinet' }],
    ['t2', { binId: 't2', binName: 'Bin 2A', doorName: 'Door 2', storage: 'cabinet' }],
    ['s7', { binId: 's7', binName: 'Bin 1A', doorName: 'Door 7', storage: 'cabinet' }],
    ['t7', { binId: 't7', binName: 'Bin 2A', doorName: 'Door 7', storage: 'cabinet' }],
  ]);
  const r = planMoveRoute([
    { productId: 'a', fromBinId: 's2', toBinId: 't2', quantity: 5, productName: 'A', ndc: 'A', inventoryType: 'Purchased' },
    { productId: 'b', fromBinId: 's7', toBinId: 't7', quantity: 5, productName: 'B', ndc: 'B', inventoryType: 'Purchased' },
  ], idx);
  const w = twoPhaseWalkOrder(r, idx);
  console.log(`    ideal route: ${r.visits.map(v => v.doorName).join(' -> ')}  (${r.cabinetDoorVisits} visits)`);
  const { sequence, unlocks } = doorInteractions([...w.takeBinOrder, ...w.placeBinOrder], idx);
  console.log(`    two-phase:   ${sequence.join(' -> ')}  (${unlocks} unlocks)`);
  check('the ideal route is two visits', r.cabinetDoorVisits, 2);
  check('two phases cost four', unlocks, 4);
  check('and the extra is reported rather than hidden', w.extraDoorVisits, 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
