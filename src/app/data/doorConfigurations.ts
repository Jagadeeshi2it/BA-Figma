import { DoorShelfConfig } from '../types';
import { realDoorShelfConfig } from './realData';
import { applyShelfLayouts } from '../utils/shelfLayoutConfig';
import { redistributeProducts } from '../utils/redistributeProducts';
import { withInventoryType } from '../utils/inventoryTypes';
import { hasClimateBadge } from '../utils/binProducts';

// Spread bin products across the four inventory types. Keyed on the master product
// id, so a drug sitting in several bins reports the same type in all of them and
// matches what the master catalogue (data/products) reports for it.
const applyInventoryTypes = (config: DoorShelfConfig): DoorShelfConfig => {
  const out: DoorShelfConfig = {};
  Object.keys(config).forEach(doorName => {
    out[doorName] = config[doorName].map(shelf => ({
      ...shelf,
      bins: shelf.bins.map(bin => ({
        ...bin,
        products: bin.products.map(withInventoryType),
      })),
    }));
  });
  return out;
};

// Demo setup: four products left at 0 inventory, scattered across different doors, so the
// Allocate/Unallocate panel's "Only products with 0 inventory" filter has something to show. The
// import has nothing at zero — a product only reaches zero by having its stock moved out, which is
// the other workflow's job, so without this the release half of the panel can't be demonstrated
// without performing a whole move first.
//
// The four are chosen deterministically — fewest locations first, then smallest total, then NDC —
// and capped at one per door. Deterministic so the same products are empty on every reload and the
// demo can be rehearsed; fewest-and-smallest first so emptying them barely dents the stock levels
// on screen; one per door so the empties are spread across the cabinet rather than clustered.
const EMPTY_DEMO_PRODUCT_COUNT = 4;

const emptySomeProductsForDemo = (config: DoorShelfConfig): DoorShelfConfig => {
  const candidates = new Map<
    string,
    { key: string; doors: Set<string>; locations: number; total: number; ndc: string }
  >();

  Object.keys(config).forEach(doorName => {
    config[doorName].forEach(shelf => {
      shelf.bins.forEach(bin => {
        bin.products.forEach(product => {
          const key = `${product.ndc}|${product.inventoryType}`;
          const existing = candidates.get(key);
          if (existing) {
            existing.locations += 1;
            existing.total += product.quantity;
            existing.doors.add(doorName);
          } else {
            candidates.set(key, {
              key,
              doors: new Set([doorName]),
              locations: 1,
              total: product.quantity,
              ndc: product.ndc
            });
          }
        });
      });
    });
  });

  const chosen = new Set<string>();
  const usedDoors = new Set<string>();

  Array.from(candidates.values())
    .sort((a, b) => a.locations - b.locations || a.total - b.total || a.ndc.localeCompare(b.ndc))
    .forEach(candidate => {
      if (chosen.size >= EMPTY_DEMO_PRODUCT_COUNT) return;
      if ([...candidate.doors].some(door => usedDoors.has(door))) return;
      chosen.add(candidate.key);
      candidate.doors.forEach(door => usedDoors.add(door));
    });

  const out: DoorShelfConfig = {};
  Object.keys(config).forEach(doorName => {
    out[doorName] = config[doorName].map(shelf => ({
      ...shelf,
      bins: shelf.bins.map(bin => ({
        ...bin,
        // Quantity only — the bin keeps the product and stays unavailable, which is exactly the
        // state unallocation exists to clear up: still allocated, holding nothing.
        products: bin.products.map(product =>
          chosen.has(`${product.ndc}|${product.inventoryType}`) ? { ...product, quantity: 0 } : product
        )
      }))
    }));
  });
  return out;
};

// One of those four then gets a second, stocked location, so the demo has the case that actually
// explains the rule: ALIMTA holds 0 in the bin it started in and 12 somewhere else. Release is per
// location, so the empty bin can be given up while the stocked one cannot — and the row shows both
// at once, with a release control on one line and none on the other. A product that is empty
// everywhere can't show that contrast.
//
// Note this takes ALIMTA's total above zero, so it no longer appears under the "0 inventory" filter;
// it is found by searching for it. The filter is for products empty everywhere, which is the other
// half of the story.
const MIXED_DEMO_PRODUCT = 'ALIMTA 100 MG VIAL';
const MIXED_DEMO_QUANTITY = 12;

