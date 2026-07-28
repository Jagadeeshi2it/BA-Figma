import { Bin, DoorShelfConfig, DoorType, Shelf } from '../types';

// ---------------------------------------------------------------------------
// Physical door/shelf configuration.
//
// The OCSRI import (realData.ts) gives us WHICH products sit in which bin, but
// carries no positional metadata at all — every bin comes through as a plain
// 1x1 with no row and no gridPosition. This module layers the physical cabinet
// layout back on top of that data, so the generated file stays the source of
// truth for inventory and this stays the source of truth for geometry.
//
// Footprints are named rows x cols, matching the design reference: a "1x2" is
// one row spanning two columns, and its rotation (two rows, one column) keeps
// the same name. gridPosition.width is columns, gridPosition.height is rows —
// so a 2x3 is { width: 3, height: 2 }.
// ---------------------------------------------------------------------------

// Doors 9-14 (Virtual/fridge) are deliberately absent: they hold one pooled
// bin per door and are handled by isFridgeDoor, not by any slot grid.
const DOOR_TYPES: Record<string, DoorType> = {
  'Door 1': 'single',
  'Door 2': 'double',
  'Door 3': 'double',
  'Door 4': 'unique', // "bottom door" — the wide door at the base of the cabinet
  'Door 5': 'single',
  'Door 6': 'double',
  'Door 7': 'double',
  'Door 8': 'unique',
};

export const getConfiguredDoorType = (doorName: string): DoorType =>
  DOOR_TYPES[doorName] ?? 'single';

export const SINGLE_DOOR_SLOTS = 5; // 1 row x 5 columns
export const DOUBLE_DOOR_GRID = { rows: 2, cols: 5 }; // 10 slots
export const BOTTOM_DOOR_GRID = { rows: 5, cols: 5 }; // 25 slots

type Placement = { x: number; y: number; width: number; height: number };

// Map a footprint back to the Bin['size'] label. Rotations share a label, which
// is why gridPosition — not size — has to be what the renderer measures.
const sizeForFootprint = (width: number, height: number): Bin['size'] => {
  const key = `${height}x${width}`;
  switch (key) {
    case '1x1': return 'single';
    case '1x2':
    case '2x1': return 'double';
    case '2x2': return '2x2';
    case '2x3':
    case '3x2': return '2x3';
    case '3x3': return '3x3';
    default: return 'single';
  }
};

// Bottom doors are a fixed configuration — identical on all four shelves.
//   2x3 | 2x3(rotated) | 3x3 | 2x2  tiles 5x5 exactly, 25/25 slots.
//
//   row 0:  A A A B B
//   row 1:  A A A B B
//   row 2:  C C C B B
//   row 3:  C C C D D
//   row 4:  C C C D D
const BOTTOM_SHELF_PLACEMENTS: Placement[] = [
  { x: 0, y: 0, width: 3, height: 2 }, // A — 2x3
  { x: 3, y: 0, width: 2, height: 3 }, // B — 2x3 rotated
  { x: 0, y: 2, width: 3, height: 3 }, // C — 3x3
  { x: 3, y: 3, width: 2, height: 2 }, // D — 2x2
];

