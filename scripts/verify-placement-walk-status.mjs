/**
 * Verifies `placementBinStatus` in src/app/components/TargetBinSerialScanPage.tsx — where a target bin
 * stands on the placement half of step ④.
 *
 *     pnpm run dev
 *     node scripts/verify-placement-walk-status.mjs     # or DEV_ORIGIN=http://localhost:PORT node …
 *
 * The case that motivated it: a bin added mid-move re-plans the route, so the bin the operator has just
 * filled can end up AFTER the new one in the walk. Status was positional only, which called that bin
 * `pending` — and a pending bin renders carrying nothing, so a bin holding 100 vials read as untouched.
 *
 * Two surfaces ask this question (the Move Summary's row status, the target-bin side sheet's `Done`
 * badge) and both now call this function, so the assertions below hold for both.
 *
 * Loads the real module from the dev server. The component pulls in React and the whole app graph, so
 * this reads the transformed source and evaluates only the function under test — see below.
 */
const ORIGIN = process.env.DEV_ORIGIN ?? 'http://localhost:5173';

let placementBinStatus;
try {
  const response = await fetch(`${ORIGIN}/src/app/components/TargetBinSerialScanPage.tsx`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const source = await response.text();

  // Importing the module would drag in React, lucide, sonner and the rest. The function is
  // self-contained and exported, so its declaration is lifted out and evaluated on its own. Brittle in
  // exactly one way: renaming it breaks this script loudly, which is the intent.
  const start = source.indexOf('const placementBinStatus =');
  if (start === -1) throw new Error('placementBinStatus not found — was it renamed or unexported?');
  const end = source.indexOf('\n};', start);
  if (end === -1) throw new Error('could not find the end of placementBinStatus');
  const declaration = source.slice(start, end + 3);

  placementBinStatus = (await import(
    `data:text/javascript,${encodeURIComponent(`${declaration}\nexport { placementBinStatus };`)}`
  )).placementBinStatus;
} catch (error) {
  console.error(`Could not load placementBinStatus from ${ORIGIN} — is the dev server running there?`);
  console.error(`  ${error.message}`);
  process.exit(2);
}

let pass = 0;
let fail = 0;
const check = (label, actual, expected) => {
  if (actual === expected) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`  FAIL  ${label}\n        expected ${expected}, got ${actual}`);
  }
};

/** One product, the operator standing at target bin `at`. */
const status = (targetBinIndex, at, placed = 0) =>
  placementBinStatus({
    productIndex: 0,
    targetBinIndex,
    currentProductIndex: 0,
    currentTargetBinIndex: at,
    placed
  });

console.log('verify-placement-walk-status');

// --- The plain walk: one bin in hand, earlier ones done, later ones pending.
check('the bin in hand is current', status(1, 1), 'current');
check('an earlier bin is done', status(0, 1), 'done');
check('a later bin is pending', status(2, 1), 'pending');
check('first bin, nothing done yet', status(0, 0), 'current');

// --- A visited bin the operator deliberately left empty stays done. Position is what carries this;
//     there is no quantity to prove it with, and "all of it in the first bin, none in the second" is a
//     legitimate outcome (canSave allows it).
check('earlier bin with nothing in it is still done', status(0, 2, 0), 'done');

// --- The case this exists for: a bin further along the walk that already holds stock.
check('later bin holding stock is done, not pending', status(2, 0, 100), 'done');
check('later bin holding nothing is pending', status(2, 0, 0), 'pending');

// --- current outranks both tests, so exactly one bin is ever current. The Move Summary's marking
//     depends on this: isCurrentTarget is status === 'current'.
check('the bin in hand stays current even holding stock', status(1, 1, 50), 'current');
check('the bin in hand stays current at index 0', status(0, 0, 100), 'current');

// --- Across products: everything of an earlier product is done, everything of a later one pending.
const acrossProducts = (productIndex, currentProductIndex, targetBinIndex = 0, placed = 0) =>
  placementBinStatus({
    productIndex,
    targetBinIndex,
    currentProductIndex,
    currentTargetBinIndex: 0,
    placed
  });

check('earlier product is done', acrossProducts(0, 1), 'done');
check('later product is pending', acrossProducts(2, 1), 'pending');
check('later product holding stock is done', acrossProducts(2, 1, 0, 25), 'done');
check('current product, current bin', acrossProducts(1, 1, 0, 0), 'current');
check(
  "an earlier product's later bin is done by position alone",
  acrossProducts(0, 1, 5, 0),
  'done'
);

// --- Exactly one current across a whole batch, which is the invariant the panel's bold rests on.
{
  const bins = [0, 1, 2, 3];
  const currents = bins.filter(i => status(i, 2, i === 3 ? 40 : 0) === 'current');
  check('exactly one bin is current across the walk', currents.length, 1);
  check('and it is the one in hand', currents[0], 2);
  check('the filled bin after it reads done', status(3, 2, 40), 'done');
}

// --- A negative placed count cannot arise, but must not read as done if it ever did.
check('zero placed is not stock', status(3, 0, 0), 'pending');

console.log(`\n${pass}/${pass + fail} assertions passed`);
if (fail > 0) {
  console.error(`${fail} FAILED`);
  process.exit(1);
}
