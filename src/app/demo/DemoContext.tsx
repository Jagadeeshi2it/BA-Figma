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
 * what makes it safe for the runner to update a caption between every step; nothing but the
 * overlay re-renders.
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
  caption: string;
  failure: string | null;
  highlight: HighlightRect | null;
  pressed: boolean;
  cursorRef: React.MutableRefObject<HTMLDivElement | null>;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  start: (scenarioId: string) => void;
  pause: () => void;
  resume: () => void;
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

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Where the cursor waits before its first move — off the bottom edge, so it glides into frame. */
const parkingSpot = () => ({ x: window.innerWidth / 2, y: window.innerHeight + 60 });

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [caption, setCaption] = useState('');
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
   */
  const moveCursorTo = useCallback(
    (x: number, y: number, token: DemoRunToken) =>
      new Promise<void>(resolve => {
        const from = cursorPos.current;
        const distance = Math.hypot(x - from.x, y - from.y);
        // Nothing to animate in a tab nobody is looking at, and rAF would not run there anyway.
        if (distance < 1 || document.hidden) {
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
   */
  const ringTarget = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHighlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, []);

  /** Hold between steps while paused. This is why pausing never interrupts a half-finished click. */
  const awaitResume = useCallback(async (token: DemoRunToken) => {
    while (pausedRef.current && !token.cancelled) {
      await sleep(80, token);
    }
  }, []);

  const runStep = useCallback(
    async (step: DemoStep, token: DemoRunToken): Promise<boolean> => {
      setCaption(step.caption);

      if (step.kind === 'note') {
        setHighlight(null);
        await sleep(step.settleMs ?? 1200, token);
        return true;
      }

      if (!step.target) return true;

      const el = await waitForTarget(step.target, token, 8000);
      if (token.cancelled) return false;
      if (!el) {
        setFailure(`Could not find what this step needed: "${step.caption}"`);
        setStatus('failed');
        return false;
      }

      await scrollTargetIntoView(el, token);
      if (token.cancelled) return false;

      // Re-resolve after the scroll. A React re-render during the settle can replace the node, and
      // clicking a detached element is a click that silently does nothing.
      const live = resolveTarget(step.target) ?? el;
      const { x, y } = centreOf(live);
      ringTarget(live);
      await moveCursorTo(x, y, token);
      if (token.cancelled) return false;

      if (step.kind === 'await') {
        await sleep(step.settleMs ?? 600, token);
        return true;
      }

      if (step.kind === 'type') {
        const input = live as HTMLInputElement;
        setPressed(true);
        dispatchRealClick(input, x, y);
        await sleep(120, token);
        setPressed(false);
        await typeInto(input, step.text ?? '', token);
        await sleep(step.settleMs ?? 700, token);
        return true;
      }

      // click
      setPressed(true);
      await sleep(110, token);
      dispatchRealClick(live, x, y);
      await sleep(110, token);
      setPressed(false);
      await sleep(step.settleMs ?? 700, token);
      return true;
    },
    [moveCursorTo, ringTarget]
  );

  const runScenario = useCallback(
    async (toRun: DemoScenario) => {
      // Cancel anything already walking before taking over, or two loops drive one cursor.
      if (tokenRef.current) tokenRef.current.cancelled = true;
      const token: DemoRunToken = { cancelled: false };
      tokenRef.current = token;

      pausedRef.current = false;
      setScenario(toRun);
      setFailure(null);
      setHighlight(null);
      setStepIndex(0);
      setStatus('running');
      writeCursor(parkingSpot().x, parkingSpot().y);

      for (let i = 0; i < toRun.steps.length; i++) {
        await awaitResume(token);
        if (token.cancelled) return;
        setStepIndex(i);
        const ok = await runStep(toRun.steps[i], token);
        if (!ok || token.cancelled) return;
      }

      setHighlight(null);
      setStatus('finished');
    },
    [awaitResume, runStep, writeCursor]
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
  const start = useCallback((scenarioId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(DEMO_PARAM, scenarioId);
    window.location.replace(url.toString());
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setStatus('running');
  }, []);

  const restart = useCallback(() => {
    if (scenario) start(scenario.id);
  }, [scenario, start]);

  /**
   * Stop the walk and hand the app back, in the state the demo left it in. Deliberately not a
   * reload: the operator has just watched something happen and the obvious next move is to poke at
   * the result. The URL parameter goes, though, or a refresh would silently restart the demo.
   */
  const exit = useCallback(() => {
    if (tokenRef.current) tokenRef.current.cancelled = true;
    pausedRef.current = false;
    setStatus('idle');
    setScenario(null);
    setHighlight(null);
    setCaption('');
    setFailure(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has(DEMO_PARAM)) {
      url.searchParams.delete(DEMO_PARAM);
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
        resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [status, pause, resume]);

  // Pick up ?demo=<id> on load. Waits for the app's own chrome to exist first: on a cold load the
  // first step's target is not mounted yet, and a scenario that begins by failing to find the
  // header would be indistinguishable from a broken anchor.
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get(DEMO_PARAM);
    const toRun = findScenario(id);
    if (!toRun) return;
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
      runScenario(toRun);
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

  const value = useMemo<DemoContextValue>(
    () => ({
      status,
      scenario,
      scenarios: demoScenarios,
      stepIndex,
      stepCount: scenario?.steps.length ?? 0,
      caption,
      failure,
      highlight,
      pressed,
      cursorRef,
      paletteOpen,
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      start,
      pause,
      resume,
      restart,
      exit,
    }),
    [
      status,
      scenario,
      stepIndex,
      caption,
      failure,
      highlight,
      pressed,
      paletteOpen,
      start,
      pause,
      resume,
      restart,
      exit,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
