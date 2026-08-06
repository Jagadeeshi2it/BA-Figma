import React from 'react';
import { toast } from 'sonner@2.0.3';
import { Unlock } from 'lucide-react';
import { DoorUnlockedToast } from './ui/sonner-1';
import { isFridgeDoor } from '../utils/doorUtils';
import { CabinetAccess } from '../hooks/useCabinetAccess';

/**
 * Manual "Unlock Door", beside the product name on both halves of step ④.
 *
 * Step ④ already unlocks each door on arrival, from an effect. This is the recovery path for the case
 * that effect cannot cover: the app believes it sent the unlock and the hardware did not open. Without
 * it the operator is stuck at a door with no way to ask again short of abandoning the move — and
 * cancelling is refused by then anyway (CANNOT_CANCEL_REASON), so there is no way out at all.
 *
 * One component rather than a copy on each screen: the take half and the place half must not drift on
 * something the operator reaches for when the cabinet is already misbehaving.
 */
interface UnlockDoorButtonProps {
  /** The door this screen's current bin sits behind. */
  doorName?: string | null;
  cabinetAccess: CabinetAccess;
}

// Repeated taps replace rather than stack — an operator whose door did not open will press this more
// than once, and four identical toasts would bury the one that matters. Its own id, not the arrival
// effect's: that one dismisses its toast by captured id on cleanup, and sharing would let a manual tap
// be cancelled by a step change.
const MANUAL_UNLOCK_TOAST_ID = 'manual-door-unlock';

export default function UnlockDoorButton({ doorName, cabinetAccess }: UnlockDoorButtonProps) {
  // A fridge has no lock (see useCabinetAccess), so there is nothing here to offer. Better absent than
  // present and inert — an unlock control that cannot unlock is the "silently dead button" this app
  // keeps closing off elsewhere.
  if (!doorName || isFridgeDoor(doorName)) return null;

  const handleUnlock = () => {
    const { locked, unlocked } = cabinetAccess.requestDoor(doorName);
    // Announced even when requestDoor reports no transition. It is idempotent, so asking for the door
    // already open returns `unlocked: null` — and that is precisely the case this button exists for.
    // Staying silent there would make the one situation it was built for look like a broken control.
    toast.custom(
      t => (
        <DoorUnlockedToast
          doorName={unlocked ?? doorName}
          lockedDoor={locked}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      { id: MANUAL_UNLOCK_TOAST_ID, duration: 4000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleUnlock}
      // Secondary, per the app's convention: white with the primary's blue. h-8 to sit against a 16px
      // product name without setting the header's height.
      className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-white text-[#095192] border border-[#095192] text-[14px] leading-[20px] whitespace-nowrap cursor-pointer transition-colors hover:bg-[#F1F6FA]"
    >
      <Unlock className="w-3.5 h-3.5" />
      Unlock Door
    </button>
  );
}
