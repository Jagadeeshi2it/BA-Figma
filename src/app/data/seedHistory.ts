import { AllocationHistoryEntry } from '../types';

// Demo history seeded across the last 7 days so the History page shows every kind of record it
// can render: allocations, single/multi-target moves, partial vs full moves, multi-product
// entries, and unallocations. Dates are computed relative to load time so the "7 days" filter
// always covers them regardless of when the demo is opened.
//
// Every entry carries the station it happened at, spread deterministically across the clinic's four
// stations (Onco, Secondary, North, East) so the clinic-level Station filter has more than one answer.
// Position-based rather than random: a seed that reshuffles on every load cannot be described in a doc.
//
// Nothing is seeded into TODAY. Today's list is where a walkthrough's own transaction lands, and it
// reads as the record of what just happened — seed rows sitting there beforehand make the operator
// hunt for their own entry among strangers.
const daysAgo = (days: number, hour: number, minute: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const generateSeedHistory = (): AllocationHistoryEntry[] => [
  // 1. New Bin Allocation — single product into a single bin.
  {
    id: 'seed-alloc-single',
    timestamp: daysAgo(6, 9, 15),
    products: [
      { id: 'PROD001', name: 'ALIMTA 100 MG VIAL', ndc: '00002764001', badge: 'SDV', quantity: 12, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d1-s1-c', binName: 'Bin C', shelfName: 'Shelf 1', doorNumber: '1', cabinetNumber: '1', quantity: 12, existingQuantity: 0 }
    ],
    action: 'allocation',
    transactionType: 'New Bin Allocation',
    station: 'Onco Station'
  },

  // 2. New Bin Allocation — several products allocated together in one transaction.
  {
    id: 'seed-alloc-multi-product',
    timestamp: daysAgo(6, 11, 40),
    products: [
      { id: 'PROD004', name: 'ALIMTA 500 MG VIAL', ndc: '00002762301', badge: 'SDV', quantity: 8, unit: 'vials' },
      { id: 'PROD005', name: 'COSELA 300 MG VIAL', ndc: '73462010101', badge: 'SDV', quantity: 20, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d2-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '2', cabinetNumber: '1', quantity: 8, existingQuantity: 0 }
    ],
    action: 'allocation',
    transactionType: 'New Bin Allocation',
    station: 'Secondary Station'
  },

  // 3. New Bin Allocation — one product spread across multiple bins.
  {
    id: 'seed-alloc-multi-bin',
    timestamp: daysAgo(5, 14, 5),
    products: [
      { id: 'PROD002', name: 'ALBURX (HUMAN) 25% VIAL 25GM/100ML', ndc: '44206025110', badge: 'SDV', quantity: 30, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d2-s2-b', binName: 'Bin B', shelfName: 'Shelf 2', doorNumber: '2', cabinetNumber: '1', quantity: 15, existingQuantity: 0 },
      { binId: 'seed-bin-d2-s2-c', binName: 'Bin C', shelfName: 'Shelf 2', doorNumber: '2', cabinetNumber: '1', quantity: 15, existingQuantity: 5 }
    ],
    action: 'allocation',
    transactionType: 'New Bin Allocation',
    station: 'North Station'
  },

  // 4. Product moved — full move (source emptied), single target bin.
  {
    id: 'seed-move-full-single',
    timestamp: daysAgo(4, 10, 20),
    products: [
      { id: 'PROD003', name: 'PEMETREXED DISODIUM 100 MG VL', ndc: '55150038101', badge: 'SDV', quantity: 25, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d3-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '3', cabinetNumber: '1', quantity: 25, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d1-s2-b', binName: 'Bin B', shelfName: 'Shelf 2', doorNumber: '1', cabinetNumber: '1',
      quantity: 25, remainingQuantity: 0
    },
    action: 'move',
    transactionType: 'Product moved',
    station: 'East Station'
  },

  // 5. Product moved — partial move, source keeps a remainder.
  {
    id: 'seed-move-partial',
    timestamp: daysAgo(3, 13, 45),
    products: [
      { id: 'PROD005', name: 'COSELA 300 MG VIAL', ndc: '73462010101', badge: 'SDV', quantity: 40, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d4-s1-b', binName: 'Bin B', shelfName: 'Shelf 1', doorNumber: '4', cabinetNumber: '1', quantity: 40, existingQuantity: 10 }
    ],
    sourceBin: {
      binId: 'seed-bin-d2-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '2', cabinetNumber: '1',
      quantity: 40, remainingQuantity: 63
    },
    action: 'move',
    transactionType: 'Product moved',
    station: 'Onco Station'
  },

  // 6. Product moved — one source split across two target bins.
  {
    id: 'seed-move-split-targets',
    timestamp: daysAgo(2, 15, 30),
    products: [
      { id: 'PROD007', name: 'CARBOPLATIN 600 MG/60 ML VIAL', ndc: '63323017260', badge: 'SDV', quantity: 100, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d1-s1-b', binName: 'Bin B', shelfName: 'Shelf 1', doorNumber: '1', cabinetNumber: '1', quantity: 60, existingQuantity: 0 },
      { binId: 'seed-bin-d1-s2-c', binName: 'Bin C', shelfName: 'Shelf 2', doorNumber: '1', cabinetNumber: '1', quantity: 40, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d4-s3-c', binName: 'Bin C', shelfName: 'Shelf 3', doorNumber: '4', cabinetNumber: '1',
      quantity: 100, remainingQuantity: 0
    },
    action: 'move',
    transactionType: 'Product moved',
    station: 'Secondary Station'
  },

  // 7. Product moved — multiple products moved out of the same source bin together.
  {
    id: 'seed-move-multi-product',
    timestamp: daysAgo(2, 16, 50),
    products: [
      { id: 'PROD010', name: 'MITOMYCIN 5 MG VIAL', ndc: '71288013720', badge: 'MDV', quantity: 50, unit: 'vials' },
      { id: 'PROD011', name: 'MITOMYCIN 20 MG VIAL', ndc: '71288013850', badge: 'SDV', quantity: 5, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d3-s2-d', binName: 'Bin D', shelfName: 'Shelf 2', doorNumber: '3', cabinetNumber: '1', quantity: 50, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d4-s3-a', binName: 'Bin A', shelfName: 'Shelf 3', doorNumber: '4', cabinetNumber: '1',
      quantity: 55, remainingQuantity: 110
    },
    action: 'move',
    transactionType: 'Product moved',
    station: 'North Station'
  },

  // 8. Product moved — across cabinets (Cabinet 1 → Cabinet 2).
  {
    id: 'seed-move-cross-cabinet',
    timestamp: daysAgo(1, 9, 5),
    products: [
      { id: 'PROD004', name: 'ALIMTA 500 MG VIAL', ndc: '00002762301', badge: 'SDV', quantity: 12, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d5-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '5', cabinetNumber: '2', quantity: 12, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d2-s2-b', binName: 'Bin B', shelfName: 'Shelf 2', doorNumber: '2', cabinetNumber: '1',
      quantity: 12, remainingQuantity: 0
    },
    action: 'move',
    transactionType: 'Product moved',
    station: 'East Station'
  },

  // 9. Product moved — gathered from MULTIPLE source bins into a single target bin.
  {
    id: 'seed-move-multi-source',
    timestamp: daysAgo(3, 9, 30),
    products: [
      { id: 'PROD005', name: 'COSELA 300 MG VIAL', ndc: '73462010101', badge: 'SDV', quantity: 45, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d6-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '6', cabinetNumber: '2', quantity: 45, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d1-s3-a', binName: 'Bin A', shelfName: 'Shelf 3', doorNumber: '1', cabinetNumber: '1',
      quantity: 20, remainingQuantity: 5
    },
    sourceBins: [
      { binId: 'seed-bin-d1-s3-a', binName: 'Bin A', shelfName: 'Shelf 3', doorNumber: '1', cabinetNumber: '1', quantity: 20, remainingQuantity: 5 },
      { binId: 'seed-bin-d2-s3-b', binName: 'Bin B', shelfName: 'Shelf 3', doorNumber: '2', cabinetNumber: '1', quantity: 15, remainingQuantity: 0 },
      { binId: 'seed-bin-d3-s1-c', binName: 'Bin C', shelfName: 'Shelf 1', doorNumber: '3', cabinetNumber: '1', quantity: 10, remainingQuantity: 12 }
    ],
    action: 'move',
    transactionType: 'Product moved',
    station: 'Onco Station'
  },

  // 10. Product moved — the full matrix: gathered from MULTIPLE source bins AND dispersed
  // across MULTIPLE target bins in one operation.
  {
    id: 'seed-move-multi-source-multi-target',
    timestamp: daysAgo(1, 16, 10),
    products: [
      { id: 'PROD007', name: 'CARBOPLATIN 600 MG/60 ML VIAL', ndc: '63323017260', badge: 'SDV', quantity: 90, unit: 'vials' }
    ],
    bins: [
      { binId: 'seed-bin-d7-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '7', cabinetNumber: '2', quantity: 50, existingQuantity: 0 },
      { binId: 'seed-bin-d7-s1-b', binName: 'Bin B', shelfName: 'Shelf 1', doorNumber: '7', cabinetNumber: '2', quantity: 25, existingQuantity: 10 },
      { binId: 'seed-bin-d8-s2-c', binName: 'Bin C', shelfName: 'Shelf 2', doorNumber: '8', cabinetNumber: '2', quantity: 15, existingQuantity: 0 }
    ],
    sourceBin: {
      binId: 'seed-bin-d4-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '4', cabinetNumber: '1',
      quantity: 40, remainingQuantity: 0
    },
    sourceBins: [
      { binId: 'seed-bin-d4-s1-a', binName: 'Bin A', shelfName: 'Shelf 1', doorNumber: '4', cabinetNumber: '1', quantity: 40, remainingQuantity: 0 },
      { binId: 'seed-bin-d4-s2-b', binName: 'Bin B', shelfName: 'Shelf 2', doorNumber: '4', cabinetNumber: '1', quantity: 30, remainingQuantity: 8 },
      { binId: 'seed-bin-d5-s1-c', binName: 'Bin C', shelfName: 'Shelf 1', doorNumber: '5', cabinetNumber: '2', quantity: 20, remainingQuantity: 0 }
    ],
    action: 'move',
    transactionType: 'Product moved',
    station: 'Secondary Station'
  },

  // 11. Unallocated — single product removed from its bin.
  {
    id: 'seed-unalloc-single',
    timestamp: daysAgo(1, 12, 25),
    products: [
      { id: 'PROD002', name: 'ALBURX (HUMAN) 25% VIAL 25GM/100ML', ndc: '44206025110', badge: 'SDV', quantity: 3, unit: 'vials' }
    ],
    bins: [],
    sourceBin: {
      binId: 'seed-bin-d1-s1-c', binName: 'Bin C', shelfName: 'Shelf 1', doorNumber: '1', cabinetNumber: '1'
    },
    action: 'unallocate',
    transactionType: 'Unallocated',
    station: 'North Station'
  }

  // There was a 13th entry here: a multi-product unallocation stamped today at 08:40, which is the
  // only seed record that landed in Today's list. Removed — Today is where a demo lands after doing
  // something, and finding two unallocations already sitting there muddies the one row the operator
  // just created. The single-product unallocation above (yesterday) still covers the record type, so
  // nothing the History page can render has gone untested.
];
