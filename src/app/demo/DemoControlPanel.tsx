import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useDemo } from './DemoContext';

/**
 * The demo's controls, and the only thing on screen that says a demo is running.
 *
 * **Minimised by default.** At rest it is a status dot and two icons — Restart and Take over, the
 * two a viewer reaches for without having planned to. Hovering expands it to the full transport:
 * back a step, play/pause, forward a step, and the step's own name. That way the controls are
 * always one gesture away without a control bar sitting over the app for the whole walkthrough,
 * which is the same objection that got the per-step captions removed.
 *
 * Top-centre because it is the one strip of the header holding nothing: the title is left, the
 * search and workflow controls are right. Bottom-centre belongs to the move pipeline's footer, and
 * top-right to the toasts.
 *
 * It sits above the input shield, which is what makes every control here live at any moment while
 * the rest of the app is being ignored.
 */

/**
 * Collapses to nothing and back, animating the width.
 *
 * `grid-template-columns: 0fr → 1fr` rather than a max-width guess: the content decides its own
 * width, so a longer scenario title or a translated label cannot be clipped by a number somebody
 * picked once. The inner `overflow-hidden` is what makes the 0fr track actually hide its content.
 */
function Collapse({
  open,
  duration,
  children,
}: {
  open: boolean;
  duration: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: open ? '1fr' : '0fr',
        transition: `grid-template-columns ${duration}ms ease-out`,
      }}
      // Hidden from assistive tech as well as from view when collapsed — a screen reader reading
      // out three controls the eye cannot see is its own kind of clutter.
      aria-hidden={!open}
    >
      <div className="min-w-0 overflow-hidden whitespace-nowrap">{children}</div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  icon,
  expanded,
  duration,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  expanded: boolean;
  duration: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      // The accessible name is on the button whether or not the label is showing, so the icon-only
      // state is not a set of unnamed controls.
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      className={`flex h-7 shrink-0 items-center rounded-[4px] px-1.5 text-[12px] leading-[16px] text-white transition-colors ${
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer hover:bg-white/15'
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <Collapse open={expanded} duration={duration}>
        <span className="pl-1.5 pr-0.5">{label}</span>
      </Collapse>
    </button>
  );
}

export default function DemoControlPanel() {
  const {
    status,
    scenario,
    stepIndex,
    stepCount,
    stepLabel,
    failure,
    play,
    pause,
    nextStep,
    previousStep,
    canStepBack,
    canStepForward,
    restart,
    exit,
  } = useDemo();

  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const collapseTimer = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
  }, []);

  if (status === 'idle' || !scenario) return null;

  const duration = reducedMotion ? 0 : 220;
  const running = status === 'running';
  const finished = status === 'finished';
  const failed = status === 'failed';
  const walking = running || status === 'paused';

  const open = () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    setExpanded(true);
  };
  // A short grace period on the way out. The panel shrinks as the pointer leaves, which can pull an
  // edge out from under a cursor that was heading for a button — the delay makes that a non-event
  // rather than a control that dodges the click.
  const close = () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 260);
  };

  return (
    // `w-max` is load-bearing. A `fixed` element placed with `left: 50%` and no `right` gets an
    // available width of only the half-viewport to its right, so the panel was capped there and the
    // flex row silently squeezed its labels out — Next vanished and the step name truncated to two
    // characters, which looked like a rendering bug rather than a sizing one. Sizing to content and
    // capping at the viewport instead keeps the expansion honest at any window width.
    <div className="pointer-events-none fixed top-3 left-1/2 z-[10050] w-max max-w-[calc(100vw-24px)] -translate-x-1/2">
      <div
        onMouseEnter={open}
        onMouseLeave={close}
        // Hover is not available on the tablet this app targets, so focus opens it for the keyboard
        // and a tap on the status dot opens it for a finger.
        onFocusCapture={open}
        onBlurCapture={close}
        className="pointer-events-auto flex items-center rounded-[6px] bg-[#020817] px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
      >
        <button
          type="button"
          onClick={() => (expanded ? setExpanded(false) : open())}
          aria-label={expanded ? 'Collapse demo controls' : 'Expand demo controls'}
          aria-expanded={expanded}
          className="flex h-7 shrink-0 items-center gap-2 rounded-[4px] px-1 cursor-pointer"
        >
          {/* Pulses only while something is actually happening — a live indicator on a finished or
              stalled demo says the opposite of the truth. */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              failed ? 'bg-[#C6362C]' : running ? 'bg-[#22C55E] motion-safe:animate-pulse' : 'bg-white/50'
            }`}
          />
          <Collapse open={expanded} duration={duration}>
            <span className="pr-1 text-[12px] font-medium uppercase tracking-wide text-white/70">
              Demo
            </span>
          </Collapse>
        </button>

        <Collapse open={expanded} duration={duration}>
          <div className="flex items-center gap-2 pr-2 pl-1">
            <span className="max-w-[220px] truncate text-[13px] leading-[18px] text-white">
              {/* The step's own name, which used to be a caption floating over the app. In here it
                  is available to anyone who looks for it and in nobody's way if they don't. */}
              {failed ? failure : finished ? 'Finished' : stepLabel || scenario.title}
            </span>
            {walking && (
              <span className="shrink-0 text-[12px] leading-[16px] text-white/60">
                {Math.min(stepIndex + 1, stepCount)}/{stepCount}
              </span>
            )}
          </div>
        </Collapse>

        {/* The transport. Collapsed away entirely at rest — stepping through is a deliberate act,
            and once the walk is over there is nothing left to step through. */}
        <Collapse open={expanded && walking} duration={duration}>
          <div className="flex items-center border-l border-white/20 pl-1">
            <ControlButton
              label="Previous"
              onClick={previousStep}
              disabled={!canStepBack}
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
              expanded={expanded}
              duration={duration}
            />
            <ControlButton
              label={running ? 'Pause' : 'Play'}
              onClick={running ? pause : play}
              icon={running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              expanded={expanded}
              duration={duration}
            />
            <ControlButton
              label="Next"
              onClick={nextStep}
              disabled={!canStepForward}
              icon={<ChevronRight className="h-3.5 w-3.5" />}
              expanded={expanded}
              duration={duration}
            />
          </div>
        </Collapse>

        {/* The two that stay visible at rest. Restart because a demo is watched more than once, and
            Take over because being stuck watching is the one thing a viewer must never be. */}
        <div className="flex shrink-0 items-center">
          <ControlButton
            label="Restart"
            onClick={restart}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            expanded={expanded}
            duration={duration}
          />
          {/* Named for what it gives back, not for what it stops. Exiting hands over an app that is
              immediately interactive and still shows whatever the demo just did. */}
          <ControlButton
            label="Take over"
            onClick={exit}
            icon={<X className="h-3.5 w-3.5" />}
            expanded={expanded}
            duration={duration}
          />
        </div>
      </div>
    </div>
  );
}
