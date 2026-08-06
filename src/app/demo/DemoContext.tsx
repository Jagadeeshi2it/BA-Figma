import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DemoRunToken, DemoScenario, DemoStep } from './types';
import { demoScenarios, findScenario } from './scenarios';
import { PACE } from './pace';
import {
  centreOf,
  dispatchRealClick,
  resolveTarget,
  scrollTargetIntoView,
  sleep,
  typeInto,
  waitForTarget,
} from './dom';

/**
 * Demo Mode's state machine and the loop that walks a scenario.
 *
 * The provider wraps App but App is not a consumer of it, and the `children` element is created
 * once in main.tsx — so React bails out of re-rendering the app when this state changes. That is
 * what makes it safe for the runner to update the position between every act; nothing but the
 * overlay re-renders.
 *
 * The cursor is the exception and is deliberately NOT React state: it moves at frame rate, so the
 * runner writes its transform straight to the DOM node through `cursorRef`.
 *
 * **The walk is a position, not a for-loop.** `positionRef` counts completed steps and the loop
 * reads it fresh each pass, which is what lets Previous move it *backwards* between steps. A
 * for-loop over indices could only ever go forward.
 */

export type DemoStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed';

interface DemoContextValue {
  status: DemoStatus;
  scenario: DemoScenario | null;
  scenarios: DemoScenario[];
  /** Steps completed, 0…stepCount. The step being performed is `steps[position]`. */
  position: number;
  stepCount: number;
  stepLabel: string;
  failure: string | null;
  pressed: boolean;
  cursorRef: React.MutableRefObject<HTMLDivElement | null>;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  start: (scenarioId: string) => void;
  play: () => void;
  pause: () => void;
  nextStep: () => void;
  previousStep: () => void;
  canStepBack: boolean;
  canStepForward: boolean;
  restart: () => void;
  exit: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}

/** The scenario to auto-run on load. See `start` for why entering Demo Mode goes through the URL. */
const DEMO_PARAM = 'demo';
/** How many steps to replay before stopping. Only used by the Previous fallback — see `stepBack`. */
const STEP_PARAM = 'step';

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Where the cursor waits before its first move — off the bottom edge, so it glides into frame. */
const parkingSpot = () => ({ x: window.innerWidth / 2, y: window.innerHeight + 60 });

/**
 * How to put `step` back, or null if it cannot be put back through the UI.
 *
 * `note` and `await` change nothing, so they reverse for free without having to say so.
 */
