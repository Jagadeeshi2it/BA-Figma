import React from 'react';
import { SEARCH_HIGHLIGHT_COLOR } from '../utils/textHighlight';

/** The green the availability filter uses everywhere — the door badge here, `border-green-500` on the
 *  bin cards behind the door. One value, so the control, the door and the bin cannot drift apart. */
export const AVAILABLE_BIN_INDICATOR_COLOR = '#00C951';

/**
 * The two indicators a door tile can carry, in one place.
 *
 * Four tiles draw them — the three shapes in CabinetComponent and the fridge in
 * VirtualCabinetComponent — and each used to hand-roll the same 14×6 SVG with two hard-coded circles
 * at hard-coded offsets. That is how the four came to sit at four different distances from their tile's
 * edge, and it is why the availability indicator could not gain a number without being changed in four
 * places.
 *
 * Both indicators are 6px dots. The availability one carried its COUNT for a day — a 16px badge with a
 * number in it — and the number was dropped at the operator's request: at cabinet level the question is
 * which doors to walk to, and a door with room is a door with room. The count is still threaded in, and
 * still stated, but as this dot's accessible name rather than on its face — a bare dot is
 * colour-and-shape with nothing at all for a screen reader, which is the half of the problem the number
 * was not needed to solve.
 *
 * The size difference is the reason the badge is not simply parked behind a flag: at 6px the dot sits
 * inside the tile's top-right corner, while the badge had to hang off the corner to clear the "Door"
 * label on a ~44px tile. Restoring it means restoring that offset too.
 */
export default function DoorIndicators({
  showSearchDot,
  availableBinCount,
}: {
  showSearchDot: boolean;
  /** Free bins behind this door, or 0 to draw nothing — the caller applies the filter's own gating. */
  availableBinCount: number;
}) {
  const showAvailable = availableBinCount > 0;
  if (!showSearchDot && !showAvailable) return null;

  return (
    // Right-anchored on every tile. The four hand-rolled versions were each positioned from the left
    // with a literal offset derived from that tile's width, so a tile that changed width moved its
    // indicators off the corner.
    <div className="absolute top-[3px] right-[4px] flex items-center gap-1 pointer-events-none">
      {showSearchDot && (
        <span
          className="block w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: SEARCH_HIGHLIGHT_COLOR }}
        />
      )}
      {showAvailable && (
        <span
          role="img"
          aria-label={`${availableBinCount} ${availableBinCount === 1 ? 'bin' : 'bins'} available`}
          className="block w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: AVAILABLE_BIN_INDICATOR_COLOR }}
        />
      )}
    </div>
  );
}
