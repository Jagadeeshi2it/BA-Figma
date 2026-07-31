import React from 'react';
import { ChevronRight, LogOut, LogIn, ArrowLeft, ArrowRight } from 'lucide-react';

interface AllocationBottomBarProps {
  step: 1 | 2;
  sourceBinCount: number;
  // Distinct products the source selection was built from — 0 when bins were clicked straight off
  // the shelf, where there's no product context to report.
  sourceProductCount: number;
  targetBinCount: number;
  // Distinct products the target bins already hold — nearly always 0, since destinations are usually
  // available bins, which is itself the useful signal when reviewing where things are going.
  targetProductCount: number;
  openPanel: 'source' | 'target' | null;
  onOpenSource: () => void;
  onOpenTarget: () => void;
  onCancel: () => void;
  onBackToSource: () => void;
  onNext: () => void;
  onConfirm: () => void;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count !== 1 ? 's' : ''}`;

// One tappable half of the bar's left side. The count is the whole point of the redesign: the user
// can see what they've gathered without leaving the shelves, and open it to check the detail.
function SelectionSummary({
  icon,
  label,
  value,
  active,
  enabled,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
  enabled: boolean;
  onClick: () => void;
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
        <span className="block text-[14px] leading-[20px] font-medium text-[#020817] whitespace-nowrap">
          {value}
        </span>
      </span>
      {/* No affordance when there's nothing to look at — a chevron that opens an empty panel reads
          as broken rather than as "nothing selected yet". */}
      {enabled && <ChevronRight className="w-4 h-4 text-[#676b74] shrink-0" />}
    </button>
  );
}

function BarButton({
  label,
  variant,
  enabled,
  onClick,
  leadingIcon,
  trailingIcon
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'outline-danger';
  enabled: boolean;
  onClick: () => void;
  // Which side an arrow sits on is the whole message on the two step buttons: leading points back to
  // the step you came from, trailing points on to the next one.
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-[4px] text-[14px] leading-[20px] px-3 py-2 whitespace-nowrap transition-colors';
  const look =
    variant === 'primary'
      ? 'bg-[#095192] text-white hover:bg-[#074080]'
      : variant === 'secondary'
        ? 'bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA]'
        // Outlined rather than bare text, matching the panel footer's Remove all: leaving the mode
        // discards a selection, so it reads as an action with weight rather than an aside.
        : 'bg-white text-[#C6362C] border border-[#C6362C] hover:bg-[#FDF2F2]';
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

/**
 * The allocation flow's controls, pinned to the bottom of the content column for as long as the mode
 * is open. It replaces the banner that used to sit above the cabinets: that put the step's actions
 * at the top of a page whose whole job is scrolling through shelves, so the button you needed next
 * scrolled away from the bins you were picking. Down here it stays put, and it carries a running
 * count of both halves of the selection — openable for review before anything is committed.
 */
export default function AllocationBottomBar({
  step,
  sourceBinCount,
  sourceProductCount,
  targetBinCount,
  targetProductCount,
  openPanel,
  onOpenSource,
  onOpenTarget,
  onCancel,
  onBackToSource,
  onNext,
  onConfirm
}: AllocationBottomBarProps) {
  // Both halves always report both figures, including zeros. "None selected" said the same thing in
  // fewer words but changed shape as soon as something was picked, so the two summaries kept
  // disagreeing about what they were counting; a count that starts at 0 and only ever goes up reads
  // as a running tally instead.
  const summaryValue = (binCount: number, productCount: number) =>
    `${plural(binCount, 'Bin')}, ${plural(productCount, 'Product')}`;

  const sourceValue = summaryValue(sourceBinCount, sourceProductCount);
  const targetValue = summaryValue(targetBinCount, targetProductCount);

  return (
    <div className="shrink-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)] px-4 py-2">
      {/* Wraps rather than clipping: with a review panel open the column loses 440px, and the
          actions are the last thing that should disappear off the edge. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SelectionSummary
          icon={<LogOut className="w-4 h-4" />}
          label="Source"
          value={sourceValue}
          active={openPanel === 'source'}
          enabled={sourceBinCount > 0}
          onClick={onOpenSource}
        />
        <div className="self-stretch border-l border-gray-200" />
        <SelectionSummary
          icon={<LogIn className="w-4 h-4" />}
          label="Target"
          value={targetValue}
          active={openPanel === 'target'}
          enabled={targetBinCount > 0}
          onClick={onOpenTarget}
        />


        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <BarButton label="Cancel" variant="outline-danger" enabled onClick={onCancel} />
          {step === 2 && (
            <BarButton
              label="Source Selection"
              variant="secondary"
              enabled
              onClick={onBackToSource}
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
            />
          )}
          {step === 1 ? (
            <BarButton
              label="Target Selection"
              variant="primary"
              enabled={sourceBinCount > 0}
              onClick={onNext}
              trailingIcon={<ArrowRight className="w-4 h-4" />}
            />
          ) : (
            <BarButton
              label="Review Selection"
              variant="primary"
              enabled={targetBinCount > 0}
              onClick={onConfirm}
              // Third step in the same sequence as the two beside it, so it takes the same arrow.
              // It was left bare while it said "Confirm", on the grounds that it opens a panel
              // rather than advancing — but that was the misleading part: it does advance, and the
              // commit is two screens further on.
              trailingIcon={<ArrowRight className="w-4 h-4" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