function reverseOf(step: DemoStep): DemoStep[] | null {
  if (step.reverse) return step.reverse;
  return step.kind === 'note' || step.kind === 'await' ? [] : null;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [position, setPosition] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorPos = useRef(parkingSpot());
  const tokenRef = useRef<DemoRunToken | null>(null);
  /** Steps completed. The loop's only notion of where it is, and the thing Previous decrements. */
  const positionRef = useRef(0);
  // Read by the inter-step gate. Refs rather than the status state because the loop is a plain
  // async function — it cannot see a re-render, only what the refs hold when it next looks.
  const pausedRef = useRef(false);
  const stepOnceRef = useRef(false);
  const stepBackRef = useRef(false);
  // Set only when the tab going into the background paused the walk, so returning to the tab does
  // not resume a demo the viewer paused deliberately.
  const autoPausedRef = useRef(false);

  const writeCursor = useCallback((x: number, y: number) => {
    cursorPos.current = { x, y };
    const el = cursorRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }, []);

  /**
   * Glide, don't teleport. Duration scales with distance so a short hop across a panel does not
   * take as long as a trip across the cabinet, and the easing is the point of the whole thing —
   * a linear cursor reads as a machine, an eased one reads as a hand.
   *
   * `fast` skips it entirely: that is the replay pass rebuilding state for the Previous fallback,
   * and nobody is meant to watch it.
   */
  const moveCursorTo = useCallback(
    (x: number, y: number, token: DemoRunToken, fast: boolean) =>
      new Promise<void>(resolve => {
        const from = cursorPos.current;
        const distance = Math.hypot(x - from.x, y - from.y);
        // Nothing to animate in a tab nobody is looking at, and rAF would not run there anyway.
        if (fast || distance < 1 || document.hidden) {
          writeCursor(x, y);
          resolve();
          return;
        }
        const duration = Math.min(
          PACE.cursorMaxMs,
          Math.max(PACE.cursorMinMs, distance * PACE.cursorPerPx)
        );
        const started = performance.now();
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          resolve();
        };
        // rAF stops in a backgrounded tab, and the tab can be backgrounded mid-glide. Without this
        // the promise never settles and the whole walk hangs on a cursor move — the most confusing
        // possible failure, since the app underneath looks perfectly healthy.
        const watchdog = window.setTimeout(() => {
          writeCursor(x, y);
          finish();
        }, duration + 500);
        const frame = (now: number) => {
          if (token.cancelled) {
            finish();
            return;
          }
          const t = Math.min(1, (now - started) / duration);
          const eased = easeInOutCubic(t);
          writeCursor(from.x + (x - from.x) * eased, from.y + (y - from.y) * eased);
          if (t < 1) requestAnimationFrame(frame);
          else finish();
        };
        requestAnimationFrame(frame);
      }),
    [writeCursor]
  );

  const runStep = useCallback(
    async (step: DemoStep, token: DemoRunToken, fast: boolean): Promise<boolean> => {
      const settle = fast ? 0 : step.settleMs;

      if (step.kind === 'note') {
        await sleep(settle ?? PACE.afterNoteMs, token);
        return true;
      }

      if (!step.target) return true;

      const el = await waitForTarget(step.target, token, 8000);
      if (token.cancelled) return false;
      if (!el) {
        setFailure(`Step "${step.label}" could not find what it needed.`);
        setStatus('failed');
        return false;
      }

      await scrollTargetIntoView(el, token);
      if (token.cancelled) return false;

      // Re-resolve after the scroll. A React re-render during the settle can replace the node, and
      // clicking a detached element is a click that silently does nothing.
      const live = resolveTarget(step.target) ?? el;
      const { x, y } = centreOf(live);
      await moveCursorTo(x, y, token, fast);
      if (token.cancelled) return false;

      if (step.kind === 'await') {
        await sleep(settle ?? PACE.afterAwaitMs, token);
        return true;
      }

      // Arrive, then act. The pause between landing on a control and pressing it is most of what
      // makes the cursor read as a hand rather than a script.
      await sleep(fast ? 0 : PACE.approachMs, token);
      if (token.cancelled) return false;

      if (step.kind === 'type') {
        const input = live as HTMLInputElement;
        setPressed(true);
        dispatchRealClick(input, x, y);
        await sleep(fast ? 0 : PACE.pressMs, token);
        setPressed(false);
        await typeInto(input, step.text ?? '', token, fast ? 0 : PACE.typeCharMs);
        await sleep(settle ?? PACE.afterClickMs, token);
        return true;
      }

      // click
      setPressed(true);
      await sleep(fast ? 0 : PACE.pressMs, token);
      dispatchRealClick(live, x, y);
      await sleep(fast ? 0 : PACE.pressMs, token);
      setPressed(false);
      await sleep(settle ?? PACE.afterClickMs, token);
      return true;
    },
    [moveCursorTo]
  );

  const advanceTo = useCallback((next: number) => {
    positionRef.current = next;
    setPosition(next);
  }, []);

  /**
   * Entering a scenario reloads the page with `?demo=<id>`.
   *
   * Not a flourish — a necessity. Inventory lives in React state seeded from a static file and
   * nothing persists, so a reload is the only thing that guarantees the preconditions a scenario
   * assumes: this one needs SOLU-CORTEF to still be unallocated and a bin to still be empty, and
   * both stop being true the moment anyone (including a previous run of this same demo) does the
   * thing it demonstrates. The palette says the current session will be discarded.
   */
  const start = useCallback((scenarioId: string, replay?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set(DEMO_PARAM, scenarioId);
    if (replay && replay > 0) url.searchParams.set(STEP_PARAM, String(replay));
    else url.searchParams.delete(STEP_PARAM);
    window.location.replace(url.toString());
  }, []);

  /**
   * Undo the last completed step, in place.
   *
   * Each step declares how to reverse itself (`DemoStep.reverse`) and the reverse is performed like
   * any other step — cursor, click, settle — so stepping back looks like the operator changing
   * their mind rather than the screen jumping. Position moves back by one and the walk stays
   * paused, so Next re-runs the step just undone.
   *
   * A step with no reverse cannot be undone through the UI: this app has no undo, and nothing
   * outside `useInventoryState` can rewind it. Allocating is the example — there is no path from
   * the tray that un-allocates. Those fall back to reloading and replaying, which is correct but
   * visibly a rebuild, and is why every step that CAN declare a reverse should.
   */
  const stepBack = useCallback(
    async (toRun: DemoScenario, token: DemoRunToken): Promise<boolean> => {
      const undoing = positionRef.current - 1;
      if (undoing < 0) return true;

      const reverse = reverseOf(toRun.steps[undoing]);
      if (!reverse) {
        start(toRun.id, undoing);
        return false;
      }

      for (const step of reverse) {
        const ok = await runStep(step, token, false);
        if (!ok || token.cancelled) return false;
      }

      advanceTo(undoing);
      pausedRef.current = true;
      setStatus('paused');
      return true;
    },
    [advanceTo, runStep, start]
  );

  const runScenario = useCallback(
    async (toRun: DemoScenario, replay = 0) => {
      // Cancel anything already walking before taking over, or two loops drive one cursor.
      if (tokenRef.current) tokenRef.current.cancelled = true;
      const token: DemoRunToken = { cancelled: false };
      tokenRef.current = token;

      pausedRef.current = false;
      stepOnceRef.current = false;
      stepBackRef.current = false;
      setScenario(toRun);
      setFailure(null);
      advanceTo(0);
      setStatus('running');
      writeCursor(parkingSpot().x, parkingSpot().y);

      // The Previous fallback's rebuild: everything up to `replay`, with no animation and no
      // settles, then stop where the viewer asked to be.
      for (let i = 0; i < replay; i++) {
        const ok = await runStep(toRun.steps[i], token, true);
        if (!ok || token.cancelled) return;
        advanceTo(i + 1);
      }
      if (replay > 0) {
        pausedRef.current = true;
        setStatus('paused');
      }

      for (;;) {
        // The gate. Holds while paused, and releases for one step when Next or Previous asks.
        // Gating BETWEEN steps rather than inside one is what makes pausing safe: a pause never
        // leaves half an interaction done, and resuming can never re-run a click that landed.
        while (
          (pausedRef.current || positionRef.current >= toRun.steps.length) &&
          !stepOnceRef.current &&
          !stepBackRef.current &&
          !token.cancelled
        ) {
          await sleep(80, token);
        }
        if (token.cancelled) return;

        if (stepBackRef.current) {
          stepBackRef.current = false;
          stepOnceRef.current = false;
          const carryOn = await stepBack(toRun, token);
          if (!carryOn || token.cancelled) return;
          continue;
        }

        stepOnceRef.current = false;

        const i = positionRef.current;
        if (i >= toRun.steps.length) continue;
        const ok = await runStep(toRun.steps[i], token, false);
        if (!ok || token.cancelled) return;
        advanceTo(i + 1);

        // The walk is over but the loop is not: parking it in the gate rather than returning is
        // what keeps Previous working from the final state, instead of dead-ending the viewer on
        // the last screen with nothing but Restart.
        if (positionRef.current >= toRun.steps.length) {
          pausedRef.current = true;
          setStatus('finished');
        }
      }
    },
    [advanceTo, runStep, stepBack, writeCursor]
  );

  const play = useCallback(() => {
    autoPausedRef.current = false;
    pausedRef.current = false;
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setStatus('paused');
  }, []);

  /** One step, then stop again. Pauses first, so it also works as "pause and advance" while playing. */
  const nextStep = useCallback(() => {
    pausedRef.current = true;
    stepOnceRef.current = true;
    setStatus('paused');
  }, []);

  const previousStep = useCallback(() => {
    pausedRef.current = true;
    stepBackRef.current = true;
    setStatus('paused');
  }, []);

  const restart = useCallback(() => {
    if (scenario) start(scenario.id);
  }, [scenario, start]);

  /**
   * Stop the walk and hand the app back, in the state the demo left it in. Deliberately not a
   * reload: the operator has just watched something happen and the obvious next move is to poke at
   * the result. The URL parameters go, though, or a refresh would silently restart the demo.
   */
  const exit = useCallback(() => {
    if (tokenRef.current) tokenRef.current.cancelled = true;
    pausedRef.current = false;
    stepOnceRef.current = false;
    stepBackRef.current = false;
    setStatus('idle');
    setScenario(null);
    setFailure(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has(DEMO_PARAM) || url.searchParams.has(STEP_PARAM)) {
      url.searchParams.delete(DEMO_PARAM);
      url.searchParams.delete(STEP_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  /**
   * Hold the walk while the tab is in the background, and pick it up again on return.
   *
   * Not an optimisation — a demo that plays on while nobody is watching means the viewer comes
   * back to a finished screen and no idea what happened. The auto flag keeps this from overriding
   * a deliberate pause: coming back to a tab you paused on purpose should leave it paused.
   */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (status === 'running') {
          autoPausedRef.current = true;
          pause();
        }
      } else if (autoPausedRef.current) {
        autoPausedRef.current = false;
        play();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [status, pause, play]);

  // Pick up ?demo=<id> on load. Waits for the app's own chrome to exist first: on a cold load the
  // first step's target is not mounted yet, and a scenario that begins by failing to find the
  // header would be indistinguishable from a broken anchor.
  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const toRun = findScenario(params.get(DEMO_PARAM));
    if (!toRun) return;
    const replay = Math.max(
      0,
      Math.min(toRun.steps.length, Number(params.get(STEP_PARAM) ?? 0) || 0)
    );
    let cancelledByUnmount = false;
    const token: DemoRunToken = { cancelled: false };
    (async () => {
      const ready = await waitForTarget('[data-demo="workflow-trigger"]', token, 10000);
      if (cancelledByUnmount) return;
      if (!ready) {
        setScenario(toRun);
        setFailure('The app did not finish loading in time to start the demo.');
        setStatus('failed');
        return;
      }
      await sleep(400, token);
      if (cancelledByUnmount) return;
      runScenario(toRun, replay);
    })();
    return () => {
      cancelledByUnmount = true;
      token.cancelled = true;
    };
  }, [runScenario]);

  // "/" opens the palette from anywhere — except while typing, where "/" is just a character. The
  // app's own search box is the reason that check is not optional.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
        return;
      }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setPaletteOpen(open => !open);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  const stepCount = scenario?.steps.length ?? 0;
  const walking = status === 'running' || status === 'paused' || status === 'finished';
  // The step being performed, or the one Next will perform. Derived rather than stored, so the
  // name, the counter and the walk cannot disagree about where it is.
  const stepLabel = scenario?.steps[Math.min(position, stepCount - 1)]?.label ?? '';

  const value = useMemo<DemoContextValue>(
    () => ({
      status,
      scenario,
      scenarios: demoScenarios,
      position,
      stepCount,
      stepLabel,
      failure,
      pressed,
      cursorRef,
      paletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      start,
      play,
      pause,
      nextStep,
      previousStep,
      canStepBack: walking && position > 0,
      canStepForward: walking && position < stepCount,
      restart,
      exit,
    }),
    [
      status,
      walking,
      scenario,
      position,
      stepCount,
      stepLabel,
      failure,
      pressed,
      paletteOpen,
      start,
      play,
      pause,
      nextStep,
      previousStep,
      restart,
      exit,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
