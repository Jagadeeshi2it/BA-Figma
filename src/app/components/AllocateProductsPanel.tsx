import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { X, Search, Check, CheckCircle2, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ValidationToast } from './ui/sonner-1';
import { getBinLocationDetails } from '../utils/doorUtils';
import { searchProducts, ProductSearchResult } from '../utils/productSearchUtils';
import { SelectAllToggle, BadgeFilterSelect } from './ProductListControls';
import { BadgeFilter, badgeFilterLabel, matchesBadgeFilter } from '../utils/badgeFilter';
import ProductBadges from './ProductBadges';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { DoorShelfConfig } from '../types';

interface AllocateProductsPanelProps {
  doorShelfConfig: DoorShelfConfig;
  // Bins tapped on the canvas, owned by the same channel the unallocated-products flow uses.
  selectedBinsForAssignment: string[];
  onConfirmAssignment: (products: ProductSearchResult[], binIds: string[]) => void;
  onClose: () => void;
  // Identity keys of the ticked products, reported so a bin tap on the canvas can be gated on a
  // product being chosen first and refuse a bin that already holds all of them — the picked
  // product objects themselves stay local to this panel (see selectedProducts below), so this is
  // the bit the shelf's bin-click handler needs lifted out of it.
  onSelectionChange?: (keys: string[]) => void;
}

const productKeyOf = (product: ProductSearchResult) => `${product.ndc}|${product.inventoryType}`;

/**
 * One product row, shared by the search results and the "selected so far" list under the empty state.
 *
 * Extracted rather than written twice: both lists show the same product in the same state, and a row that
 * drifted between them would make the selected list read as a different kind of thing from the results it
 * came from. Module scope, above the panel, because it is a pure function of its props — the same reason
 * scanKey lives outside its screen (CLAUDE.md §4).
 */
