import React, { useState, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp, Unlock, ArrowUpFromLine, ArrowDownToLine, GripVertical } from 'lucide-react';
import { DoorShelfConfig } from '../types';
import { cabinets } from '../data/cabinets';
import { pluralizeUnit } from '../utils/pluralizeUnit';
import { usePip } from '../context/PipContext';

// Picture-in-picture "physical world" companion view for the change-allocation flow.
// While the main screen talks in software terms (products, quantities, serials), this
// panel mirrors what is physically happening at the cabinet — the door popping open and
// the bin's pick-to-light guide lamp blinking — so a demo audience can connect each
// on-screen step to the real-world hardware interaction it represents.
//
// The cabinet miniature deliberately reuses the Allocation homepage's visual language
// (blue cabinet card, white two-line "Door N" buttons, 3-doors-plus-full-width layout)
// so the audience recognizes it as the same cabinet they saw on the board.
//
// The panel is draggable by its header — grab and move it anywhere on screen; a tap
// (no movement) on the same header still toggles collapse.

// Product data often stores the unit already pluralized ("vials"); pluralizeUnit passes
// quantity <= 1 through unchanged, so normalize to singular first to avoid "1 vials".
const singularizeUnit = (unit: string): string => {
  const map: Record<string, string> = {
    vials: 'vial', syringes: 'syringe', tablets: 'tablet',
    capsules: 'capsule', doses: 'dose', tabs: 'tab'
  };
  return map[unit.toLowerCase()] || unit;
};

const DRAG_THRESHOLD_PX = 8; // movement below this is treated as a tap (collapse toggle)

interface CabinetPipViewProps {
  doorName: string;          // e.g. "Door 1"
  binName: string;           // e.g. "Bin A"
  binId?: string;            // preferred match key when available
  doorShelfConfig: DoorShelfConfig;
  mode: 'source' | 'target'; // take out of bin vs. put into bin
  quantity: number;
  unit?: string;
}

