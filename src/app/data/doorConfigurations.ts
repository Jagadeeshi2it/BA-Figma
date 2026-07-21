import { DoorShelfConfig } from '../types';
import { realDoorShelfConfig } from './realData';

// The live cabinet layout is now driven by the real OCSRI bin-allocation data.
// See realData.ts (auto-generated from OCSRI_BIN_ALLOCATION 1.pdf).
//   Cabinet 1 = Doors 1-4, Cabinet 2 = Doors 5-8 (structured shelves/bins)
//   Virtual   = Doors 9-14 (bulk/fridge storage, one pooled bin per door)
export const doorShelfConfig: DoorShelfConfig = realDoorShelfConfig;
