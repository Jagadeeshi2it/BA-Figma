import React from 'react';
import { Check, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BadgeFilter, BADGE_FILTER_OPTIONS } from '../utils/badgeFilter';

/**
 * The two controls both allocation panels put above their product list — the badge filter, which lives
 * **in the search row**, and `Select All`, which sits alone directly above the rows.
 *
 * **Two parts rather than one row, because they scope differently, and the row was saying they didn't.**
 * They shared a line between the search box and the list, which reads as both governing whatever is
 * beneath — and `Select All` does exactly that, acting on the rows on screen whichever list they came
 * from. The filter does not: it narrows the *catalogue* the search draws from, and it has no business
 * narrowing a selection the operator assembled one product at a time. Sitting them together produced the
 * bug in both directions in one day — a filter that ignored the selected list, then one that hid picks
 * from it. Beside the box it narrows, the scope needs no explaining.
 *
 * **Still one module, and still one implementation each**, for the reason CLAUDE.md §6 gives about these
 * two panels: they are the workflow menu's two allocation entries, so a difference between them implies
 * the two flows work differently. That rule had been holding by inspection, which is how the tray came to
 * render only the vial badge while the other panel rendered all three. Same pattern as `PipelineFooter` —
 * parts a caller composes, so a panel chooses what it needs and never how it looks.
 *
 * The pairing is still the workflow — narrow to a kind, then take all of it. Most climate-sensitive stock
 * goes to a fridge, so "show me the Climate products and tick them" is the commonest way a delivery gets
 * put away, and it was eight rows to read and eight taps. One row apart does not break that; the two
 * controls are still a search box apart, in the order the job is done.
 */
export function SelectAllToggle({
  allSelected,
  someSelected,
  canSelectAll,
  onSelectAll,
  demoId
}: {
  allSelected: boolean;
  someSelected: boolean;
  /** Whether anything is listed for `Select All` to act on. */
  canSelectAll: boolean;
  onSelectAll: () => void;
  // Spelled out by each panel rather than derived from a prefix here, so the anchors stay greppable
  // literals — `scripts/verify-demo-anchors.mjs` reads them at the call site.
  demoId: string;
}) {
  return (
    <>
      {/* Visible always, dimmed when there is nothing to tick.
          It was withheld once, on the reasoning that a control which cannot act reads as broken rather
          than unavailable. Dropped when the filter shared this row — the filter has to stay reachable
          precisely when the list is empty, since it is usually what emptied it. The filter has moved up
          into the search row and this control is now alone on its line, so that argument no longer holds
          it. What does is the other half: a checkbox that appears and disappears as the list fills and
          empties is a layout shifting under the operator mid-task, and the gap between the search box and
          the first row would close and open with it. Dimmed in place says "nothing to select" without
          moving anything. */}
      <div
        data-demo={demoId}
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
    </>
  );
}

/**
 * The badge filter, sized to sit at the end of a panel's search row.
 *
 * Its position is the documentation: beside the box, it reads as part of the query rather than as a
 * second control over the list, which is exactly what it is — a narrowing of what a search can return
 * (`AllocateProductsPanel`) or of the fixed set on offer (the tray). Move it back down beside
 * `Select All` and the scope question reopens; see this module's header.
 */
export function BadgeFilterSelect({
  badgeFilter,
  onBadgeFilterChange,
  demoId
}: {
  badgeFilter: BadgeFilter;
  onBadgeFilterChange: (filter: BadgeFilter) => void;
  demoId: string;
}) {
  return (
    <Select value={badgeFilter} onValueChange={value => onBadgeFilterChange(value as BadgeFilter)}>
      <SelectTrigger
        // `default`, not `sm`: it sits in the search row now, and `sm` is h-8 against the box's h-9 —
        // a 4px stagger on two controls sharing one line, which reads as one of them being misaligned
        // rather than smaller on purpose.
        size="default"
        data-demo={demoId}
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
        // 120px, leaving the search box the rest of the row — it was 150 when this sat on its own line
        // opposite Select All, where the width cost nothing; sharing a row with the box, every pixel
        // here is one the query does not get.
        //
        // The tighter padding is what makes 120 honest. `All products` is 78px of text, and at the
        // primitive's `px-3 gap-2` the trigger needs 128 — at 120 the value's `line-clamp-1` silently
        // ate the "s" and the control read `All product`. `!` because these fight the same utilities on
        // the base class, where class order in the string decides nothing (CLAUDE.md §4).
        className="w-[120px] !px-2 !gap-1 shrink-0 text-[14px] active:border-[#095192] active:text-[#095192]"
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
  );
}
