/**
 * Demo Mode's vocabulary.
 *
 * A scenario is data. The runner knows how to click, type and wait; it knows nothing about
 * allocation, bins or products, and adding a second scenario must never mean editing it. That is
 * why a step's target can be a function as well as a selector — a scenario that has to find "the
 * first empty bin on this door" resolves that itself rather than teaching the runner about bins.
 */

/**
 * What a step acts on. A selector string covers the fixed anchors (`[data-demo="..."]`); the
 * function form is for targets only the scenario can identify, and is re-evaluated at the moment
 * the step runs — never at module load, when none of the UI exists yet.
 */
export type DemoTarget = string | (() => Element | null);

export type DemoStepKind =
  // Move the cursor to the target and click it, for real.
  | 'click'
  // Move to the target, focus it, and type `text` a character at a time.
  | 'type'
  // Wait for the target to appear without touching it. Used where the app needs a beat and the
  // next step's target is not the thing being waited on.
  | 'await'
  // A pause. No cursor movement, no interaction — the opening and closing beats, which give the
  // viewer a moment to take in the screen before anything moves and to see the result afterwards.
  | 'note';

export interface DemoStep {
  kind: DemoStepKind;
  /**
   * What this step is, in a few words. Named, not narrated: it is read in the control panel's
   * tooltip and in the message shown if the step cannot find its target. Nothing is ever drawn over
   * the app itself.
   *
   * This started out as a caption pinned beside the cursor and was removed. A walkthrough that
   * explains every click in a black box floating over the screen stops being a demonstration of the
   * app and becomes a slideshow about it — and it hides the very interface it is meant to be
   * showing off. The cursor and the app's own state changes carry the meaning now.
   */
  label: string;
  target?: DemoTarget;
  /**
   * `type` only. A function is resolved at the moment the step runs, for the same reason DemoTarget
   * allows one: text a scenario can only know at runtime. A walkthrough that resolves "a bin with
   * room" from the DOM has to be able to type THAT bin's name, and hard-coding one would rot with
   * the seed exactly as a hard-coded bin id would.
   */
  text?: string | (() => string);
  /**
   * Held after the step completes, before the next one starts. Defaults come from `PACE`; raise it
   * where the viewer needs longer to find what just changed on screen.
   */
  settleMs?: number;
  /**
   * How to put the app back the way it was before this step ran — what Previous Step performs.
   *
   * The app has no undo, and nothing outside `useInventoryState` can rewind it, so a step that
   * changes state has to say how to change it back. Most can, because most of what a demo does is
   * a toggle: ticking a product un-ticks, tapping a bin un-taps, a typed query clears. Reversing is
   * performed like any other step, cursor and all, so the viewer watches it happen.
   *
   *   `[]`        — this step changed nothing that needs putting back.
   *   `[steps]`   — run these, in order, to undo it.
   *   *absent*    — this step cannot be undone through the UI. Previous falls back to reloading and
   *                 replaying the earlier steps at speed, which is correct but visibly a rebuild.
   *
   * `note` and `await` steps are reversible for free and need nothing declared.
   */
  reverse?: DemoStep[];
}

export interface DemoScenario {
  /** Stable — it goes in the URL, and a bookmarked demo link should keep working. */
  id: string;
  title: string;
  /** One line, shown in the palette. Says what the scenario demonstrates, not how. */
  description: string;
  steps: DemoStep[];
}

/**
 * Cooperative cancellation. Every await inside the runner checks it, so exiting or restarting
 * stops the walk at the next instant rather than after the current animation plays out.
 */
export interface DemoRunToken {
  cancelled: boolean;
}
