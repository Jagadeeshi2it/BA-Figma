import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Play } from 'lucide-react';
import { useDemo } from './DemoContext';

/**
 * The Demo Scenarios palette, opened with "/" from anywhere outside a text field.
 *
 * "/" used to reveal a hidden Unallocated Products button in the header — an undocumented shortcut
 * in front of the app's most basic job, and it was removed for that (CLAUDE.md §2 D). The key is
 * free again, and a palette is the honest use for it: it is a list of things you can run, not a
 * hidden door to one of them.
 *
 * Over time this is the launcher for every walkthrough, so it filters from the first scenario
 * rather than waiting until the list is long enough to need it.
 */
export default function DemoPalette() {
  const { paletteOpen, closePalette, scenarios, start } = useDemo();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scenarios;
    return scenarios.filter(
      scenario =>
        scenario.title.toLowerCase().includes(q) || scenario.description.toLowerCase().includes(q)
    );
  }, [query, scenarios]);

  // Fresh every time it opens. A palette that reopens holding the last query answers a question
  // nobody asked twice.
  useEffect(() => {
    if (!paletteOpen) return;
    setQuery('');
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [paletteOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!paletteOpen) return null;

  const run = (index: number) => {
    const scenario = results[index];
    if (scenario) start(scenario.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
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
        role="dialog"
        aria-label="Demo scenarios"
        onKeyDown={onKeyDown}
        className="relative w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[6px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
      >
        <div className="relative border-b border-gray-200">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676b74]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search demo scenarios"
            className="h-12 w-full bg-transparent pl-9 pr-3 text-[14px] leading-[20px] text-[#020817] outline-none placeholder:text-[#676b74]"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="p-6 text-center text-[14px] text-[#676b74]">No scenarios match that search.</div>
          ) : (
            results.map((scenario, index) => (
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
            ))
          )}
        </div>

        {/* Said before they choose, not after. Starting a scenario reloads so the cabinet is back at
            its seeded state — without that, a demo run twice fails the second time, because the
            first one really did allocate the product it was demonstrating. */}
        <div className="border-t border-gray-200 px-3 py-2 text-[12px] leading-[16px] text-[#676b74]">
          Runs the real workflow, and reloads first — anything you have changed in this session is
          discarded. <span className="text-[#020817]">↑↓</span> to choose,{' '}
          <span className="text-[#020817]">Enter</span> to run,{' '}
          <span className="text-[#020817]">Esc</span> to close.
        </div>
      </div>
    </div>
  );
}
