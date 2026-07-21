import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Real target device is a touch-only tablet with no physical/external keyboard or mouse.
// This provider lets any component (via useTabletSimulator()) toggle a visual "device frame"
// simulation so the actual running app can be previewed at a fixed 1920x1080 tablet resolution,
// including a simulated on-screen keyboard whenever a text input/textarea gains focus.

const DEVICE_WIDTH = 1920;
const DEVICE_HEIGHT = 1080;
const KEYBOARD_HEIGHT_RATIO = 0.38; // approximates a typical tablet on-screen keyboard's screen share

interface TabletSimulatorContextValue {
  isSimulating: boolean;
  toggleSimulation: () => void;
  // DOM node Radix portals (Dialog/Select/etc.) should render into, so modals stay confined to
  // the simulated device frame instead of escaping to the real browser window. Null = use default.
  portalContainer: HTMLElement | null;
}

const TabletSimulatorContext = createContext<TabletSimulatorContextValue>({
  isSimulating: false,
  toggleSimulation: () => {},
  portalContainer: null,
});

export function useTabletSimulator() {
  return useContext(TabletSimulatorContext);
}

function isTextEntryElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'email', 'number', 'tel', 'url', 'password'].includes(type);
  }
  return el.isContentEditable;
}

const KEY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

function TouchPointerOverlay({
  frameElRef,
  scale,
}: {
  frameElRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
}) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = frameElRef.current;
    if (!frame) return;

    // Position the dot in the frame's own local 1920x1080 coordinate space (not the visually
    // scaled one) — as a descendant of the frame, it inherits the frame's CSS transform, so it
    // scales down/up together with everything else automatically.
    const movePointer = (clientX: number, clientY: number) => {
      const rect = frame.getBoundingClientRect();
      const x = (clientX - rect.left) / scale;
      const y = (clientY - rect.top) / scale;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
    };

    const handleMove = (e: PointerEvent) => {
      setVisible(true);
      movePointer(e.clientX, e.clientY);
    };
    const handleDown = (e: PointerEvent) => {
      movePointer(e.clientX, e.clientY);
      setPressed(true);
    };
    const handleUp = () => setPressed(false);
    const handleLeave = () => setVisible(false);

    frame.addEventListener('pointermove', handleMove);
    frame.addEventListener('pointerdown', handleDown);
    frame.addEventListener('pointerup', handleUp);
    frame.addEventListener('pointerleave', handleLeave);
    frame.addEventListener('pointercancel', handleUp);
    return () => {
      frame.removeEventListener('pointermove', handleMove);
      frame.removeEventListener('pointerdown', handleDown);
      frame.removeEventListener('pointerup', handleUp);
      frame.removeEventListener('pointerleave', handleLeave);
      frame.removeEventListener('pointercancel', handleUp);
    };
  }, [frameElRef, scale]);

  const size = pressed ? 40 : 28;

  return (
    <div
      ref={dotRef}
      className="pointer-events-none absolute top-0 left-0 z-[10001] rounded-full border-2 border-white"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: pressed ? 'rgba(9,81,146,0.55)' : 'rgba(9,81,146,0.28)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
        opacity: visible ? 1 : 0,
        transition: 'width 90ms ease-out, height 90ms ease-out, background-color 90ms ease-out, opacity 120ms ease-out',
      }}
    />
  );
}