// Double doors tile 2 rows x 5 columns = 10 slots. Keyed by how many bins the
// shelf actually holds, so no bin is ever added or dropped to make a layout fit.
// Each bin count offers SEVERAL arrangements — the shelves of doors 2/3/6/7 have
// near-identical bin counts, so a single arrangement per count would make every
// shelf and every door look the same. Every entry sums to exactly 10 slots.
const DOUBLE_SHELF_VARIANTS: Record<number, Placement[][]> = {
  3: [
    // 2x3 with two stacked 1x2 beside it
    [
      { x: 0, y: 0, width: 3, height: 2 },
      { x: 3, y: 0, width: 2, height: 1 },
      { x: 3, y: 1, width: 2, height: 1 },
    ],
    // ...and mirrored, 2x3 on the right
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 1, width: 2, height: 1 },
      { x: 2, y: 0, width: 3, height: 2 },
    ],
    // Two 2x2 with a rotated 1x2 filling the last column
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 2 },
      { x: 4, y: 0, width: 1, height: 2 },
    ],
  ],
  4: [
    // 2x3 + 1x2 over two 1x1
    [
      { x: 0, y: 0, width: 3, height: 2 },
      { x: 3, y: 0, width: 2, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
    // ...mirrored, 2x3 on the right
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
      { x: 1, y: 1, width: 1, height: 1 },
      { x: 2, y: 0, width: 3, height: 2 },
    ],
    // Two 2x2 with a stacked pair of 1x1
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 2 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
    // 2x2 + two horizontal 1x2 + a rotated 1x2
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 1 },
      { x: 2, y: 1, width: 2, height: 1 },
      { x: 4, y: 0, width: 1, height: 2 },
    ],
  ],
  5: [
    // Reference "shelf config 2": four horizontal 1x2 around one rotated 1x2
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0, y: 1, width: 2, height: 1 },
      { x: 2, y: 0, width: 1, height: 2 },
      { x: 3, y: 0, width: 2, height: 1 },
      { x: 3, y: 1, width: 2, height: 1 },
    ],
    // 2x3 with a 2x2 block of 1x1 beside it
    [
      { x: 0, y: 0, width: 3, height: 2 },
      { x: 3, y: 0, width: 1, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
    // 2x2 + two 1x2 + two 1x1
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 1 },
      { x: 2, y: 1, width: 2, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
  ],
  6: [
    // Reference "shelf config 5": four 1x2 plus a 1x1 at the end of each row
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 2, y: 0, width: 2, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 2, height: 1 },
      { x: 2, y: 1, width: 2, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
    // 2x2 + 1x2 + four 1x1
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
  ],
  7: [
    // Reference "shelf config 4": 3x2 block of 1x1 alongside a 2x2
    [
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 2, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
      { x: 1, y: 1, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 3, y: 0, width: 2, height: 2 },
    ],
    // ...mirrored, 2x2 on the left
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 1, height: 1 },
      { x: 3, y: 0, width: 1, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
  ],
  8: [
    // One 1x2 per row, remainder 1x1
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 2, y: 0, width: 1, height: 1 },
      { x: 3, y: 0, width: 1, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 2, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
  ],
  9: [
    // Single 1x2 on the top row, everything else 1x1
    [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 2, y: 0, width: 1, height: 1 },
      { x: 3, y: 0, width: 1, height: 1 },
      { x: 4, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
      { x: 1, y: 1, width: 1, height: 1 },
      { x: 2, y: 1, width: 1, height: 1 },
      { x: 3, y: 1, width: 1, height: 1 },
      { x: 4, y: 1, width: 1, height: 1 },
    ],
  ],
  10: [
    // Reference "shelf config 1": ten 1x1
    Array.from({ length: 10 }, (_, i) => ({
      x: i % 5,
      y: Math.floor(i / 5),
      width: 1,
      height: 1,
    })),
  ],
};

// Single doors are one row of 5 slots. With K bins, exactly (5 - K) of them have
// to be a 1x2 for the row to fill — so K=5 is all 1x1, K=4 has one 1x2, K=3 has
// two. Which POSITIONS the wide bins take is free, and that's what varies the
// shelves: every distinct ordering is offered as a variant.
const singleShelfVariants = (binCount: number): Placement[][] => {
  const doubles = SINGLE_DOOR_SLOTS - binCount;
  if (doubles < 0 || doubles > binCount) return [];

  // Each variant shifts the run of wide bins one place further along the row.
  const offsets = Array.from({ length: binCount - doubles + 1 }, (_, i) => i);

  return offsets.map(offset => {
    let x = 0;
    return Array.from({ length: binCount }, (_, i) => {
      const width = i >= offset && i < offset + doubles ? 2 : 1;
      const placement = { x, y: 0, width, height: 1 };
      x += width;
      return placement;
    });
  });
};

const emptyBin = (shelfId: string, index: number): Bin => ({
  id: `${shelfId}_slot${index + 1}`,
  name: `Bin ${String.fromCharCode(65 + index)}`,
  products: [],
  available: true,
  size: 'single',
});

const hasProducts = (bin: Bin) => (bin.products?.length ?? 0) > 0;

