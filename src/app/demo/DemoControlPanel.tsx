import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useDemo } from './DemoContext';

/**
 * The demo's controls, and the only thing on screen that says a demo is running.
 *
 * **Top-left, over the app's logo.** Chrome belongs where chrome lives, and the logo is the one
 * thing on the page that carries no state and answers no question mid-demo. Top-centre — where this
 * sat — put a floating black bar in the middle of the header the viewer was trying to read.
 *
 * **Minimised to two icons: Restart and Exit demo.** Those are the two anybody reaches for without
 * having planned to. Hover, focus or a tap reveals the rest — Previous, Play/Pause, Next, and the
 * name of the step being performed.
 *
 * The two persistent icons come FIRST, before the collapsing group, so the panel grows to the right
 * and they never move. If they sat at the far end, expanding would slide them out from under the
 * pointer that triggered the expansion — which at best mis-aims a click and at worst oscillates,
 * because leaving the panel collapses it again.
 */

/**
 * Collapses to nothing and back, animating the width.
 *
 * `grid-template-columns: 0fr → 1fr` rather than a max-width guess: the content decides its own
 * width, so a longer step name or a translated label cannot be clipped by a number somebody picked
 * once. The inner `overflow-hidden` is what makes the 0fr track actually hide its content.
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
      // out controls the eye cannot see is its own kind of clutter.
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
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      // The accessible name is on the button whether or not a label is showing, so an icon-only
      // panel is not a row of unnamed controls.
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-white transition-colors ${
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer hover:bg-white/15'
      }`}
    >
      {icon}
    </button>
  );
}

export default function DemoControlPanel() {
  const {
    status,
    scenario,
    position,
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

  useEffect(
    () => () => {
      if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    },
    []
  );

  // A walk that ends while the panel is a dot and two icons ends silently: the cursor stops, the
  // app sits there, and nothing says whether that was the finish or a stall. Opening the panel is
  // the announcement — it states that the demo is over and puts Restart, Previous and Exit in front
  // of the viewer at the moment they are wondering what to do next.
  const ended = status === 'finished' || status === 'failed';
  useEffect(() => {
    if (ended) setExpanded(true);
  }, [ended]);

  if (status === 'idle' || !scenario) return null;

  const duration = reducedMotion ? 0 : 220;
  const running = status === 'running';
  const failed = status === 'failed';
  const finished = status === 'finished';

  const open = () => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    setExpanded(true);
  };
  // A short grace period on the way out. The panel shrinks as the pointer leaves, which can pull an
  // edge out from under a cursor that was heading for a button — the delay makes that a non-event
  // rather than a control that dodges the click.
  //
  // Once the walk has ended the panel stays open regardless: it is holding a message, and a message
  // that vanishes the moment the pointer drifts off has not been delivered.
  const close = () => {
    if (ended) return;
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 260);
  };

  return (
    <div className="pointer-events-none fixed top-2 left-2 z-[10050] w-max max-w-[calc(100vw-16px)]">
      <div
        onMouseEnter={open}
        onMouseLeave={close}
        // Hover does not exist on the tablet this app targets, so focus opens it for the keyboard
        // and a tap on the status dot opens it for a finger.
        onFocusCapture={open}
        onBlurCapture={close}
        className="pointer-events-auto flex items-center gap-0.5 rounded-[6px] bg-[#020817] px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
      >
        <button
          type="button"
          onClick={() => (expanded ? setExpanded(false) : open())}
          aria-label={expanded ? 'Collapse demo controls' : 'Expand demo controls'}
          aria-expanded={expanded}
          // The dot's tooltip carries the words that are not on screen: which scenario, or why it
          // stopped. Available to anyone who looks, costing no pixels to anyone who doesn't.
          title={failed && failure ? failure : `Demo Mode — ${scenario.title}`}
          className="flex h-7 shrink-0 items-center px-1 cursor-pointer"
        >
          {/* Pulses only while something is actually happening — a live indicator on a finished or
              stalled demo says the opposite of the truth. */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              failed
                ? 'bg-[#C6362C]'
                : running
                  ? 'bg-[#22C55E] motion-safe:animate-pulse'
                  : // Solid green, not pulsing: finished is a result, not an activity.
                    finished
                    ? 'bg-[#22C55E]'
                    : 'bg-white/50'
            }`}
          />
        </button>

        {/* Always there, and always in the same place. */}
        <ControlButton label="Restart demo" onClick={restart} icon={<RotateCcw className="h-3.5 w-3.5" />} />
        {/* Exiting hands over an app that is immediately interactive and still shows whatever the
            demo just did — the result is the thing a viewer wants to poke at. */}
        <ControlButton label="Exit demo" onClick={exit} icon={<X className="h-4 w-4" />} />

        <Collapse open={expanded} duration={duration}>
          <div className="flex items-center pl-1">
            <span className="mr-1 h-4 w-px shrink-0 bg-white/20" />
            <ControlButton
              label="Previous step"
              onClick={previousStep}
              disabled={!canStepBack}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <ControlButton
              label={running ? 'Pause' : 'Play'}
              onClick={running ? pause : play}
              disabled={!canStepForward}
              icon={running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            />
            <ControlButton
              label="Next step"
              onClick={nextStep}
              disabled={!canStepForward}
              icon={<ChevronRight className="h-4 w-4" />}
            />

            {/* The step being performed, or the one Next will perform. Derived from the same
                position the walk runs on, so the name and the counter cannot disagree with it.

                At the end it becomes the message instead — "Demo completed", not "Finished", which
                could as easily be a step name as a verdict. */}
            <span
              className={`ml-1.5 max-w-[240px] truncate pr-1 text-[13px] leading-[18px] ${
                finished ? 'font-medium text-[#7EE2A8]' : 'text-white'
              }`}
            >
              {failed ? `Demo stopped — ${failure}` : finished ? 'Demo completed' : stepLabel}
            </span>
            {!finished && !failed && (
              <span className="shrink-0 pr-1 text-[11px] leading-[16px] tabular-nums text-white/60">
                {Math.min(position + 1, stepCount)}/{stepCount}
              </span>
            )}
          </div>
        </Collapse>
      </div>
    </div>
  );
}
