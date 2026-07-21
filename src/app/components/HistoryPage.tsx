import React, { useState, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, X, RotateCcw, ArrowLeft } from 'lucide-react';
import { AllocationHistoryEntry } from '../types';
import { pluralizeUnit } from '../utils/pluralizeUnit';
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
  onLogout?: () => void;
  onBack: () => void;
}

// One target bin the product landed in, with the quantity moved and the resulting total.
interface TargetLine {
  label: string;        // e.g. "Bin C, Door 2"
  movedQty: number;     // qty moved into this bin (0 for allocations)
  resultingQty: number; // existing + moved (for moves)
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
  sourceLabel: string;      // "Bin A, Door 1" (or a fallback for legacy/allocation entries)
  sourceSub: string;        // secondary location line, e.g. "Cabinet 1, Shelf 1"
  targets: TargetLine[];
  movedTotal: number;       // total units moved across all targets (0 for allocations)
  unit: string;
  isMove: boolean;
  isUnallocate: boolean;
  timestamp: Date;
  createdBy: string;
}

export default function HistoryPage({
  history,
  doorShelfConfig,
  currentStation,
  onStationClick,
  onLogout,
  onBack
}: HistoryPageProps) {
  const doorConfig = doorShelfConfig || defaultDoorConfig;
  const [searchQuery, setSearchQuery] = useState('');
  const [showBinChanges, setShowBinChanges] = useState(true);
  const [showBinAllocation, setShowBinAllocation] = useState(true);
  const [showUnallocated, setShowUnallocated] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');

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

        // Source: prefer the recorded sourceBin; otherwise fall back to the historyUtils
        // resolver (covers legacy entries / E-Kit) — same behavior as the modal. The sub-line
        // mirrors Target's "+moved → resulting" but for what left the source bin.
        let sourceLabel = '—';
        let sourceSub = '';
        if (isMove || isUnallocate) {
          if (entry.sourceBin) {
            sourceLabel = `Door ${entry.sourceBin.doorNumber}, ${entry.sourceBin.binName}`;
            if (isMove && entry.sourceBin.quantity != null) {
              const remaining = entry.sourceBin.remainingQuantity ?? 0;
              sourceSub = `-${entry.sourceBin.quantity} → ${remaining} ${pluralizeUnit(unit, remaining)}`;
            }
          } else if (shouldHaveSourceBin(entry)) {
            sourceLabel = getSourceDisplayName(entry, doorConfig, history);
          }
        }

        const movedTotal = isMove
          ? (product.quantity || targets.reduce((s, t) => s + t.movedQty, 0))
          : 0;

        if (q) {
          const hay = `${name} ${generic} ${ndc} ${inventoryType} ${sourceLabel} ${targets.map(t => t.label).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return;
        }

        const vialType: 'SDV' | 'MDV' = (ep.vialType === 'MDV' || ep.vialType === 'SDV')
          ? ep.vialType
          : (product.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 2 === 0 ? 'MDV' : 'SDV');

        out.push({
          key: `${entry.id}-${product.id}`,
          displayName: name,
          genericName: generic,
          ndc,
          inventoryType,
          vialType,
          sourceLabel,
          sourceSub,
          targets: targets.length ? targets : [{ label: '—', movedQty: 0, resultingQty: 0 }],
          movedTotal,
          unit,
          isMove,
          isUnallocate,
          timestamp: entry.timestamp,
          createdBy: 'John Doe'
        });
      });
    });

    return out;
  }, [history, searchQuery, showBinChanges, showBinAllocation, showUnallocated, dateFilter, enhance, doorConfig]);

  const handleReset = () => {
    setSearchQuery('');
    setDateFilter('today');
    setShowBinChanges(true);
    setShowBinAllocation(true);
    setShowUnallocated(true);
  };

  // Real SDV/MDV badge + static CLIMATE / CIV badges (to match the reference mock).
  const ProductBadges = ({ vialType }: { vialType: 'SDV' | 'MDV' }) => (
    <div className="flex items-center gap-1 mt-1">
      <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{vialType}</span>
      <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-medium px-1.5 py-0.5 rounded">CLIMATE</span>
      <span className="bg-[#FEF3C7] text-[#B45309] text-[10px] font-medium px-1.5 py-0.5 rounded">CIV</span>
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
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 h-9">
                  <Checkbox id="bin-changes" checked={showBinChanges} onCheckedChange={(v) => setShowBinChanges(!!v)} className="w-4 h-4" />
                  <label htmlFor="bin-changes" className="text-[14px] text-[#020817] cursor-pointer">Bin Changes ({binChangesCount})</label>
                </div>
                <div className="flex items-center gap-2 h-9">
                  <Checkbox id="bin-allocation" checked={showBinAllocation} onCheckedChange={(v) => setShowBinAllocation(!!v)} className="w-4 h-4" />
                  <label htmlFor="bin-allocation" className="text-[14px] text-[#020817] cursor-pointer">Bin Allocation ({binAllocationCount})</label>
                </div>
                <div className="flex items-center gap-2 h-9">
                  <Checkbox id="unallocated" checked={showUnallocated} onCheckedChange={(v) => setShowUnallocated(!!v)} className="w-4 h-4" />
                  <label htmlFor="unallocated" className="text-[14px] text-[#020817] cursor-pointer">Unallocated ({unallocatedCount})</label>
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
                        {['Product', 'NDC', 'Inventory Type', 'Source', 'Moved', 'Target', 'Status', 'Created By'].map(h => (
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
                            <ProductBadges vialType={row.vialType} />
                          </td>
                          <td className="px-4 py-4 text-[14px] text-[#020817] whitespace-nowrap">{row.ndc}</td>
                          <td className="px-4 py-4 text-[14px] text-[#020817] whitespace-nowrap">{row.inventoryType}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-[14px] text-[#020817]">{row.sourceLabel}</div>
                            {row.sourceSub && (
                              <div className="text-[12px] text-[#64748b] whitespace-nowrap">{row.sourceSub}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-[#020817] whitespace-nowrap">
                            {row.isMove && row.movedTotal > 0
                              ? `${row.movedTotal} ${pluralizeUnit(row.unit, row.movedTotal)}`
                              : '—'}
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
