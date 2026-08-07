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
        {/* Named for what the tap does next, like every other button in the app — `Select All` while
            there is anything left to tick, `Unselect All` once everything listed is ticked. A control
            reading `Select All` above a fully ticked list leaves the operator to work out that it must
            therefore clear.

            Keyed on `allSelected`, not `someSelected`, and that is exactly what both panels' toggles now
            do: a partial selection COMPLETES rather than clears, so the label is true in all three
            states. Multi Bin used to clear from partial, which is why that had to change with this —
            the label and the behaviour are one decision, and splitting them is how a control comes to
            lie. */}
        <span className="text-[14px] text-gray-900">{allSelected ? 'Unselect All' : 'Select All'}</span>
      </div>

      <Select value={badgeFilter} onValueChange={value => onBadgeFilterChange(value as BadgeFilter)}>
        <SelectTrigger
          size="sm"
          data-demo={filterDemoId}
          aria-label="Filter by badge"
          // Blue only while the control is being pressed, then straight back to default.
          //
          // It used to go green and STAY green for as long as a filter was applied, borrowing
          // `Bins Available(n)`'s "a view filter is on" colour. Dropped: the two are not the same kind of
          // control. That one is a toggle whose whole state is on-or-off, so a colour is the only thing
          // that can report it; this one already says what it is doing in its own label — the trigger
          // reads `Climate`, not `All products`. Colouring it as well stated the same fact twice, in a
          // green that pulled the eye to the least surprising thing on the panel.
          //
          // `active:` is the press itself, not the open dropdown: a trigger that stayed blue while its
          // listbox was open would be back to a persistent state colour by another route.
          className="w-[150px] shrink-0 text-[14px] active:border-[#095192] active:text-[#095192]"
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
