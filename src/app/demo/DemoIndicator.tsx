import React from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { useDemo } from './DemoContext';

function ControlButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 items-center gap-1.5 rounded-[4px] border border-white/25 px-2 text-[12px] leading-[16px] text-white transition-colors hover:bg-white/15 cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * The "you are watching a demo" bar, and the only live controls while one is running.
 *
 * Top-centre because it is the one strip of the header that holds nothing: the title is left, the
 * search and workflow controls are right. Bottom-centre belongs to the move pipeline's footer, and
 * top-right to the toasts.
 *
 * It sits above the input shield, which is what makes Pause/Restart/Exit reachable at any moment
 * while every other click in the app is being swallowed.
 */
export default function DemoIndicator() {
  const { status, scenario, stepIndex, stepCount, failure, pause, resume, restart, exit } = useDemo();

  if (status === 'idle' || !scenario) return null;

  const running = status === 'running';
  const finished = status === 'finished';
  const failed = status === 'failed';

  return (
    <div className="pointer-events-none fixed top-3 left-1/2 z-[10050] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[6px] bg-[#020817] px-3 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2">
          {/* Pulses only while something is actually happening — a live indicator on a finished or
              stalled demo says the opposite of the truth. */}
          <span
            className={`h-2 w-2 rounded-full ${
              failed ? 'bg-[#C6362C]' : running ? 'bg-[#22C55E] motion-safe:animate-pulse' : 'bg-white/50'
            }`}
          />
          <span className="text-[12px] font-medium uppercase tracking-wide text-white/70">Demo Mode</span>
        </div>

        <div className="max-w-[280px] truncate text-[13px] leading-[18px] text-white">
          {scenario.title}
        </div>

        {/* Steps, not a percentage: the viewer is watching discrete acts and "3 of 10" is the
            figure that tells them how much is left. Withheld once the walk is over, when it would
            just be the total staring back. */}
        {!finished && !failed && (
          <div className="shrink-0 text-[12px] leading-[16px] text-white/60">
            Step {Math.min(stepIndex + 1, stepCount)} of {stepCount}
          </div>
        )}

        {failed && failure && (
          <div className="max-w-[320px] text-[12px] leading-[16px] text-[#F7B4AE]">{failure}</div>
        )}

        {finished && <div className="text-[12px] leading-[16px] text-[#7EE2A8]">Finished</div>}

        <div className="flex shrink-0 items-center gap-1.5 border-l border-white/20 pl-3">
          {!finished && !failed && (
            running ? (
              <ControlButton label="Pause" onClick={pause} icon={<Pause className="h-3 w-3" />} />
            ) : (
              <ControlButton label="Resume" onClick={resume} icon={<Play className="h-3 w-3" />} />
            )
          )}
          <ControlButton label="Restart" onClick={restart} icon={<RotateCcw className="h-3 w-3" />} />
          {/* Named for what it gives back, not for what it stops. Exiting hands over an app that is
              immediately interactive and still shows whatever the demo just did — which is the
              thing a viewer wants to poke at. */}
          <ControlButton label="Take over" onClick={exit} icon={<X className="h-3 w-3" />} />
        </div>
      </div>
    </div>
  );
}
