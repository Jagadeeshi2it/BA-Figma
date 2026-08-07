import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useDemo } from './DemoContext';

/**
 * The Demo Scenarios palette, opened with "/" from anywhere outside a text field.
 *
 * "/" used to reveal a hidden Unallocated Products button in the header — an undocumented shortcut
 * in front of the app's most basic job, and it was removed for that (CLAUDE.md §2 D). The key is
 * free again, and a palette is the honest use for it: it is a list of things you can run, not a
 * hidden door to one of them.
 *
 * **A title and the list, nothing else.** It had a search box and a footer of instructions, on the
 * reasoning that this is the launcher for every walkthrough and would need filtering before the list
 * grew long enough to demand it. Removed: there are four scenarios, all visible at once, and a search
 * box above four rows is a control whose only effect is to make a short list look like a long one —
 * it also took the caret, so the first thing the viewer saw was somewhere to type rather than
 * something to choose. Bring it back when the list actually outgrows the panel, not before.
 *
 * The footer went with it. It explained the arrow keys, which the rows already invite by being
 * clickable, and warned that starting a scenario reloads — true, and it belongs where the state
 * being discarded is, not on the one screen a viewer reads before every run.
 */
export default function DemoPalette() {
  const { paletteOpen, closePalette, scenarios, start } = useDemo();
  const [activeIndex, setActiveIndex] = useState(0);
  // Focused on open so the arrow keys have somewhere to land. The search input used to hold this by
  // accident; with it gone the dialog has to take focus itself, or Esc and ↑↓ reach nothing.
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!paletteOpen) return;
    setActiveIndex(0);
    const id = window.setTimeout(() => dialogRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [paletteOpen]);

  if (!paletteOpen) return null;

  const run = (index: number) => {
    const scenario = scenarios[index];
    if (scenario) start(scenario.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, scenarios.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  return (
    <div className="fixed inset-0 z-[10060] flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={closePalette}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Demo scenarios"
        // Focusable but not in the tab order: it is a modal that takes focus on open, not a stop on
        // the way through the page.
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[6px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.35)] outline-none"
      >
        {/* The panel's own name, in the app's 16px medium — the same header treatment the two
            allocation panels use, so a surface the app owns looks like one. */}
        <div className="border-b border-gray-200 px-4 py-3 text-[16px] font-medium leading-[24px] text-[#020817]">
          Select a module for a demo
        </div>

        <div className="max-h-[320px] overflow-y-auto p-1">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => run(index)}
              className={`flex w-full items-start gap-3 rounded-[4px] px-3 py-2.5 text-left transition-colors cursor-pointer ${
                index === activeIndex ? 'bg-[#F1F6FA]' : 'hover:bg-[#F1F6FA]'
              }`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#095192]">
                <Play className="h-2.5 w-2.5 text-white" fill="currentColor" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-medium leading-[20px] text-[#020817]">
                  {scenario.title}
                </span>
                <span className="block text-[13px] leading-[18px] text-[#676b74]">
                  {scenario.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
