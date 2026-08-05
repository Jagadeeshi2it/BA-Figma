/**
 * The step ④ route planner. See STEP4-GUIDANCE.md for the rules this implements; the section numbers
 * below refer to it.
 *
 * Turns the transfers agreed at Review into an ordered walk through the cabinet, under two physical
 * constraints: only one door can be open at a time (globally, across every cabinet), and only one bin
 * can be lit. The unit is a STOP — one bin, lit once, worked until done — and because only one door
 * opens, every stop behind a door must be contiguous, so the route is a sequence of DOOR VISITS each
 * containing stops.
 *
 * Deliberately dependency-free. It takes the cabinet facts it needs (which door a bin is behind, and
 * whether that door is a constrained cabinet door or an unconstrained fridge) rather than importing
 * doorUtils, for three reasons: the caller already has a resolved bin index, a pure function of its
 * arguments can be replayed in Node without a bundler (the project's main verification route — CLAUDE.md
 * §6), and the planner has no business deciding what counts as a fridge.
 */

/** Fridges (Doors 9–14) have no lock and no bin lighting, so they cost the route nothing (§1, R6). */
export type StorageKind = 'cabinet' | 'fridge';

/** What the caller must know about a bin for it to appear in a route. */
export interface RouteBin {
  binId: string;
  binName: string;
  doorName: string;
  storage: StorageKind;
}

/** One thing to do at one bin. */
export interface RouteAction {
  kind: 'take' | 'place';
  /** The identity triple, lowercased — the app's product identity everywhere (CLAUDE.md §3). */
  productKey: string;
  productName: string;
  /**
   * The bin row's own id. Kept because transfers match on it and the id differs per bin for the same
   * product, so the route cannot hand back an identity where a caller needs a row.
   */
  productId: string;
  /**
   * null means undecided, and only ever happens on a place: when a product's stock is split across
   * several target bins the share per bin is settled by scanning into them, not here. A 0 would read as
   * a decision already made (the same rule the Move Summary follows).
   */
  quantity: number | null;
  unit?: string;
}

export interface RouteStop {
  key: string;
  binId: string;
  binName: string;
  doorName: string;
  storage: StorageKind;
  /** Takes before places (§4.4) — a bin that is both a source and a target must be emptied then filled. */
  actions: RouteAction[];
}

export interface DoorVisit {
  /** Door plus visit index: a door can legitimately be visited twice (§5), and the two must not merge. */
  key: string;
  doorName: string;
  storage: StorageKind;
  /** 1-based. > 1 only for a door split to break a precedence cycle (§5). */
  visitIndex: number;
  purpose: 'take' | 'place' | 'both';
  stops: RouteStop[];
}

export interface MoveRoute {
  visits: DoorVisit[];
  /** The same stops flattened in route order — what a "stop n of N" counter walks. */
  stops: RouteStop[];
  /** Cabinet door visits only; fridge visits cost nothing and are excluded from the figure. */
  cabinetDoorVisits: number;
  /** Lock-then-unlock pairs between cabinet visits. One less than the visits, never below 0. */
  doorTransitions: number;
  /** Doors that had to be visited twice, i.e. where §5's cycle fallback fired. */
  splitDoors: string[];
}

/**
 * The route reduced to the order a walk can follow when it must finish every take before starting any
 * place — which is the shape step ④'s two screens have (`QuantitySelectionPage` then
 * `TargetBinSerialScanPage`).
 *
 * Most routes are already in that shape, including the important one: when a door holds both sources and
 * the target, the planner visits it last among the sources, so its takes and its places sit together at
 * the end and the door never closes between them. Those routes lose nothing here.
 *
 * A route that genuinely interleaves — a place at one door followed by a take at another — cannot be
 * executed by two phases, and `needsInterleaving` says so rather than letting the walk quietly cost more
 * door visits than the plan promised. `extraDoorVisits` is how much more.
 */
export interface TwoPhaseWalk {
  /** Bin ids with something to take, in route order. */
  takeBinOrder: string[];
  /** Bin ids with something to place, in route order. */
  placeBinOrder: string[];
  needsInterleaving: boolean;
  extraDoorVisits: number;
}

