import React from 'react';
import { ChevronRight } from 'lucide-react';
import { instructionFor, workflowLabel, TOTAL_PIPELINE_STEPS, PipelineStep } from './PipelineSteps';

/**
 * The parts every stage of the move flow builds its footer from.
 *
 * Each of the four stages had grown its own bar: the cabinet page's had icon-and-label summaries with
 * a chevron, while the quantity and placement pages carried bare underlined "1/1" links, and the three
 * used different heights, paddings and button markup. Same job, three vocabularies — so moving between
 * steps looked like moving between products.
 *
 * Defining the shell, the step cell, the summary cell and the buttons once means a stage chooses WHAT
 * to report, never how it looks. It also keeps the step numbering honest: the count and per-step
 * instruction come from PipelineSteps.tsx, the pipeline's one shared source for both.
 */

export const plural = (count: number, noun: string) => `${count} ${noun}${count !== 1 ? 's' : ''}`;

/**
 * Whether step ④ shows its "Product n of N" and "Source/Target Bin n of N" position counters.
 *
 * Off at the operator's request while the Move Summary panel beside them is being judged on its own —
 * the panel already lists every product and bin in the move and marks the one in hand, so the two
 * counters may be saying the same thing twice. One switch for both halves of step ④, so they cannot
 * disagree about it.
 *
 * A switch rather than a deletion because this is explicitly a "hide it for now, we'll decide later"
 * — the cells and their side sheets stay wired, so restoring them is this one line. If the decision
 * lands on keeping them off, delete the cells and the sheets they open rather than leaving this here:
 * the stepper band that sat behind exactly this kind of flag is a warning, not a precedent.
 */
export const SHOW_STEP4_POSITION_COUNTERS = false;

/**
 * The bar itself. min-h rather than a fixed height: the step cell's instruction wraps to two lines on
 * some steps and one on others, and a hard height would either clip the long ones or leave the short
 * ones floating. A floor plus consistent padding gives every stage the same bar without pretending the
 * content is the same size.
 */
export function PipelineFooterShell({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)] px-4 py-2 min-h-[60px] flex items-center ${className}`}
    >
      {/* Wraps rather than clipping: with a review panel open the column loses 440px, and the actions
          are the last thing that should disappear off the edge. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full">{children}</div>
    </div>
  );
}

/** Vertical hairline between cells, matching the bar's own border. */
export function FooterDivider() {
  return <div className="self-stretch border-l border-gray-200" />;
}

/**
 * Where you are and what to do here. Fixed 200px rather than a max: the instructions differ in length
 * between steps, and a cell that resized with them would shunt everything to its right sideways every
 * time the step changed.
 */
export function StepCell({
  step,
  moveMode
}: {
  step: PipelineStep;
  moveMode?: 'bin' | 'product' | null;
}) {
  return (
    <div className="shrink-0 w-[240px]">
      {/* Keyed on the step so React remounts this block on every advance and the entry animation plays
          again. That covers both halves of what it is for: it runs when the move opens (step ① mounts
          with it), and again each time the guidance changes, which is the moment the operator most needs
          pulling back to a bar they have stopped reading.

          A 4px rise and a fade over 300ms — enough to catch the eye at the bottom of the screen, not
          enough to be read as something arriving. motion-safe: so anyone who has asked their OS for
          less movement simply gets the new text. */}
      <div
        key={step}
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
      >
        {/* The workflow first, then the position in it — but only for as long as the kind still
            changes what the operator is looking at. Steps ① and ② differ by kind: one gathers bins and
            the other products, and a tap on the canvas means different things in each, so the prefix
            answers a live question. By ③ the two kinds have converged onto the same screens with the
            same rules, and repeating how the selection was gathered is history rather than guidance. */}
        <span className="block text-[12px] leading-[16px] font-semibold text-[#020817]">
          {step <= 2 ? `${workflowLabel(moveMode)} · ` : ''}Step {step}/{TOTAL_PIPELINE_STEPS}
        </span>
        <span className="block text-[12px] leading-[16px] text-[#676b74]">
          {instructionFor(step, moveMode)}
        </span>
      </div>
    </div>
  );
}

/**
 * One reportable half of the footer: an icon, what it is, and what's in it. Tappable when there's
 * something to look at.
 *
 * The value goes blue as soon as the cell holds something and stays grey while it's a zero or a
 * placeholder — the colour is the fastest read on the bar, saying "this side has something in it"
 * before the number is parsed, and it matches the chevron appearing at the same moment.
 */
export function SummaryCell({
  icon,
  label,
  value,
  active = false,
  enabled,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
  enabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={`flex items-center gap-3 px-4 py-2 rounded-[6px] text-left transition-colors ${
        active ? 'bg-[#F1F6FA]' : enabled ? 'hover:bg-gray-50' : ''
      } ${enabled ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="text-[#676b74] shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] leading-[16px] text-[#676b74]">{label}</span>
        <span
          className={`block text-[14px] leading-[20px] font-medium whitespace-nowrap ${
            enabled ? 'text-[#095192]' : 'text-[#676b74]'
          }`}
        >
          {value}
        </span>
      </span>
      {/* No affordance when there's nothing to look at — a chevron that opens an empty panel reads as
          broken rather than as "nothing selected yet". */}
      {enabled && <ChevronRight className="w-4 h-4 text-[#095192] shrink-0" />}
    </button>
  );
}

