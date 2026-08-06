import React from 'react';
import { useDemo } from './DemoContext';

/**
 * The virtual cursor and the ring that precedes it. Nothing else.
 *
 * A caption used to ride alongside, naming each act as it happened. It was removed deliberately: a
 * walkthrough that explains every click in a black box over the screen stops demonstrating the app
 * and starts talking about it — and it covers the interface it exists to show. What is left is a
 * ring that says *where* and an app that says *what*, through its own state changes, highlights and
 * transitions. The step's name is still available, in the control panel, for anyone who wants it.
 *
 * Both live at document level rather than inside the app — including inside the tablet simulator's
 * frame, which is a CSS-scaled `fixed inset-0` element (CLAUDE.md §4). Radix overlays have to portal
 * INTO that frame to be visible; the cursor is the opposite case and must sit above it, and
 * `getBoundingClientRect` already returns post-transform viewport coordinates, so the same numbers
 * are right in both modes.
 *
 * The transform is written imperatively by the runner through `cursorRef` — never through React
 * state. It moves at frame rate, and re-rendering anything 60 times a second to drag an arrow
 * across the screen would make the demo stutter on exactly the machines that need it most.
 */
export default function DemoCursor() {
  const { cursorRef, pressed, highlight, status } = useDemo();

  if (status !== 'running' && status !== 'paused') return null;

  return (
    <>
      {/* The ring. Drawn as an outline offset outward so it never covers the control it is calling
          attention to — a filled or inset highlight hides the label the viewer is being asked to
          read. */}
      {highlight && (
        <div
          className="pointer-events-none fixed z-[10035] rounded-[6px]"
          style={{
            top: highlight.top - 4,
            left: highlight.left - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
            boxShadow: '0 0 0 2px #095192, 0 0 0 6px rgba(9,81,146,0.18)',
            transition: 'top 180ms ease-out, left 180ms ease-out, width 180ms ease-out, height 180ms ease-out',
          }}
        />
      )}

      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[10045]"
        style={{ transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)' }}
      >
        {/* The press ripple. Scaled from the same centre as the arrow so the two read as one hand
            rather than a pointer with a dot near it. */}
        <div
          className="absolute top-1/2 left-1/2 rounded-full border-2 border-[#095192]"
          style={{
            width: 34,
            height: 34,
            marginTop: -17,
            marginLeft: -17,
            background: 'rgba(9,81,146,0.18)',
            opacity: pressed ? 1 : 0,
            transform: `scale(${pressed ? 1 : 0.4})`,
            transition: 'opacity 130ms ease-out, transform 130ms ease-out',
          }}
        />
        {/* An arrow, not a dot: a dot reads as a touch point and this is showing intent before
            contact. Offset so the tip — not the centre of the glyph — is what sits on the target. */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          className="relative"
          style={{
            marginLeft: -2,
            marginTop: -2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
            transform: `scale(${pressed ? 0.88 : 1})`,
            transition: 'transform 130ms ease-out',
          }}
        >
          <path d="M5 2.5 L5 19.5 L9.4 15.4 L12.1 21.5 L15.2 20.1 L12.5 14.2 L18.5 14.0 Z" fill="#095192" stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