export function twoPhaseWalkOrder(route: MoveRoute, binIndex: Map<string, RouteBin>): TwoPhaseWalk {
  const takeBinOrder: string[] = [];
  const placeBinOrder: string[] = [];
  const kindSequence: Array<'take' | 'place'> = [];

  route.stops.forEach(stop => {
    stop.actions.forEach(action => kindSequence.push(action.kind));
    if (stop.actions.some(a => a.kind === 'take') && !takeBinOrder.includes(stop.binId)) {
      takeBinOrder.push(stop.binId);
    }
    if (stop.actions.some(a => a.kind === 'place') && !placeBinOrder.includes(stop.binId)) {
      placeBinOrder.push(stop.binId);
    }
  });

  const firstPlace = kindSequence.indexOf('place');
  const lastTake = kindSequence.lastIndexOf('take');
  const needsInterleaving = firstPlace !== -1 && lastTake !== -1 && firstPlace < lastTake;

  // Door visits the two-phase order actually costs: consecutive stops behind one door share a visit, so
  // count the changes.
  const doorOf = (binId: string) => binIndex.get(binId);
  const countVisits = (binIds: string[]): string[] =>
    binIds.reduce<string[]>((doors, binId) => {
      const bin = doorOf(binId);
      if (!bin || bin.storage !== 'cabinet') return doors;
      if (doors[doors.length - 1] !== bin.doorName) doors.push(bin.doorName);
      return doors;
    }, []);

  // The two phases run back to back, so a door ending the take phase and opening the place phase is one
  // visit, not two — which is exactly what saves the door in the source-and-target-behind-one-door case.
  const walkedDoors = countVisits([...takeBinOrder, ...placeBinOrder]);

  return {
    takeBinOrder,
    placeBinOrder,
    needsInterleaving,
    extraDoorVisits: Math.max(0, walkedDoors.length - route.cabinetDoorVisits)
  };
}

/** A transfer as the pipeline stages it. Only the four fields the route needs are required. */
export interface RouteTransfer {
  productId: string;
  fromBinId: string;
  toBinId: string;
  quantity: number;
  productName?: string;
  ndc?: string;
  inventoryType?: string;
  unit?: string;
}

export const productKeyOf = (parts: {
  productName?: string;
  ndc?: string;
  inventoryType?: string;
}): string =>
  `${parts.productName ?? ''}|${parts.ndc ?? ''}|${parts.inventoryType ?? ''}`.toLowerCase();

/** "Door 12" -> 12. Doors sort numerically, so "Door 12" must not fall between "Door 1" and "Door 2". */
const doorNumberOf = (doorName: string): number => {
  const match = /(\d+)/.exec(doorName);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
};

/**
 * "Bin 2A" sorts after "Bin 1B" and before "Bin 10A" — shelf number first, then the letter. A plain
 * string compare puts "Bin 10A" before "Bin 2A", which is the wrong reading order on a shelf.
 */
const binNameCompare = (a: string, b: string): number => {
  const parse = (name: string): [number, string] => {
    const match = /(\d+)\s*([A-Za-z]*)/.exec(name);
    return match ? [parseInt(match[1], 10), match[2] ?? ''] : [Number.MAX_SAFE_INTEGER, name];
  };
  const [aNum, aLetter] = parse(a);
  const [bNum, bLetter] = parse(b);
  if (aNum !== bNum) return aNum - bNum;
  if (aLetter !== bLetter) return aLetter.localeCompare(bLetter);
  return a.localeCompare(b);
};

/**
 * Ascending door number, then bin reading order.
 *
 * Exported because a return walk needs it too: putting stock back has nothing to take, so there are no
 * precedence constraints at all, and every door order costs the same number of visits. With cost tied,
 * R5 decides outright — the operator should be able to guess the order.
 */
export const compareRouteBins = (a: RouteBin, b: RouteBin): number => {
  const doorDelta = doorNumberOf(a.doorName) - doorNumberOf(b.doorName);
  if (doorDelta !== 0) return doorDelta;
  return binNameCompare(a.binName, b.binName);
};