// Order bins so occupied ones claim placements first, then pad or trim to the
// placement count. Trimming only ever discards EMPTY bins — an occupied bin is
// never dropped, so no product can be lost to a layout change.
const fitBinsToPlacements = (shelf: Shelf, count: number): Bin[] | null => {
  const occupied = shelf.bins.filter(hasProducts);
  const empty = shelf.bins.filter(bin => !hasProducts(bin));

  if (occupied.length > count) {
    console.warn(
      `shelfLayoutConfig: shelf ${shelf.id} has ${occupied.length} occupied bins but the ` +
      `layout only offers ${count} slots — leaving this shelf unchanged rather than dropping products.`
    );
    return null;
  }

  const fitted = [...occupied, ...empty].slice(0, count);
  while (fitted.length < count) {
    fitted.push(emptyBin(shelf.id, fitted.length));
  }
  return fitted;
};

const doorNumber = (doorName: string) => parseInt(doorName.replace(/\D/g, ''), 10) || 0;

// A door's position among the doors of its OWN type. Seeding with this rather than
// the raw door number matters: the raw number collides, because doors 2 and 6 are
// four apart and 4-bin shelves offer four variants, so (2 + n) and (6 + n) pick the
// same one. Ranking makes the walk across doors a permutation instead, so no two
// doors of a type share an arrangement on the same shelf whenever there are at
// least as many variants as doors.
const DOOR_RANKS: Record<string, number> = (() => {
  const ranks: Record<string, number> = {};
  const byType: Record<string, string[]> = {};

  Object.keys(DOOR_TYPES).forEach(door => {
    const type = DOOR_TYPES[door];
    (byType[type] ??= []).push(door);
  });

  Object.values(byType).forEach(doors => {
    doors
      .sort((a, b) => doorNumber(a) - doorNumber(b))
      .forEach((door, index) => { ranks[door] = index; });
  });

  return ranks;
})();

// Choose one arrangement from the available variants. Stable across reloads, and
// stepping by shelf index keeps consecutive shelves of one door from matching.
const pickVariant = (
  variants: Placement[][],
  doorName: string,
  shelfIndex: number
): Placement[] | null => {
  if (variants.length === 0) return null;
  const rank = DOOR_RANKS[doorName] ?? 0;
  return variants[(rank + shelfIndex) % variants.length];
};

const placementsForShelf = (
  doorName: string,
  doorType: DoorType,
  shelf: Shelf,
  shelfIndex: number
): Placement[] | null => {
  // Bottom doors are a single fixed configuration — all four shelves alike, by design.
  if (doorType === 'unique') return BOTTOM_SHELF_PLACEMENTS;

  const variants = doorType === 'double'
    ? DOUBLE_SHELF_VARIANTS[shelf.bins.length] ?? []
    : singleShelfVariants(shelf.bins.length);

  return pickVariant(variants, doorName, shelfIndex);
};

const layoutShelf = (
  doorName: string,
  doorType: DoorType,
  shelf: Shelf,
  shelfIndex: number
): Shelf => {
  const placements = placementsForShelf(doorName, doorType, shelf, shelfIndex);
  if (!placements) return shelf;

  const bins = fitBinsToPlacements(shelf, placements.length);
  if (!bins) return shelf;

  return {
    ...shelf,
    bins: bins.map((bin, index) => {
      const { x, y, width, height } = placements[index];
      return {
        ...bin,
        size: sizeForFootprint(width, height),
        // Single doors render from `size` alone (one row, no vertical spans), so
        // they intentionally keep gridPosition undefined.
        ...(doorType === 'single' ? {} : { gridPosition: { x, y, width, height } }),
        // Bin letters follow the physical layout rather than the import order.
        name: `Bin ${String.fromCharCode(65 + index)}`,
      };
    }),
  };
};

/**
 * Apply the physical cabinet geometry to an imported door/shelf config.
 * Fridge doors (Virtual, 9-14) pass through untouched — one pooled bin, no grid.
 */
export const applyShelfLayouts = (config: DoorShelfConfig): DoorShelfConfig => {
  const out: DoorShelfConfig = {};

  Object.keys(config).forEach(doorName => {
    const doorType = DOOR_TYPES[doorName];
    if (!doorType) {
      out[doorName] = config[doorName];
      return;
    }
    out[doorName] = config[doorName].map((shelf, shelfIndex) =>
      layoutShelf(doorName, doorType, shelf, shelfIndex)
    );
  });

  return out;
};
