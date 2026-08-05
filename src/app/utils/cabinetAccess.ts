/**
 * The door-access transition, as a pure function.
 *
 * Split out of `useCabinetAccess` so the one-door-at-a-time rule (STEP4-GUIDANCE.md §1) can be verified
 * without React — it is the constraint the whole step ④ route is built on, and "at most one door is open"
 * is exactly the kind of invariant that is easy to state and easy to break later. Import-free for the
 * same reason `moveRoute.ts` is: it can then be loaded straight into Node (see
 * `scripts/verify-move-route.mjs` for how).
 */

export interface DoorTransition {
  /** The door that had to be given up. null when nothing was open. */
  locked: string | null;
  /** The door now unlocked. null when no unlock was needed — already open, or a fridge. */
  unlocked: string | null;
  /** The resulting open door. Never a fridge, and never more than one by construction. */
  openDoor: string | null;
}

/**
 * @param openDoor   the currently unlocked cabinet door, or null
 * @param requested  the door the operator needs to reach next
 * @param isFridge   whether `requested` is unconstrained storage (no lock, no bin lighting)
 */
export function nextDoorTransition(
  openDoor: string | null,
  requested: string | null | undefined,
  isFridge: boolean
): DoorTransition {
  if (!requested) return { locked: null, unlocked: null, openDoor };

  // A fridge needs no unlock. But the operator is walking away from the cabinet to reach it, so nothing
  // should stay open behind them — and the route puts fridge stops at its ends (R6) precisely so this
  // never interrupts a cabinet visit.
  if (isFridge) return { locked: openDoor, unlocked: null, openDoor: null };

  // Idempotent: asking for the door already open is not a transition, so it must not be announced as
  // one. Effects call this on every render pass, and a second bin behind the same door is the common
  // case — the door did not change, and saying it did would imply it had been closed and reopened.
  if (requested === openDoor) return { locked: null, unlocked: null, openDoor };

  return { locked: openDoor, unlocked: requested, openDoor: requested };
}