/** Ascending door number, then bin reading order — the tie-break R5 asks for. */
const stopCompare = (a: RouteStop, b: RouteStop): number => {
  const doorDelta = doorNumberOf(a.doorName) - doorNumberOf(b.doorName);
  if (doorDelta !== 0) return doorDelta;
  return binNameCompare(a.binName, b.binName);
};

interface PlannedAction extends RouteAction {
  bin: RouteBin;
}

/**
 * A node in the door-ordering graph. Normally one per cabinet door, holding its takes and its places
 * together. A door caught in a precedence cycle is split into two — takes in one, places in the other —
 * which is what breaks the cycle: the takes node has no incoming precedence edge to satisfy (§5).
 */
interface DoorNode {
  doorName: string;
  part: 'all' | 'take' | 'place';
}

const nodeKey = (node: DoorNode): string => `${node.doorName}#${node.part}`;

/**
 * Plans the route.
 *
 * @param transfers  the move as agreed at Review
 * @param binIndex   every bin either end of a transfer touches, resolved to its door and storage kind.
 *                   A transfer whose bins aren't in here is dropped: a stop that can't say which door
 *                   it is behind cannot be guided to, and guessing would be worse than omitting it.
 */
export function planMoveRoute(
  transfers: RouteTransfer[],
  binIndex: Map<string, RouteBin>
): MoveRoute {
  const empty: MoveRoute = {
    visits: [],
    stops: [],
    cabinetDoorVisits: 0,
    doorTransitions: 0,
    splitDoors: []
  };
  if (!transfers || transfers.length === 0) return empty;

  const usable = transfers.filter(
    transfer => binIndex.has(transfer.fromBinId) && binIndex.has(transfer.toBinId)
  );
  if (usable.length === 0) return empty;

  // ── 1. Takes and places ────────────────────────────────────────────────────────────────────────
  //
  // A transfer's quantity is the WHOLE amount leaving its source bin, repeated across every target
  // that source feeds — it is not this target's share (CLAUDE.md §3). So a take is recorded once per
  // (source bin, product) and NOT summed across the transfers that share it; summing would double a
  // split. The share landing in each target is decided by scanning at the stop, so a place carries a
  // figure only when there is nothing to divide: one target for the whole product.
  const takeByBinProduct = new Map<string, PlannedAction>();
  const sourceBinsByProduct = new Map<string, Set<string>>();
  const targetBinsByProduct = new Map<string, Set<string>>();

  usable.forEach(transfer => {
    const key = productKeyOf(transfer);
    const fromBin = binIndex.get(transfer.fromBinId)!;
    const toBin = binIndex.get(transfer.toBinId)!;

    if (!sourceBinsByProduct.has(key)) sourceBinsByProduct.set(key, new Set());
    sourceBinsByProduct.get(key)!.add(transfer.fromBinId);
    if (!targetBinsByProduct.has(key)) targetBinsByProduct.set(key, new Set());
    targetBinsByProduct.get(key)!.add(transfer.toBinId);

    const takeKey = `${transfer.fromBinId}|${key}`;
    if (!takeByBinProduct.has(takeKey)) {
      takeByBinProduct.set(takeKey, {
        kind: 'take',
        productKey: key,
        productName: transfer.productName ?? '',
        productId: transfer.productId,
        quantity: transfer.quantity,
        unit: transfer.unit,
        bin: fromBin
      });
    }
    void toBin;
  });

  const placeByBinProduct = new Map<string, PlannedAction>();
  usable.forEach(transfer => {
    const key = productKeyOf(transfer);
    const placeKey = `${transfer.toBinId}|${key}`;
    if (placeByBinProduct.has(placeKey)) return;

    // One target for this product means everything taken for it lands here, so the figure is known up
    // front: the sum of what leaves each source. More than one target and the split is the operator's
    // to make at the bin.
    const singleTarget = (targetBinsByProduct.get(key)?.size ?? 0) === 1;
    const total = singleTarget
      ? Array.from(sourceBinsByProduct.get(key) ?? []).reduce(
          (sum, binId) => sum + (takeByBinProduct.get(`${binId}|${key}`)?.quantity ?? 0),
          0
        )
      : null;

    placeByBinProduct.set(placeKey, {
      kind: 'place',
      productKey: key,
      productName: transfer.productName ?? '',
      productId: transfer.productId,
      quantity: total,
      unit: transfer.unit,
      bin: binIndex.get(transfer.toBinId)!
    });
  });

  // ── 2. Stops ───────────────────────────────────────────────────────────────────────────────────
  //
  // One stop per bin, however many actions it carries: two takes from one bin is one stop, because the
  // bin is lit once (R3). Takes before places within the stop (§4.4).
  const buildStops = (actions: PlannedAction[]): RouteStop[] => {
    const byBin = new Map<string, RouteStop>();
    actions.forEach(action => {
      let stop = byBin.get(action.bin.binId);
      if (!stop) {
        stop = {
          key: `stop-${action.bin.binId}`,
          binId: action.bin.binId,
          binName: action.bin.binName,
          doorName: action.bin.doorName,
          storage: action.bin.storage,
          actions: []
        };
        byBin.set(action.bin.binId, stop);
      }
      stop.actions.push({
        kind: action.kind,
        productKey: action.productKey,
        productName: action.productName,
        productId: action.productId,
        quantity: action.quantity,
        unit: action.unit
      });
    });
    byBin.forEach(stop => {
      stop.actions.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'take' ? -1 : 1;
        return a.productName.localeCompare(b.productName);
      });
    });
    return Array.from(byBin.values());
  };

  const allTakes = Array.from(takeByBinProduct.values());
  const allPlaces = Array.from(placeByBinProduct.values());

  const cabinetTakes = allTakes.filter(a => a.bin.storage === 'cabinet');
  const cabinetPlaces = allPlaces.filter(a => a.bin.storage === 'cabinet');
  const fridgeTakes = allTakes.filter(a => a.bin.storage === 'fridge');
  const fridgePlaces = allPlaces.filter(a => a.bin.storage === 'fridge');

  // ── 3. Precedence between cabinet doors ────────────────────────────────────────────────────────
  //
  // A target can only be filled once its sources have been worked. That is the ONLY ordering the
  // physics imposes, because stock can be staged on the counter (§1) — without staging, every source
  // would have to be adjacent to its target and there would be nothing to optimize.
  //
  // Fridge doors take no part: R6 puts fridge takes at the very front and fridge placements at the very
  // end, which satisfies every precedence involving one automatically — a fridge source is worked
  // before all cabinet work, and a fridge target after all of it.
  const doorsOf = (binIds: Iterable<string>): string[] =>
    Array.from(
      new Set(
        Array.from(binIds)
          .map(binId => binIndex.get(binId))
          .filter((bin): bin is RouteBin => !!bin && bin.storage === 'cabinet')
          .map(bin => bin.doorName)
      )
    );

  const cabinetDoors = Array.from(
    new Set([...cabinetTakes, ...cabinetPlaces].map(a => a.bin.doorName))
  ).sort((a, b) => doorNumberOf(a) - doorNumberOf(b));

  // door -> doors that must come before it
  const rawEdges: Array<[string, string]> = [];
  cabinetPlaces.forEach(place => {
    const targetDoor = place.bin.doorName;
    doorsOf(sourceBinsByProduct.get(place.productKey) ?? []).forEach(sourceDoor => {
      if (sourceDoor !== targetDoor) rawEdges.push([sourceDoor, targetDoor]);
    });
  });

  // ── 4. Order the door visits ───────────────────────────────────────────────────────────────────
  //
  // Each door is one node, so each is visited once (R2). Where that is impossible — a cycle, e.g. door
  // A feeds a target behind B while B feeds a target behind A — the door with the highest number in the
  // cycle is split into a takes node and a places node, which breaks it because the takes node has no
  // precedence to wait for. Highest number rather than "best" because the choice must be deterministic
  // (R5); finding a genuinely minimum split is NP-hard and the real cabinets have at most eight doors.
  const splitDoors = new Set<string>();

  const buildGraph = () => {
    const nodes: DoorNode[] = [];
    cabinetDoors.forEach(doorName => {
      const hasTakes = cabinetTakes.some(a => a.bin.doorName === doorName);
      const hasPlaces = cabinetPlaces.some(a => a.bin.doorName === doorName);
      if (splitDoors.has(doorName)) {
        if (hasTakes) nodes.push({ doorName, part: 'take' });
        if (hasPlaces) nodes.push({ doorName, part: 'place' });
      } else if (hasTakes || hasPlaces) {
        nodes.push({ doorName, part: 'all' });
      }
    });

    const byKey = new Map<string, DoorNode>();
    nodes.forEach(node => byKey.set(nodeKey(node), node));

    // Which node an edge's ends attach to once a door is split: a source contributes from its takes,
    // and a target is filled by its places.
    const sourceNodeFor = (doorName: string): DoorNode | undefined =>
      byKey.get(`${doorName}#take`) ?? byKey.get(`${doorName}#all`);
    const targetNodeFor = (doorName: string): DoorNode | undefined =>
      byKey.get(`${doorName}#place`) ?? byKey.get(`${doorName}#all`);

    const incoming = new Map<string, Set<string>>();
    nodes.forEach(node => incoming.set(nodeKey(node), new Set()));

    rawEdges.forEach(([sourceDoor, targetDoor]) => {
      const from = sourceNodeFor(sourceDoor);
      const to = targetNodeFor(targetDoor);
      if (!from || !to || nodeKey(from) === nodeKey(to)) return;
      incoming.get(nodeKey(to))!.add(nodeKey(from));
    });

    // A split door's own takes must precede its own places.
    nodes.forEach(node => {
      if (node.part !== 'place') return;
      const takeNode = byKey.get(`${node.doorName}#take`);
      if (takeNode) incoming.get(nodeKey(node))!.add(nodeKey(takeNode));
    });

    return { nodes, byKey, incoming };
  };

  /** Kahn's algorithm, always taking the lowest door number among the ready nodes (R5). */
  const topoSort = (graph: ReturnType<typeof buildGraph>): DoorNode[] | null => {
    const remaining = new Map(Array.from(graph.incoming, ([key, deps]) => [key, new Set(deps)]));
    const ordered: DoorNode[] = [];

    while (remaining.size > 0) {
      const ready = Array.from(remaining.entries())
        .filter(([, deps]) => deps.size === 0)
        .map(([key]) => graph.byKey.get(key)!)
        .sort((a, b) => {
          const delta = doorNumberOf(a.doorName) - doorNumberOf(b.doorName);
          if (delta !== 0) return delta;
          // A door's takes visit before its places visit.
          if (a.part !== b.part) return a.part === 'take' ? -1 : 1;
          return 0;
        });

      if (ready.length === 0) return null; // cycle
      const next = ready[0];
      ordered.push(next);
      remaining.delete(nodeKey(next));
      remaining.forEach(deps => deps.delete(nodeKey(next)));
    }
    return ordered;
  };

  /** The doors still stuck once Kahn stalls: everything with unsatisfied dependencies left. */
  const stalledDoors = (graph: ReturnType<typeof buildGraph>): string[] => {
    const remaining = new Map(Array.from(graph.incoming, ([key, deps]) => [key, new Set(deps)]));
    let progressed = true;
    while (progressed) {
      progressed = false;
      Array.from(remaining.entries()).forEach(([key, deps]) => {
        if (deps.size === 0) {
          remaining.delete(key);
          remaining.forEach(other => other.delete(key));
          progressed = true;
        }
      });
    }
    return Array.from(
      new Set(Array.from(remaining.keys()).map(key => graph.byKey.get(key)!.doorName))
    );
  };

  let ordered: DoorNode[] | null = null;
  // Bounded by the number of doors: each pass splits one, and a fully split graph cannot cycle.
  for (let attempt = 0; attempt <= cabinetDoors.length; attempt++) {
    const graph = buildGraph();
    ordered = topoSort(graph);
    if (ordered) break;
    const stuck = stalledDoors(graph)
      .filter(doorName => !splitDoors.has(doorName))
      .sort((a, b) => doorNumberOf(b) - doorNumberOf(a));
    if (stuck.length === 0) break;
    splitDoors.add(stuck[0]);
  }
  if (!ordered) ordered = cabinetDoors.map(doorName => ({ doorName, part: 'all' as const }));

  // ── 5. Assemble ────────────────────────────────────────────────────────────────────────────────
  const visits: DoorVisit[] = [];
  const visitCountByDoor = new Map<string, number>();

  const pushVisit = (
    doorName: string,
    storage: StorageKind,
    purpose: DoorVisit['purpose'],
    stops: RouteStop[]
  ) => {
    if (stops.length === 0) return;
    const visitIndex = (visitCountByDoor.get(doorName) ?? 0) + 1;
    visitCountByDoor.set(doorName, visitIndex);
    visits.push({
      key: `${doorName}#${visitIndex}`,
      doorName,
      storage,
      visitIndex,
      purpose,
      stops: stops.sort(stopCompare)
    });
  };

  // R6: fridge takes first. They cost nothing and block nothing, so they must not sit between two stops
  // behind one cabinet door, which would read as an interruption without being one.
  buildStops(fridgeTakes)
    .sort(stopCompare)
    .forEach(stop => pushVisit(stop.doorName, 'fridge', 'take', [stop]));

  ordered.forEach(node => {
    const takes = node.part === 'place' ? [] : cabinetTakes.filter(a => a.bin.doorName === node.doorName);
    const places = node.part === 'take' ? [] : cabinetPlaces.filter(a => a.bin.doorName === node.doorName);
    if (takes.length === 0 && places.length === 0) return;

    // Takes before places across the whole visit, not just within a bin: a bin that receives stock
    // taken from another bin behind this same door has to be filled after that one is emptied.
    const takeStops = buildStops(takes).sort(stopCompare);
    const placeStops = buildStops(places).sort(stopCompare);

    // A bin that both gives and receives can usually be one stop — emptied then filled while it is lit,
    // which saves an illumination (R3). But only if the stock arriving is already in hand: if it comes
    // out of another bin behind THIS door, that take happens later in this visit, and merging would have
    // the operator fill a bin from stock they have not collected yet. Precedence is modelled between
    // doors (§4.2), so this is the one place it has to be checked within one.
    const takeBinIds = new Set(takeStops.map(stop => stop.binId));
    const arrivesFromThisVisit = (stop: RouteStop): boolean =>
      stop.actions.some(
        action =>
          action.kind === 'place' &&
          Array.from(sourceBinsByProduct.get(action.productKey) ?? []).some(
            sourceBinId => sourceBinId !== stop.binId && takeBinIds.has(sourceBinId)
          )
      );

    const merged: RouteStop[] = [];
    const placeByBin = new Map(placeStops.map(stop => [stop.binId, stop]));
    takeStops.forEach(stop => {
      const alsoPlaces = placeByBin.get(stop.binId);
      if (alsoPlaces && !arrivesFromThisVisit(alsoPlaces)) {
        stop.actions.push(...alsoPlaces.actions);
        placeByBin.delete(stop.binId);
      }
      merged.push(stop);
    });
    // Everything not merged goes after every take in the visit, so no bin is filled from stock that is
    // still in another bin behind this same door.
    placeByBin.forEach(stop => merged.push(stop));

    const purpose: DoorVisit['purpose'] =
      takes.length > 0 && places.length > 0 ? 'both' : takes.length > 0 ? 'take' : 'place';
    // Not re-sorted: the takes-then-places order above is the point, and stopCompare would undo it.
    const visitIndex = (visitCountByDoor.get(node.doorName) ?? 0) + 1;
    visitCountByDoor.set(node.doorName, visitIndex);
    visits.push({
      key: `${node.doorName}#${visitIndex}`,
      doorName: node.doorName,
      storage: 'cabinet',
      visitIndex,
      purpose,
      stops: merged
    });
  });

  // R6: fridge placements last.
  buildStops(fridgePlaces)
    .sort(stopCompare)
    .forEach(stop => pushVisit(stop.doorName, 'fridge', 'place', [stop]));

  const stops = visits.flatMap(visit => visit.stops);
  const cabinetDoorVisits = visits.filter(visit => visit.storage === 'cabinet').length;

  return {
    visits,
    stops,
    cabinetDoorVisits,
    doorTransitions: Math.max(0, cabinetDoorVisits - 1),
    splitDoors: Array.from(splitDoors).sort((a, b) => doorNumberOf(a) - doorNumberOf(b))
  };
}
