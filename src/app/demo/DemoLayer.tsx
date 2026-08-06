import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from './DemoContext';
import DemoCursor from './DemoCursor';
import DemoControlPanel from './DemoControlPanel';
import DemoPalette from './DemoPalette';

/** How long the real pointer stays visible after the last genuine movement. */
const POINTER_LINGER_MS = 2000;

/**
 * Everything Demo Mode draws, portalled to `document.body`.
 *
 * The portal is what keeps it above the tablet simulator, whose frame is a `fixed inset-0
 * z-[9999]` element — rendered as a child of App it would land inside that frame and be scaled
 * along with the app, which is right for a Radix popover and wrong for a cursor.
 */
export default function DemoLayer() {
  const { status } = useDemo();
  const [userPointerActive, setUserPointerActive] = useState(false);
  const lingerTimer = useRef<number | null>(null);

  const walking = status === 'running' || status === 'paused';

  /**
   * Two cursors on screen at once is the worst of both worlds — the viewer cannot tell which one
   * they control — so the real pointer is hidden over the app while the demo drives. But hiding it
   * unconditionally makes the panel feel unreachable: the viewer moves the mouse, nothing appears,
   * and the walkthrough reads as something they are locked inside.
   *
   * So: moving the mouse brings the real pointer straight back. `isTrusted` is the whole trick —
   * the demo's own synthetic `pointermove` events report false, so the demo cannot mistake itself
   * for the user. It hides again after a couple of seconds of genuine stillness, and only while the
   * walk is actually running; the moment it is paused the user is in charge and the pointer stays.
   */
  useEffect(() => {
    if (!walking) return;
    const onPointerMove = (e: PointerEvent) => {
      if (!e.isTrusted) return;
      setUserPointerActive(true);
      if (lingerTimer.current) window.clearTimeout(lingerTimer.current);
      lingerTimer.current = window.setTimeout(() => setUserPointerActive(false), POINTER_LINGER_MS);
    };
    document.addEventListener('pointermove', onPointerMove, true);
    return () => {
      document.removeEventListener('pointermove', onPointerMove, true);
      if (lingerTimer.current) window.clearTimeout(lingerTimer.current);
    };
  }, [walking]);

  if (typeof document === 'undefined') return null;

  const hideRealPointer = status === 'running' && !userPointerActive;

  return createPortal(
    <>
      {/* The input shield. A single stray click from the viewer — ticking a product the script is
          about to tick, closing the panel it is about to type into — desynchronises the whole walk,
          and the failure looks like a broken app rather than a race. Synthetic events are
          dispatched straight onto their target and are not hit-tested, so the shield does not block
          the demo's own clicks; the control panel sits above it, so its controls stay live.

          `cursor` is set here rather than on the body because this element is exactly the area the
          demo owns: over the control panel the real pointer is always visible, which is what makes
          "move the mouse and take over" work even mid-step.

          Not shown once the walk is finished: at that point the app is the point. */}
      {walking && (
        <div
          className="fixed inset-0 z-[10030]"
          style={{ cursor: hideRealPointer ? 'none' : 'default' }}
          onClickCapture={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-hidden="true"
        />
      )}
      <DemoCursor />
      <DemoControlPanel />
      <DemoPalette />
    </>,
    document.body
  );
}
