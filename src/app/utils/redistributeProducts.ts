import { Bin, DoorShelfConfig, Shelf } from '../types';
import { placementCapacityForShelf, capacitySizesForShelf } from './shelfLayoutConfig';

// The generated import dumps almost everything into the Virtual cabinet's pooled bins — Door 13's
// single "Main Storage" held 242 of the 393 product rows, 62% of the inventory in one bin. This
// transform spreads those rows across every bin in the building, keeping a share of bins empty so
// there is always somewhere to allocate to.
//
// Cabinet bins are capped to what their EVENTUAL footprint can realistically hold — a 1x1 in a real
// station holds a line or two, not a proportional slice of the whole import. Whatever doesn't fit in
// the cabinet at those realistic counts is bulk overflow, which is exactly what the pooled fridge/
// virtual bins are for, so it lands there instead.
//
// It runs BEFORE applyShelfLayouts, which pairs the fullest bins with the largest footprints. So
// loads are dealt out in a descending pattern per shelf, and the geometry then follows: the bin
// holding the most rows is the one that gets the 3x3. No quantity is altered and no row is lost —
// rows only change which bin they sit in.

// Share of bins deliberately left empty.
const AVAILABLE_BIN_SHARE = 0.1;

// The pooled fridge bins are bulk storage with no physical footprint to overfill, so they simply
// absorb whatever the capped cabinet bins don't take — weighted a little unevenly so the six don't
// all land on an identical count.
const FRIDGE_BIN_WEIGHT = 10;

// How many distinct product lines a bin of each footprint realistically holds, mirroring how the
// physical station is stocked rather than how much of the import happens to exist. Anchored on a
// 1x1 holding one or two lines and a 3x3 topping out around five; the sizes between ramp smoothly.
const MAX_PRODUCTS_BY_SIZE: Record<Bin['size'], number> = {
  single: 2,
  double: 3,
  '2x2': 3,
  '2x3': 4,
  '3x3': 5,
  // No physical slot to overfill — these absorb overflow instead of being capped.
  fridge: Infinity,
  floor: Infinity,
};

const isFridgeBin = (bin: Bin): boolean => bin.size === 'fridge' || bin.size === 'floor';

type BinRef = { doorName: string; shelfIndex: number; binIndex: number; bin: Bin };

// Stable order: door key order, then shelf, then bin. Nothing here depends on Math.random or
// Date.now, so the same layout comes back on every reload and history stays consistent with it.
const collectBins = (config: DoorShelfConfig): BinRef[] => {
  const refs: BinRef[] = [];
  Object.keys(config).forEach(doorName => {
    config[doorName].forEach((shelf, shelfIndex) => {
      shelf.bins.forEach((bin, binIndex) => {
        refs.push({ doorName, shelfIndex, binIndex, bin });
      });
    });
  });
  return refs;
};

