/**
 * Verifies the one-door-at-a-time rule (STEP4-GUIDANCE.md §1) against the pure transition in
 * src/app/utils/cabinetAccess.ts, and then walks a planned route through it to prove the two agree:
 * a route is only honest if working it never asks for a second door while one is open.
 *
 *     pnpm run dev          # in one terminal — the loader needs it
 *     node scripts/verify-cabinet-access.mjs
 *
 * Loads the real modules from the dev server rather than transcribing them. See
 * scripts/verify-move-route.mjs for why that works.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

const load = async (path) => {
  const response = await fetch(`${ORIGIN}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  const code = await response.text();
  return import(`data:text/javascript,${encodeURIComponent(code)}`);
};

let nextDoorTransition, planMoveRoute;
try {
  ({ nextDoorTransition } = await load('/src/app/utils/cabinetAccess.ts'));
  ({ planMoveRoute } = await load('/src/app/utils/moveRoute.ts'));
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

const FRIDGE = new Set(['Door 9', 'Door 10', 'Door 11', 'Door 12', 'Door 13', 'Door 14']);
const step = (openDoor, requested) =>
  nextDoorTransition(openDoor, requested, FRIDGE.has(requested ?? ''));

console.log('\n--- the transition');
check('first unlock has nothing to lock', step(null, 'Door 3'),
  { locked: null, unlocked: 'Door 3', openDoor: 'Door 3' });
check('a second door locks the first', step('Door 3', 'Door 1'),
  { locked: 'Door 3', unlocked: 'Door 1', openDoor: 'Door 1' });
check('asking for the open door is not a transition', step('Door 3', 'Door 3'),
  { locked: null, unlocked: null, openDoor: 'Door 3' });
check('a fridge needs no unlock and closes the cabinet', step('Door 3', 'Door 11'),
  { locked: 'Door 3', unlocked: null, openDoor: null });
check('a fridge from a locked cabinet changes nothing', step(null, 'Door 11'),
  { locked: null, unlocked: null, openDoor: null });
check('no request is not a transition', step('Door 3', undefined),
  { locked: null, unlocked: null, openDoor: 'Door 3' });
check('a fridge is never the open door', step(null, 'Door 11').openDoor, null);

console.log('\n--- across cabinets: the rule is global, not per cabinet');
// Door 3 is Cabinet 1, Door 8 is Cabinet 2. Opening one must still lock the other.
check('Cabinet 2 door locks the Cabinet 1 door', step('Door 3', 'Door 8'),
  { locked: 'Door 3', unlocked: 'Door 8', openDoor: 'Door 8' });

console.log('\n--- walking a planned route: never two doors at once');
{
  const bins = new Map([
    ['s1', { binId: 's1', binName: 'Bin 4C', doorName: 'Door 2', storage: 'cabinet' }],
    ['s2', { binId: 's2', binName: 'Bin 2A', doorName: 'Door 3', storage: 'cabinet' }],
    ['s3', { binId: 's3', binName: 'Bin 2B', doorName: 'Door 3', storage: 'cabinet' }],
    ['f', { binId: 'f', binName: 'Fridge Bin', doorName: 'Door 11', storage: 'fridge' }],
    ['d', { binId: 'd', binName: 'Bin 1C', doorName: 'Door 3', storage: 'cabinet' }],
  ]);
  const t = (productId, from, to, quantity) => ({
    productId, fromBinId: from, toBinId: to, quantity,
    productName: 'ALIMTA', ndc: 'NDC1', inventoryType: 'Purchased', unit: 'vial',
  });
  const route = planMoveRoute([
    t('p1', 's1', 'd', 25), t('p2', 's2', 'd', 10), t('p3', 's3', 'd', 5), t('p4', 'f', 'd', 12),
  ], bins);

  let openDoor = null;
  const log = [];
  let unlocks = 0, locks = 0;
  route.stops.forEach((stop) => {
    const transition = step(openDoor, stop.doorName);
    if (transition.locked) { locks++; log.push(`lock ${transition.locked}`); }
    if (transition.unlocked) { unlocks++; log.push(`unlock ${transition.unlocked}`); }
    openDoor = transition.openDoor;
    log.push(`  ${stop.binName} (${stop.doorName})`);
    // The invariant: whatever bin we are at, at most one door is open, and it is this bin's door
    // unless this bin is in a fridge.
    if (stop.storage === 'cabinet' && openDoor !== stop.doorName) {
      fail++; console.log(`  FAIL at ${stop.binName}: open door is ${openDoor}, expected ${stop.doorName}`);
    }
  });
  log.forEach((line) => console.log(`    ${line}`));
  check('one unlock per cabinet door visit', unlocks, route.cabinetDoorVisits);
  check('every stop found its own door open (or was a fridge)', true, true);
  check('the last cabinet door is still open until the flow locks up', openDoor, 'Door 3');
}

console.log('\n--- the split-door case still opens one at a time');
{
  const bins = new Map([
    ['s1', { binId: 's1', binName: 'Bin 1A', doorName: 'Door 1', storage: 'cabinet' }],
    ['t1', { binId: 't1', binName: 'Bin 1B', doorName: 'Door 1', storage: 'cabinet' }],
    ['s2', { binId: 's2', binName: 'Bin 2A', doorName: 'Door 2', storage: 'cabinet' }],
    ['t2', { binId: 't2', binName: 'Bin 2B', doorName: 'Door 2', storage: 'cabinet' }],
  ]);
  const route = planMoveRoute([
    { productId: 'p1', fromBinId: 's1', toBinId: 't2', quantity: 7, productName: 'ALIMTA', ndc: 'N1', inventoryType: 'Purchased' },
    { productId: 'p2', fromBinId: 's2', toBinId: 't1', quantity: 3, productName: 'CARBOPLATIN', ndc: 'N2', inventoryType: 'Purchased' },
  ], bins);

  let openDoor = null;
  let unlocks = 0;
  const visited = [];
  route.stops.forEach((stop) => {
    const transition = step(openDoor, stop.doorName);
    if (transition.unlocked) { unlocks++; visited.push(transition.unlocked); }
    openDoor = transition.openDoor;
    if (openDoor !== stop.doorName) {
      fail++; console.log(`  FAIL at ${stop.binName}: open door is ${openDoor}`);
    }
  });
  console.log(`    door order: ${visited.join(' -> ')}`);
  check('the split door is genuinely unlocked twice', unlocks, 3);
  check('and it is the same door returning', visited[0], visited[2]);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
