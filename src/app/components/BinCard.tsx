import React from 'react';
import { Bin } from '../types';
import {
  highlightText,
  highlightNDC,
  doesProductMatchSearch,
  SEARCH_HIGHLIGHT_COLOR,
  SOURCE_HIGHLIGHT_COLOR,
  TARGET_HIGHLIGHT_COLOR
} from '../utils/textHighlight';
// Grouping and badges are shared with AllProductsPanel so both views of a bin agree.
import { consolidateBinProducts, getVialType, hasClimateBadge, hasCivBadge, selectionBadge } from '../utils/binProducts';
import { sourcePickKey, sourcePickQueryGroup } from '../utils/sourcePicks';

interface BinCardProps {
  bin: Bin;
  isSelected?: boolean;
  highlightAvailable: boolean;
  highlightSearch?: boolean;
  /**
   * Which part of this bin's own NAME to colour in, or '' for none — supplied only when the operator
   * asked for this bin by name. Handed down rather than derived from searchQuery, because the decision
   * is per bin id: a bin name repeats across doors, so nothing this card can see distinguishes the bin
   * that was asked for from its seven namesakes (see ShelfLayout's isBinHighlighted).
   */
  binNameHighlightQuery?: string;
  isSelectedForAssignment?: boolean;
  isChangeAllocationSource?: boolean;
  isChangeAllocationTarget?: boolean;
  /**
   * A Move To bin this screen cannot take back — set only by `Add Move To Bin`'s overlay, for the bins
   * already receiving the product. The card looks identical (it is still a target); the badge says
   * `Already selected` rather than `Move To`, because tapping it is refused while a bin picked in this
   * visit toggles. See `selectionBadge`.
   */
  isCommittedChangeAllocationTarget?: boolean;
  changeAllocationMode?: boolean;
  showUnallocatedProducts?: boolean;
  onClick: (binId: string) => void;
  onProductClick?: (product: any, location: any) => void;
  // Move by Product, source step: the BIN is not selectable there, but its product rows are — a tap
  // picks that product out of this bin, so the canvas is a second way in alongside the search bar.
  canPickSourceProduct?: boolean;
  // Which kind of move is running, so a source bin can describe itself in the unit the operator picked.
  moveMode?: 'bin' | 'product' | null;
  /**
   * The product identities picked IN THIS BIN (utils/sourcePicks). Counting from a query instead — even
   * the source query — overstated it: a query has no bin attached, so every identity picked anywhere
   * matched whatever this bin happened to contain.
   */
  pickedProductKeys?: string[];
  onSelectSourceProduct?: (product: any) => void;
  // "All products" modal state lives in App so it survives the product detail page.
  allProductsBinId?: string | null;
  onOpenAllProducts?: (binId: string) => void;
  onCloseAllProducts?: () => void;
  className?: string;
  style?: React.CSSProperties;
  selectedDoor?: string;
  searchQuery?: string;
}

