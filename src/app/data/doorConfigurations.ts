import { DoorShelfConfig } from '../types';
import { realDoorShelfConfig } from './realData';
import { applyShelfLayouts } from '../utils/shelfLayoutConfig';
import { redistributeProducts } from '../utils/redistributeProducts';
import { withInventoryType } from '../utils/inventoryTypes';

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
export const doorShelfConfig: DoorShelfConfig = stockOneLocationForDemo(
  emptySomeProductsForDemo(
    applyShelfLayouts(redistributeProducts(applyInventoryTypes(realDoorShelfConfig)))
  )
);
