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
   * What this step is, in a few words. Named, not narrated: it appears only inside the demo control
   * panel and only while that panel is expanded — nothing is ever drawn over the app itself.
   *
   * This started out as a caption pinned beside the cursor and was removed. A walkthrough that
   * explains every click in a black box floating over the screen stops being a demonstration of the
   * app and becomes a slideshow about it — and it hides the very interface it is meant to be
   * showing off. The cursor, the ring and the app's own state changes carry the meaning now.
   */
  label: string;
  target?: DemoTarget;
  /** `type` only. */
  text?: string;
  /**
   * Held after the step completes, before the next one starts. The default suits an ordinary
   * click; raise it where the operator needs time to read what just happened on screen.
   */
  settleMs?: number;
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
