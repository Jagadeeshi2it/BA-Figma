/**
 * Verifies src/app/utils/moveTargetBins.ts — which bins may be added as a Move To bin part-way through
 * step ④, when the bin in front of the operator has run out of room.
 *
 *     pnpm run dev
 *     node scripts/verify-move-target-bins.mjs     # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * What it holds down: the three refusals, that a refused bin is still LISTED with its reason rather
 * than dropped, and the ordering — the open door first, then unusable bins last, then empty ones
 * first. The refusals are restatements of step ②'s rules, and the whole point of the module is that
 * the placement screen cannot accept a bin step ② would have turned away.
 *
 * Loads the real module from the dev server, as the other verify scripts do.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

let M;
try {
  const response = await fetch(`${ORIGIN}/src/app/utils/moveTargetBins.ts`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  M = await import(`data:text/javascript,${encodeURIComponent(await response.text())}`);
} catch (error) {
  console.error(`Could not load moveTargetBins.ts from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

const { moveToBinCandidates, selectableMoveToBins, reachableMoveToBins } = M;

let pass = 0;
let fail = 0;
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`  FAIL  ${label}\n        expected ${e}\n        actual   ${a}`);
  }
};

const bin = (binId, doorName, productCount = 0, alreadyStocksProduct = false) => ({
  binId,
  binName: binId,
  doorName,
  productCount,
  alreadyStocksProduct
});

// A small cabinet: two doors, four bins each side of it.
const BINS = [
  bin('1A', 'Door 1', 2),
  bin('1B', 'Door 1', 0),
  bin('1C', 'Door 1', 1, true),
  bin('2A', 'Door 2', 0),
  bin('2B', 'Door 2', 3),
  bin('EK', 'Door 2', 0)
];

const base = {
  sourceBinIds: [],
  existingTargetBinIds: [],
  restrictedBinIds: [],
  productAllowedInRestrictedBins: true,
  currentDoorName: undefined
};

const byId = candidates => Object.fromEntries(candidates.map(c => [c.binId, c]));
const ids = candidates => candidates.map(c => c.binId);

console.log('verify-move-target-bins');

// --- Nothing refused: every bin is a candidate, and none carries a reason.
{
  const result = moveToBinCandidates(BINS, base);
  check('all six listed', result.length, 6);
  check('none blocked', result.filter(c => c.blockedReason).length, 0);
  check('selectable is all of them', selectableMoveToBins(result).length, 6);
}

// --- A source bin of this very move. The sharpest of the three reasons, so it wins over the others.
{
  const result = byId(moveToBinCandidates(BINS, { ...base, sourceBinIds: ['1A'] }));
  check('source bin is refused', result['1A'].blockedReason, 'You are moving stock out of this bin.');
  check('source bin is still listed', !!result['1A'], true);
  check('others unaffected', result['1B'].blockedReason, null);
}

// --- Already a Move To bin for this product.
{
  const result = byId(moveToBinCandidates(BINS, { ...base, existingTargetBinIds: ['2A'] }));
  check('existing target refused', result['2A'].blockedReason, 'Already a Move To bin for this product.');
}

// --- Restricted bin, product not allowed in one.
{
  const result = byId(
    moveToBinCandidates(BINS, {
      ...base,
      restrictedBinIds: ['EK'],
      productAllowedInRestrictedBins: false
    })
  );
  check('restricted bin refused', result['EK'].blockedReason, 'This bin only accepts Purchased stock.');
  check('and not for the others', result['2A'].blockedReason, null);
}

// --- Restricted bin, product IS allowed. The restriction is on the pairing, not the bin.
{
  const result = byId(
    moveToBinCandidates(BINS, {
      ...base,
      restrictedBinIds: ['EK'],
      productAllowedInRestrictedBins: true
    })
  );
  check('allowed product may use a restricted bin', result['EK'].blockedReason, null);
}

// --- One bin refused for two reasons at once: the most specific truth is the one stated.
{
  const result = byId(
    moveToBinCandidates(BINS, {
      ...base,
      sourceBinIds: ['EK'],
      existingTargetBinIds: ['EK'],
      restrictedBinIds: ['EK'],
      productAllowedInRestrictedBins: false
    })
  );
  check(
    'source outranks the other two reasons',
    result['EK'].blockedReason,
    'You are moving stock out of this bin.'
  );
}

// --- Derived facts a row renders from.
{
  const result = byId(moveToBinCandidates(BINS, { ...base, currentDoorName: 'Door 1' }));
  check('empty bin reads available', result['1B'].isAvailable, true);
  check('stocked bin does not', result['1A'].isAvailable, false);
  check('product count carried through', result['2B'].productCount, 3);
  check('already-stocks flag carried through', result['1C'].alreadyStocksProduct, true);
  check('open door flagged', result['1A'].isCurrentDoor, true);
  check('other door not', result['2A'].isCurrentDoor, false);
}

// --- Ordering: the open door first, whatever that costs elsewhere. One door is open at a time, so a
//     bin behind another door means closing this one and walking.
{
  const result = ids(moveToBinCandidates(BINS, { ...base, currentDoorName: 'Door 2' }));
  check('Door 2 bins come first', result.slice(0, 3).sort(), ['2A', '2B', 'EK']);
  check('empty ones lead within the open door', result[0], '2A');
}

// --- Ordering: a refused bin sinks below usable ones on its own door, since it is the one row that
//     cannot be acted on at all.
{
  const result = ids(
    moveToBinCandidates(BINS, { ...base, currentDoorName: 'Door 1', sourceBinIds: ['1B'] })
  );
  check('refused bin sinks within its door', result.indexOf('1B') > result.indexOf('1A'), true);
  check('but stays ahead of the closed door', result.indexOf('1B') < result.indexOf('2A'), true);
}

// --- Ordering is stable: bins that tie keep the cabinet's own order, so the list reads as a walk.
{
  const sameRank = [bin('3A', 'Door 1', 1), bin('3B', 'Door 1', 1), bin('3C', 'Door 1', 1)];
  check(
    'ties keep input order',
    ids(moveToBinCandidates(sameRank, { ...base, currentDoorName: 'Door 1' })),
    ['3A', '3B', '3C']
  );
}

// --- No door open (a fridge, which has no lock): ordering falls back to available-first.
{
  const result = ids(moveToBinCandidates(BINS, base));
  check('empty bins first with no open door', result[0], '1B');
}

// --- Everything refused: selectable is empty, which is what withholds the button entirely.
{
  const result = moveToBinCandidates(BINS, {
    ...base,
    sourceBinIds: ['1A', '1B', '1C'],
    existingTargetBinIds: ['2A', '2B', 'EK']
  });
  check('all six listed still', result.length, 6);
  check('none selectable', selectableMoveToBins(result).length, 0);
}

// --- An empty cabinet is not a crash.
check('no bins at all', moveToBinCandidates([], base), []);

// --- Scoping: the open door in full, plus empty bins elsewhere. The seed has 132 bins and the first
//     version of the dialog listed every one of them.
{
  const candidates = moveToBinCandidates(BINS, { ...base, currentDoorName: 'Door 1' });
  const { listed, hiddenCount } = reachableMoveToBins(candidates);
  check('open door bins all listed', ids(listed).filter(id => id.startsWith('1')).sort(), ['1A', '1B', '1C']);
  check('empty bins elsewhere listed', ids(listed).includes('2A'), true);
  check('empty restricted bin elsewhere listed too', ids(listed).includes('EK'), true);
  check('stocked bin behind a closed door is not', ids(listed).includes('2B'), false);
  check('and it is counted', hiddenCount, 1);
  check('nothing invented', listed.length + hiddenCount, candidates.length);
}

// --- Scoping keeps the source bin, which is always on the open door, so its refusal stays visible.
{
  const candidates = moveToBinCandidates(BINS, {
    ...base,
    currentDoorName: 'Door 1',
    sourceBinIds: ['1A']
  });
  const { listed } = reachableMoveToBins(candidates);
  const source = listed.find(c => c.binId === '1A');
  check('source bin still listed after scoping', !!source, true);
  check('still saying why', source.blockedReason, 'You are moving stock out of this bin.');
}

// --- A refused bin does not earn a row on its own account: three doors away and stocked, it is out.
{
  const bins = [bin('9A', 'Door 9', 4)];
  const candidates = moveToBinCandidates(bins, {
    ...base,
    currentDoorName: 'Door 1',
    restrictedBinIds: ['9A'],
    productAllowedInRestrictedBins: false
  });
  const { listed, hiddenCount } = reachableMoveToBins(candidates);
  check('far-off refused bin is not listed', listed.length, 0);
  check('but is counted', hiddenCount, 1);
}

// --- With no door open, only empty bins are offered.
{
  const { listed } = reachableMoveToBins(moveToBinCandidates(BINS, base));
  check('all listed bins are empty', listed.every(c => c.isAvailable), true);
}

console.log(`\n${pass}/${pass + fail} assertions passed`);
if (fail > 0) {
  console.error(`${fail} FAILED`);
  process.exit(1);
}