function SimulatedKeyboard({ onHide }: { onHide: () => void }) {
  return (
    <div
      className="absolute left-0 bottom-0 w-full bg-[#d1d4da] border-t border-[#aeb2ba] shadow-[0px_-4px_16px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center gap-[10px] py-[14px] z-[10000]"
      style={{ height: `${KEYBOARD_HEIGHT_RATIO * 100}%` }}
      // Prevent taps on the (non-functional) keys from stealing focus away from the real input.
      onPointerDown={(e) => e.preventDefault()}
    >
      <p className="text-[13px] text-[#5b6068] mb-1">Simulated on-screen keyboard (visual only — type with your real keyboard)</p>
      {KEY_ROWS.map((row, i) => (
        <div key={i} className="flex gap-[6px]">
          {row.map((k) => (
            <div
              key={k}
              className="w-[64px] h-[56px] bg-white rounded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.2)] flex items-center justify-center text-[20px] text-[#25282a] uppercase select-none"
            >
              {k}
            </div>
          ))}
        </div>
      ))}
      <div className="flex gap-[6px]">
        <div className="w-[420px] h-[56px] bg-white rounded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.2)] flex items-center justify-center text-[14px] text-[#767676] select-none">
          space
        </div>
        <div
          className="w-[100px] h-[56px] bg-[#095192] rounded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.2)] flex items-center justify-center text-[14px] text-white select-none cursor-pointer"
          onPointerDown={(e) => {
            e.preventDefault();
            onHide();
            (document.activeElement as HTMLElement | null)?.blur?.();
          }}
        >
          Hide
        </div>
      </div>
    </div>
  );
}

export function TabletSimulatorProvider({ children }: { children: React.ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null);
  const frameElRef = useRef<HTMLDivElement | null>(null);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
    setKeyboardVisible(false);
  }, []);

  // Fit the fixed 1920x1080 device frame to whatever window this is actually running in.
  useEffect(() => {
    if (!isSimulating) return;
    const computeScale = () => {
      const availableWidth = window.innerWidth - 80;
      const availableHeight = window.innerHeight - 120;
      setScale(Math.min(availableWidth / DEVICE_WIDTH, availableHeight / DEVICE_HEIGHT, 1));
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [isSimulating]);

  const setFrameRef = useCallback((el: HTMLDivElement | null) => {
    frameElRef.current = el;
    setFrameEl(el);
  }, []);

  // Delegate focus tracking to the frame itself (onFocus/onBlur bubble in React) so ANY text
  // input/textarea anywhere in the real app triggers the simulated keyboard, with no need to
  // touch every input individually.
  const handleFocus = useCallback((e: React.FocusEvent) => {
    if (isTextEntryElement(e.target)) setKeyboardVisible(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!isTextEntryElement(e.target)) return;
    // Defer so a tap moving focus to another text field (or the keyboard's own Hide button)
    // is accounted for before deciding to hide.
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!frameElRef.current?.contains(active) || !isTextEntryElement(active)) {
        setKeyboardVisible(false);
      }
    }, 0);
  }, []);

  const contextValue: TabletSimulatorContextValue = {
    isSimulating,
    toggleSimulation,
    portalContainer: isSimulating ? frameEl : null,
  };

  if (!isSimulating) {
    return (
      <TabletSimulatorContext.Provider value={contextValue}>
        {children}
      </TabletSimulatorContext.Provider>
    );
  }

  return (
    <TabletSimulatorContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-[9999] bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden">
        <div className="text-white text-[13px] mb-3 flex items-center gap-3">
          <span>Tablet simulation — 1920×1080, touch-only. Tap "V 1.0" again, or:</span>
          <button
            onClick={toggleSimulation}
            className="bg-white text-[#1a1a1a] text-[12px] px-3 py-1.5 rounded-[4px] cursor-pointer"
          >
            Exit Simulation
          </button>
        </div>
        <div
          style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT, transform: `scale(${scale})`, cursor: 'none' }}
          className="shrink-0 rounded-[24px] border-[10px] border-[#0a0a0a] shadow-[0px_20px_60px_rgba(0,0,0,0.6)] overflow-hidden relative bg-white"
          ref={setFrameRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {children}
          {keyboardVisible && <SimulatedKeyboard onHide={() => setKeyboardVisible(false)} />}
          {frameEl && <TouchPointerOverlay frameElRef={frameElRef} scale={scale} />}
        </div>
      </div>
    </TabletSimulatorContext.Provider>
  );
}