export default function BinCard({
  bin,
  isSelected = false,
  highlightAvailable,
  highlightSearch = false,
  binNameHighlightQuery = '',
  isSelectedForAssignment = false,
  isChangeAllocationSource = false,
  isChangeAllocationTarget = false,
  isCommittedChangeAllocationTarget = false,
  changeAllocationMode = false,
  showUnallocatedProducts = false,
  onClick,
  onProductClick,
  canPickSourceProduct = false,
  moveMode = null,
  pickedProductKeys,
  onSelectSourceProduct,
  allProductsBinId = null,
  onOpenAllProducts,
  onCloseAllProducts,
  className = "",
  style,
  selectedDoor,
  searchQuery = ""
}: BinCardProps) {
  // Convert bin size to numerical format
  const getBinSizeDisplay = (size: string): string => {
    const sizeMap: { [key: string]: string } = {
      'single': '1x1',
      // Footprints are named rows x cols, so a 2-slot bin is 1x2 in either
      // orientation — gridPosition is what says which way round it sits.
      'double': '1x2',
      '2x2': '2x2',
      '2x3': '2x3',
      '3x3': '3x3',
      'fridge': 'Fridge',
      'floor': 'Floor'
    };
    return sizeMap[size] || size;
  };

  // Group identical products by name, NDC, and inventory type to avoid duplicates
  const consolidatedProducts = React.useMemo(
    () => consolidateBinProducts(bin),
    [bin.products, bin.available]
  );

  // The one pooled bin behind a fridge door. Keyed on the bin's own size rather than the door name,
  // so it holds wherever such a bin is rendered.
  const isFridgeBin = bin.size === 'fridge';

  // Define doors where product limiting applies (extract number from "Door X" format). 4 and 8 are
  // the bottom "unique" doors — the only place 2x2/2x3/3x3 footprints occur — so they need the cap
  // too or those sizes' limits in DISPLAY_LIMIT_BY_SIZE below never have anywhere to apply.
  const doorsWithLimiting = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const doorNumber = selectedDoor ? selectedDoor.replace('Door ', '') : '';
  const shouldLimit = doorNumber && doorsWithLimiting.includes(doorNumber) && bin.size !== 'fridge';

  // How many products fit before "+N more", fixed per footprint rather than derived from
  // gridPosition — a rotated 2x3 (3 rows, 2 cols) and its unrotated twin (2 rows, 3 cols) are the
  // same physical size and should tuck away the same number of rows regardless of which way they sit.
  const DISPLAY_LIMIT_BY_SIZE: Record<Bin['size'], number> = {
    single: 1,
    double: 2,
    '2x2': 2,
    '2x3': 3,
    '3x3': 4,
    fridge: 3,
    floor: 3
  };
  const baseDisplayLimit = DISPLAY_LIMIT_BY_SIZE[bin.size] ?? 3;

  // The size-based cap above is a floor, not a ceiling. A bin's card is stretched by CSS Grid to
  // match the tallest bin in its shelf row (e.g. a 2x2 sitting beside a column of two stacked 1x1s),
  // so it often ends up with far more room than its own base cap needs — the extra height just sat
  // empty above "+N more". This measures that leftover room after mount and lets the cap grow to
  // fill it, capped at the bin's actual product count.
  const [heightFitCount, setHeightFitCount] = React.useState(0);
  const contentAreaRef = React.useRef<HTMLDivElement>(null);
  const firstRowRef = React.useRef<HTMLDivElement>(null);
  const moreLinkRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLDivElement>(null);

  // The multi-column grids (fridge, and the Door 17-19 Emergency Kit layout) arrange products
  // side by side rather than stacked, so a horizontal divider between rows doesn't apply there.
  const isStackedProductList =
    bin.size !== 'fridge' && !(selectedDoor && ['Door 17', 'Door 18', 'Door 19'].includes(selectedDoor));

  const displayLimit = Math.min(consolidatedProducts.length, Math.max(baseDisplayLimit, heightFitCount));

  // Products matching the active search are floated to the front, and the visible
  // window grows to fit all of them. Without this a searched-for product sitting past
  // the limit stays hidden behind "+N more": the bin lights up because
  // binMatchesSearch looks at ALL its products, so the user is pointed at a bin and
  // then can't see the thing they asked for. Non-matching products keep the
  // cap, so a card only grows when it actually holds a match.
  const visibleProducts = React.useMemo(() => {
    if (!shouldLimit || consolidatedProducts.length <= displayLimit) return consolidatedProducts;

    const matches = searchQuery.trim()
      ? consolidatedProducts.filter(product => doesProductMatchSearch(product, searchQuery))
      : [];

    if (matches.length === 0) return consolidatedProducts.slice(0, displayLimit);

    const matched = new Set(matches);
    const rest = consolidatedProducts.filter(product => !matched.has(product));
    return [...matches, ...rest].slice(0, Math.max(displayLimit, matches.length));
  }, [consolidatedProducts, shouldLimit, searchQuery, displayLimit]);

  const additionalCount = consolidatedProducts.length - visibleProducts.length;

  /**
   * How many of THIS bin's products the operator picked.
   *
   * Only meaningful in a Product move, where a source bin was added *because* a product in it was picked
   * and is therefore scoped to that product (CLAUDE.md §3). In a Bin move the whole bin was chosen, so
   * there is no subset to count.
   */
  const selectedProductCount = moveMode === 'product' ? (pickedProductKeys?.length ?? 0) : 0;

  // The badge's text and colour, from the one helper both this card and the fridge's shelf heading read.
  const selectionBadgeInfo = selectionBadge({
    isSource: isChangeAllocationSource,
    isTarget: isChangeAllocationTarget,
    isCommittedTarget: isCommittedChangeAllocationTarget,
    moveMode,
    pickedCount: selectedProductCount
  });

  // Measures the row height and leftover space in the actual, grid-stretched card, then converts
  // that into extra rows for heightFitCount above. A ResizeObserver rather than a one-shot effect:
  // the height being measured comes from sibling bins in the same shelf row, which can change after
  // this bin's own first paint (a search filtering the row, another bin's content updating), so the
  // fit has to be able to re-settle rather than freeze at whatever it read on mount.
  React.useLayoutEffect(() => {
    if (!shouldLimit) return;
    const container = contentAreaRef.current;
    const rowEl = firstRowRef.current;
    if (!container || !rowEl || consolidatedProducts.length === 0) return;

    const measure = () => {
      const rowHeight = rowEl.getBoundingClientRect().height;
      if (rowHeight <= 0) return;
      const moreLinkHeight = moreLinkRef.current?.getBoundingClientRect().height ?? 32;
      // Each row after the first drags along one divider, so the per-row cost for row n>1 is
      // rowHeight + dividerHeight — folded in here rather than measured per-row.
      const dividerHeight = isStackedProductList ? (dividerRef.current?.getBoundingClientRect().height ?? 5) : 0;
      const fit = Math.floor((container.clientHeight - moreLinkHeight + dividerHeight) / (rowHeight + dividerHeight));
      setHeightFitCount(prev => {
        const next = Math.max(0, Math.min(fit, consolidatedProducts.length));
        return next === prev ? prev : next;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldLimit, consolidatedProducts.length, isStackedProductList]);

  /**
   * What colour a matched product row is — decided **per row**, on whether THAT PRODUCT is picked.
   *
   * This is the same amber-means-found / blue-means-chosen rule the bin name follows, applied at the
   * level the choice was actually made. In a Product move the product *is* the unit, so a picked row is
   * a selection and takes the source blue. Everywhere else a matched row is only a search hit and stays
   * amber, however the bin around it is committed.
   *
   * Both wrong answers have been shipped. Keying it on `isChangeAllocationSource` turned a merely
   * *located* product blue the moment its bin was tapped in a Bin move — a selection rewriting a
   * highlight. Then flattening it to always-amber left a product the operator had explicitly picked
   * reading as though it had merely been found, with `1 Selected` on the badge above it and nothing on
   * the row saying which product that was. The bin is the wrong thing to ask either way; the picks are
   * the right one.
   */
  const productHighlightColorFor = (product: any): string =>
    moveMode === 'product' && pickedProductKeys?.includes(sourcePickKey(product))
      ? SOURCE_HIGHLIGHT_COLOR
      : SEARCH_HIGHLIGHT_COLOR;

  /**
   * The bin NAME carries the selection — black when the bin is nothing yet, blue as a Move From,
   * green as a Move To.
   */
  const binNameColor = isChangeAllocationSource
    ? SOURCE_HIGHLIGHT_COLOR
    : isChangeAllocationTarget
      ? TARGET_HIGHLIGHT_COLOR
      : '#020817';

  /**
   * Selection wins the name outright, exactly as it wins the card's stroke below.
   *
   * The amber marks a bin the operator went looking for and has *not* committed yet. Once it is a
   * source or a target, that is the stronger and more recent claim, and the two must not be layered:
   * a bin found by name is matched along its whole label, so the amber covered the blue completely and
   * a selected bin still read as merely "found".
   */
  const nameMatchQuery =
    isChangeAllocationSource || isChangeAllocationTarget ? '' : binNameHighlightQuery;


  // Any state that draws its own coloured stroke on this card — see the resting outline below.
  const hasStateStroke =
    isChangeAllocationSource ||
    isChangeAllocationTarget ||
    highlightSearch ||
    isSelected ||
    (highlightAvailable && bin.available) ||
    (isSelectedForAssignment && !changeAllocationMode);

  /**
   * The query a product row is highlighted against.
   *
   * In a Product move a source bin highlights exactly what was picked IN IT, derived from the picks and
   * nothing else — so the search box has no say in it, in either direction:
   *
   * - an UNPICKED row gets an empty query, or Bin 1C's OCTAGAM would light up merely because OCTAGAM was
   *   picked in Bin 1B (the highlight query is a union of identities with no bin attached)
   * - a PICKED row is matched against its own identity, so clearing the search box cannot un-highlight
   *   something that is still selected
   */
  const highlightQueryFor = (product: any): string => {
    /**
     * A bin committed as a Move To highlights nothing inside it.
     *
     * Selection outranks the highlight, which is the rule the card's stroke and its bin name already
     * follow — this is the same rule reaching the rows. Amber means "the search found this", and by the
     * target step the operator is not searching for anything: the query is a leftover from step ①, where
     * picking a product appends its identity so its rows light up wherever the drug lives. That is right
     * while they are locating it and wrong once a bin has become a destination, where it produced a green
     * Move To card with an amber row inside — two states on one card, the amber answering a question
     * nobody asked on that screen.
     *
     * Only a COMMITTED target is quietened. A bin that merely holds the drug still lights up while it is
     * being considered, which is what tells the operator this destination already stocks it.
     */
    if (isChangeAllocationTarget) return '';
    if (moveMode !== 'product' || !isChangeAllocationSource || !pickedProductKeys) return searchQuery;
    // Matched against the product's OWN identity, not the ambient query. The pick is the reason the row is
    // highlighted, so the highlight has to survive the search box being cleared — reading the query meant
    // clearing it wiped the blue off products that were still very much selected.
    return pickedProductKeys.includes(sourcePickKey(product)) ? sourcePickQueryGroup(product) : '';
  };

  const renderProduct = (product: any, index: number) => {
    // In a Product move's source step a row tap MEANS "take this product from this bin", so it wins
    // over the view-mode behaviour of opening the product's detail page — navigating away mid-selection
    // would be the opposite of what the tap is for.
    const picksSourceProduct = canPickSourceProduct && !!onSelectSourceProduct;
    const isProductClickable =
      picksSourceProduct || (!changeAllocationMode && !showUnallocatedProducts && onProductClick);

    // No refusal toast on these rows, deliberately. An unclickable row here has no handler, so the tap
    // bubbles to the card and selects the BIN — which in a Bin move, and at either kind's target step,
    // is exactly the right outcome. The only genuinely silent product row is the one in
    // AllProductsPanel, which has no bin card above it to catch the tap; that is where the mirror of
    // handleBinClick's refusal lives.

    return (
      <div
        key={product.id}
        // Only the first row needs to be measured — every row shares the same classes, so its
        // rendered height stands in for the rest when heightFitCount above works out how many more
        // fit in the space this bin's card actually got stretched to.
        ref={index === 0 ? firstRowRef : undefined}
        // Demo Mode's handle on the gesture that defines a Product move: the row, not the card, is
        // what a tap means here. Carried only while the row actually picks — in a Bin move or at
        // either kind's target step the same row is inert and the tap belongs to the bin, so anchoring
        // it unconditionally would hand a walkthrough a target that does something else entirely.
        data-demo={picksSourceProduct ? 'source-product-row' : undefined}
        // Alongside it, because "a product to move" means one with something to move. A row at 0 is
        // movable by design (the allocation relocates, CLAUDE.md §2 E) but it is not the happy path,
        // and the seed has several — Bin 1B's ALIMTA is one.
        data-product-quantity={product.quantity}
        // py-2 unconditionally: it used to ride along with the clickable state, so a row gained 8px of
        // padding the moment it became tappable and lost it again when it didn't. With three products
        // that moved a bin card by 48px — the cards visibly resettled on entering a Bin move (rows
        // inert, so unpadded) but not a Product move (rows pick, so padded), which read as the bottom
        // bar squeezing the shelves. Geometry stays put; only the affordances below are conditional.
        // No horizontal padding here: the card's own p-4 gutter already insets the row from the edge.
        className={`box-border content-stretch flex flex-row items-start justify-between gap-2 py-2 relative shrink-0 w-full rounded ${
          isProductClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
        }`}
        onClick={isProductClickable ? (e) => {
          e.stopPropagation();
          if (picksSourceProduct) {
            onSelectSourceProduct!(product);
            return;
          }
          const location = {
            cabinet: 'Cabinet',
            door: selectedDoor || '',
            bin: bin.name,
            shelf: 'Shelf'
          };
          // Deliberately leave the "all products" modal open. The detail page
          // unmounts this card, and App still holds the open-bin id, so pressing
          // Back returns the user to the modal they picked the product from
          // rather than dumping them on the shelf page.
          onProductClick(product, location);
        } : undefined}
      >
        <div className="flex-1 box-border content-stretch flex flex-col gap-0.5 items-start justify-start min-w-0 p-0 relative">
          <div className="w-full flex flex-col font-normal justify-center leading-[0] not-italic relative text-[#020817] text-xs text-left">
            <p className="block leading-[16px] text-[14px] text-[11px]">{highlightText(product.name, highlightQueryFor(product), productHighlightColorFor(product), product)}</p>
          </div>
          <div className="flex items-center gap-1 my-1">
            <span className="bg-[#D1D5DB] text-[#111827] text-[9px] font-medium px-1.5 py-0.5 rounded">{getVialType(product)}</span>
            {hasClimateBadge(product) && (
              <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
            )}
            {hasCivBadge(product) && (
              <span className="bg-[#FEF3C7] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded">CIV</span>
            )}
          </div>
          <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-xs text-left w-full">
            <p className="block leading-[16px] break-words overflow-hidden text-[14px]">{highlightNDC(`${product.ndc} - ${product.inventoryType}`, highlightQueryFor(product), productHighlightColorFor(product), product)}</p>
          </div>
        </div>
        <div className="bg-[#f7f7f7] box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded shrink-0 w-12">
          <div className="absolute border-[1px] border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded" />
          <div className="flex flex-col font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#020817] text-xs text-nowrap text-right">
            <p className="block leading-[16px] whitespace-pre text-[14px] text-[11px]">{product.quantity}</p>
          </div>
          <div className="flex flex-col font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#676b74] text-[8px] text-left text-nowrap">
            <p className="block leading-[normal] whitespace-pre text-[10px] text-[9px]">{product.unit}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        data-bin-id={bin.id}
        // Read by Demo Mode to find "a bin with room" without being told which one — the seed is
        // expected to be replaced by real cabinet data, so a scenario naming a bin id would rot.
        // The same `bin.available` draws the green stroke, so the demo taps a bin the viewer can
        // already see is free.
        data-bin-available={bin.available ? 'true' : 'false'}
        // Also for Demo Mode: having resolved "a bin with room" from the attribute above, a
        // scenario needs the bin's NAME to type into the search box. Reading it out of the header
        // text would mean stripping the size suffix, which is presentation the demo should not know.
        data-bin-name={bin.name}
        // How many product rows the bin holds — what Review will offer for it. A Move from Bin
        // walkthrough needs a source with
        // more than one, because choosing which of a bin's products actually leave is the thing that
        // makes it a Bin move at all — with a single-product bin that choice is invisible and the
        // demo shows a Product move wearing a different name. `available="false"` only says the bin
        // is not empty, which is not the same question.
        data-bin-product-count={(bin.products || []).length}
        className={`relative rounded-[4px] transition-all ${
          // The bin itself does nothing in a Product move — only its rows do — so it must not offer a
          // pointer or a hover lift it cannot honour (UX-AUDIT H9-1: a control that looks live and
          // isn't reads as broken).
          canPickSourceProduct ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
        } ${className} ${
          // Source and target bins stay white like a search hit does. A tinted fill washed out the
          // highlight colour on the matched product's own text — the thing being pointed at — and
          // the 1px stroke plus the coloured text carry the state on their own.
          isSelectedForAssignment && !changeAllocationMode ? 'bg-[#F7EFFE]' :
          'bg-white'
        } ${
          isSelected ? 'border-blue-500 border-[1px] border-solid' : ''
        } ${
          isSelectedForAssignment && !changeAllocationMode ? 'ring-1 ring-[#8F48D2]' : ''
        } ${
          // Yields to every stroke a workflow draws, exactly as the search highlight below does. The
          // filter is now on screen inside the workflows (see HeaderSection), so an available bin
          // being picked as a Move To is an ordinary event rather than a corner case — and both
          // strokes are green, so leaving the two to fight would come down to stylesheet order and
          // read as "free" on a bin the operator had already committed.
          highlightAvailable &&
          bin.available &&
          !isChangeAllocationSource &&
          !isChangeAllocationTarget &&
          !(isSelectedForAssignment && !changeAllocationMode)
            ? 'border-green-500 border-2 border-solid'
            : ''
        } ${
          // Only while the bin is nothing more than a search hit. Once it's a source or a target,
          // that state owns the stroke — two borders competing on one card would come down to
          // stylesheet order rather than intent.
          highlightSearch && !isChangeAllocationSource && !isChangeAllocationTarget
            ? 'border-[#A16207] border border-solid'
            : ''
        } ${
          isSelectedForAssignment && !changeAllocationMode ? 'border-[#8F48D2] border-[1px] border-solid' : ''
        } ${
          isChangeAllocationSource ? 'border-blue-600 border-1 border-solid' : ''
        } ${
          isChangeAllocationTarget ? 'border-green-600 border-1 border-solid' : ''
        } ${
          bin.size === 'fridge' ? 'min-h-[140px]' : 'min-h-[140px]'
        }`}
        style={style}
        onClick={() => onClick(bin.id)}
      >
        {/* Named for the act, not the role: "Move From" / "Move To" rather than "Source Bin" / "Target
            Bin". Source and target are the app's words for the two ends; move-from and move-to are the
            operator's, and the label is on a shelf they are about to reach into.

            In a Product move the source says "2 Selected" instead. They picked products — the bin is
            where those products happen to live and joined the selection as a consequence — so the badge
            reports what they chose. The count is per bin: the label sits on this card, so a figure that
            was the same on every source bin would say nothing about the one it is attached to.

            A fridge bin draws no badge here. It has no bin header for the badge to sit under, so
            top-right put it over the first product in the right-hand column, where it read as that
            product's label rather than the bin's — ShelvesSection renders it in the shelf heading
            instead, opposite the fridge name. Same helper, so the wording cannot drift apart. */}
        {!isFridgeBin && selectionBadgeInfo && (
          <p
            className={`absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] right-3 not-italic ${selectionBadgeInfo.className} text-[14px] text-nowrap text-right top-2`}
          >
            {selectionBadgeInfo.text}
          </p>
        )}
        
        {/* The resting card's own outline. It's inset just inside the card's border box, so when the
            card already carries a state stroke the two sit side by side and read as one 2px line —
            which is why a "1px" source stroke still looked heavy. Only drawn when nothing else is. */}
        {!hasStateStroke && (
          // Radius has to match the card's own — this outline is inset on top of it, so a different
          // corner here shows as a stroke cutting across the card's rounding.
          <div className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[4px]" />
        )}
        <div className="min-h-inherit relative size-full">
          <div className="box-border content-stretch flex flex-col items-start justify-start min-h-inherit p-4 relative size-full">
            {/* A fridge door holds one pooled bin, so the bin has no name of its own worth stating —
                the door heading above ("Fridge 1") already names the thing, and "Main Storage
                (Fridge)" only repeated in the bin's own words what the door had just said. Every
                other kind of door has several bins on a shelf, where the name is what tells them
                apart, so the header stays there. */}
            {!isFridgeBin && (
              <div className="box-border content-stretch flex flex-row items-center justify-start p-0 relative shrink-0 w-full mb-2">
                <div
                  className="basis-0 flex flex-col font-bold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-xs text-left"
                  style={{ color: binNameColor }}
                >
                  <p className="block leading-[12px] text-[14px]">
                    {/* Amber over the part of the label the query accounts for (binNameQueryGroup, so
                        a product term appearing in a bin's label can't tint it) — but only while the
                        bin is nothing more than a search hit. Once selected, nameMatchQuery is empty
                        and the name shows the selection colour set above. */}
                    {nameMatchQuery
                      ? highlightText(bin.name, nameMatchQuery, SEARCH_HIGHLIGHT_COLOR)
                      : bin.name}{' '}
                    <span className="text-[#7A7D85]">({getBinSizeDisplay(bin.size)})</span>
                  </p>
                </div>
              </div>
            )}

            {bin.available ? (
              <div className="flex items-center justify-center flex-1 text-gray-500 text-xs w-full text-[14px]">
                Available Bin
              </div>
            ) : (
              // flex-1 + min-h-0: this fills whatever room the card has below its header, and
              // mt-auto on "+N more" below rides the bottom of that space — so the link lands on
              // the same line across every bin in a row, whether it's tucking away rows behind a
              // single product or a full display limit's worth. Without this, a bin's own row
              // count decided where "+more" sat, so it undulated between bins that were stretched
              // to the same card height by the shelf's grid but not to the same amount of content.
              <div className="flex flex-col flex-1 min-h-0 w-full" ref={contentAreaRef}>
                {/* Both multi-column layouts use the same grid, but only the Emergency Kit one
                    scrolls: its card height is fixed, so the grid has to stay inside it. Virtual
                    (fridge) cards size to their contents, so an inner scroll there is wrong. */}
                <div className={`box-border content-stretch pb-0 pt-0 px-0 relative shrink-0 w-full ${
                  bin.size === 'fridge'
                    ? 'grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-[60px] gap-y-3'
                    : selectedDoor && ['Door 17', 'Door 18', 'Door 19'].includes(selectedDoor)
                    ? 'grid overflow-y-auto max-h-[700px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-[60px] gap-y-3'
                    : 'flex flex-col'
                }`}>
                  {visibleProducts.map((product, index) => (
                    <React.Fragment key={product.id}>
                      {/* py-1 on the wrapper: 4px each side of the rule. dividerRef measures this
                          wrapper's height to work out how many rows fit before "+N more", so the value has
                          to live here rather than as margin on the rule inside it. */}
                      {isStackedProductList && index > 0 && (
                        <div className="w-full py-1" ref={index === 1 ? dividerRef : undefined}>
                          <div className="h-px bg-gray-200" />
                        </div>
                      )}
                      {renderProduct(product, index)}
                    </React.Fragment>
                  ))}
                </div>

                {additionalCount > 0 && (
                  <div ref={moreLinkRef} className="box-border content-stretch flex flex-row items-start justify-start p-2 relative shrink-0 w-full mt-auto">
                    <button
                      className="flex flex-col font-normal justify-start items-start leading-[0] not-italic relative text-[#176cff] text-xs hover:underline cursor-pointer bg-transparent border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAllProducts?.(bin.id);
                      }}
                    >
                      <p className="block leading-[16px] text-[14px] text-left">+{additionalCount} more</p>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "+N more" opens AllProductsPanel (rendered by MainLayout from App's allProductsBinId)
          rather than a modal, so the list is searchable and doesn't cover the shelves. */}
    </>
  );
}