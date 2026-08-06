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
 * what makes it safe for the runner to update the step between every act; nothing but the overlay
 * re-renders.
 *
 * The cursor is the exception and is deliberately NOT React state: it moves at frame rate, so the
 * runner writes its transform straight to the DOM node through `cursorRef`.
 */

export type DemoStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed';

export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface DemoContextValue {
  status: DemoStatus;
  scenario: DemoScenario | null;
  scenarios: DemoScenario[];
  stepIndex: number;
  stepCount: number;
  stepLabel: string;
  failure: string | null;
  highlight: HighlightRect | null;
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
/** Which step to arrive at. See `previousStep` for why stepping back is a URL round trip. */
const STEP_PARAM = 'step';

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Where the cursor waits before its first move — off the bottom edge, so it glides into frame. */
const parkingSpot = () => ({ x: window.innerWidth / 2, y: window.innerHeight + 60 });

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);
  const [pressed, setPressed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorPos = useRef(parkingSpot());
  const tokenRef = useRef<DemoRunToken | null>(null);
  // Read by the inter-step gate. A ref rather than the status state because the loop is a plain
  // async function — it cannot see a re-render, only what the ref holds when it next looks.
  const pausedRef = useRef(false);
  // Set by Next Step: releases the gate for exactly one step, then the walk pauses again.
  const stepOnceRef = useRef(false);
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
   * `fast` skips it entirely: that is the replay pass rebuilding state before a Previous Step, and
   * nobody is meant to watch it.
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
        const duration = Math.min(1000, Math.max(380, distance * 0.85));
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

  /**
   * Ring the target before touching it, so the eye is already there when the click lands. Drawn
   * from the live rect rather than a stored one: the shelves scroll, panels animate in, and a ring
   * pinned to a stale box is worse than none.
   *
   * This is the only thing Demo Mode draws over the app, and it is a pointer rather than a caption —
   * it says where, and lets the app say what.
   */
  const ringTarget = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, []);

  /**
   * Hold between steps while paused, and release for exactly one step when Next Step asks.
   *
   * Gating between steps rather than inside one is what makes pausing safe: a pause never leaves
   * half an interaction done, and resuming can never re-run a click that already landed.
   */
  const awaitGate = useCallback(async (token: DemoRunToken) => {
    while (pausedRef.current && !stepOnceRef.current && !token.cancelled) {
      await sleep(80, token);
    }
    if (stepOnceRef.current) stepOnceRef.current = false;
  }, []);

  const runStep = useCallback(
    async (step: DemoStep, token: DemoRunToken, fast: boolean): Promise<boolean> => {
      setStepLabel(step.label);
      const settle = fast ? 0 : step.settleMs;

      if (step.kind === 'note') {
        setHighlight(null);
        await sleep(settle ?? 1200, token);
        return true;
      }

      if (!step.target) return true;

      const el = await waitForTarget(step.target, token, 8000);
      if (token.cancelled) return false;
      if (!el) {
        setFailure(`Step ${step.label} could not find what it needed.`);
        setStatus('failed');
        return false;
      }

      await scrollTargetIntoView(el, token);
      if (token.cancelled) return false;

      // Re-resolve after the scroll. A React re-render during the settle can replace the node, and
      // clicking a detached element is a click that silently does nothing.
      const live = resolveTarget(step.target) ?? el;
      const { x, y } = centreOf(live);
      if (!fast) ringTarget(live);
      await moveCursorTo(x, y, token, fast);
      if (token.cancelled) return false;

      if (step.kind === 'await') {
        await sleep(settle ?? 600, token);
        return true;
      }

      if (step.kind === 'type') {
        const input = live as HTMLInputElement;
        setPressed(true);
        dispatchRealClick(input, x, y);
        await sleep(fast ? 0 : 120, token);
        setPressed(false);
        await typeInto(input, step.text ?? '', token, fast ? 0 : 55);
        await sleep(settle ?? 700, token);
        return true;
      }

      // click
      setPressed(true);
      await sleep(fast ? 0 : 110, token);
      dispatchRealClick(live, x, y);
      await sleep(fast ? 0 : 110, token);
      setPressed(false);
      await sleep(settle ?? 700, token);
      return true;
    },
    [moveCursorTo, ringTarget]
  );

  /**
   * Walk the scenario, optionally replaying the first `arriveAt` steps at speed and stopping there.
   *
   * The replay is how Previous Step works. App state cannot be rewound — nothing can un-tick a
   * product or un-allocate a bin — so the only honest way back to step n is to rebuild the state
   * step n was reached with. It runs with no cursor animation and no settles, which makes it a
   * flicker rather than a second viewing.
   */
  const runScenario = useCallback(
    async (toRun: DemoScenario, arriveAt = 0) => {
      // Cancel anything already walking before taking over, or two loops drive one cursor.
      if (tokenRef.current) tokenRef.current.cancelled = true;
      const token: DemoRunToken = { cancelled: false };
      tokenRef.current = token;

      pausedRef.current = false;
      stepOnceRef.current = false;
      setScenario(toRun);
      setFailure(null);
      setHighlight(null);
      setStepIndex(0);
      setStatus('running');
      writeCursor(parkingSpot().x, parkingSpot().y);

      for (let i = 0; i < toRun.steps.length; i++) {
        const fast = i < arriveAt;
        if (!fast) {
          // Arriving at a step the viewer asked to be positioned on: stop here and wait for Play or
          // Next, rather than running on past the step they were trying to look at.
          if (i === arriveAt && arriveAt > 0) {
            pausedRef.current = true;
            setStatus('paused');
          }
          await awaitGate(token);
          if (token.cancelled) return;
        }
        setStepIndex(i);
        const ok = await runStep(toRun.steps[i], token, fast);
        if (!ok || token.cancelled) return;
      }

      setHighlight(null);
      setStatus('finished');
    },
    [awaitGate, runStep, writeCursor]
  );

  /**
   * Entering a scenario reloads the page with `?demo=<id>`.
   *
   * Not a flourish — a necessity. Inventory lives in React state seeded from a static file and
   * nothing persists, so a reload is the only thing that guarantees the preconditions a scenario
   * assumes: this one needs SOLU-CORTEF to still be unallocated and a bin to still be empty, and
   * both stop being true the moment anyone (including a previous run of this same demo) does the
   * thing it demonstrates. The palette says the current session will be discarded.
   */
  const start = useCallback((scenarioId: string, arriveAt?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set(DEMO_PARAM, scenarioId);
    if (arriveAt && arriveAt > 0) url.searchParams.set(STEP_PARAM, String(arriveAt));
    else url.searchParams.delete(STEP_PARAM);
    window.location.replace(url.toString());
  }, []);

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

  /**
   * Back one step — a reload and a fast replay, for the reason given on `runScenario`. Costly, and
   * the alternative is worse: re-running a click without rewinding the state behind it would toggle
   * the very thing the step did, so "back" would mean "undo something else".
   */
  const previousStep = useCallback(() => {
    if (!scenario || stepIndex <= 0) return;
    // `stepIndex`, not `stepIndex - 1`. `arriveAt` counts the steps to REPLAY, and the panel shows
    // `stepIndex + 1` — the step just completed. So replaying `stepIndex` steps (0 … stepIndex-1)
    // lands on the one before it, which is what Previous means. Handing it `stepIndex - 1` skipped
    // back two.
    start(scenario.id, stepIndex);
  }, [scenario, stepIndex, start]);

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
    setStatus('idle');
    setScenario(null);
    setHighlight(null);
    setStepLabel('');
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
    const arriveAt = Math.max(
      0,
      Math.min(toRun.steps.length - 1, Number(params.get(STEP_PARAM) ?? 0) || 0)
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
      runScenario(toRun, arriveAt);
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

  // Keep the ring on the target through scrolls and resizes rather than letting it drift off the
  // thing it is pointing at. Cheap: it only runs while a ring is up.
  useEffect(() => {
    if (!highlight || status !== 'running') return;
    const reposition = () => {
      const step = scenario?.steps[stepIndex];
      if (!step?.target) return;
      const el = resolveTarget(step.target);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [highlight, scenario, status, stepIndex]);

  const walking = status === 'running' || status === 'paused';

  const value = useMemo<DemoContextValue>(
    () => ({
      status,
      scenario,
      scenarios: demoScenarios,
      stepIndex,
      stepCount: scenario?.steps.length ?? 0,
      stepLabel,
      failure,
      highlight,
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
      canStepBack: walking && stepIndex > 0,
      canStepForward: walking && stepIndex < (scenario?.steps.length ?? 0) - 1,
      restart,
      exit,
    }),
    [
      status,
      walking,
      scenario,
      stepIndex,
      stepLabel,
      failure,
      highlight,
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