const stockOneLocationForDemo = (config: DoorShelfConfig): DoorShelfConfig => {
  let template: any = null;
  let occupiedBinId: string | null = null;

  Object.keys(config).forEach(doorName => {
    config[doorName].forEach(shelf => {
      shelf.bins.forEach(bin => {
        const match = bin.products.find((product: any) => product.name === MIXED_DEMO_PRODUCT);
        if (match && !template) {
          template = match;
          occupiedBinId = bin.id;
        }
      });
    });
  });

  if (!template) return config;

  // First bin that isn't the one it already sits in and doesn't already stock it. Deterministic by
  // iteration order, so the same bin gets the 12 on every reload.
  let destinationId: string | null = null;
  Object.keys(config).forEach(doorName => {
    config[doorName].forEach(shelf => {
      shelf.bins.forEach(bin => {
        if (destinationId || bin.id === occupiedBinId) return;
        if (bin.products.some((product: any) => product.ndc === template.ndc)) return;
        destinationId = bin.id;
      });
    });
  });

  if (!destinationId) return config;

  const out: DoorShelfConfig = {};
  Object.keys(config).forEach(doorName => {
    out[doorName] = config[doorName].map(shelf => ({
      ...shelf,
      bins: shelf.bins.map(bin =>
        bin.id !== destinationId
          ? bin
          : {
              ...bin,
              available: false,
              products: [
                ...bin.products,
                {
                  ...template,
                  id: `${String(template.id).split('_')[0]}_demo_${bin.id}`,
                  quantity: MIXED_DEMO_QUANTITY
                }
              ]
            }
      )
    }));
  });
  return out;
};

/**
 * Climate-sensitive stock belongs in a fridge.
 *
 * Every CLIMATE product in Cabinet 1 or Cabinet 2 is moved into the Virtual cabinet's fridges, bar one
 * exception per cabinet. Fridges keep their non-Climate stock — the rule is about what may sit in a
 * warm cabinet, not about what a fridge may hold.
 *
 * **The two exceptions are the point, not an oversight.** A cabinet with no Climate stock at all says
 * the rule is enforced by the system, and it is not: the app has no domain constraints beyond the E-Kit
 * rule (CLAUDE.md §5), and nothing stops an operator allocating a CLIMATE product to a room-temperature
 * door. Leaving one in each cabinet keeps the data honest about that, and gives the real-world case a
 * face — stock pulled for a run and not yet returned, or a product a pharmacist has judged tolerant.
 * One per cabinet rather than two in one, so the exception is visible wherever the operator is looking.
 *
 * Two mechanics worth not re-deriving:
 *
 *   - **A product already stocked in a fridge merges into that row** rather than arriving as a second
 *     one. A bin holding one identity twice splits it into two rows and every count in the app doubles
 *     it (CLAUDE.md §2 A) — the same reason `handleAssignProductsToBins` skips a bin that already stocks
 *     the product. Otherwise it goes to whichever fridge holds fewest rows, so the six stay even.
 *   - **A cabinet bin emptied by the move becomes available.** In the current seed that is exactly one
 *     bin (Door 5's, which held a single CLIMATE product). Leaving it `available: false` with nothing in
 *     it would be a bin that reads as allocated and shows no stock — the state the zero-inventory banner
 *     exists to clear up, arrived at by a data build rather than by a move.
 *
 * Runs LAST, after the demo scaffolding, so it has the final word: no later step can put a CLIMATE
 * product back into a cabinet without this being reconsidered. It is safe there because it only moves
 * products between existing bins — the geometry was fixed by `applyShelfLayouts` several steps earlier
 * and nothing here touches a bin's size.
 */
const CLIMATE_CABINET_EXCEPTIONS_PER_CABINET = 1;

const cabinetOf = (doorName: string): 1 | 2 | null => {
  const doorNumber = parseInt(doorName.split(' ')[1], 10);
  if (doorNumber >= 1 && doorNumber <= 4) return 1;
  if (doorNumber >= 5 && doorNumber <= 8) return 2;
  return null;
};

