import React from 'react';
import { Check, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BadgeFilter, BADGE_FILTER_OPTIONS } from '../utils/badgeFilter';

/**
 * `Select All` on the left, the badge filter opposite it — the control row both allocation panels sit
 * above their product list.
 *
 * **Extracted rather than written twice**, for the reason CLAUDE.md §6 gives about these two panels: they
 * are the workflow menu's two allocation entries, so a difference between them implies the two flows work
 * differently. That rule had been holding by inspection, which is how the tray came to render only the
 * vial badge while the other panel rendered all three. A rule this easy to break by accident belongs in
 * one component, not in a paragraph asking the next person to check.
 *
 * The pairing is the workflow, and it is why the two controls share a row: narrow to a kind, then take
 * all of it. Most climate-sensitive stock goes to a fridge, so "show me the Climate products and tick
 * them" is the commonest way a delivery gets put away, and it was eight rows to read and eight taps.
 */
export default function ProductListControls({
  allSelected,
  someSelected,
  canSelectAll,
  onSelectAll,
  badgeFilter,
  onBadgeFilterChange,
  selectAllDemoId,
  filterDemoId
}: {
  allSelected: boolean;
  someSelected: boolean;
  /** Whether anything is listed for `Select All` to act on. */
  canSelectAll: boolean;
  onSelectAll: () => void;
  badgeFilter: BadgeFilter;
  onBadgeFilterChange: (filter: BadgeFilter) => void;
  // Spelled out by each panel rather than derived from a prefix here, so the anchors stay greppable
  // literals — `scripts/verify-demo-anchors.mjs` reads them at the call site.
  selectAllDemoId: string;
  filterDemoId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Visible always, dimmed when there is nothing to tick.
          It used to be withheld, on the reasoning that a control which cannot act reads as broken rather
          than unavailable. That holds where the control is alone on its row and the row can go with it.
          It does not hold once the row also carries the filter, which must stay reachable precisely when
          the list is empty — it is usually what emptied it, so it is the only control that can undo it.
          A checkbox appearing and disappearing beside a control that never moves is a layout shifting
          under the operator mid-task; dimmed in place says "nothing to select" without it. */}
      <div
        data-demo={selectAllDemoId}
        role="checkbox"
        aria-checked={allSelected}
        // Not the `disabled` attribute — this is a div, so it would do nothing. `aria-disabled` carries
        // the state and dropping the handler carries the behaviour, the same split `FooterButton` uses
        // for a blocked control (CLAUDE.md §6).
        aria-disabled={!canSelectAll}
        onClick={canSelectAll ? onSelectAll : undefined}
        className={`flex items-center gap-2 w-fit ${
          canSelectAll ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
            someSelected ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
          }`}
        >
          {allSelected ? (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          ) : someSelected ? (
            <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          ) : null}
        </div>
        <span className="text-[14px] text-gray-900">Select All</span>
      </div>

      <Select value={badgeFilter} onValueChange={value => onBadgeFilterChange(value as BadgeFilter)}>
        <SelectTrigger
          size="sm"
          data-demo={filterDemoId}
          aria-label="Filter by badge"
          // Green when narrowed, exactly as `Bins Available(n)` goes green when on: this app already has
          // a colour for "a view filter is active", and a second one would make two filters look like two
          // kinds of control. `#15803D` on the text rather than the stroke's own green — #22C55E is
          // 2.3:1 at this size, under the ~4.5:1 the app holds text to.
          className={`w-[150px] shrink-0 text-[14px] ${
            badgeFilter !== 'all' ? 'border-green-500 text-[#15803D]' : ''
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        {/* Above the side panels, which are `z-[70]`.
            `SelectContent` defaults to `z-50` and portals to `document.body`, so in the tray (`z-50`)
            it happened to win on DOM order and in `AllocateProductsPanel` (`z-[70]`) it did not — the
            listbox opened, sat in the DOM with `data-state="open"`, and was completely hidden behind the
            panel that owns it. Identical symptom to the tablet-mode `portalContainer` trap in CLAUDE.md
            §4, and worth recognising the same way: the control looks inert, and there is no error.
            80 keeps the app's layering — panels 70, this 80, toasts 100. */}
        <SelectContent className="z-[80]">
          {BADGE_FILTER_OPTIONS.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              // One anchor per option, not per panel: the option values are the same everywhere and only
              // one of these panels can be open at a time, so a walkthrough asking for "the Climate
              // option" cannot reach the wrong one. Keyed by name rather than position, so reordering
              // the list or rewording a label does not silently send a walk elsewhere.
              data-demo={`badge-filter-option-${option.value}`}
              // No count, and never disabled on an empty result — an option that cannot be picked removes
              // the way to ask "is there any CIV stock waiting?". Each panel's empty state names the
              // filter, so an empty result cannot be mistaken for an empty list.
              className="text-[14px]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
