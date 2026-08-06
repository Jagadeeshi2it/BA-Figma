/**
 * How fast the demo moves. One place, because pace is a single judgement about the whole
 * experience rather than a set of unrelated numbers — and because tuning it meant hunting for
 * magic numbers across three files.
 *
 * The bias is deliberately slow. A demo that keeps up with someone who already knows the app is
 * useless to the person it is for: they are reading an interface they have never seen, and every
 * click changes something they then have to find. The cost of being too slow is boredom; the cost
 * of being too fast is that the walkthrough teaches nothing.
 */
export const PACE = {
  /** Cursor travel. Scaled by distance, so a hop inside a panel is not paced like a trip across the cabinet. */
  cursorMinMs: 550,
  cursorMaxMs: 1500,
  cursorPerPx: 1.15,

  /** After arriving, before pressing. A hand lands on a control and then presses; it does not do both at once. */
  approachMs: 280,
  /** How long the press reads as held. */
  pressMs: 180,

  /** Per character. Fast enough not to drag, slow enough that the results list is seen narrowing. */
  typeCharMs: 85,

  /** Held after a step, before the next begins. This is the time to notice what the step changed. */
  afterClickMs: 1100,
  afterAwaitMs: 900,
  afterNoteMs: 1600,
} as const;
