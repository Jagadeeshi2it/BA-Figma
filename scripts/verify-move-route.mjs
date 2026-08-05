/**
 * Verifies the step ④ route planner against the scenarios in STEP4-GUIDANCE.md.
 *
 *     pnpm run dev          # in one terminal — the loader below needs it
 *     node scripts/verify-move-route.mjs
 *
 * The project has no test runner and no tsc (CLAUDE.md §6), so this reaches for what it does have: the
 * dev server already transforms TypeScript, so the planner is fetched from it and imported as real
 * JavaScript. That means this checks the ACTUAL module rather than a transcription of it — the usual
 * Node-replay method's weak point. It works only because moveRoute.ts is deliberately import-free; a
 * planner reaching into doorUtils could not be loaded this way.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';
const MODULE_PATH = '/src/app/utils/moveRoute.ts';

let planMoveRoute;
try {
  const response = await fetch(`${ORIGIN}${MODULE_PATH}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const code = await response.text();
  // Data URL rather than a temp file: nothing to clean up, and no import resolution to get wrong.
  ({ planMoveRoute } = await import(`data:text/javascript,${encodeURIComponent(code)}`));
} catch (error) {
  console.error(`Could not load ${MODULE_PATH} from ${ORIGIN} — is the dev server running?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

let pass = 0, fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}\n        expected ${e}\n        actual   ${a}`); }
};

const bins = (...defs) => new Map(defs.map(([binId, binName, doorName, storage = 'cabinet']) =>
  [binId, { binId, binName, doorName, storage }]));

const t = (productId, fromBinId, toBinId, quantity, productName, ndc = 'NDC1', inventoryType = 'Purchased') =>
  ({ productId, fromBinId, toBinId, quantity, productName, ndc, inventoryType, unit: 'vial' });

// A compact reading of the route, for eyeballing and asserting.
const render = (route) => route.visits.map(v =>
  `${v.doorName}${v.visitIndex > 1 ? `(visit ${v.visitIndex})` : ''}${v.storage === 'fridge' ? ' [fridge]' : ''}: ` +
  v.stops.map(s => `${s.binName}{${s.actions.map(a => `${a.kind} ${a.quantity ?? '?'}`).join(', ')}}`).join(' -> ')
);
const show = (label, route) => {
  console.log(`\n--- ${label} — ${route.cabinetDoorVisits} cabinet visit(s), ${route.doorTransitions} transition(s), ${route.stops.length} stop(s)`);
  render(route).forEach(line => console.log(`    ${line}`));
  if (route.splitDoors.length) console.log(`    split: ${route.splitDoors.join(', ')}`);
};

// ── Scenario 1a: one source, one target, same door ────────────────────────────────────────────────
{
  const idx = bins(['s', 'Bin 2A', 'Door 3'], ['d', 'Bin 3D', 'Door 3']);
  const route = planMoveRoute([t('p1', 's', 'd', 10, 'ALIMTA')], idx);
  show('1a same door', route);
  check('1a visits', route.cabinetDoorVisits, 1);
  check('1a transitions', route.doorTransitions, 0);
  check('1a route', render(route), ['Door 3: Bin 2A{take 10} -> Bin 3D{place 10}']);
}

// ── Scenario 1b: one source, one target, different doors ──────────────────────────────────────────
{
  const idx = bins(['s', 'Bin 2A', 'Door 3'], ['d', 'Bin 1C', 'Door 1']);
  const route = planMoveRoute([t('p1', 's', 'd', 10, 'ALIMTA')], idx);
  show('1b different doors', route);
  check('1b visits', route.cabinetDoorVisits, 2);
  check('1b transitions', route.doorTransitions, 1);
  check('1b source door first', render(route), ['Door 3: Bin 2A{take 10}', 'Door 1: Bin 1C{place 10}']);
}

// ── Scenario 2: 3 sources over 2 doors, target behind one of them ─────────────────────────────────
{
  const idx = bins(
    ['s1', 'Bin 4C', 'Door 2'], ['s2', 'Bin 2A', 'Door 3'], ['s3', 'Bin 2B', 'Door 3'],
    ['d', 'Bin 1C', 'Door 3']);
  const route = planMoveRoute([
    t('p1', 's1', 'd', 25, 'ALIMTA'),
    t('p2', 's2', 'd', 10, 'ALIMTA'),
    t('p3', 's3', 'd', 5, 'ALIMTA'),
  ], idx);
  show('2 three sources, one target', route);
  check('2 visits', route.cabinetDoorVisits, 2);
  check('2 transitions', route.doorTransitions, 1);
  check('2 stops', route.stops.length, 4);
  check('2 route', render(route), [
    'Door 2: Bin 4C{take 25}',
    'Door 3: Bin 2A{take 10} -> Bin 2B{take 5} -> Bin 1C{place 40}',
  ]);
}

// ── Scenario 3: a fridge is involved ──────────────────────────────────────────────────────────────
{
  const idx = bins(['s1', 'Bin 2A', 'Door 3'], ['f', 'Fridge Bin', 'Door 11', 'fridge'], ['d', 'Bin 1C', 'Door 3']);
  const route = planMoveRoute([
    t('p1', 's1', 'd', 10, 'ALIMTA'),
    t('p2', 'f', 'd', 12, 'ALIMTA'),
  ], idx);
  show('3 fridge source', route);
  check('3 cabinet visits', route.cabinetDoorVisits, 1);
  check('3 fridge take goes first', render(route), [
    'Door 11 [fridge]: Fridge Bin{take 12}',
    'Door 3: Bin 2A{take 10} -> Bin 1C{place 22}',
  ]);
}

// ── Scenario 4: the precedence cycle ──────────────────────────────────────────────────────────────
{
  const idx = bins(
    ['s1', 'Bin 1A', 'Door 1'], ['t1', 'Bin 1B', 'Door 1'],
    ['s2', 'Bin 2A', 'Door 2'], ['t2', 'Bin 2B', 'Door 2']);
  // S1 (Door 1) -> T2 (Door 2), and S2 (Door 2) -> T1 (Door 1). Mutual dependency.
  const route = planMoveRoute([
    t('p1', 's1', 't2', 7, 'ALIMTA', 'NDC1'),
    t('p2', 's2', 't1', 3, 'CARBOPLATIN', 'NDC2'),
  ], idx);
  show('4 cycle', route);
  check('4 a door was split', route.splitDoors.length > 0, true);
  check('4 three cabinet visits', route.cabinetDoorVisits, 3);
  check('4 no door open twice at once (each visit is one door)',
    route.visits.every(v => new Set(v.stops.map(s => s.doorName)).size === 1), true);
}

// ── The §3 trap: a transfer's quantity is the source's WHOLE amount, repeated per target ───────────
{
  const idx = bins(['s', 'Bin 2A', 'Door 3'], ['d1', 'Bin 1C', 'Door 1'], ['d2', 'Bin 1D', 'Door 1']);
  // One source, 12 vials, split across two targets: BOTH transfers carry 12, not 6 each.
  const route = planMoveRoute([
    t('p1', 's', 'd1', 12, 'ALIMTA'),
    t('p1', 's', 'd2', 12, 'ALIMTA'),
  ], idx);
  show('split across two targets', route);
  const take = route.stops.find(s => s.binId === 's').actions[0];
  check('take is 12, not summed to 24', take.quantity, 12);
  const places = route.stops.filter(s => s.binId !== 's').flatMap(s => s.actions.map(a => a.quantity));
  check('both places undecided (null)', places, [null, null]);
}

// ── Determinism (R5) ──────────────────────────────────────────────────────────────────────────────
{
  const idx = bins(
    ['s1', 'Bin 4C', 'Door 2'], ['s2', 'Bin 2A', 'Door 3'], ['s3', 'Bin 1A', 'Door 1'],
    ['d', 'Bin 1C', 'Door 3']);
  const transfers = [
    t('p3', 's3', 'd', 1, 'ALIMTA'), t('p1', 's1', 'd', 25, 'ALIMTA'), t('p2', 's2', 'd', 10, 'ALIMTA'),
  ];
  const a = render(planMoveRoute(transfers, idx));
  const b = render(planMoveRoute([...transfers].reverse(), idx));
  check('same route regardless of transfer order', a, b);
  check('ascending door number among equals', a, [
    'Door 1: Bin 1A{take 1}',
    'Door 2: Bin 4C{take 25}',
    'Door 3: Bin 2A{take 10} -> Bin 1C{place 36}',
  ]);
}

// ── A bin that is both source and target is ONE stop, takes first ─────────────────────────────────
{
  const idx = bins(['b', 'Bin 2A', 'Door 3'], ['other', 'Bin 3D', 'Door 3']);
  const route = planMoveRoute([
    t('p1', 'b', 'other', 5, 'ALIMTA', 'NDC1'),
    t('p2', 'other', 'b', 8, 'CARBOPLATIN', 'NDC2'),
  ], idx);
  show('bin is both source and target', route);
  check('one visit', route.cabinetDoorVisits, 1);
  // Each bin's arriving stock comes out of the OTHER bin behind this same door, so neither place can be
  // merged into its bin's take stop: all takes must happen first.
  check('every take precedes every place in the visit', render(route),
    ['Door 3: Bin 2A{take 5} -> Bin 3D{take 8} -> Bin 2A{place 8} -> Bin 3D{place 5}']);
  check('no bin is filled from stock still behind this door', (() => {
    const order = route.stops.flatMap((s, i) => s.actions.map(a => ({ ...a, at: i, binId: s.binId })));
    const lastTakeAt = Math.max(...order.filter(a => a.kind === 'take').map(a => a.at));
    const firstPlaceAt = Math.min(...order.filter(a => a.kind === 'place').map(a => a.at));
    return lastTakeAt < firstPlaceAt;
  })(), true);
}

// ── ...but a bin whose arriving stock is ALREADY in hand still merges (R3) ─────────────────────────
{
  const idx = bins(['far', 'Bin 1A', 'Door 1'], ['b', 'Bin 2A', 'Door 3'], ['other', 'Bin 3D', 'Door 3']);
  const route = planMoveRoute([
    t('p1', 'b', 'other', 5, 'ALIMTA', 'NDC1'),       // Bin 2A gives, within Door 3
    t('p2', 'far', 'b', 8, 'CARBOPLATIN', 'NDC2'),    // Bin 2A receives, from Door 1 — collected earlier
  ], idx);
  show('bin receives from another door', route);
  check('Bin 2A is one stop: emptied then filled', render(route), [
    'Door 1: Bin 1A{take 8}',
    'Door 3: Bin 2A{take 5, place 8} -> Bin 3D{place 5}',
  ]);
}

// ── Bin reading order, and Door 12 after Door 2 ───────────────────────────────────────────────────
{
  const idx = bins(['a', 'Bin 10A', 'Door 2'], ['b', 'Bin 2A', 'Door 2'], ['d', 'Bin 1A', 'Door 12']);
  const route = planMoveRoute([
    t('p1', 'a', 'd', 1, 'ALIMTA'), t('p2', 'b', 'd', 2, 'ALIMTA'),
  ], idx);
  show('sorting', route);
  check('Bin 2A before Bin 10A; Door 2 before Door 12', render(route), [
    'Door 2: Bin 2A{take 2} -> Bin 10A{take 1}',
    'Door 12: Bin 1A{place 3}',
  ]);
}

// ── Degenerate inputs ─────────────────────────────────────────────────────────────────────────────
{
  check('no transfers', planMoveRoute([], bins()).stops.length, 0);
  check('unresolvable bins are dropped',
    planMoveRoute([t('p1', 'nope', 'alsonope', 5, 'X')], bins()).stops.length, 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
