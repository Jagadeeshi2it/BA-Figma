import { DoorShelfConfig } from '../types';
import { realDoorShelfConfig } from './realData';
import { applyShelfLayouts } from '../utils/shelfLayoutConfig';
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

// The live cabinet layout is now driven by the real OCSRI bin-allocation data.
// See realData.ts (auto-generated from OCSRI_BIN_ALLOCATION 1.pdf).
//   Cabinet 1 = Doors 1-4, Cabinet 2 = Doors 5-8 (structured shelves/bins)
//   Virtual   = Doors 9-14 (bulk/fridge storage, one pooled bin per door)
// The import supplies inventory only — every bin arrives as a positionless 1x1.
// applyShelfLayouts layers the physical geometry on top (see shelfLayoutConfig).
export const doorShelfConfig: DoorShelfConfig = applyShelfLayouts(
  applyInventoryTypes(realDoorShelfConfig)
);
