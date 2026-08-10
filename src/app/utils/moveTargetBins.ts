/**
 * Which bins may receive stock that is already in the operator's hands — the bin list behind
 * "Add Move To Bin" on the placement screen (step ④).
 *
 * This is a *second* place a Move To bin gets chosen; step ② is the first. The rules therefore are not
 * invented here, they are restated from there, which is the whole reason this is one function rather
 * than a filter written inline: a bin the pipeline would have refused at step ② must not become
 * acceptable just because the operator reached it by another door. Each refusal carries the sentence
 * that explains it, so a row can say why rather than being silently dropped — the same discipline the
 * search dropdown follows (§ "No hit is ever dropped for being spent").
 *
 * Deliberately import-free, like `utils/searchQuery.ts`: `scripts/verify-move-target-bins.mjs` runs it
 * under plain node. Everything it needs about a bin is passed in, including the two facts only the
 * Emergency Kit service can answer.
 */

export type MoveToBinCandidate = {
  binId: string;
  binName: string;
  doorName: string;
  /** True when the bin holds nothing — the same sense `BinCard`'s green stroke has. */
  isAvailable: boolean;
  /** How many product rows it already holds. Shown so the operator can judge what will fit. */
  productCount: number;
  /** Already stocks the identity being placed, so the arrival merges into that row rather than adding one. */
  alreadyStocksProduct: boolean;
  /** Behind the door the operator currently has open. */
  isCurrentDoor: boolean;
  /** Set when the bin cannot be used. `null` means it can. */
  blockedReason: string | null;
};

export type MoveToBinInput = {
  binId: string;
  binName: string;
  doorName: string;
  productCount: number;
  alreadyStocksProduct: boolean;
};

export type EligibilityContext = {
  /** Bins this move is taking stock OUT of. A bin cannot be both ends of one move. */
  sourceBinIds: string[];
  /** Bins already receiving this product in this move. */
  existingTargetBinIds: string[];
  /** Bins that restrict what inventory they accept. */
  restrictedBinIds: string[];
  /**
   * Whether the product being placed may go into one of those restricted bins. Resolved by the caller
   * from the one real domain rule, since only it knows the product's inventory type.
   */
  productAllowedInRestrictedBins: boolean;
  /** The door the operator has open right now, so its bins can be offered first. */
  currentDoorName?: string;
};

/**
 * A source bin of the *same* move. Step ② refuses this with a worded toast; the wording here is the
 * placement screen's equivalent, in the same voice.
 */
const SOURCE_BIN_REASON = 'You are moving stock out of this bin.';
const EXISTING_TARGET_REASON = 'Already a Move To bin for this product.';
const RESTRICTED_REASON = 'This bin only accepts Purchased stock.';

export function moveToBinCandidates(
  bins: MoveToBinInput[],
  context: EligibilityContext
): MoveToBinCandidate[] {
  const sourceBinIds = new Set(context.sourceBinIds);
  const existingTargetBinIds = new Set(context.existingTargetBinIds);
  const restrictedBinIds = new Set(context.restrictedBinIds);

  const candidates = bins.map<MoveToBinCandidate>(bin => {
    // Order matters only in that the operator gets one sentence, so it must be the most specific
    // truth about the bin. Being a source of this very move is the sharpest of the three: it is not
    // a property of the bin at all, it is a property of what they are doing.
    const blockedReason = sourceBinIds.has(bin.binId)
      ? SOURCE_BIN_REASON
      : existingTargetBinIds.has(bin.binId)
        ? EXISTING_TARGET_REASON
        : restrictedBinIds.has(bin.binId) && !context.productAllowedInRestrictedBins
          ? RESTRICTED_REASON
          : null;

    return {
      binId: bin.binId,
      binName: bin.binName,
      doorName: bin.doorName,
      isAvailable: bin.productCount === 0,
      productCount: bin.productCount,
      alreadyStocksProduct: bin.alreadyStocksProduct,
      isCurrentDoor: !!context.currentDoorName && bin.doorName === context.currentDoorName,
      blockedReason
    };
  });

  /**
   * Sorted for the decision actually being made, which is not the same one step ② makes.
   *
   * The door comes first, ahead of even availability: the operator is standing at an open door with
   * stock in their hands, and one door is open at a time. A bin behind another door is a legitimate
   * choice but it means closing this one and walking, so it cannot be what the list offers first.
   *
   * Then unusable bins sink, then empty ones rise — a bin with nothing in it is the one that can take
   * stock without a second thought, the same reasoning the search dropdown's ordering rests on. Stable
   * throughout, so bins that tie keep the cabinet's own order and the list still reads as a walk.
   */
  return candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => {
      const rank = (c: MoveToBinCandidate) =>
        (c.isCurrentDoor ? 0 : 1) * 4 + (c.blockedReason ? 2 : 0) + (c.isAvailable ? 0 : 1);
      const diff = rank(a.candidate) - rank(b.candidate);
      return diff !== 0 ? diff : a.index - b.index;
    })
    .map(entry => entry.candidate);
}

/** Just the ones that can actually be chosen — what a "nothing left to offer" check should ask. */
export function selectableMoveToBins(candidates: MoveToBinCandidate[]): MoveToBinCandidate[] {
  return candidates.filter(candidate => !candidate.blockedReason);
}

/**
 * The bins worth putting in front of someone holding stock they cannot put down.
 *
 * Every bin in the cabinet is a legal answer, and offering all of them is not: the seed has 132, so the
 * first version of this dialog was a 132-row scroll, which is not a choice so much as a search problem
 * the operator did not ask for.
 *
 * Two things earn a place:
 *
 * - **Every bin behind the door that is already open**, empty or not. This is where the operator is
 *   standing, one door opens at a time, and the stock is in their hands — anything here costs them
 *   nothing.
 * - **Empty bins behind other doors.** Reaching one means closing this door and walking, so it has to
 *   be worth the trip: a bin with nothing in it is the one that can take the rest without a second
 *   thought. That is the same reason the search dropdown sorts available bins first.
 *
 * What that leaves out is a stocked bin behind a closed door — a legal choice, and the one that
 * combines a walk with a judgement about what will fit beside what is already there. `hiddenCount`
 * reports how many, because a list that quietly drops a bin the operator can see in the cabinet reads
 * as the list being wrong rather than as being narrowed.
 *
 * A refused bin is not listed on its own account: it earns its row by being on the open door or empty,
 * the same as any other, and then explains itself. The source bin the operator is emptying is the one
 * that matters here — it is on the open door by definition, so it is always in the list saying why it
 * cannot be used. A restricted bin three doors away is not a question anybody is asking.
 */
export function reachableMoveToBins(
  candidates: MoveToBinCandidate[]
): { listed: MoveToBinCandidate[]; hiddenCount: number } {
  const listed = candidates.filter(candidate => candidate.isCurrentDoor || candidate.isAvailable);
  return { listed, hiddenCount: candidates.length - listed.length };
}
