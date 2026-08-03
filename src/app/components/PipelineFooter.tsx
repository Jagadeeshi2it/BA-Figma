import React from 'react';
import { ChevronRight } from 'lucide-react';
import { instructionFor, TOTAL_PIPELINE_STEPS, PipelineStep } from './PipelineSteps';

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
    <div className="shrink-0 w-[200px]">
      <span className="block text-[12px] leading-[16px] font-semibold text-[#020817]">
        Step {step}/{TOTAL_PIPELINE_STEPS}
      </span>
      <span className="block text-[12px] leading-[16px] text-[#676b74]">
        {instructionFor(step, moveMode)}
      </span>
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
  leadingIcon,
  trailingIcon
}: {
  label: string;
  variant: 'primary' | 'secondary';
  enabled?: boolean;
  onClick: () => void;
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
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={`${base} ${look} ${enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
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
