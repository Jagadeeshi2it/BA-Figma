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
 * The availability indicator states HOW MANY bins are free behind the door, rather than only that some
 * are. A bare dot is colour-and-shape with no text alternative, so it said nothing to a screen reader
 * and nothing about size to anyone else — and "which door has room for these four products" is a
 * question the operator actually has, answered previously only by opening doors one at a time.
 *
 * The search dot stays a dot: "this door holds a match" has no number worth printing, since the count
 * that matters there is per product, not per door.
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
    //
    // Sitting ON the corner rather than inside it: the tiles are ~44px wide and their "Door" label is
    // centred across nearly all of that, so a 16px badge placed inside the top-right lands on the last
    // letter of the word. The 6px dot this replaced was small enough to fit; a badge with a number in
    // it is not. Half-outside is also the shape the badge already reads as. It stays within the
    // cabinet's own 8px padding, so it never escapes the cabinet card.
    <div className="absolute -top-[6px] -right-[6px] flex items-center gap-1 pointer-events-none">
      {showSearchDot && (
        <span
          className="block w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: SEARCH_HIGHLIGHT_COLOR }}
        />
      )}
      {showAvailable && (
        // min-w rather than a fixed width: a two-digit count must widen the badge into a pill rather
        // than overflow a circle. px-[3px] keeps the digits off the rounding at 10 and above.
        <span
          role="img"
          aria-label={`${availableBinCount} ${availableBinCount === 1 ? 'bin' : 'bins'} available`}
          className="flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full text-white text-[10px] leading-none font-semibold tabular-nums"
          style={{ backgroundColor: AVAILABLE_BIN_INDICATOR_COLOR }}
        >
          {availableBinCount}
        </span>
      )}
    </div>
  );
}
