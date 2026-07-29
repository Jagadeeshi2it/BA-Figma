import { Bin, DoorShelfConfig, Shelf } from '../types';
import { placementCapacityForShelf } from './shelfLayoutConfig';

// The generated import dumps almost everything into the Virtual cabinet's pooled bins — Door 13's
// single "Main Storage" held 242 of the 393 product rows, 62% of the inventory in one bin. This
// transform spreads those rows across every bin in the building, keeping a share of bins empty so
// there is always somewhere to allocate to.
//
// It runs BEFORE applyShelfLayouts, which pairs the fullest bins with the largest footprints. So
// loads are dealt out in a descending pattern per shelf, and the geometry then follows: the bin
// holding the most rows is the one that gets the 3x3. No quantity is altered and no row is lost —
// rows only change which bin they sit in.

// Share of bins deliberately left empty.
const AVAILABLE_BIN_SHARE = 0.1;

// The pooled fridge bins are bulk storage, so they keep a much larger share than a cabinet bin.
const FRIDGE_BIN_WEIGHT = 10;

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

  // Weight each receiving bin. Within a shelf the weights descend (4, 3, 2, 1 for four bins), so
  // after applyShelfLayouts the largest footprint sits on the heaviest bin.
  const weights = new Map<Bin, number>();
  const perShelf = new Map<string, BinRef[]>();
  let fridgeIndex = 0;
  allBins.forEach(ref => {
    if (reserved.has(ref.bin)) return;
    if (isFridgeBin(ref.bin)) {
      // Vary the pooled bins a little rather than giving all six an identical load.
      weights.set(ref.bin, FRIDGE_BIN_WEIGHT + (fridgeIndex++ % 4) - 1);
      return;
    }
    const key = `${ref.doorName}|${ref.shelfIndex}`;
    if (!perShelf.has(key)) perShelf.set(key, []);
    perShelf.get(key)!.push(ref);
  });

  // Cap each shelf at the number of bins its tiling can place. A bottom door offers four slots but
  // ships five bins; filling the fifth makes applyShelfLayouts abandon the whole shelf.
  perShelf.forEach((refs, key) => {
    const [doorName, shelfIndexRaw] = key.split('|');
    const shelfIndex = Number(shelfIndexRaw);
    const shelf = config[doorName][shelfIndex];
    const capacity = placementCapacityForShelf(doorName, shelf, shelfIndex);
    const fillable = capacity === null ? refs : refs.slice(0, capacity);
    fillable.forEach((ref, rank) => weights.set(ref.bin, fillable.length - rank));
  });

  const receiving = allBins.filter(ref => weights.has(ref.bin));
  const totalWeight = receiving.reduce((sum, ref) => sum + weights.get(ref.bin)!, 0);

  // Largest-remainder allocation, so the quotas add up to exactly the row count.
  const quotas = new Map<Bin, number>();
  const remainders: Array<{ bin: Bin; fraction: number; weight: number }> = [];
  let assigned = 0;
  receiving.forEach(ref => {
    const exact = (weights.get(ref.bin)! * allRows.length) / totalWeight;
    const whole = Math.floor(exact);
    quotas.set(ref.bin, whole);
    assigned += whole;
    remainders.push({ bin: ref.bin, fraction: exact - whole, weight: weights.get(ref.bin)! });
  });
  remainders
    .sort((a, b) => b.fraction - a.fraction || b.weight - a.weight)
    .slice(0, allRows.length - assigned)
    .forEach(entry => quotas.set(entry.bin, quotas.get(entry.bin)! + 1));

  // Deal the rows out round-robin rather than in blocks. Consecutive rows in the source are often
  // duplicate lots of one drug, so round-robin scatters those lots across different bins instead
  // of rebuilding the same pile somewhere else.
  const order: Bin[] = [];
  const maxQuota = Math.max(...[...quotas.values()]);
  for (let round = 0; round < maxQuota; round++) {
    receiving.forEach(ref => {
      if (quotas.get(ref.bin)! > round) order.push(ref.bin);
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
