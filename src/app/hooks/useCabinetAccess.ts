import { useCallback, useMemo, useState } from 'react';
import { isFridgeDoor } from '../utils/doorUtils';
import { nextDoorTransition } from '../utils/cabinetAccess';

/**
 * Which cabinet door is open — at most one, ever.
 *
 * See STEP4-GUIDANCE.md §1: only one door at the station can be unlocked at a time, and the constraint
 * is global, not per cabinet. If Door 1 is open, Door 8 cannot be, even though they are different
 * cabinets.
 *
 * This replaces an accumulating `unlockedDoors: Set<string>` that App used to hold. That set was really
 * "doors already announced by a toast" — nothing was ever removed from it, so after visiting two doors
 * the app believed both were unlocked, which the hardware cannot do. The shape here makes the constraint
 * unbreakable rather than merely respected: one door name, or none.
 *
 * Fridges (Doors 9–14) have no lock, so they are never `openDoor` and never need granting. Asking for
 * one locks whatever cabinet door is open, because the operator is walking away from it — the route puts
 * fridge stops at its ends precisely so this never interrupts a cabinet visit (§R6).
 */
export interface CabinetAccess {
  /** The single unlocked cabinet door, or null when everything is locked. Never a fridge. */
  openDoor: string | null;
  isOpen: (doorName?: string | null) => boolean;
  /**
   * Ask for access to a door, locking whatever was open first. Idempotent — asking for the door that is
   * already open changes nothing, so it is safe to call from an effect on every render pass.
   *
   * Returns the transition it performed, so the caller can announce it without re-deriving it from
   * state that has not landed yet. `locked` is the door that had to be given up; null when nothing was
   * open. `unlocked` is null when no unlock was needed (already open, or a fridge).
   */
  requestDoor: (doorName?: string | null) => { locked: string | null; unlocked: string | null };
  /** Lock up. Called when a flow ends, so the next one cannot inherit an open door. */
  lockAll: () => void;
}

export function useCabinetAccess(): CabinetAccess {
  const [openDoor, setOpenDoor] = useState<string | null>(null);

  const isOpen = useCallback(
    (doorName?: string | null) => !!doorName && doorName === openDoor,
    [openDoor]
  );

  // The decision lives in cabinetAccess.ts as a pure function; this only applies its result to state,
  // so the one-door rule can be verified without React.
  const requestDoor = useCallback(
    (doorName?: string | null) => {
      const transition = nextDoorTransition(
        openDoor,
        doorName,
        !!doorName && isFridgeDoor(doorName)
      );
      if (transition.openDoor !== openDoor) setOpenDoor(transition.openDoor);
      return { locked: transition.locked, unlocked: transition.unlocked };
    },
    [openDoor]
  );

  const lockAll = useCallback(() => setOpenDoor(null), []);

  return useMemo(
    () => ({ openDoor, isOpen, requestDoor, lockAll }),
    [openDoor, isOpen, requestDoor, lockAll]
  );
}