const moveClimateStockToFridges = (config: DoorShelfConfig): DoorShelfConfig => {
  const productIdentity = (product: any) =>
    `${product.name || ''}|${product.ndc || ''}|${product.inventoryType || ''}`.toLowerCase();

  // Deep-ish clone: bins and their product arrays are rewritten below, so the seed's own objects must
  // not be mutated — `initializeDoorConfigs` hands this straight to React state.
  const out: DoorShelfConfig = {};
  Object.keys(config).forEach(doorName => {
    out[doorName] = config[doorName].map(shelf => ({
      ...shelf,
      bins: shelf.bins.map(bin => ({ ...bin, products: [...(bin.products || [])] }))
    }));
  });

  const fridgeBins = Object.keys(out)
    .filter(doorName => cabinetOf(doorName) === null)
    .flatMap(doorName => out[doorName].flatMap(shelf => shelf.bins));

  if (fridgeBins.length === 0) return out;

  // One exception per cabinet, taken as the first CLIMATE row encountered. Iteration order over the
  // seed is stable, so the same two products are the exceptions on every reload and the demo can be
  // rehearsed against them.
  const exceptionsKept: Record<number, number> = { 1: 0, 2: 0 };

  Object.keys(out).forEach(doorName => {
    const cabinet = cabinetOf(doorName);
    if (cabinet === null) return;

    out[doorName].forEach(shelf => {
      shelf.bins.forEach(bin => {
        const staying: any[] = [];

        bin.products.forEach((product: any) => {
          if (!hasClimateBadge(product)) {
            staying.push(product);
            return;
          }
          if (exceptionsKept[cabinet] < CLIMATE_CABINET_EXCEPTIONS_PER_CABINET) {
            exceptionsKept[cabinet] += 1;
            // First in its bin, so the card shows it without expanding. `BinCard` renders a couple of
            // rows and hides the rest behind "+N more", and the first exception landed third in a bin
            // of three — an exception nobody can see demonstrates nothing. Order within a bin carries no
            // meaning anywhere else (`consolidateBinProducts` groups by identity, not position).
            staying.unshift(product);
            return;
          }

          const identity = productIdentity(product);
          const alreadyStocking = fridgeBins.find(fridge =>
            fridge.products.some((existing: any) => productIdentity(existing) === identity)
          );

          if (alreadyStocking) {
            alreadyStocking.products = alreadyStocking.products.map((existing: any) =>
              productIdentity(existing) === identity
                ? { ...existing, quantity: (existing.quantity || 0) + (product.quantity || 0) }
                : existing
            );
            return;
          }

          const destination = fridgeBins.reduce((fewest, candidate) =>
            candidate.products.length < fewest.products.length ? candidate : fewest
          );
          destination.products = [...destination.products, product];
          destination.available = false;
        });

        bin.products = staying;
        // An emptied bin is a free bin, and the green stroke and every free-bin count read this flag.
        if (staying.length === 0) bin.available = true;
      });
    });
  });

  return out;
};

// The live cabinet layout is now driven by the real OCSRI bin-allocation data.
// See realData.ts (auto-generated from OCSRI_BIN_ALLOCATION 1.pdf).
//   Cabinet 1 = Doors 1-4, Cabinet 2 = Doors 5-8 (structured shelves/bins)
//   Virtual   = Doors 9-14 (bulk/fridge storage, one pooled bin per door)
// The import supplies inventory only — every bin arrives as a positionless 1x1.
// applyShelfLayouts layers the physical geometry on top (see shelfLayoutConfig).
//
// redistributeProducts runs first: the import piles almost everything into the Virtual cabinet's
// pooled bins, and applyShelfLayouts sizes each bin from how much it holds — so the spread has to
// happen before the geometry is derived from it.
//
// emptySomeProductsForDemo runs LAST, after the geometry: applyShelfLayouts sizes each bin from how
// much it holds, so zeroing quantities any earlier would change the physical shape of the cabinet.
//
// moveClimateStockToFridges runs last of all, so nothing after it can leave a CLIMATE product in a
// warm cabinet — see its own comment for the two exceptions it deliberately keeps.
export const doorShelfConfig: DoorShelfConfig = moveClimateStockToFridges(
  stockOneLocationForDemo(
    emptySomeProductsForDemo(
      applyShelfLayouts(redistributeProducts(applyInventoryTypes(realDoorShelfConfig)))
    )
  )
);