/**
 * A footer action. Secondary covers Cancel and Back alike: leaving a flow discards a selection that
 * was never committed, which is a step back rather than something being deleted, so neither earns the
 * destructive red they used to carry.
 */
export function FooterButton({
  label,
  variant,
  enabled = true,
  onClick,
  onBlockedClick,
  leadingIcon,
  trailingIcon,
  demoId
}: {
  label: string;
  variant: 'primary' | 'secondary';
  enabled?: boolean;
  onClick: () => void;
  /**
   * Stable handle for Demo Mode, in place of matching on the label. Every stage's primary answers to
   * the same `pipeline-primary`, which is not laziness: the bar's whole design is that the operator
   * looks at one place for what happens next, and a walkthrough that reaches for the same place is
   * demonstrating that rather than working around it. It is also the only handle that survives this
   * button's labels, which change with the step, the mode, and whether the requirement is met —
   * `Move To` / `Select bins to move` / `Build Move List` / `Start Qty Move` / `Proceed to Move To`
   * are all this one control.
   */
  demoId?: string;
  /**
   * What to do when the button is tapped while unavailable. Given one, the button keeps its normal label
   * and stays tappable — it just answers with an explanation instead of acting.
   *
   * This is the alternative to the convention of putting the requirement in the label
   * ("Select a source bin"). That works for a primary the operator is trying to reach, where the label
   * names what to do next. It reads badly on a control whose whole meaning is one word: "Cannot cancel —
   * stock placed" replaces the name of the button with a sentence about it, so the operator has to
   * re-read it to find out what the button even was.
   */
  onBlockedClick?: () => void;
  // Which side an arrow sits on is the whole message on the step buttons: leading points back to the
  // step you came from, trailing points on to the next one.
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-[4px] text-[14px] leading-[20px] px-3 py-2 h-9 whitespace-nowrap transition-colors';
  const look =
    variant === 'primary'
      ? 'bg-[#095192] text-white hover:bg-[#074080]'
      : 'bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA]';

  // Not the `disabled` attribute when there is something to explain: a disabled button swallows the click,
  // so the operator taps it, nothing happens at all, and they cannot tell a blocked control from a broken
  // one. It stays focusable and keeps aria-disabled so assistive tech is still told it is unavailable.
  const explains = !enabled && !!onBlockedClick;
  return (
    <button
      type="button"
      data-demo={demoId}
      onClick={enabled ? onClick : onBlockedClick}
      disabled={!enabled && !explains}
      aria-disabled={!enabled}
      className={`${base} ${look} ${
        enabled ? 'cursor-pointer' : explains ? 'opacity-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      {leadingIcon}
      {label}
      {trailingIcon}
    </button>
  );
}

/** The actions cluster, pushed to the right of whatever the stage reports on the left. */
export function FooterActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 shrink-0 ml-auto">{children}</div>;
}
