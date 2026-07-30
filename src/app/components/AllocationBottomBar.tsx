import React from 'react';
import { ChevronRight, LogOut, LogIn } from 'lucide-react';

interface AllocationBottomBarProps {
  step: 1 | 2;
  sourceBinCount: number;
  // Distinct products the source selection was built from — 0 when bins were clicked straight off
  // the shelf, where there's no product context to report.
  sourceProductCount: number;
  targetBinCount: number;
  openPanel: 'source' | 'target' | null;
  onOpenSource: () => void;
  onOpenTarget: () => void;
  onCancel: () => void;
  onBackToSource: () => void;
  onClear: () => void;
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
  onClick
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'ghost-danger';
  enabled: boolean;
  onClick: () => void;
}) {
  const base = 'rounded-[4px] text-[14px] leading-[20px] px-3 py-2 whitespace-nowrap transition-colors';
  const look =
    variant === 'primary'
      ? 'bg-[#095192] text-white hover:bg-[#074080]'
      : variant === 'secondary'
        ? 'bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA]'
        : 'bg-transparent text-[#C6362C] hover:underline';
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={`${base} ${look} ${enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
    >
      {label}
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
  openPanel,
  onOpenSource,
  onOpenTarget,
  onCancel,
  onBackToSource,
  onClear,
  onNext,
  onConfirm
}: AllocationBottomBarProps) {
  const sourceValue =
    sourceBinCount === 0
      ? 'None selected'
      : sourceProductCount > 0
        ? `${plural(sourceBinCount, 'Bin')}, ${plural(sourceProductCount, 'Product')}`
        : plural(sourceBinCount, 'Bin');

  const targetValue = targetBinCount === 0 ? 'None selected' : plural(targetBinCount, 'Bin');

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
          <BarButton label="Cancel" variant="ghost-danger" enabled onClick={onCancel} />
          {step === 2 && (
            <BarButton label="Source Bin Selection" variant="secondary" enabled onClick={onBackToSource} />
          )}
          {/* Always present, disabled when there's nothing to clear: a button that appears and
              disappears as the count crosses zero makes the bar jump under the pointer. */}
          <BarButton
            label="Clear"
            variant="secondary"
            enabled={step === 1 ? sourceBinCount > 0 : targetBinCount > 0}
            onClick={onClear}
          />
          {step === 1 ? (
            <BarButton
              label="Select Target"
              variant="primary"
              enabled={sourceBinCount > 0}
              onClick={onNext}
            />
          ) : (
            <BarButton
              label="Confirm Selection"
              variant="primary"
              enabled={targetBinCount > 0}
              onClick={onConfirm}
            />
          )}
        </div>
      </div>
    </div>
  );
}
