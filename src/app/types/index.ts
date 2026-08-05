export interface Product {
  id: string;
  name: string; // Display Name
  genericName: string; // Generic Name
  ndc: string;
  quantity: number;
  unit: string; // Qty Type
  source: string;
  inventoryType: string; // Inventory Type
  vialType: 'SDV' | 'MDV'; // Single Dose Vial or Multi Dose Vial
  description?: string;
}

export interface Bin {
  id: string;
  name: string;
  products: Product[];
  available: boolean;
  size: 'single' | 'double' | '2x2' | '2x3' | '3x3' | 'fridge' | 'floor';
  gridPosition?: { x: number; y: number; width: number; height: number };
  style?: { width?: string; height?: string };
  row?: number; // For double doors: which row (1 or 2) the bin belongs to
}

export interface Shelf {
  id: string;
  name: string;
  bins: Bin[];
}

export interface Cabinet {
  id: string;
  name: string;
  doors: string[];
  active: boolean;
}

export interface DoorShelfConfig {
  [doorName: string]: Shelf[];
}

export type DoorType = 'single' | 'double' | 'unique';

export interface NavigationItem {
  name: string;
  icon: string;
  hasSubmenu: boolean;
  active?: boolean;
}

export interface UnallocatedProduct {
  id: string;
  name: string;
  description: string;
  ndc: string;
  source: string;
  badge: string;
  inventoryType: string;
  // The master product this entry came from. Carried explicitly because the
  // display name alone is ambiguous — several master records share a name while
  // differing by NDC (two "MESNA 1 GRAM/10 ML VIAL", two "VYLOY 100 MG VIAL") —
  // so allocation would otherwise have to guess, and could stamp the bin product
  // with the wrong master's identity.
  masterId?: string;
}

export interface AllocationHistoryEntry {
  id: string;
  timestamp: Date;
  products: {
    id: string;
    name: string;
    ndc: string;
    badge: string;
    quantity: number;
    unit: string;
    // Both were already being written by the allocate and cancel paths and read by the History page; the
    // type simply hadn't caught up. The generic name and inventory type are what make a row name the same
    // drug the bins do.
    description?: string;
    inventoryType?: string;
  }[];
  bins: {
    binId: string;
    binName: string;
    shelfName: string;
    doorNumber: string;
    cabinetNumber: string;
    quantity?: number; // Quantity assigned to this specific bin
    existingQuantity?: number; // Quantity that existed in this bin before the transfer
  }[];
  sourceBin?: {
    binId: string;
    binName: string;
    shelfName: string;
    doorNumber: string;
    cabinetNumber: string;
    quantity?: number; // Total quantity moved out of this source bin
    remainingQuantity?: number; // Quantity left in the source bin after the move
  };
  // A single product's quantity can be gathered from SEVERAL source bins in one operation.
  // When that happens this array holds every contributing bin (with its own quantity), while
  // `sourceBin` above stays populated with the first one for backwards compatibility.
  sourceBins?: {
    binId: string;
    binName: string;
    shelfName: string;
    doorNumber: string;
    cabinetNumber: string;
    quantity?: number; // Quantity taken out of THIS source bin
    remainingQuantity?: number; // Quantity left in THIS source bin after the move
  }[];
  // 'move-cancelled' is a move the operator abandoned with stock already in hand: nothing ended up
  // anywhere new, but a door was opened and vials were handled, so the trail must not claim the session
  // never happened (STEP4-GUIDANCE.md §8).
  action: 'allocation' | 'move' | 'change-allocation' | 'unallocate' | 'move-cancelled';
  transactionType: 'New Bin Allocation' | 'Product moved' | 'Unallocated' | 'Move cancelled';
}

export interface ProductTransfer {
  productId: string;
  fromBinId: string;
  toBinId: string;
  quantity: number;
  serialNumbers?: string[]; // For Emergency Kit transfers - array of serial numbers
  actionType?: 'allocate' | 'move'; // Track whether this was an allocate or move action
}

// Change Allocation Modal Types
export interface ProductMoveQuantity {
  productId: string;
  quantity: number;
  maxQuantity: number;
  moved: number;
}

export interface MovedProduct extends Product {
  movedQuantity: number;
}

export interface ChangeAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBins: Bin[];
  targetBins: Bin[];
  doorShelfConfig: DoorShelfConfig;
  // Query describing the product(s) picked from the search bar when the source bins were chosen.
  // When set, the source panel shows only those products — see changeAllocationSourceQuery.
  sourceProductQuery?: string;
  // The move kind. 'product' forces the Review to the product perspective (every picked product, one
  // at a time); 'bin' forces the per-bin view. Undefined falls back to the old bin-count heuristic.
  moveMode?: 'bin' | 'product' | null;
  onConfirmAllocation: (transfers: ProductTransfer[], serialNumbers?: { [transferId: string]: string[] }) => void;
  // Full-flow abort from the Review page (exits change-allocation mode entirely). Distinct from
  // onOpenChange(false), which is the one-step Back to the Target selection. Optional so older call
  // sites still type-check; the live page always supplies it.
  onCancel?: () => void;
}

// Master Product Definition Interface
export interface MasterProduct {
  id: string;
  displayName: string;
  genericName: string;
  ndc: string;
  source: string;
  inventoryType: string;
  vialType: 'SDV' | 'MDV';
  defaultUnit: string;
}