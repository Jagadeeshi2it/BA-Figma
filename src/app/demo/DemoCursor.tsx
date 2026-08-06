import React from 'react';
import { useDemo } from './DemoContext';

/**
 * The virtual cursor. That is the whole of what Demo Mode draws over the app.
 *
 * Two things used to accompany it and both were removed, in that order. First a caption naming each
 * act, which turned a demonstration into a slideshow about the app and covered the interface it
 * existed to show. Then the ring that marked each target before the click — the cursor is already
 * travelling to the control and pausing on it, so the ring was saying a second time what the
 * movement had just said, in a heavier voice. What is left is a pointer that behaves like a hand,
 * and an app that explains itself through its own state changes, highlights and transitions.
 *
 * It lives at document level rather than inside the app — including inside the tablet simulator's
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
  const { cursorRef, pressed, status } = useDemo();

  if (status !== 'running' && status !== 'paused') return null;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[10045]"
      style={{ transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)' }}
    >
      {/* The press ripple. Scaled from the same centre as the arrow so the two read as one hand
          rather than a pointer with a dot near it. With the ring gone this is the only thing marking
          the moment of contact, so it stays. */}
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
  );
}