function ProductRow({
  product,
  isSelected,
  onToggle,
  selectedBinsForAssignment,
  doorShelfConfig
}: {
  product: ProductSearchResult;
  isSelected: boolean;
  onToggle: (product: ProductSearchResult) => void;
  selectedBinsForAssignment: string[];
  doorShelfConfig: DoorShelfConfig;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      // One anchor for both lists, because it is one row — a walkthrough asking for "a product row"
      // should not have to know which of the two it is looking at.
      data-demo="allocate-product"
      aria-pressed={isSelected}
      aria-label={`Select ${product.name} for assignment`}
      onClick={() => onToggle(product)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(product);
        }
      }}
      className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
        isSelected ? 'bg-[#F1F6FA]' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Same square as the unallocated list rather than a native checkbox — the whole
            row is the control here too, and a real checkbox invites aiming at the box. */}
        <div
          className={`mt-0.5 w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center ${
            isSelected ? 'bg-[#095192]' : 'border border-gray-300 bg-white'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Display name and generic name are one block, badges below both — the shape
              the bin rows and the other side panels use. */}
          <div>
            <h3 className="font-normal leading-[20px] text-[14px] text-[#020817]">
              {product.name}
            </h3>
            {product.description && (
              <p className="italic text-gray-500 leading-snug text-[14px]">
                {product.description}
              </p>
            )}
          </div>
          {/* The shared component, not a local copy of the same three spans — the badges the panel's
              own filter narrows on have to be the badges it shows. */}
          <div className="flex items-center gap-1">
            <ProductBadges product={product} />
          </div>
          <div className="text-gray-500 text-[14px] break-words">
            {product.ndc} - {product.inventoryType}
          </div>

        </div>

        {/* Total across every location, in the same figure box the other side panels
            use — so the number answers "how much of this is in the cabinet?" rather than
            repeating one bin's share. */}
        <div className="bg-[#f7f7f7] box-border flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-12">
          <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
          <div className="font-medium text-[#020817] text-[14px] leading-[16px]">
            {product.totalQuantity}
          </div>
          <div className="font-semibold text-[#676b74] text-[9px] leading-[normal]">
            {pluralizeUnit('vial', product.totalQuantity)}
          </div>
        </div>
      </div>

      {/* Where it already lives, spanning the row's full width so each bin's quantity
          lines up under the total above it. Indented to the product name: the tick box
          belongs to the row, not to the locations. */}
      <div className="pt-2 ml-8 space-y-1">
            {product.binLocations.map(location => (
              <div
                key={location.binId}
                className="flex items-center justify-between gap-2 text-[13px]"
              >
                <span className="text-[#020817] min-w-0 truncate">
                  {location.binName} - {location.shelfName}, {location.doorName}
                </span>
                <span className={`shrink-0 ${location.quantity === 0 ? 'text-[#676b74]' : 'text-[#020817]'}`}>
                  {location.quantity} {pluralizeUnit('vial', location.quantity)}
                </span>
              </div>
            ))}
      </div>

      {/* Where it is about to go, once bins have been tapped — below the product, in the
          same purple the shelf gives an assignment-selected bin (BinCard's #8F48D2 ring
          and border), so this list and the highlighted card read as one selection rather
          than the panel inventing its own colour for it. Only on picked rows: the bins
          belong to the selection, not to every product on screen. */}
      {isSelected && selectedBinsForAssignment.length > 0 && (
        <div className="ml-8">
          <Separator className="my-2" />
          <div className="space-y-1">
            {selectedBinsForAssignment.map(binId => {
              const location = getBinLocationDetails(binId, doorShelfConfig, false);
              return location ? (
                // text-[13px], matching the already-allocated bin list directly above rather than the
                // 12px it used to be: the two lists are the same kind of fact about the same product —
                // where it is now, where it is going — and a size change between them read as a change
                // of importance rather than of meaning. The purple carries the difference.
                <div key={binId} className="text-[13px] text-[#8F48D2] font-medium">
                  {location}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Giving products additional bins. Search for products, tick them, tap bins on the shelves.
 *
 * This deliberately does NOT unallocate. Releasing a bin used to live here too — a control on any
 * location sitting at 0 — and having both directions on one screen made the screen hard to read:
 * the same row offered to give a product a home and to take one away, gated on a quantity rule that
 * had to be explained before either made sense. Unallocation still happens where it always did,
 * as the prompt that follows a move emptying a bin, which is the moment it is actually wanted.
 *
 * Multi-select, because clearing a delivery into bins is a batch job. Each product still lists the
 * bins it already occupies: that is the context for choosing another one, and it is what stops a
 * second bin being picked for stock that is already there.
 */
export default function AllocateProductsPanel({
  doorShelfConfig,
  selectedBinsForAssignment,
  onConfirmAssignment,
  onClose,
  onSelectionChange
}: AllocateProductsPanelProps) {
  const [query, setQuery] = useState('');
  // The picked products themselves, not their keys. Keys plus a lookup in `results` looked
  // equivalent, but `results` changes with every search — so a product picked under one query
  // silently vanished from the selection as soon as the query moved on, which is the reset. Holding
  // the objects makes the selection independent of what happens to be listed, the way the
  // unallocated tray's own selection is independent of its filter.
  const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
  // Panel-local, unlike the tray's — there the hook owns it because `Select All` is a hook handler and
  // the two must agree on what is visible. Here both live in this component, so there is nothing to
  // agree with across a boundary.
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');

  useEffect(() => {
    onSelectionChange?.(selectedProducts.map(productKeyOf));
  }, [selectedProducts, onSelectionChange]);

  const hasQuery = query.trim().length > 0;
  const filterIsActive = badgeFilter !== 'all';

  // Nothing until asked for. Listing all 262 products on open made this a catalogue to scroll
  // rather than a tool — you arrive already knowing which product you mean.
  //
  // **The badge filter narrows the results; it cannot produce them.** With no query this stays empty
  // whatever the filter says, and that is deliberate: the filter is a refinement of a search, not a
  // second way to browse. Letting `Climate` alone list every climate-sensitive product would reinstate
  // exactly the catalogue-to-scroll this panel was built to avoid — the badges split the catalogue
  // roughly in half, so it would be ~130 rows. It is still useful before typing, as a pre-set: choose
  // `Climate`, then search, and only climate-sensitive matches come back.
  //
  // The tray works the other way round for the same reason in reverse — it lists a fixed eight, so
  // narrowing them by badge with no query is the whole point there.
  const results = useMemo(
    () =>
      hasQuery
        ? searchProducts(doorShelfConfig, query).filter(product => matchesBadgeFilter(product, badgeFilter))
        : [],
    [doorShelfConfig, query, hasQuery, badgeFilter]
  );

  const selectedKeys = useMemo(() => new Set(selectedProducts.map(productKeyOf)), [selectedProducts]);

  /**
   * The selection, newest pick first — the order the `Selected products` list renders in.
   *
   * Appending put the newest row at the bottom, which is off screen the moment the selection outgrows
   * the panel: the operator ticks a product, comes back to check, and sees the one they picked first.
   * The row that just changed is the one they are looking for, so it goes where they are already looking.
   *
   * Reversed here rather than by prepending in `toggleProduct`, because `selectedProducts` is also what
   * `onConfirmAssignment` receives and what the history entry is built from, and a ledger reads in the
   * order the work was done. This is a view of that list, not a different list.
   */
  const selectionNewestFirst = useMemo(() => [...selectedProducts].reverse(), [selectedProducts]);


  // A product already sitting in a bin that's already picked can't be ticked — allocating it there
  // again would just be skipped at confirm (the same identity can't sit twice in one bin), and
  // letting the tick "succeed" only to unpick the bin behind the user's back was worse: it looked
  // like the panel was fighting the selection instead of refusing an act that was never valid.
  // Blocking the tick itself, with a reason, is the one point that can't produce that state at all.
  const conflictsWithSelectedBins = (product: ProductSearchResult) =>
    product.binLocations.some(location => selectedBinsForAssignment.includes(location.binId));

  const toggleProduct = (product: ProductSearchResult) => {
    const key = productKeyOf(product);
    const isSelected = selectedProducts.some(candidate => productKeyOf(candidate) === key);

    if (!isSelected && conflictsWithSelectedBins(product)) {
      toast.custom(
        () => React.createElement(ValidationToast, {
          message: 'This product is already in a selected bin. Deselect that bin, or choose a different product.'
        }),
        { duration: 4000 }
      );
      return;
    }

    setSelectedProducts(previous =>
      isSelected
        ? previous.filter(candidate => productKeyOf(candidate) !== key)
        : [...previous, product]
    );
  };

  /**
   * The rows actually on screen — which is **not** always `results`.
   *
   * With the search box clear the panel does not go blank: it lists the current selection under a
   * `Selected products` header, so the picks stay visible and droppable after the query that found them
   * has moved on (see the empty state below). Those rows are a list like any other, and Select All has
   * to act on them — keying the control on `results` alone is what made it go dead in exactly that
   * state: a fully ticked list on screen, and the one control that could clear it in a single tap greyed
   * out, so clearing a long selection meant unticking row by row.
   *
   * **While a search is running the selection is not listed at all**, so nothing is on screen for Select
   * All to act on and it is correctly dead there. That is the whole reason this reads `hasQuery` rather
   * than just falling back on `selectedProducts`: the two have to agree with the JSX below, or the
   * control acts on rows the operator cannot see — the one thing its label forbids.
   */
  const listedProducts = results.length > 0 ? results : hasQuery ? [] : selectedProducts;

  // Select All acts on what is listed, not on the catalogue — the filter and the search are how the
  // user says which products they mean, so ticking "all" of something they cannot see would be a
  // different act than the one the label describes. Its box therefore reflects the visible rows,
  // while the footer counts everything picked across every search.
  //
  // In the selected-products state every listed row is by definition ticked, so the box reads as fully
  // checked and the tap can only clear — which is precisely the "unselect all while reviewing" the
  // control is wanted for.
  const allVisibleSelected =
    listedProducts.length > 0 && listedProducts.every(product => selectedKeys.has(productKeyOf(product)));
  const someVisibleSelected = listedProducts.some(product => selectedKeys.has(productKeyOf(product)));

  const toggleAll = () => {
    const visible = new Set(listedProducts.map(productKeyOf));

    // Clears only when EVERY listed row is already ticked; a partial selection completes instead.
    //
    // It used to clear from a partial selection too, which is the opposite of what the tray does and
    // could not survive the control naming its own action: the label reads `Select All` until everything
    // is ticked, so a partial tap that cleared would have made it lie. Completing is also the more useful
    // half — from three of eight you usually want the other five, and clearing is then one more tap.
    //
    // Clearing is never blocked, unlike adding: only picking something new up can conflict with a bin.
    if (allVisibleSelected) {
      setSelectedProducts(previous => previous.filter(candidate => !visible.has(productKeyOf(candidate))));
      return;
    }

    const toAdd = listedProducts.filter(product => !selectedKeys.has(productKeyOf(product)));
    const blocked = toAdd.filter(conflictsWithSelectedBins);
    const allowed = toAdd.filter(product => !conflictsWithSelectedBins(product));

    if (blocked.length > 0) {
      toast.custom(
        () => React.createElement(ValidationToast, {
          message: blocked.length === 1
            ? '1 product was skipped — it is already in a selected bin.'
            : `${blocked.length} products were skipped — they are already in a selected bin.`
        }),
        { duration: 4000 }
      );
    }

    if (allowed.length > 0) {
      setSelectedProducts(previous => [...previous, ...allowed]);
    }
  };

  /**
   * Emptying the search box drops the badge filter with it.
   *
   * **The filter belongs to the search.** It narrows what a query can return and cannot produce a list
   * on its own, so the two are one act of asking, and clearing half of it leaves a narrowing in force
   * over a box that no longer explains it. What made that concrete: with the box clear this panel lists
   * the *selection*, and a filter still running there hid picks the footer's count insisted were still
   * held — "show me my 4 products", answered with 2, under a `Selected products` header.
   *
   * Every route that empties the box goes through here — the X, the footer's counter button, and
   * backspacing to nothing — because a rule honoured by two of the three is worse than not having it.
   *
   * **The pre-set survives**, which is the one use that needs the filter to outlive a query: this fires
   * on *clearing*, not on *being clear*, so choosing `Climate` on an empty box and then typing works
   * exactly as before. What it costs is carrying a filter from one search straight into the next, which
   * is a keystroke to redo and was never what the control was for.
   */
  const setSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length === 0) setBadgeFilter('all');
  };

  /**
   * Show me what I have picked. Clearing the search is the whole implementation, because the panel's
   * empty state is already a no-query view of the selection — so there is no second "review" surface to
   * build or keep in step, and no mode to be in or out of. The filter goes with it via `setSearch`.
   *
   * It does not touch `selectedProducts`, and must not: this is a way of *looking* at the selection, and
   * a control that reviewed and reset it would be one tap from losing work the operator spent several
   * searches assembling.
   *
   * No blur. `Input` here is a plain component with no ref, and unlike `HeaderSection` this box gates
   * nothing on a React "focused" flag — so the desync trap in CLAUDE.md §4 does not apply, and leaving
   * the caret where it is means the next keystroke starts a new search rather than nothing at all.
   */
  const reviewSelection = () => setSearch('');

  const canConfirm = selectedProducts.length > 0 && selectedBinsForAssignment.length > 0;

  const productCount = selectedProducts.length;
  const binCount = selectedBinsForAssignment.length;

  return (
    <div className="fixed inset-y-0 right-0 w-[440px] bg-white border-l border-gray-200 shadow-lg z-[70] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Named for the menu entry that opens it. It said "Allocate Product", which is now the OTHER
              entry — the one for products with no bin at all — so the panel was announcing itself as the
              flow the operator had just chosen not to run. */}
          <h2 className="text-[16px] font-medium text-[#020817]">Multi Bin Assignment</h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[#676b74] hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* py-3, matching the header: 12px is the panel's vertical rhythm throughout. */}
      <div className="py-3 px-4 border-b border-gray-200 space-y-3">
        {/* The badge filter sits at the end of this row, not on the Select All line below it. It narrows
            what a search can return, so beside the box is where it says so — on the row underneath it
            read as a second control over the list, which is a claim it cannot honour once that list is
            the selection. See ProductListControls. */}
        <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#676b74]" />
          <Input
            data-demo="allocate-search"
            // Focused the moment the panel opens. Searching is not one way into this flow, it is the
            // only one — the list below is empty until something is typed, so every visit begins with
            // this box and the operator would otherwise have to click it first every single time. The
            // tray deliberately does NOT do this: it lists its products on open, so the first act there
            // is picking a row that is already on screen, and stealing focus would point at the wrong
            // control (and, on a tablet, raise a keyboard nobody asked for).
            autoFocus
            value={query}
            onChange={event => setSearch(event.target.value)}
            // "Search products", same as the tray's. "…in this cabinet" was scoping the search out loud,
            // which the panel it sits in already does.
            placeholder="Search products"
            // pr-9 leaves room for the clear button, so a long query runs under the icon rather than
            // behind it.
            className="pl-9 pr-9"
          />
          {/* Only once there is something to clear — an always-present X on an empty box is a control
              that does nothing. Same affordance as the header's own search box. */}
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#676b74] hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

          <BadgeFilterSelect
            badgeFilter={badgeFilter}
            onBadgeFilterChange={setBadgeFilter}
            demoId="allocate-badge-filter"
          />
        </div>

        {/* Alone on its line, directly above the rows it acts on — which is the whole of what it claims.
            Ticking everything and clearing it are the same tap, so there is no separate Clear. */}
        <SelectAllToggle
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          // What is on screen, not what the search returned — with no results the panel lists the
          // selection instead, and Select All is how that gets cleared in one tap.
          canSelectAll={listedProducts.length > 0}
          onSelectAll={toggleAll}
          demoId="allocate-select-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          /* Two different empty states, split on whether a search is running.

             **While searching, the list is the search's alone.** A no-match message followed by a list
             of products that plainly do not match reads as a contradiction — the panel says nothing was
             found and then shows rows — and it buries the one line that answers what the operator just
             did. If a selected product happens to match the query it appears in the results like any
             other row, already ticked, which is the honest place for it.

             **With the box clear, the selection is listed.** It is not the search's to lose: the picks
             survive a query changing (see selectedProducts), so without this they existed only as a
             number in the footer — "2 Products selected" with no way to see WHICH two, or drop one,
             without remembering the query that found each. Here they are in the same rows they were
             ticked in, so a tap unticks. */
          <>
            {hasQuery ? (
              // Names the filter when one is on, the same as the tray's. A query that matched something
              // and a filter that then removed it look identical without this, and the filter is the
              // narrowing the operator is least likely to be holding in mind — they typed the query a
              // second ago, while the filter sits above and outlives whatever they do in the box.
              <div className="p-8 text-center text-[14px] text-[#676b74]">
                {filterIsActive
                  ? `No ${badgeFilterLabel(badgeFilter)} products match that search.`
                  : 'No products match that search.'}
              </div>
            ) : selectedProducts.length > 0 ? (
              <>
                {/* No count here — the footer already carries it, and two figures for one number
                    invites checking whether they agree. This says what the list IS. */}
                <div className="px-4 py-2 border-b border-gray-200 bg-[#f7f7f7] text-[12px] leading-[16px] font-medium text-[#676b74]">
                  Selected products
                </div>
                <div className="divide-y divide-gray-200">
                  {selectionNewestFirst.map(product => (
                    <ProductRow
                      key={productKeyOf(product)}
                      product={product}
                      // Always ticked: this list IS the selection, so the row's tap can only remove.
                      isSelected
                      onToggle={toggleProduct}
                      selectedBinsForAssignment={selectedBinsForAssignment}
                      doorShelfConfig={doorShelfConfig}
                    />
                  ))}
                </div>
              </>
            ) : (
              // The next action first, in its own sentence, naming the control it happens in — the
              // cursor is already sitting in that box, so the line reads as a caption for the thing
              // the operator is about to do rather than as a description of the flow. It ran as one
              // sentence with three verbs in it ("Search for and select … then select …"), which
              // buried the only step available right now behind two that are not, and said "select"
              // for both products and bins where the panel's own controls are a tick and a tap.
              <div className="p-8 text-center text-[14px] text-[#676b74]">
                <p className="mb-1">Start typing in the search box above to find a product.</p>
                <p>Tick one or more, then tap the bins on the left canvas to allocate them.</p>
              </div>
            )}
          </>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map(product => (
              <ProductRow
                key={productKeyOf(product)}
                product={product}
                isSelected={selectedKeys.has(productKeyOf(product))}
                onToggle={toggleProduct}
                selectedBinsForAssignment={selectedBinsForAssignment}
                doorShelfConfig={doorShelfConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* Same action bar as the unallocated tray: the counters on the left say what has been
          gathered and what is still missing, and Allocate stays disabled until both halves exist.
          The two halves are collected on different surfaces — products in here, bins out on the
          shelves — so a single disabled button could not say which one was outstanding.
          Cancel sits beside Allocate rather than across the bar, so the counters own the left. */}
      <div className="py-3 px-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
        {/* The two counters are one control: what has been gathered, and the way back to it.

            They were two static lines. Making them a single button gives the selection a dedicated place
            to be reviewed and edited — tapping clears the search, which is exactly what puts the
            `Selected products` list back on screen (see the empty state above, which is a no-query view).
            So the operator can bounce between "what am I finding" and "what have I got" without emptying
            the search box by hand and without losing the picks either way.

            One control rather than two because they are one fact — the state of the assembly — and the
            bin half is not separately actionable: bins are picked out on the shelves, not in here.

            Chevron and colour follow `SummaryCell` in the pipeline footer, which is the app's existing
            idiom for "this cell opens a view of the selection", down to withholding the affordance when
            there is nothing to look at. Here that is the whole block: nothing selected needs no
            instruction, because the disabled Allocate button already says so.

            Not offered in the unallocated tray, though the two panels otherwise share this bar — the tray
            has no selected-products list for it to reveal (the gap CLAUDE.md §8 records), so the same
            control there would clear the box and show the tray, which is not the same act. */}
        {productCount > 0 ? (
          <button
            type="button"
            data-demo="allocate-review-selection"
            onClick={reviewSelection}
            aria-label={`Review the ${productCount} selected product${productCount > 1 ? 's' : ''}`}
            // Negative margin so the hover tint has room to breathe without the counters shifting when
            // the block becomes a button.
            className="-mx-2 px-2 py-1 rounded-[4px] flex items-center gap-2 text-left text-[14px] leading-[20px] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-[#095192]">
                {productCount} Product{productCount > 1 ? 's' : ''} selected
              </span>
              <span className="block text-[#8F48D2]">
                {binCount === 0
                  ? 'Select bin(s) to allocate'
                  : `${binCount} Bin${binCount > 1 ? 's' : ''} selected`}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#095192] shrink-0" />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-demo="allocate-cancel"
            onClick={onClose}
            className="h-9 px-3 inline-flex items-center rounded-[4px] text-[14px] leading-[20px] bg-white text-[#095192] border border-[#095192] hover:bg-[#F1F6FA] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div
            data-demo="allocate-confirm"
            className={`relative rounded-[4px] shrink-0 bg-[#095192] ${
              canConfirm ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={
              canConfirm
                ? () => {
                    onConfirmAssignment(selectedProducts, selectedBinsForAssignment);
                    setSelectedProducts([]);
                  }
                : undefined
            }
          >
            <div className="box-border flex gap-2 items-center justify-center h-9 px-4">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <div className="capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic shrink-0 text-[14px] text-nowrap text-white">
                <p className="leading-[20px] whitespace-pre text-[14px]">Allocate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