export default function CabinetPipView({
  doorName,
  binName,
  binId,
  doorShelfConfig,
  mode,
  quantity,
  unit
}: CabinetPipViewProps) {
  const { pipEnabled } = usePip();
  const [collapsed, setCollapsed] = useState(false);
  // null = default docked position (bottom-right); set on first drag.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const cabinet = useMemo(
    () => cabinets.find(cab => cab.doors.includes(doorName)),
    [doorName]
  );
  const isVirtual = cabinet?.name === 'Virtual';
  const doors = cabinet?.doors || [doorName];
  // Mirror the homepage layout: regular cabinets show 3 doors in a row with the 4th
  // full-width beneath; the Virtual cabinet shows its 4 fridges side by side.
  const doorRows = isVirtual ? [doors] : [doors.slice(0, 3), doors.slice(3)].filter(row => row.length > 0);

  const shelves = doorShelfConfig?.[doorName] || [];

  const accent = mode === 'source'
    ? { ring: '#2563EB', fill: '#DBEAFE', led: '#3B82F6', text: '#1D4ED8' }   // blue = take from
    : { ring: '#16A34A', fill: '#DCFCE7', led: '#22C55E', text: '#15803D' };  // green = put into

  const isActiveBin = (bin: { id: string; name: string }) =>
    binId ? bin.id === binId : bin.name === binName;

  const unitLabel = pluralizeUnit(singularizeUnit(unit || 'vial'), quantity);
  const actionLabel = mode === 'source'
    ? `Take ${quantity} ${unitLabel} out of ${binName}`
    : `Place ${quantity} ${unitLabel} into ${binName}`;

  // --- Header drag / tap handling (pointer events cover touch, mouse, and pen) ---
  // Move/up listeners go on window rather than relying on setPointerCapture, so the drag
  // keeps tracking even when a fast swipe leaves the header before the next event fires.
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      moved = true;
      const width = rootRef.current?.offsetWidth ?? 300;
      const height = rootRef.current?.offsetHeight ?? 44;
      setPos({
        x: Math.min(Math.max(rect.left + dx, 8), window.innerWidth - width - 8),
        y: Math.min(Math.max(rect.top + dy, 8), window.innerHeight - height - 8)
      });
    };
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (!moved) setCollapsed(prev => !prev); // a tap (no movement) toggles collapse
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };

  // Hidden by default — shown only when toggled on via the Resource sidebar item.
  if (!pipEnabled) return null;

  return (
    <div
      ref={rootRef}
      className={`fixed w-[300px] bg-white rounded-lg shadow-[0px_8px_30px_rgba(0,0,0,0.18)] border border-[#d5dae1] z-20 overflow-hidden ${
        pos ? '' : 'right-6 bottom-[104px]'
      }`}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
    >
      {/* Local keyframes for the door-open swing — everything else uses Tailwind's
          built-in pulse/ping animations. */}
      <style>{`
        @keyframes pip-door-open {
          from { transform: perspective(600px) rotateY(0deg); }
          to   { transform: perspective(600px) rotateY(-42deg); }
        }
      `}</style>

      {/* Header — drag handle (move the panel) and tap target (collapse/expand) */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className="w-full min-h-[44px] flex items-center justify-between px-3 bg-[#0e243f] text-white cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <span className="flex items-center gap-2 text-[12px] font-medium">
          <GripVertical className="w-3.5 h-3.5 text-white/50" />
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Cabinet — Live Physical View
        </span>
        {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {!collapsed && (
        <div className="p-3 flex flex-col gap-3">
          {/* Cabinet card, styled after the homepage CabinetComponent */}
          <div className="bg-blue-50 rounded-[4px] w-full">
            <div className="px-2 py-1">
              <p className="text-[11px] font-bold text-[#176cff] leading-[14px]">{cabinet?.name || 'Cabinet'}</p>
            </div>
            <div className="px-1.5 pb-1.5 flex flex-col gap-1">
              {doorRows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-1">
                  {row.map(door => {
                    const active = door === doorName;
                    const doorNum = door.replace('Door ', '');
                    const label = isVirtual ? 'Fridge' : 'Door';
                    // Virtual doors 13-16 display as Fridge 1-4 on the homepage
                    const displayNum = isVirtual ? String(parseInt(doorNum, 10) - 12) : doorNum;
                    return (
                      <div key={door} className="flex-1 relative" style={{ perspective: '600px' }}>
                        <div
                          className={`rounded flex flex-col items-center justify-center text-[10px] leading-[13px] text-center ${
                            isVirtual ? 'h-[54px]' : 'h-[40px]'
                          } ${
                            active
                              ? 'border border-[#12805C] bg-[#E1F5EC] text-[#12805C] font-semibold origin-left'
                              : 'bg-white text-[#176cff] border border-[#e2e8f0]'
                          }`}
                          style={active ? { animation: 'pip-door-open 1.1s ease-out forwards', animationDelay: '0.35s' } : undefined}
                        >
                          <span>{label}</span>
                          <span>{displayNum}</span>
                        </div>
                        {active && (
                          <Unlock className="w-3.5 h-3.5 text-[#12805C] absolute -top-1.5 -right-1 bg-white rounded-full p-[1px] border border-[#12805C]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Inside the open door: shelves with bins, styled after the homepage bin cards;
              the active bin's pick-to-light guide lamp blinks */}
          <div className="border border-[#d5dae1] rounded-[6px] p-2 bg-[#fafbfc] flex flex-col gap-1.5">
            {shelves.map(shelf => (
              <div key={shelf.name} className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold text-[#7a7d85] w-[38px] shrink-0">{shelf.name}</span>
                <div className="flex gap-1 flex-1">
                  {shelf.bins.map(bin => {
                    const active = isActiveBin(bin);
                    return (
                      <div
                        key={bin.id}
                        className="flex-1 h-[24px] rounded-[4px] border relative flex items-center justify-center"
                        style={active
                          ? { borderColor: accent.ring, backgroundColor: accent.fill, boxShadow: `0 0 0 1px ${accent.ring}` }
                          : { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                      >
                        <span
                          className={`text-[9px] ${active ? 'font-bold' : 'font-normal'}`}
                          style={{ color: active ? accent.text : '#9fa9b7' }}
                        >
                          {bin.name.replace('Bin ', '')}
                        </span>
                        {active && (
                          /* Pick-to-light guide lamp */
                          <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 flex h-[7px] w-[7px]">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accent.led }} />
                            <span className="relative inline-flex rounded-full h-[7px] w-[7px]" style={{ backgroundColor: accent.led }} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Physical action caption */}
          <div className="flex items-center gap-2 rounded-[6px] px-3 py-2" style={{ backgroundColor: accent.fill }}>
            {mode === 'source'
              ? <ArrowUpFromLine className="w-4 h-4 animate-bounce shrink-0" style={{ color: accent.text }} />
              : <ArrowDownToLine className="w-4 h-4 animate-bounce shrink-0" style={{ color: accent.text }} />}
            <p className="text-[12px] leading-snug" style={{ color: accent.text }}>
              <span className="font-semibold">{doorName} open.</span> {actionLabel}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
