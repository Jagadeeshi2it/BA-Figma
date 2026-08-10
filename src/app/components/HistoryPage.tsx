import React, { useState, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Clock, X, RotateCcw, ArrowLeft, ChevronDown } from 'lucide-react';
import { AllocationHistoryEntry } from '../types';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { getVialType, hasClimateBadge, hasCivBadge } from '../utils/binProducts';
import { productDataService } from '../services/ProductDataService';
import { getSourceDisplayName, shouldHaveSourceBin } from '../utils/historyUtils';
import { doorShelfConfig as defaultDoorConfig } from '../data/doorConfigurations';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface HistoryPageProps {
  history: AllocationHistoryEntry[];
  doorShelfConfig?: any;
  currentStation?: string;
  onStationClick?: () => void;
  /**
   * Clinic level. A clinic holds several stations, so the ledger is read across all of them: each row
   * names the station its transaction happened at, and a Station filter narrows to one. At station
   * level the operator works a single cabinet, so both would restate the only station there is.
   */
  isClinicLevel?: boolean;
  onLogout?: () => void;
  onBack: () => void;
}

// One target bin the product landed in, with the quantity moved and the resulting total.
interface TargetLine {
  label: string;        // e.g. "Bin C, Door 2"
  movedQty: number;     // qty moved into this bin (0 for allocations)
  resultingQty: number; // existing + moved (for moves)
}

// One source bin the product was gathered from. A move can pull from several bins at once,
// so this mirrors TargetLine — each with its own quantity taken and remainder left behind.
interface SourceLine {
  label: string;          // e.g. "Door 1, Bin B"
  movedQty: number | null; // qty taken out of this bin (null when unknown/unallocate)
  remainingQty: number;    // qty left in this bin afterwards
}

// One flattened table row per product within a history entry. A product moved to several
// target bins keeps a single row and lists each target (with its own quantity) inside the
// Target cell — mirroring how the old modal broke a move down per destination bin.
interface HistoryRow {
  key: string;
  displayName: string;
  genericName: string;
  ndc: string;
  inventoryType: string;
  vialType: 'SDV' | 'MDV';
  hasClimate: boolean;
  hasCiv: boolean;
  sources: SourceLine[];    // every bin the product came from (empty for allocations)
  targets: TargetLine[];
  movedTotal: number;       // total units moved across all targets (0 for allocations)
  unit: string;
  isMove: boolean;
  isUnallocate: boolean;
  timestamp: Date;
  createdBy: string;
  // Where it happened. Undefined on entries written before stations were stamped — rendered as an
  // em dash rather than assumed to be the current station.
  station?: string;
}

