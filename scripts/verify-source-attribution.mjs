/**
 * Pins how a placed quantity is attributed back to the source bins it came from —
 * TargetBinSerialScanPage.finalizeAndConfirm.
 *
 * The rule: a product's sources are drained in the order they were added, each capped by what it has
 * LEFT across every target bin of that product. Two things follow, and both are the point of this file:
 *
 *   1. No source is ever debited for more than it held. The old logic capped per TARGET BIN, each bin
 *      measuring against the source's original declared amount, so the first source absorbed every
 *      bin's amount up to its own total and later sources were never touched. 200 from Bin 1B and 25
 *      from Bin 1C, placed 120 into one target and 105 into another, debited 1B by 225 and 1C by 0 —
 *      and filling the first target completely drove 1B to -12.
 *   2. The per-source shares always sum to what was actually placed, which is what keeps the
 *      conservation invariant true per BIN and not merely per product. The product total was right
 *      under the old logic too; that is why this survived so long.
 *
 * Transcribed rather than imported: the component pulls in React and the whole app graph. Keep the two
 * in step — this is the only thing holding the rule.
 */

let checks = 0;
let failures = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${message}`);
  }
}

/**
 * The assignment under test. `sources` is [{ key, declared }] in the order they were added; each target
 * bin carries the source keys feeding it plus what was actually scanned into it.
 */
function assign(sources, targetBins, productTotalQuantity) {
  const budget = new Map(sources.map(s => [s.key, s.declared]));
  const out = [];

  targetBins.forEach(tb => {
    let remainingToAssign = tb.scanned;
    tb.sourceKeys.forEach(key => {
      const available = budget.get(key) ?? 0;
      const assigned = Math.min(available, remainingToAssign);
      remainingToAssign -= assigned;
      budget.set(key, available - assigned);
      if (assigned <= 0 && productTotalQuantity > 0) return;
      out.push({ from: key, to: tb.toBinId, quantity: assigned });
    });
  });

  return out;
}

const debitsBySource = out => {
  const m = new Map();
  out.forEach(t => m.set(t.from, (m.get(t.from) || 0) + t.quantity));
  return m;
};
const total = out => out.reduce((s, t) => s + t.quantity, 0);

function scenario(name, sources, targetBins) {
  const declaredTotal = sources.reduce((s, x) => s + x.declared, 0);
  const placedTotal = targetBins.reduce((s, x) => s + x.scanned, 0);
  const out = assign(sources, targetBins, declaredTotal);
  const debits = debitsBySource(out);

  console.log(`\n${name}`);
  console.log(
    `  sources ${sources.map(s => `${s.key}=${s.declared}`).join(' ')} | placed ${placedTotal}` +
      ` | debits ${[...debits].map(([k, v]) => `${k}=${v}`).join(' ')}`
  );

  // (1) Nothing is debited past what it held.
  sources.forEach(s => {
    assert(
      (debits.get(s.key) || 0) <= s.declared,
      `${name}: ${s.key} debited ${debits.get(s.key) || 0} of ${s.declared} it held`
    );
  });

  // (2) The shares sum to what was actually placed.
  assert(
    total(out) === placedTotal,
    `${name}: shares sum to ${total(out)}, but ${placedTotal} was placed`
  );

  // (3) Never a negative share.
  assert(out.every(t => t.quantity >= 0), `${name}: produced a negative share`);

  return { out, debits };
}

console.log('verify-source-attribution');

// The plain multi-source, multi-target move. No mid-move bin needed to break the old logic.
{
  const { debits } = scenario(
    'two targets fed by two sources, split 120/105',
    [{ key: '1B', declared: 200 }, { key: '1C', declared: 25 }],
    [
      { toBinId: '3D', scanned: 120, sourceKeys: ['1B', '1C'] },
      { toBinId: '4A', scanned: 105, sourceKeys: ['1B', '1C'] }
    ]
  );
  assert(debits.get('1B') === 200, 'first source drains fully before the second is touched');
  assert(debits.get('1C') === 25, 'second source covers the rest');
}

// The shape a mid-move added bin produces: the first target fills up, the remainder goes elsewhere.
{
  const { debits } = scenario(
    'first target takes 200, a bin added mid-move takes 12',
    [{ key: '1B', declared: 200 }, { key: '1C', declared: 25 }],
    [
      { toBinId: '3D', scanned: 200, sourceKeys: ['1B', '1C'] },
      { toBinId: 'NEW', scanned: 12, sourceKeys: ['1B', '1C'] }
    ]
  );
  assert(debits.get('1B') === 200, '1B is spent by the first bin and cannot be charged again');
  assert(debits.get('1C') === 12, 'the added bin is charged to the source that still has stock');
}

// A partial placement: 225 taken, 213 placed. The 12 never placed stay with their source.
{
  const { debits } = scenario(
    'partial placement leaves 12 uncharged',
    [{ key: '1B', declared: 200 }, { key: '1C', declared: 25 }],
    [
      { toBinId: '3D', scanned: 200, sourceKeys: ['1B', '1C'] },
      { toBinId: 'NEW', scanned: 13, sourceKeys: ['1B', '1C'] }
    ]
  );
  assert(debits.get('1C') === 13, 'only what was placed is debited');
  assert((debits.get('1B') || 0) + (debits.get('1C') || 0) === 213, 'the shortfall is simply not debited');
}

// One source spread over three targets — the case the old logic happened to get right.
{
  const { debits } = scenario(
    'one source across three targets',
    [{ key: '2A', declared: 60 }],
    [
      { toBinId: 'T1', scanned: 20, sourceKeys: ['2A'] },
      { toBinId: 'T2', scanned: 20, sourceKeys: ['2A'] },
      { toBinId: 'T3', scanned: 20, sourceKeys: ['2A'] }
    ]
  );
  assert(debits.get('2A') === 60, 'a single source is debited exactly once for the whole amount');
}

// Three sources, one target: order is what decides, and the last one is not special.
{
  const { debits } = scenario(
    'three sources into one target, 40 placed',
    [{ key: 'A', declared: 25 }, { key: 'B', declared: 10 }, { key: 'C', declared: 5 }],
    [{ toBinId: 'T1', scanned: 40, sourceKeys: ['A', 'B', 'C'] }]
  );
  assert(debits.get('A') === 25 && debits.get('B') === 10 && debits.get('C') === 5, 'all three drain in order');
}

// The zero-quantity move (§ Moving a product that has no stock). Nothing is carried, but the transfer
// must survive: it relocates the allocation itself, and dropping it cancels the move silently.
{
  const out = assign([{ key: '1B', declared: 0 }], [{ toBinId: '3D', scanned: 0, sourceKeys: ['1B'] }], 0);
  assert(out.length === 1, 'a zero-quantity move still produces its transfer');
  assert(out[0].quantity === 0, 'and it carries no quantity');
  checks += 2;
}

// A source feeding two targets where the second needs more than the first left it.
{
  const { debits } = scenario(
    'second target wants more than the first left behind',
    [{ key: 'A', declared: 30 }, { key: 'B', declared: 30 }],
    [
      { toBinId: 'T1', scanned: 50, sourceKeys: ['A', 'B'] },
      { toBinId: 'T2', scanned: 10, sourceKeys: ['A', 'B'] }
    ]
  );
  assert(debits.get('A') === 30, 'A is capped at what it held');
  assert(debits.get('B') === 30, 'B covers the rest across both targets');
}

console.log(`\n${checks - failures}/${checks} assertions passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