export const redistributeProducts = (config: DoorShelfConfig): DoorShelfConfig => {
  const allBins = collectBins(config);
  const allRows = allBins.flatMap(ref => ref.bin.products || []);

  if (allRows.length === 0) return config;

  const cabinetBins = allBins.filter(ref => !isFridgeBin(ref.bin));
  const keepEmptyCount = Math.ceil(allBins.length * AVAILABLE_BIN_SHARE);

  // Reserve empties on a stride through the cabinet bins so they land across every door rather
  // than clustering at the end of the list. Fridge bins are never reserved — they're the bulk pool.
  const stride = Math.max(1, Math.floor(cabinetBins.length / keepEmptyCount));
  const reserved = new Set<Bin>();
  for (let i = stride - 1; i < cabinetBins.length && reserved.size < keepEmptyCount; i += stride) {
    reserved.add(cabinetBins[i].bin);
  }

  // Group the remaining cabinet bins by shelf so each can be capped by the footprint its shelf slot
  // will resolve to; fridge bins are pulled aside for the overflow pass below.
  const perShelf = new Map<string, BinRef[]>();
  const fridgeRefs: BinRef[] = [];
  allBins.forEach(ref => {
    if (reserved.has(ref.bin)) return;
    if (isFridgeBin(ref.bin)) {
      fridgeRefs.push(ref);
      return;
    }
    const key = `${ref.doorName}|${ref.shelfIndex}`;
    if (!perShelf.has(key)) perShelf.set(key, []);
    perShelf.get(key)!.push(ref);
  });

  // Cap each shelf at the number of bins its tiling can place (a bottom door offers four slots but
  // ships five bins — filling the fifth makes applyShelfLayouts abandon the whole shelf), then give
  // each remaining bin the product-count cap of the footprint it will end up with. Rank within a
  // shelf follows arrival order (Bin A first) — capacitySizesForShelf lists sizes largest-first, so
  // rank 0 gets the biggest footprint's cap, matching what applyShelfLayouts will independently
  // reproduce once the fullest-filled bin here becomes the highest-loaded bin there.
  //
  // Alternating cap / cap-1 by rank keeps same-size bins from looking identical — a real station
  // doesn't stock every 1x1 to the exact same count either.
  const capFor = new Map<Bin, number>();
  const priority: BinRef[] = [];
  perShelf.forEach((refs, key) => {
    const [doorName, shelfIndexRaw] = key.split('|');
    const shelfIndex = Number(shelfIndexRaw);
    const shelf = config[doorName][shelfIndex];
    const capacity = placementCapacityForShelf(doorName, shelf, shelfIndex);
    const sizes = capacitySizesForShelf(doorName, shelf, shelfIndex);
    const fillable = capacity === null ? refs : refs.slice(0, capacity);
    fillable.forEach((ref, rank) => {
      const size = sizes?.[rank] ?? 'single';
      const max = MAX_PRODUCTS_BY_SIZE[size] ?? 3;
      capFor.set(ref.bin, rank % 2 === 0 ? max : Math.max(1, max - 1));
      priority.push(ref);
    });
  });

  // Fill cabinet bins to their cap in priority order. A running counter rather than a fixed quota
  // math pass: if the import ever held fewer rows than the cabinet wants, the biggest footprints
  // (first in priority order) still fill first instead of every bin coming up short evenly.
  let remainingRows = allRows.length;
  const quotas = new Map<Bin, number>();
  priority.forEach(ref => {
    const take = Math.min(capFor.get(ref.bin) ?? 0, remainingRows);
    quotas.set(ref.bin, take);
    remainingRows -= take;
  });

  // Whatever's left after every cabinet bin has its realistic share is bulk overflow — the pooled
  // fridge/virtual bins' actual job. Weighted and dealt with the same largest-remainder method the
  // whole import used to be split by, just aimed at the leftover instead of all of it.
  if (remainingRows > 0 && fridgeRefs.length > 0) {
    const fridgeWeights = new Map<Bin, number>();
    fridgeRefs.forEach((ref, index) => {
      fridgeWeights.set(ref.bin, FRIDGE_BIN_WEIGHT + (index % 4) - 1);
    });
    const totalFridgeWeight = fridgeRefs.reduce((sum, ref) => sum + fridgeWeights.get(ref.bin)!, 0);

    let assigned = 0;
    const remainders: Array<{ bin: Bin; fraction: number; weight: number }> = [];
    fridgeRefs.forEach(ref => {
      const exact = (fridgeWeights.get(ref.bin)! * remainingRows) / totalFridgeWeight;
      const whole = Math.floor(exact);
      quotas.set(ref.bin, whole);
      assigned += whole;
      remainders.push({ bin: ref.bin, fraction: exact - whole, weight: fridgeWeights.get(ref.bin)! });
    });
    remainders
      .sort((a, b) => b.fraction - a.fraction || b.weight - a.weight)
      .slice(0, remainingRows - assigned)
      .forEach(entry => quotas.set(entry.bin, quotas.get(entry.bin)! + 1));
  } else {
    fridgeRefs.forEach(ref => quotas.set(ref.bin, 0));
  }

  const receiving = [...priority, ...fridgeRefs];

  // Deal the rows out round-robin rather than in blocks. Consecutive rows in the source are often
  // duplicate lots of one drug, so round-robin scatters those lots across different bins instead
  // of rebuilding the same pile somewhere else.
  const order: Bin[] = [];
  const maxQuota = Math.max(0, ...[...quotas.values()]);
  for (let round = 0; round < maxQuota; round++) {
    receiving.forEach(ref => {
      if ((quotas.get(ref.bin) ?? 0) > round) order.push(ref.bin);
    });
  }

  const productsFor = new Map<Bin, any[]>();
  allBins.forEach(ref => productsFor.set(ref.bin, []));
  allRows.forEach((row, index) => {
    const target = order[index];
    if (target) productsFor.get(target)!.push(row);
  });

  const out: DoorShelfConfig = {};
  Object.keys(config).forEach(doorName => {
    out[doorName] = config[doorName].map((shelf: Shelf) => ({
      ...shelf,
      bins: shelf.bins.map(bin => {
        const products = productsFor.get(bin) ?? [];
        return {
          ...bin,
          products,
          // A bin with nothing in it is an available bin — that's what the "Available Bin" label
          // and the allocation flows read.
          available: products.length === 0,
        };
      }),
    }));
  });

  return out;
};
