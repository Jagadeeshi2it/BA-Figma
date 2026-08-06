import React from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useDemo } from './DemoContext';

/**
 * The demo's controls, and the only thing on screen that says a demo is running.
 *
 * **Icon-only, and every control is always there.** It briefly expanded on hover to reveal labels
 * and the transport; that traded one problem for another — the controls were compact but three of
 * them were unreachable without discovering that the panel expands, and a control you have to find
 * is worse than a wide bar. Icons for all six keeps the panel under 200px and keeps Previous, Play
 * and Next one click away at any moment.
 *
 * Each button carries `aria-label` and `title`, so the name is available to a screen reader always
 * and to a pointer on hover — a native tooltip on a control the user is already pointing at, which
 * is a different thing from the instructional captions this demo deliberately has none of.
 *
 * Top-centre because it is the one strip of the header holding nothing: the title is left, the
 * search and workflow controls are right. Bottom-centre belongs to the move pipeline's footer, and
 * top-right to the toasts.
 *
 * It sits above the input shield, which is what makes every control here live at any moment while
 * the rest of the app is being ignored.
 */
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

  if (status === 'idle' || !scenario) return null;

  const running = status === 'running';
  const failed = status === 'failed';
  const walking = running || status === 'paused';

  return (
    // `w-max` is load-bearing. A `fixed` element placed with `left: 50%` and no `right` gets an
    // available width of only the half-viewport to its right, so the panel was capped there and the
    // flex row silently squeezed controls out of existence — which looks like a rendering bug rather
    // than a sizing one (CLAUDE.md §4).
    <div className="pointer-events-none fixed top-3 left-1/2 z-[10050] w-max max-w-[calc(100vw-24px)] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-[6px] bg-[#020817] px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        {/* Pulses only while something is actually happening — a live indicator on a finished or
            stalled demo says the opposite of the truth. Red on a failure, which is the one state
            with no icon of its own.

            Its tooltip is where the words went. The scenario, the step being performed, or the
            reason it stopped — available to anyone who wants it, costing no pixels to anyone who
            doesn't, and never covering the app. */}
        <span
          title={
            failed && failure
              ? failure
              : `Demo Mode — ${scenario.title}${walking && stepLabel ? ` · ${stepLabel}` : ''}`
          }
          className={`mx-1 h-2 w-2 shrink-0 rounded-full ${
            failed ? 'bg-[#C6362C]' : running ? 'bg-[#22C55E] motion-safe:animate-pulse' : 'bg-white/50'
          }`}
        />

        {/* The one thing that cannot be an icon. Two characters wide and it is the only sense of how
            far through the walk is — without it the panel is a row of anonymous buttons. Dropped
            once the walk is over, when it would just be the total staring back. */}
        {walking && (
          <span className="shrink-0 px-1 text-[11px] leading-[16px] tabular-nums text-white/60">
            {Math.min(stepIndex + 1, stepCount)}/{stepCount}
          </span>
        )}

        {/* The transport. Gone once the walk is over — there is nothing left to step through, and a
            row of dead buttons is worse than a shorter panel. */}
        {walking && (
          <>
            <ControlButton
              label="Previous step"
              onClick={previousStep}
              disabled={!canStepBack}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <ControlButton
              label={running ? 'Pause' : 'Play'}
              onClick={running ? pause : play}
              icon={running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            />
            <ControlButton
              label="Next step"
              onClick={nextStep}
              disabled={!canStepForward}
              icon={<ChevronRight className="h-4 w-4" />}
            />
            <span className="mx-0.5 h-4 w-px shrink-0 bg-white/20" />
          </>
        )}

        <ControlButton label="Restart demo" onClick={restart} icon={<RotateCcw className="h-3.5 w-3.5" />} />
        {/* Named for what it gives back, not for what it stops. Exiting hands over an app that is
            immediately interactive and still shows whatever the demo just did. */}
        <ControlButton label="Take over" onClick={exit} icon={<X className="h-4 w-4" />} />
      </div>
    </div>
  );
}