export default function HistoryPage({
  history,
  doorShelfConfig,
  currentStation,
  onStationClick,
  isClinicLevel = false,
  onLogout,
  onBack
}: HistoryPageProps) {
  const doorConfig = doorShelfConfig || defaultDoorConfig;
  const [searchQuery, setSearchQuery] = useState('');
  const [showBinChanges, setShowBinChanges] = useState(true);
  const [showBinAllocation, setShowBinAllocation] = useState(true);
  const [showUnallocated, setShowUnallocated] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  // 'all' or one station name. Only rendered at clinic level, but held unconditionally so the value
  // cannot be stale from a previous level.
  const [stationFilter, setStationFilter] = useState('all');

  const binChangesCount = useMemo(
    () => (history || []).filter(e => e?.transactionType === 'Product moved').length,
    [history]
  );
  const binAllocationCount = useMemo(
    () => (history || []).filter(e => e?.transactionType === 'New Bin Allocation').length,
    [history]
  );
  const unallocatedCount = useMemo(
    () => (history || []).filter(e => e?.transactionType === 'Unallocated').length,
    [history]
  );

  // One list drives both the dropdown's items and its trigger text, so the two can't disagree.
  const typeFilters = useMemo(() => [
    { id: 'bin-changes', label: 'Bin Changes', count: binChangesCount, checked: showBinChanges, onChange: setShowBinChanges },
    { id: 'bin-allocation', label: 'Bin Allocation', count: binAllocationCount, checked: showBinAllocation, onChange: setShowBinAllocation },
    { id: 'unallocated', label: 'Unallocated', count: unallocatedCount, checked: showUnallocated, onChange: setShowUnallocated },
  ], [binChangesCount, binAllocationCount, unallocatedCount, showBinChanges, showBinAllocation, showUnallocated]);

  // Name the types while they fit; past that a count reads better than a truncated list.
  const typeFilterSummary = useMemo(() => {
    const selected = typeFilters.filter(filter => filter.checked);
    if (selected.length === 0) return 'None selected';
    if (selected.length === typeFilters.length) return 'All types';
    if (selected.length === 1) return selected[0].label;
    return `${selected.length} of ${typeFilters.length} types`;
  }, [typeFilters]);

  const enhance = useCallback((product: any) => {
    try {
      return productDataService.enhanceProduct(product) || product;
    } catch {
      return product;
    }
  }, []);

  const formatTimestamp = (t: Date) =>
    t.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const binLabel = (bin: any) =>
    bin ? `Door ${bin.doorNumber}, ${bin.binName}` : '—';

  // Date + type filtering, then flatten entries → per-product rows.
  const rows = useMemo<HistoryRow[]>(() => {
    if (!history || history.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 864e5);
    const last15 = new Date(today.getTime() - 15 * 864e5);
    const last30 = new Date(today.getTime() - 30 * 864e5);

    const passesDate = (ts: Date) => {
      const d = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
      switch (dateFilter) {
        case 'today': return d.getTime() === today.getTime();
        case 'last7days': return d.getTime() >= lastWeek.getTime();
        case 'last15days': return d.getTime() >= last15.getTime();
        case 'last30days': return d.getTime() >= last30.getTime();
        default: return true;
      }
    };

    const q = searchQuery.trim().toLowerCase();
    const out: HistoryRow[] = [];

    history.forEach(entry => {
      if (!entry?.transactionType || !entry?.timestamp) return;
      const isMove = entry.transactionType === 'Product moved';
      const isUnallocate = entry.transactionType === 'Unallocated';
      const isAllocation = entry.transactionType === 'New Bin Allocation';
      if (isMove && !showBinChanges) return;
      if (isAllocation && !showBinAllocation) return;
      if (isUnallocate && !showUnallocated) return;
      if (!passesDate(entry.timestamp)) return;
      // Composed as AND with the rest, and only ever narrowed at clinic level — the control that sets it
      // is not rendered at station level, so 'all' is the only reachable value there.
      if (stationFilter !== 'all' && entry.station !== stationFilter) return;

      // consolidate duplicate products within an entry
      const uniq = (entry.products || []).reduce((acc: any[], p: any) => {
        if (!p?.id) return acc;
        const found = acc.find(x => x.id === p.id);
        if (found) {
          found.quantity = (found.quantity || 0) + (p.quantity || 0);
          if (p.targetBins) found.targetBins = [...(found.targetBins || []), ...p.targetBins];
        } else {
          acc.push({ ...p });
        }
        return acc;
      }, []);

      uniq.forEach((product: any) => {
        const ep = enhance(product);
        const name = ep.displayName || ep.name || 'Product';
        const generic = ep.description || ep.genericName || '';
        const ndc = ep.ndc || 'Not Available';
        const inventoryType = ep.inventoryType || 'Purchased';
        const unit = product.unit || 'vial';

        // Deduplicate target bins by physical location, merging quantities — same guard the
        // old modal used so a bin split across transfers isn't listed twice.
        const rawTargets = ((product as any).targetBins || entry.bins || []) as any[];
        const targetMap = new Map<string, TargetLine>();
        rawTargets.forEach(bin => {
          if (!bin) return;
          const locationKey = [bin.binId, bin.cabinetNumber, bin.doorNumber, bin.shelfName, bin.binName]
            .map(v => String(v ?? 'unknown')).join('|');
          const movedQty = Number(bin.quantity) || 0;
          const existingQty = bin.existingQuantity != null ? Number(bin.existingQuantity) : 0;
          const existing = targetMap.get(locationKey);
          if (existing) {
            existing.movedQty += movedQty;
            existing.resultingQty = Math.max(existing.resultingQty, existingQty) + movedQty;
          } else {
            targetMap.set(locationKey, {
              label: binLabel(bin),
              movedQty,
              resultingQty: existingQty + movedQty
            });
          }
        });
        const targets = Array.from(targetMap.values());

        // Source: prefer the recorded sourceBins array (a move can gather from several bins),
        // falling back to the single sourceBin, then to the historyUtils resolver for legacy
        // entries / E-Kit. Each line mirrors Target's "+moved → resulting", but for what left.
        const sources: SourceLine[] = [];
        if (isMove || isUnallocate) {
          const rawSources = (entry.sourceBins && entry.sourceBins.length > 0)
            ? entry.sourceBins
            : (entry.sourceBin ? [entry.sourceBin] : []);

          rawSources.forEach(bin => {
            sources.push({
              label: `Door ${bin.doorNumber}, ${bin.binName}`,
              movedQty: isMove && bin.quantity != null ? bin.quantity : null,
              remainingQty: bin.remainingQuantity ?? 0
            });
          });

          if (sources.length === 0 && shouldHaveSourceBin(entry)) {
            sources.push({
              label: getSourceDisplayName(entry, doorConfig, history),
              movedQty: null,
              remainingQty: 0
            });
          }
        }

        const movedTotal = isMove
          ? (product.quantity || targets.reduce((s, t) => s + t.movedQty, 0))
          : 0;

        if (q) {
          const hay = `${name} ${generic} ${ndc} ${inventoryType} ${sources.map(s => s.label).join(' ')} ${targets.map(t => t.label).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return;
        }

        // The shared derivation, always — a history row names the same drug the bins and search list do,
        // so it has to reach the same badge.
        //
        // This used to PREFER `enhanceProduct`'s catalogue `vialType` and fall back to the shared
        // derivation only when that was absent, which defeated the fallback in exactly the rows that
        // could resolve a product id: ALIMTA 500 read MDV on its bin card and SDV in the ledger. The
        // badge belongs to the identity triple (CLAUDE.md §3), and the catalogue's own field is keyed to
        // a master product, so the two disagree wherever the seed's inventory type differs from the
        // import's.
        const badgeProduct = { name, ndc, inventoryType };
        const vialType: 'SDV' | 'MDV' = getVialType(badgeProduct);

        out.push({
          key: `${entry.id}-${product.id}`,
          displayName: name,
          genericName: generic,
          ndc,
          inventoryType,
          vialType,
          hasClimate: hasClimateBadge(badgeProduct),
          hasCiv: hasCivBadge(badgeProduct),
          sources: sources.length ? sources : [{ label: '—', movedQty: null, remainingQty: 0 }],
          targets: targets.length ? targets : [{ label: '—', movedQty: 0, resultingQty: 0 }],
          movedTotal,
          unit,
          isMove,
          isUnallocate,
          timestamp: entry.timestamp,
          createdBy: 'John Doe',
          station: entry.station
        });
      });
    });

    // Newest activity first, regardless of the order entries arrive in.
    return out.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [history, searchQuery, showBinChanges, showBinAllocation, showUnallocated, dateFilter, stationFilter, enhance, doorConfig]);

  /**
   * The stations the ledger actually mentions, for the filter's options.
   *
   * Read from the entries rather than from a station list: a filter offering a station with no
   * transactions is a dead end, and one missing a station that HAS transactions hides rows with no way
   * to reach them. Sorted so the order does not shift as entries arrive.
   */
  const stationsInHistory = useMemo(
    () => Array.from(new Set((history || []).map(e => e?.station).filter(Boolean) as string[])).sort(),
    [history]
  );

  const handleReset = () => {
    setSearchQuery('');
    setDateFilter('today');
    setShowBinChanges(true);
    setShowBinAllocation(true);
    setShowUnallocated(true);
    setStationFilter('all');
  };

  /**
   * All three badges derived, none of them decoration.
   *
   * CLIMATE and CIV were printed on **every** row unconditionally, "to match the reference mock" — so
   * the ledger claimed every drug in the cabinet was both climate-sensitive and a controlled substance.
   * Harmless-looking while nothing else in the app disagreed out loud; not harmless now that the
   * unallocated tray filters on exactly these badges (CLAUDE.md §2 D). A tray that finds two Climate
   * products out of eight, followed by a ledger that marks all of them Climate, reads as the filter
   * being wrong rather than the ledger.
   *
   * Kept as this page's own component rather than the shared `ProductBadges`: the table's badges are
   * 10px on a black SDV/MDV chip, against 9px on grey everywhere else, and that is a table-density
   * decision rather than a drift. The VALUES now come from `binProducts` like everyone else's, which is
   * the part that was actually wrong.
   */
  const ProductBadges = ({
    vialType,
    hasClimate,
    hasCiv
  }: {
    vialType: 'SDV' | 'MDV';
    hasClimate: boolean;
    hasCiv: boolean;
  }) => (
    <div className="flex items-center gap-1 mt-1">
      <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{vialType}</span>
      {hasClimate && (
        <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
      )}
      {hasCiv && (
        <span className="bg-[#FEF3C7] text-[#B45309] text-[10px] font-medium px-1.5 py-0.5 rounded">CIV</span>
      )}
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-[50px]">
          <TopNav currentStation={currentStation} onStationClick={onStationClick} onLogout={onLogout} />
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f9fafb]">
          <div className="px-6 py-5">
            {/* Title + back */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={onBack}
                data-demo="history-back"
                aria-label="Back"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[4px] hover:bg-gray-100 cursor-pointer bg-transparent border-none"
              >
                <ArrowLeft className="w-5 h-5 text-[#020817]" />
              </button>
              <h1 className="text-[24px] font-normal text-[#020817]">History</h1>
            </div>

            {/* Filter bar */}
            <div className="border border-solid border-[#bcc3cd] rounded-[8px] p-4 mb-5 bg-white">
              <div className="flex items-end gap-6 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] text-[#020817]">Product</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by Name/ NDC"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] placeholder:text-[#9fa9b7]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-transparent border-none cursor-pointer"
                        aria-label="Clear"
                      >
                        <X className="w-3 h-3 text-[#9fa9b7]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] text-[#020817]">Date</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[150px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] font-normal">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last7days">7 days</SelectItem>
                      <SelectItem value="last15days">15 days</SelectItem>
                      <SelectItem value="last30days">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinic level only: a clinic reads several stations' ledgers in one table, so "which
                    station" is both a column and a filter. Its options come from the entries themselves,
                    so it can neither offer a station with nothing behind it nor hide one that has rows. */}
                {isClinicLevel && stationsInHistory.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] text-[#020817]">Station</label>
                    <Select value={stationFilter} onValueChange={setStationFilter}>
                      <SelectTrigger className="w-[170px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] font-normal">
                        <SelectValue placeholder="Station" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All stations</SelectItem>
                        {stationsInHistory.map(station => (
                          <SelectItem key={station} value={station}>{station}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* The three type checkboxes collapse into one dropdown so the filter row reads as
                    three controls (Product / Date / Type) instead of a spread-out checkbox strip. */}
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] text-[#020817]">Transaction Type</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-[220px] h-9 bg-white border border-[#bcc3cd] rounded px-3 text-[14px] text-[#020817] flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{typeFilterSummary}</span>
                        <ChevronDown className="w-4 h-4 text-[#9fa9b7] shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[220px] p-2">
                      <div className="flex flex-col gap-1">
                        {typeFilters.map(filter => (
                          <label
                            key={filter.id}
                            htmlFor={filter.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50"
                          >
                            <Checkbox
                              id={filter.id}
                              checked={filter.checked}
                              onCheckedChange={(v) => filter.onChange(!!v)}
                              className="w-4 h-4"
                            />
                            <span className="text-[14px] text-[#020817]">
                              {filter.label} ({filter.count})
                            </span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2 ml-auto h-9">
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset filters"
                    className="h-9 w-9 flex items-center justify-center bg-white border border-[#bcc3cd] rounded cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#095192]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            {rows.length === 0 ? (
              <div className="text-center py-20 border border-[#e5e7eb] rounded-[8px] bg-white">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-[16px] font-medium text-gray-900 mb-1">No history yet</h3>
                <p className="text-[14px] text-gray-600">
                  Product allocations and moves will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-[#e5e7eb] rounded-[8px] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                        {/* Past tense: this is a ledger of moves that happened, not the task. Same
                            vocabulary as the move flow's "Move From" / "Move To", one tense back. */}
                        {[
                          'Product',
                          'NDC',
                          'Inventory Type',
                          // Where it happened, ahead of the two bin columns that say where within it.
                          ...(isClinicLevel ? ['Station'] : []),
                          'Moved From',
                          'Moved To',
                          'Status',
                          'Created By'
                        ].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[13px] font-semibold text-[#475569] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={row.key} className="border-b border-[#eef1f4] align-top hover:bg-[#fafbfc]">
                          <td className="px-4 py-4 min-w-[260px]">
                            <div className="text-[14px] font-semibold text-[#020817]">{row.displayName}</div>
                            {row.genericName && (
                              <div className="text-[13px] italic text-[#64748b] leading-snug">{row.genericName}</div>
                            )}
                            <ProductBadges
                              vialType={row.vialType}
                              hasClimate={row.hasClimate}
                              hasCiv={row.hasCiv}
                            />
                          </td>
                          <td className="px-4 py-4 text-[14px] text-[#020817] whitespace-nowrap">{row.ndc}</td>
                          <td className="px-4 py-4 text-[14px] text-[#020817] whitespace-nowrap">{row.inventoryType}</td>
                          {/* An em dash where the entry predates stations, rather than filling in the
                              current one: a ledger that guesses where something happened is worse than
                              one that admits it does not know. */}
                          {isClinicLevel && (
                            <td className="px-4 py-4 text-[14px] whitespace-nowrap">
                              {row.station ?? <span className="text-[#94a3b8]">—</span>}
                            </td>
                          )}
                          <td className="px-4 py-4 min-w-[180px]">
                            {row.sources.map((s, i) => (
                              <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-[#f1f3f5]' : ''}>
                                <div className="text-[14px] text-[#020817] whitespace-nowrap">{s.label}</div>
                                {s.movedQty != null && (
                                  <div className="text-[12px] text-[#64748b] whitespace-nowrap">
                                    -{s.movedQty} → {s.remainingQty} {pluralizeUnit(row.unit, s.remainingQty)}
                                  </div>
                                )}
                              </div>
                            ))}
                            {/* Only worth stating when it isn't already obvious from a single
                                line — a lone "-25 → 0" bin already tells you the total. */}
                            {row.isMove && row.sources.length > 1 && row.movedTotal > 0 && (
                              <div className="mt-2 pt-2 border-t border-[#f1f3f5] text-[12px] font-medium text-[#475569] whitespace-nowrap">
                                {row.movedTotal} {pluralizeUnit(row.unit, row.movedTotal)} total
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 min-w-[180px]">
                            {row.targets.map((t, i) => (
                              <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-[#f1f3f5]' : ''}>
                                <div className="text-[14px] text-[#020817] whitespace-nowrap">{t.label}</div>
                                {row.isMove && t.movedQty > 0 && (
                                  <div className="text-[12px] text-[#64748b] whitespace-nowrap">
                                    +{t.movedQty} → {t.resultingQty} {pluralizeUnit(row.unit, t.resultingQty)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${
                              row.isUnallocate ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                              row.isMove ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#DCFCE7] text-[#15803D]'
                            }`}>
                              {row.isUnallocate ? 'Unallocated' : row.isMove ? 'Bin Changes' : 'Bin Allocation'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-[14px] text-[#020817]">{formatTimestamp(row.timestamp)}</div>
                            <div className="text-[13px] italic text-[#64748b]">{row.createdBy}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
