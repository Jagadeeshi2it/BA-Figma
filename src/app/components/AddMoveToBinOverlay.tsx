import React, { useMemo, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { PackagePlus, Search, X } from 'lucide-react';
import CabinetSelection from './CabinetSelection';
import ShelvesSection from './ShelvesSection';
import { ValidationToast } from './ui/sonner-1';
import { PipelineFooterShell, FooterActions, FooterButton } from './PipelineFooter';
import { DoorShelfConfig } from '../types';
import { cabinets } from '../data/cabinets';
import {
  getCurrentShelves,
  getDoorsWithAvailableBins,
  getFreeBinCountByDoor,
  getDoorsWithSelectedBins,
  getDoorsWithSearchMatches,
  countSearchMatches,
  getAllAvailableBins
} from '../utils/doorUtils';
import { moveToBinCandidates, MoveToBinInput, MoveToBinCandidate } from '../utils/moveTargetBins';
import { emergencyKitService } from '../services/EmergencyKitService';

/**
 * Choosing another Move To bin the way every other bin in this app is chosen: by tapping it on the
 * shelves.
 *
 * This replaces a dialog with a list of bin names. The list worked and was still wrong — a bin is picked
 * off the cabinet at step ① and step ②, in the unallocated tray, and in Multi Bin Assignment, so a
 * scrolling list of names here made the one bin-pick that happens mid-move the only one that did not
 * look like picking a bin. The cabinet also shows the two things a list cannot: how full a bin is, and
 * how big it is, which is the entire question when the operator is deciding what will fit.
 *
 * **It is rendered BY the placement screen in place of that screen's own content, not routed to, and that
 * is load-bearing.** The placement screen owns `scannedItems` in local state, so unmounting it discards
 * every serial scanned in the batch; returning different children keeps it mounted. It fills the content
 * area rather than the viewport, so MainLayout's side navigation and station bar stay put — covering
 * them made a detour inside step ④ look like leaving the application. The alternative, lifting that
 * state into App and routing properly, is the bigger and cleaner change, and nothing here blocks it.
 *
 * `changeAllocationStep={2}` is passed to the real `ShelvesSection` so the cards behave exactly as they
 * do at the target step: bins tappable, product rows inert, the green Move To treatment on bins already
 * receiving this product. Reusing the components rather than restyling them is what keeps this from
 * becoming a second, drifting cabinet.
 */
export default function AddMoveToBinOverlay({
  open,
  doorShelfConfig,
  productName,
  productInventoryType,
  /** Bins this move takes stock out of — refused, and shown as the from-end. */
  sourceBinIds,
  /** Bins already receiving this product in this move. */
  existingTargetBinIds,
  /** The door the operator has open, so the overlay opens on it rather than wherever they last were. */
  currentDoorName,
  onCancel,
  onConfirm
}: {
  open: boolean;
  doorShelfConfig: DoorShelfConfig;
  productName: string;
  productInventoryType?: string;
  sourceBinIds: string[];
  existingTargetBinIds: string[];
  currentDoorName?: string;
  onCancel: () => void;
  /** Every bin picked in this visit, committed in one go. */
  onConfirm: (binIds: string[]) => void;
}) {
  // Opens on the door already unlocked, since that is where the operator is standing and one door opens
  // at a time. They can still walk to another; the door dots say which hold free bins.
  const [selectedDoor, setSelectedDoor] = useState<string>(currentDoorName ?? 'Door 1');
  const [selectedCabinet, setSelectedCabinet] = useState<string>(
    () => cabinets.find(cabinet => cabinet.doors.includes(currentDoorName ?? 'Door 1'))?.name ?? 'Cabinet 1'
  );
  /**
   * Bins picked in this visit, committed together when the operator is done.
   *
   * Multi-select rather than pick-one-and-close, because the question being answered is "where is the
   * rest of this going", and the answer can be several bins — the same way step ② takes as many targets
   * as the operator wants before moving on. Closing on the first tap would make them reopen the cabinet
   * once per bin, and each reopen is another walk back to the door they were already standing at.
   */
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]);
  /**
   * The overlay's own search and available-bins filter.
   *
   * Local rather than the app's: `HeaderSection` carries the search dropdown, which needs some thirty
   * props wired into `useInventoryState` — the pick handlers, the highlight channels, the source/target
   * selections. Threading those through a detour inside step ④ would make this component a second
   * front end for the move state. What the operator needs here is narrower: find a bin among 132, and
   * see at a glance which are free. Both are answerable from `doorShelfConfig` alone.
   *
   * The cost is honest and worth naming: no dropdown, so no jump-to-bin and no product search. Typing
   * tints the bins that match and lights the doors holding them, which is what the query does on the
   * main canvas anyway.
   */
  const [search, setSearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Reset to the open door each time it opens — a door left selected from a previous visit is a walk the
  // operator did not ask for, and a bin still ticked from last time is a commitment they did not make.
  React.useEffect(() => {
    if (!open) return;
    const door = currentDoorName ?? 'Door 1';
    setSelectedDoor(door);
    setSelectedCabinet(cabinets.find(cabinet => cabinet.doors.includes(door))?.name ?? 'Cabinet 1');
    setSelectedBinIds([]);
    setSearch('');
    setShowAvailableOnly(false);
  }, [open, currentDoorName]);

  /**
   * The same eligibility the dialog used, so what the shelves accept cannot drift from what the rules
   * say. Every bin is here, not just the open door's — the operator can walk, and a bin they can see and
   * tap has to give an answer either way.
   */
  const candidatesByBinId = useMemo(() => {
    const bins: MoveToBinInput[] = [];
    const restrictedBinIds: string[] = [];
    Object.keys(doorShelfConfig).forEach(doorName => {
      doorShelfConfig[doorName]?.forEach(shelf => {
        shelf.bins?.forEach(bin => {
          bins.push({
            binId: bin.id,
            binName: bin.name,
            doorName,
            productCount: bin.products.length,
            alreadyStocksProduct: bin.products.some(product => product.name === productName)
          });
          if (emergencyKitService.isBinInEmergencyKit(bin.id, doorShelfConfig)) {
            restrictedBinIds.push(bin.id);
          }
        });
      });
    });

    const candidates = moveToBinCandidates(bins, {
      sourceBinIds,
      existingTargetBinIds,
      restrictedBinIds,
      productAllowedInRestrictedBins: emergencyKitService.isInventoryTypeAllowed(
        productInventoryType || '',
        'move'
      ),
      currentDoorName
    });

    return new Map<string, MoveToBinCandidate>(candidates.map(c => [c.binId, c]));
  }, [doorShelfConfig, productName, productInventoryType, sourceBinIds, existingTargetBinIds, currentDoorName]);

  if (!open) return null;

  const currentShelves = getCurrentShelves(selectedDoor, doorShelfConfig);
  const doorsWithAvailableBins = getDoorsWithAvailableBins(doorShelfConfig);
  const freeBinsByDoor = getFreeBinCountByDoor(doorShelfConfig);

  /**
   * A tap on a bin. A refused bin explains itself rather than doing nothing — the whole reason the
   * shelves' refusals are worded at all (§ "A refused tap says which control would work"). One toast id
   * so a second tap replaces the message instead of stacking copies.
   */
  const handleBinClick = (binId: string) => {
    const candidate = candidatesByBinId.get(binId);
    if (!candidate) return;
    if (candidate.blockedReason) {
      toast.custom(() => <ValidationToast message={candidate.blockedReason!} />, {
        id: 'add-move-to-bin-refusal',
        duration: 5000
      });
      return;
    }
    // Toggles, as a bin tap does at step ②. A tap that could only ever add would leave a mis-tap
    // uncorrectable without cancelling the whole visit.
    setSelectedBinIds(prev =>
      prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
    );
  };

  const availableBinCount = getAllAvailableBins(doorShelfConfig);

  return (
    /**
     * Fills the content area, NOT the viewport. It used to be `fixed inset-0`, which covered the side
     * navigation and the station bar along with everything else — so a detour inside step ④ looked like
     * leaving the application. The operator keeps the chrome they had a moment ago and it stays obvious
     * that this is one screen of a move rather than somewhere new.
     */
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-[#095192]" />
              <h2 className="text-[16px] font-medium text-[#020817]">Add another Move To bin</h2>
            </div>
            <p className="text-[14px] text-[#4a5565] mt-0.5">
              {productName} — tap the bins to move the rest into. No quantities here; the split is
              decided bin by bin when you get back.
            </p>
          </div>

          {/* Search and the available-bins filter, right-aligned as one group — the same arrangement and
              the same order as the app's own header, so the controls sit where the operator last saw
              them. */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9fa9b7] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search bins and products"
                className="w-[280px] h-9 pl-9 pr-8 border border-gray-300 rounded-[4px] text-[14px] text-[#020817] outline-none placeholder:text-[#9fa9b7]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9fa9b7] hover:text-[#4a5565] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Green when on, matching `Bins Available(n)` on the main header — the app already has one
                colour for "a view filter is live", and the label is `#15803D` because the stroke's
                `#22C55E` is 2.3:1 at this size. */}
            <button
              type="button"
              onClick={() => setShowAvailableOnly(prev => !prev)}
              className={`h-9 px-3 rounded-[4px] border text-[14px] whitespace-nowrap cursor-pointer ${
                showAvailableOnly
                  ? 'border-green-500 text-[#15803D] bg-white'
                  : 'border-[#095192] text-[#095192] bg-white hover:bg-[#F1F6FA]'
              }`}
            >
              Bins Available({availableBinCount})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <CabinetSelection
          selectedCabinet={selectedCabinet}
          selectedDoor={selectedDoor}
          doorsWithAvailableBins={doorsWithAvailableBins}
          freeBinsByDoor={freeBinsByDoor}
          highlightAvailableBins={showAvailableOnly}
          doorsWithSearchMatches={getDoorsWithSearchMatches(doorShelfConfig, search)}
          doorsWithSelectedBins={[]}
          doorsWithChangeAllocationBins={getDoorsWithSelectedBins(doorShelfConfig, existingTargetBinIds)}
          searchQuery={search}
          showUnallocatedProducts={false}
          changeAllocationMode={true}
          onCabinetClick={setSelectedCabinet}
          onDoorClick={setSelectedDoor}
        />

        <ShelvesSection
          currentShelves={currentShelves}
          searchQuery={search}
          searchMatchCount={countSearchMatches(doorShelfConfig, search)}
          selectedDoor={selectedDoor}
          selectedBin={null}
          showBinInventory={false}
          highlightAvailableBins={showAvailableOnly}
          selectedBinsForAssignment={[]}
          // Step ②'s own semantics: the bin is what a tap means, and product rows are inert. Passing the
          // real step rather than inventing a mode is what keeps these cards identical to the ones the
          // operator picked their first target bin from.
          changeAllocationMode={true}
          changeAllocationStep={2}
          changeAllocationSourceBins={sourceBinIds}
          // Bins picked in this visit wear the same green Move To treatment as the ones already in the
          // move, because that is what they are about to become — the operator is looking at where this
          // product will end up, and the colour is the same claim about the cabinet either way.
          //
          // **The wording does distinguish them, though, and has to.** The two look alike and do not
          // behave alike: an existing target is refused on tap (`EXISTING_TARGET_REASON`) while a bin
          // picked here toggles. Badging both `Move To` left the operator tapping one of two identical
          // cards and getting a toast. The committed ones say `Already selected` instead — the app's
          // existing voice for a control whose work is done, and enough to predict the tap.
          changeAllocationTargetBins={[...existingTargetBinIds, ...selectedBinIds]}
          committedChangeAllocationTargetBins={existingTargetBinIds}
          showUnallocatedProducts={false}
          onBinClick={handleBinClick}
          onProductClick={() => {}}
        />
      </div>

      {/* No StepCell: it derives its own copy from `instructionFor(step)`, which would print step ④'s
          standing "take, then place" line — the wrong guidance for a bin pick. This is a detour inside
          placement rather than a step of its own, so the instruction sits in the header above and the
          footer carries only the way out. The shell is still the shared one, so the bar's height and
          button sizing match every other stage. */}
      <PipelineFooterShell>
        <FooterActions>
          <FooterButton label="Cancel" variant="secondary" onClick={onCancel} />
          {/* States its requirement while there is nothing picked, the same as the bin-picking steps —
              here the label's job IS to name what happens next, so the rule applies rather than the
              keep-your-own-name exception the save primary follows. */}
          <FooterButton
            label={
              selectedBinIds.length === 0
                ? 'Tap a bin to add'
                : `Add ${selectedBinIds.length} ${selectedBinIds.length === 1 ? 'Bin' : 'Bins'}`
            }
            variant="primary"
            enabled={selectedBinIds.length > 0}
            onClick={() => onConfirm(selectedBinIds)}
            demoId="add-move-to-bin-confirm"
          />
        </FooterActions>
      </PipelineFooterShell>
    </div>
  );
}
